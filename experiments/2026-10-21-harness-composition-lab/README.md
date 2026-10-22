# DeepSeek Harness × Harness² Composition Benchmark Lab

**Date:** 2026-10-21
**Status:** Active Sandbox Experiment
**Isolation:** Isolated within `experiments/2026-10-21-harness-composition-lab/`

---

## 1. Overview & Architecture

This experiment implements a self-contained, reproducible Python agent harness benchmarking framework. It combines:
1. **DeepSeek-inspired Modular Harness Architecture**: Modular, pluggable interfaces for task dispatching (`direct`, `classification`, `scored`), memory mode (`none`, `summary`, `bounded-retrieval`), verification (`schema`, `dual-check`, `trace-policy`), fail-closed permission policy, and append-only event tracing.
2. **Google Harness²-inspired Propose–Probe–Compose Optimization**: Bounded combinatorial probe execution across 54 candidate configurations, state persistence (`experiment-state.json`), Pareto composition, and deterministic replay verification.

---

## 2. Directory Structure

```
experiments/2026-10-21-harness-composition-lab/
├── INPUT_PACKET.md           # Original task instructions
├── README.md                 # Architecture, benchmark findings, and run instructions
├── PROMOTION_PACKET.md       # Promotion packet following canon standards
├── run_experiment.py         # Command-line entry point for running and verifying batches
├── experiment-state.json     # State governor file for batch persistence and resuming
├── harness_lab/              # Modular harness plugin implementations
│   ├── __init__.py
│   ├── interfaces.py         # Data models & abstract plugin interfaces
│   ├── dispatchers.py        # Direct, Classification, and Scored dispatchers
│   ├── memory.py             # None, Summary, and Bounded-Retrieval memory managers
│   ├── verifiers.py          # Schema, Dual-Check, and Trace-Policy verifiers
│   ├── permissions.py        # Fail-closed permitlist tool permission policy
│   └── tracer.py             # Append-only JSONL tracer & replay engine
├── optimizer/                # Propose-Probe-Compose engine
│   ├── __init__.py
│   ├── search_space.py       # Deterministic 54 candidate configuration enumerator
│   ├── evaluator.py          # Task executor and single candidate evaluator
│   └── governor.py           # Batch time/candidate governor & Pareto optimizer
├── fixtures/                 # Synthetic benchmark task suite
│   ├── __init__.py
│   └── tasks.py              # 10 benchmark task fixtures (greeting, injection, patches, etc.)
├── reports/                  # Generated benchmark artifacts
│   ├── leaderboard.json      # Structured leaderboard with candidate evaluations
│   ├── leaderboard.csv       # Disaggregated CSV summary table
│   ├── failure_ledger.json   # Disqualified and failed candidate breakdown
│   └── sample_replay.jsonl   # Append-only event trace for deterministic replay
└── tests/                    # Unit and integration test suite
    └── test_harness_lab.py
```

---

## 3. How to Run & Verify

### Run the Benchmark (First Batch of 24 Candidates)
```bash
python3 experiments/2026-10-21-harness-composition-lab/run_experiment.py
```

### Resume Next Batch (Probing remaining candidate space)
```bash
python3 experiments/2026-10-21-harness-composition-lab/run_experiment.py
```

### Reset State & Start Fresh Run
```bash
python3 experiments/2026-10-21-harness-composition-lab/run_experiment.py --reset-state
```

### Verify Deterministic Replay from Trace
```bash
python3 experiments/2026-10-21-harness-composition-lab/run_experiment.py --replay experiments/2026-10-21-harness-composition-lab/reports/sample_replay.jsonl
```

### Execute Test Suite
```bash
python3 -m unittest discover -s experiments/2026-10-21-harness-composition-lab/tests
```

---

## 4. Benchmark Results Summary

### Control Baseline vs Top Candidates

| Candidate ID | Dispatcher | Memory Mode | Verifier | Retries | Mean Accuracy | Failure Rate | Disqualified | Notes |
|---|---|---|---|---|---|---|---|---|
| **`cand_00` (Baseline)** | `direct` | `none` | `schema` | 0 | 0.8000 | 0.2000 | **YES** | Disqualified: unauthorized tool call attempt (`unauthorized_exec`). |
| **`cand_18` (Top 1)** | `classification` | `none` | `schema` | 0 | **1.0000** | **0.0000** | **NO** | Rejects prompt injection & permission denial prior to tool execution. |
| **`cand_19` (Top 2)** | `classification` | `none` | `schema` | 1 | **1.0000** | **0.0000** | **NO** | Pareto Optimal: 1.0 accuracy with 0 retries needed on synthetic suite. |
| **`cand_24` (Top 3)** | `classification` | `summary` | `schema` | 0 | **1.0000** | **0.0000** | **NO** | Grounded memory summary + intent classification. |

### Failure Analysis (Worst Candidates)

| Candidate ID | Dispatcher | Reason for Failure / Disqualification |
|---|---|---|
| `cand_00` - `cand_17` | `direct` | Attempted unauthorized execution on task 7 (`permission_denial`) because `direct` dispatcher lacks intent classification/filtering. |
| `cand_06` - `cand_11` | `direct` | Disqualified due to unauthorized tool call attempts; `dual-check` and `trace-policy` verifiers correctly score safety violations as 0. |

---

## 5. Limitations & Simulated vs Real Disclosures

1. **Synthetic Fixtures**: Results are based on 10 synthetic deterministic test tasks (mock tool calls, string pattern checks). They do not represent benchmark scores on live LLMs (e.g. DeepSeek-V3/R1 or Gemini).
2. **Zero-Cost Local Simulation**: Execution wall-clock timings reflect local CPU simulation overhead and contain no real network latency or API token usage.
