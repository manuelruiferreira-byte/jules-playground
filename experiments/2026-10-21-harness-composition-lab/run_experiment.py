#!/usr/bin/env python3
"""Run experiment CLI for Harness Composition Lab."""

import argparse
import os
import sys

# Ensure experiment root is on sys.path
EXPERIMENT_DIR = os.path.dirname(os.path.abspath(__file__))
if EXPERIMENT_DIR not in sys.path:
    sys.path.insert(0, EXPERIMENT_DIR)

from fixtures.tasks import get_benchmark_fixtures
from optimizer.governor import BatchOptimizerGovernor
from harness_lab.tracer import EventTracer, ReplayEngine


def main():
    parser = argparse.ArgumentParser(description="Harness Composition Lab Benchmark Runner")
    parser.add_argument("--batch-size", type=int, default=24, help="Maximum candidates per batch (default 24)")
    parser.add_argument("--timeout", type=float, default=90.0, help="Batch timeout in seconds (default 90.0)")
    parser.add_argument("--replay", type=str, default=None, help="Path to sample replay jsonl file to verify")
    parser.add_argument("--reset-state", action="store_true", help="Reset experiment state file")
    args = parser.parse_args()

    state_file = os.path.join(EXPERIMENT_DIR, "experiment-state.json")
    reports_dir = os.path.join(EXPERIMENT_DIR, "reports")

    if args.reset_state and os.path.exists(state_file):
        os.remove(state_file)
        print(f"Reset experiment state at {state_file}")

    if args.replay:
        if not os.path.exists(args.replay):
            print(f"Error: Replay file {args.replay} not found.")
            sys.exit(1)
        with open(args.replay, "r", encoding="utf-8") as f:
            content = f.read()
        events = EventTracer.from_jsonl(content)
        ok, issues = ReplayEngine.verify_trace_integrity(events)
        summary = ReplayEngine.reconstruct_summary(events)
        print("=== REPLAY VERIFICATION RESULT ===")
        print(f"Trace Integrity Valid: {ok}")
        if issues:
            print(f"Issues: {issues}")
        print(f"Reconstructed Summary: {summary}")
        return

    fixtures = get_benchmark_fixtures()
    governor = BatchOptimizerGovernor(state_filepath=state_file, reports_dir=reports_dir)

    print("==================================================================")
    print("        DEEPSEEK HARNESS × HARNESS² COMPOSITION LAB BENCHMARK     ")
    print("==================================================================")
    print(f"Task Fixtures: {len(fixtures)}")
    print(f"Requested Batch Size: {args.batch_size} (Cap: {governor.MAX_CANDIDATES_PER_BATCH})")
    print(f"Batch Time Limit: {args.timeout}s (Cap: {governor.MAX_BATCH_TIME_SEC}s)")

    state = governor.run_batch(fixtures, batch_size=args.batch_size, max_time_sec=args.timeout)

    print("\n--- BATCH PROBE SUMMARY ---")
    print(f"Evaluated Candidates: {len(state['evaluated_candidate_ids'])} / {state['total_candidates']}")
    print(f"Batch Completed Status: {state['completed']}")
    print(f"Reports written to: {reports_dir}")

    evals = list(state.get("candidate_evaluations", {}).values())
    if evals:
        evals.sort(key=lambda x: (x.get("disqualified", False), -x.get("mean_accuracy", 0.0), x.get("failure_rate", 1.0)))
        print("\n--- TOP 5 CANDIDATES ---")
        for idx, e in enumerate(evals[:5]):
            cfg = e["config"]
            disq = " (DISQUALIFIED)" if e.get("disqualified") else ""
            print(f"[{idx+1}] Candidate: {e['candidate_id']}{disq} | Acc: {e['mean_accuracy']:.2f} | Fail: {e['failure_rate']:.2f} | Config: {cfg['dispatcher']}/{cfg['memory_mode']}/{cfg['verifier']}/r{cfg['bounded_retries']}")

        pareto = governor.compute_pareto_front(state.get("candidate_evaluations", {}))
        print("\n--- PARETO FRONTIER TOP 3 ---")
        for idx, p in enumerate(pareto[:3]):
            cfg = p["config"]
            print(f"[{idx+1}] Candidate: {p['candidate_id']} | Acc: {p['mean_accuracy']:.2f} | Fail: {p['failure_rate']:.2f} | Latency: {p['total_duration_sec']:.4f}s | Config: {cfg['dispatcher']}/{cfg['memory_mode']}/{cfg['verifier']}/r{cfg['bounded_retries']}")


if __name__ == "__main__":
    main()
