"""Bounded Propose-Probe-Compose batch engine and state governor."""

import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple
from harness_lab.interfaces import CandidateConfig, ExecutionResult, TaskInput
from .search_space import generate_candidate_space, get_baseline_candidate
from .evaluator import TaskExecutor


class BatchOptimizerGovernor:
    """Manages candidate probing, state persistence, time/candidate bounds, and Pareto selection."""

    MAX_CANDIDATES_PER_BATCH = 24
    MAX_BATCH_TIME_SEC = 90.0
    MAX_WORKERS = 2
    MAX_ARTIFACT_BYTES = 50 * 1024 * 1024  # 50 MB

    def __init__(
        self,
        state_filepath: str = "experiments/2026-10-21-harness-composition-lab/experiment-state.json",
        reports_dir: str = "experiments/2026-10-21-harness-composition-lab/reports",
    ):
        self.state_filepath = state_filepath
        self.reports_dir = reports_dir
        os.makedirs(os.path.dirname(state_filepath), exist_ok=True)
        os.makedirs(reports_dir, exist_ok=True)

    def load_state(self) -> Dict[str, Any]:
        """Loads persistent state if present, else initializes state."""
        if os.path.exists(self.state_filepath):
            with open(self.state_filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "version": 1,
            "evaluated_candidate_ids": [],
            "baseline_results": None,
            "candidate_evaluations": {},
            "next_candidate_index": 0,
            "total_candidates": 54,
            "completed": False,
        }

    def save_state(self, state: Dict[str, Any]) -> None:
        """Atomically saves state to disk."""
        tmp_path = self.state_filepath + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
        os.replace(tmp_path, self.state_filepath)

    def run_batch(
        self,
        fixtures: List[TaskInput],
        batch_size: int = 24,
        max_time_sec: float = 90.0,
    ) -> Dict[str, Any]:
        """Runs a bounded batch probe execution across available candidates."""
        state = self.load_state()
        all_candidates = generate_candidate_space()

        # Ensure baseline control candidate (cand_00) is evaluated first
        baseline_cand = get_baseline_candidate()
        if not state.get("baseline_results"):
            baseline_res = self._probe_candidate(baseline_cand, fixtures)
            state["baseline_results"] = baseline_res
            state["candidate_evaluations"][baseline_cand.candidate_id] = baseline_res
            if baseline_cand.candidate_id not in state["evaluated_candidate_ids"]:
                state["evaluated_candidate_ids"].append(baseline_cand.candidate_id)

        start_index = state.get("next_candidate_index", 0)
        batch_start_time = time.time()
        evaluated_in_this_batch = 0

        # Calculate budget limits
        candidate_cap = min(batch_size, self.MAX_CANDIDATES_PER_BATCH)
        time_cap = min(max_time_sec, self.MAX_BATCH_TIME_SEC)

        curr_index = start_index
        while curr_index < len(all_candidates):
            # Check stopping criteria
            if evaluated_in_this_batch >= candidate_cap:
                break
            if (time.time() - batch_start_time) >= time_cap:
                break

            cand = all_candidates[curr_index]
            if cand.candidate_id not in state["evaluated_candidate_ids"]:
                eval_summary = self._probe_candidate(cand, fixtures)
                state["candidate_evaluations"][cand.candidate_id] = eval_summary
                state["evaluated_candidate_ids"].append(cand.candidate_id)
                evaluated_in_this_batch += 1

            curr_index += 1

        state["next_candidate_index"] = curr_index
        if curr_index >= len(all_candidates):
            state["completed"] = True

        self.save_state(state)

        # Write reports
        self.generate_reports(state, fixtures)
        return state

    def _probe_candidate(self, config: CandidateConfig, fixtures: List[TaskInput]) -> Dict[str, Any]:
        """Probes a candidate against all fixtures and aggregates performance metrics."""
        task_results = []
        total_accuracy = 0.0
        success_count = 0
        safety_violation_count = 0
        unauthorized_count = 0
        total_duration = 0.0
        total_retries = 0
        all_rejections = []
        sample_trace = []

        for task in fixtures:
            res = TaskExecutor.execute_task(task, config)
            task_results.append(res)
            total_accuracy += res.accuracy_score
            total_duration += res.duration_sec
            total_retries += res.retry_count
            if res.success:
                success_count += 1
            if res.safety_violation:
                safety_violation_count += 1
            unauthorized_count += res.unauthorized_tool_count
            all_rejections.extend(res.rejection_reasons)
            if not sample_trace:
                sample_trace = [e.to_dict() for e in res.trace_events]

        num_tasks = len(fixtures)
        mean_accuracy = total_accuracy / float(num_tasks) if num_tasks > 0 else 0.0
        failure_rate = 1.0 - (float(success_count) / float(num_tasks)) if num_tasks > 0 else 1.0

        # Disqualification check: any safety violation disqs candidate
        disqualified = (safety_violation_count > 0) or (unauthorized_count > 0)

        return {
            "candidate_id": config.candidate_id,
            "config": config.to_dict(),
            "mean_accuracy": mean_accuracy,
            "failure_rate": failure_rate,
            "success_count": success_count,
            "total_tasks": num_tasks,
            "safety_violation_count": safety_violation_count,
            "unauthorized_tool_count": unauthorized_count,
            "total_duration_sec": total_duration,
            "mean_duration_sec": total_duration / float(num_tasks) if num_tasks > 0 else 0.0,
            "total_retries": total_retries,
            "disqualified": disqualified,
            "rejection_reasons": list(set(all_rejections)),
            "sample_trace": sample_trace,
        }

    def compute_pareto_front(self, candidate_evals: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Computes Pareto frontier based on accuracy (maximize), failure rate (minimize), and duration (minimize).

        Disqualified variants (safety/permission failures) are filtered out prior to Pareto evaluation.
        """
        valid_candidates = [c for c in candidate_evals.values() if not c.get("disqualified", False)]
        pareto_front = []

        for cand in valid_candidates:
            acc = cand["mean_accuracy"]
            fail = cand["failure_rate"]
            dur = cand["total_duration_sec"]

            dominated = False
            for other in valid_candidates:
                if other["candidate_id"] == cand["candidate_id"]:
                    continue
                o_acc = other["mean_accuracy"]
                o_fail = other["failure_rate"]
                o_dur = other["total_duration_sec"]

                # Check if 'other' dominates 'cand'
                if (o_acc >= acc and o_fail <= fail and o_dur <= dur) and (
                    o_acc > acc or o_fail < fail or o_dur < dur
                ):
                    dominated = True
                    break

            if not dominated:
                pareto_front.append(cand)

        # Sort Pareto front by accuracy descending
        pareto_front.sort(key=lambda x: (-x["mean_accuracy"], x["failure_rate"], x["total_duration_sec"]))
        return pareto_front

    def generate_reports(self, state: Dict[str, Any], fixtures: List[TaskInput]) -> None:
        """Generates JSON, CSV leaderboards, failure ledger, and sample trace replay files."""
        evals = list(state.get("candidate_evaluations", {}).values())
        evals.sort(key=lambda x: (x.get("disqualified", False), -x.get("mean_accuracy", 0.0), x.get("failure_rate", 1.0), x.get("total_duration_sec", 0.0)))

        # 1. Leaderboard JSON
        pareto_front = self.compute_pareto_front(state.get("candidate_evaluations", {}))
        leaderboard_json = {
            "total_evaluated": len(evals),
            "baseline_candidate_id": "cand_00",
            "pareto_top_3": pareto_front[:3],
            "all_candidates": evals,
        }
        with open(os.path.join(self.reports_dir, "leaderboard.json"), "w", encoding="utf-8") as f:
            json.dump(leaderboard_json, f, indent=2)

        # 2. Leaderboard CSV
        csv_lines = [
            "candidate_id,dispatcher,memory_mode,verifier,bounded_retries,mean_accuracy,failure_rate,safety_violations,unauthorized_tools,duration_sec,disqualified"
        ]
        for e in evals:
            cfg = e["config"]
            line = f"{e['candidate_id']},{cfg['dispatcher']},{cfg['memory_mode']},{cfg['verifier']},{cfg['bounded_retries']},{e['mean_accuracy']:.4f},{e['failure_rate']:.4f},{e['safety_violation_count']},{e['unauthorized_tool_count']},{e['total_duration_sec']:.4f},{e['disqualified']}"
            csv_lines.append(line)

        with open(os.path.join(self.reports_dir, "leaderboard.csv"), "w", encoding="utf-8") as f:
            f.write("\n".join(csv_lines))

        # 3. Failure Ledger
        disqualified_candidates = [e for e in evals if e.get("disqualified", False) or e.get("failure_rate", 0.0) > 0.5]
        failure_ledger = {
            "disqualified_count": len([e for e in evals if e.get("disqualified", False)]),
            "high_failure_candidates": [
                {
                    "candidate_id": e["candidate_id"],
                    "config": e["config"],
                    "failure_rate": e["failure_rate"],
                    "safety_violation_count": e["safety_violation_count"],
                    "unauthorized_tool_count": e["unauthorized_tool_count"],
                    "rejection_reasons": e.get("rejection_reasons", []),
                }
                for e in disqualified_candidates
            ],
        }
        with open(os.path.join(self.reports_dir, "failure_ledger.json"), "w", encoding="utf-8") as f:
            json.dump(failure_ledger, f, indent=2)

        # 4. Sample Replay JSONL
        if evals and evals[0].get("sample_trace"):
            trace_events = evals[0]["sample_trace"]
            jsonl_lines = [json.dumps(ev, sort_keys=True) for ev in trace_events]
            with open(os.path.join(self.reports_dir, "sample_replay.jsonl"), "w", encoding="utf-8") as f:
                f.write("\n".join(jsonl_lines))
