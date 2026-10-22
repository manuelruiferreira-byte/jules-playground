"""Unit and integration test suite for Harness Composition Lab."""

import json
import os
import shutil
import tempfile
import unittest
import sys

# Ensure local harness module is on sys.path
EXPERIMENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if EXPERIMENT_DIR not in sys.path:
    sys.path.insert(0, EXPERIMENT_DIR)

from harness_lab.interfaces import CandidateConfig, TaskInput, ToolCall
from harness_lab.permissions import FailClosedPermissionPolicy
from harness_lab.tracer import EventTracer, ReplayEngine
from harness_lab.dispatchers import DirectDispatcher, ClassificationDispatcher, ScoredDispatcher
from harness_lab.memory import NoneMemoryManager, SummaryMemoryManager, BoundedRetrievalMemoryManager
from harness_lab.verifiers import SchemaVerifier, DualCheckVerifier, TracePolicyVerifier
from fixtures.tasks import get_benchmark_fixtures
from optimizer.search_space import generate_candidate_space, get_baseline_candidate
from optimizer.evaluator import TaskExecutor
from optimizer.governor import BatchOptimizerGovernor


class TestHarnessPlugins(unittest.TestCase):
    """Unit tests for plugin interfaces and fail-closed security policies."""

    def test_permission_policy_fail_closed(self):
        policy = FailClosedPermissionPolicy()
        self.assertTrue(policy.is_allowed("safe_read"))
        self.assertTrue(policy.is_allowed("mock_patch"))
        self.assertFalse(policy.is_allowed("unauthorized_exec"))
        self.assertFalse(policy.is_allowed("rm_rf"))

        call_ok = ToolCall(tool_name="mock_patch", arguments={})
        call_bad = ToolCall(tool_name="unauthorized_exec", arguments={})
        self.assertTrue(policy.check_call(call_ok))
        self.assertFalse(policy.check_call(call_bad))

    def test_search_space_generation(self):
        cands = generate_candidate_space()
        self.assertEqual(len(cands), 54)
        base = get_baseline_candidate()
        self.assertEqual(base.candidate_id, "cand_00")
        self.assertEqual(base.dispatcher, "direct")
        self.assertEqual(base.memory_mode, "none")
        self.assertEqual(base.verifier, "schema")
        self.assertEqual(base.bounded_retries, 0)

    def test_event_tracer_and_replay_engine(self):
        tracer = EventTracer("cand_00", "task_01")
        tracer.record("start", {"input": "test"})
        tracer.record("verify", {"passed": True, "score": 1.0, "safety_violation": False})
        tracer.record("complete", {"status": "ok"})

        jsonl_output = tracer.to_jsonl()
        reconstructed_events = EventTracer.from_jsonl(jsonl_output)
        self.assertEqual(len(reconstructed_events), 3)

        integrity_ok, issues = ReplayEngine.verify_trace_integrity(reconstructed_events)
        self.assertTrue(integrity_ok)
        self.assertEqual(len(issues), 0)

        summary = ReplayEngine.reconstruct_summary(reconstructed_events)
        self.assertTrue(summary["success"])
        self.assertEqual(summary["accuracy_score"], 1.0)

    def test_memory_managers(self):
        task = TaskInput(
            task_id="t1",
            category="retrieval_grounded",
            prompt="What is status?",
            expected_output={},
            context={"status": "all systems green"},
        )
        none_mem = NoneMemoryManager().prepare_context(task)
        summary_mem = SummaryMemoryManager().prepare_context(task)
        retrieval_mem = BoundedRetrievalMemoryManager().prepare_context(task)

        self.assertEqual(none_mem, "")
        self.assertIn("status: all systems green", summary_mem)
        self.assertIn("all systems green", retrieval_mem)

    def test_prompt_injection_refusal(self):
        fixtures = get_benchmark_fixtures()
        injection_task = [t for t in fixtures if t.category == "prompt_injection"][0]

        # Classification dispatcher should refuse prompt injection
        config = CandidateConfig("cand_test", "classification", "none", "dual-check", 0)
        res = TaskExecutor.execute_task(injection_task, config)
        self.assertTrue(res.success)
        self.assertFalse(res.safety_violation)
        self.assertEqual(res.accuracy_score, 1.0)


class TestOptimizerAndGovernor(unittest.TestCase):
    """Integration tests for batch probing, state persistence, and bounds."""

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.state_file = os.path.join(self.test_dir, "experiment-state.json")
        self.reports_dir = os.path.join(self.test_dir, "reports")
        self.fixtures = get_benchmark_fixtures()

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_bounded_batch_execution(self):
        governor = BatchOptimizerGovernor(state_filepath=self.state_file, reports_dir=self.reports_dir)

        # Execute first batch of 24 candidates
        state_batch1 = governor.run_batch(self.fixtures, batch_size=24, max_time_sec=90.0)
        eval_ids_1 = state_batch1["evaluated_candidate_ids"]

        # cand_00 baseline + up to 24 candidates evaluated
        self.assertGreaterEqual(len(eval_ids_1), 24)
        self.assertLessEqual(len(eval_ids_1), 25)
        self.assertIn("cand_00", eval_ids_1)
        self.assertFalse(state_batch1["completed"])

        # Check reports produced
        self.assertTrue(os.path.exists(os.path.join(self.reports_dir, "leaderboard.json")))
        self.assertTrue(os.path.exists(os.path.join(self.reports_dir, "leaderboard.csv")))
        self.assertTrue(os.path.exists(os.path.join(self.reports_dir, "failure_ledger.json")))
        self.assertTrue(os.path.exists(os.path.join(self.reports_dir, "sample_replay.jsonl")))

        # Resume execution for batch 2
        state_batch2 = governor.run_batch(self.fixtures, batch_size=24, max_time_sec=90.0)
        eval_ids_2 = state_batch2["evaluated_candidate_ids"]
        self.assertGreater(len(eval_ids_2), len(eval_ids_1))

    def test_pareto_front_calculation(self):
        governor = BatchOptimizerGovernor(state_filepath=self.state_file, reports_dir=self.reports_dir)
        mock_evals = {
            "cand_01": {"candidate_id": "cand_01", "mean_accuracy": 0.8, "failure_rate": 0.2, "total_duration_sec": 1.0, "disqualified": False},
            "cand_02": {"candidate_id": "cand_02", "mean_accuracy": 0.9, "failure_rate": 0.1, "total_duration_sec": 2.0, "disqualified": False},
            "cand_03": {"candidate_id": "cand_03", "mean_accuracy": 0.7, "failure_rate": 0.3, "total_duration_sec": 3.0, "disqualified": False},
            "cand_04": {"candidate_id": "cand_04", "mean_accuracy": 0.95, "failure_rate": 0.05, "total_duration_sec": 0.5, "disqualified": True},  # Disqualified for safety
        }
        pareto = governor.compute_pareto_front(mock_evals)
        pareto_ids = [c["candidate_id"] for c in pareto]
        self.assertIn("cand_02", pareto_ids)
        self.assertNotIn("cand_03", pareto_ids)  # Dominated by cand_01 and cand_02
        self.assertNotIn("cand_04", pareto_ids)  # Filtered out because disqualified


if __name__ == "__main__":
    unittest.main()
