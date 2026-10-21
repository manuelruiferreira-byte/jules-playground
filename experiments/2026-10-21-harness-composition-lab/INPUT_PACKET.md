# HOLTRON Adaptive Harness Laboratory — Jules Input Packet
Date: 2026-10-21
Status: sandbox experiment, no production integration
Owner authority: human owner approves any promotion

## Objective
Prototype and benchmark **modular agent execution** (inspired by DeepSeek Harness) combined with **Propose–Probe–Compose** adaptation (inspired by Google's Harness² research) using *only this repository*. Produce repeatable, safe experiments comparing alternative agent configurations, not a new always-on controller.

This is a research prototype; never claim simulated/fixture scores prove live LLM improvements.

## Context and isolation
- Read `AGENTS.md` and the canonical Free Agent Test Bench and Promotion Packet rules under `canon/docs/agents/`.
- Work entirely inside `experiments/2026-10-21-harness-composition-lab/`, on a Jules-created feature branch. Never change `canon/` or `AGENTS.md`.
- Never clone, fetch, access, or push another repository, including DeepSeek/Google repositories and any HOLTRON production repository. The conceptual patterns below are sufficient input.
- No paid APIs, external cloud inference, secrets, credentials, live trades, market orders, filesystem access outside the experiment, remote network operations, or production changes.
- You may use local standard-library Python 3.11+ for a zero-cost implementation and tests. No deployment or self-promotion.
- Do not use uncontrolled recursive agents or unbounded parallelism. All runs have time, CPU, experiment-count and file-count limits. Provide an explicit stop mechanism.

## Architectural building blocks
A. **Modular harness**: interchangeable strategy interfaces for worker selection, tool permission policy, compact memory input, verification, bounded retries and observable event hooks. Plugin contracts must fail closed; only permitlisted dummy tools execute in tests.
B. **Append-only trace**: JSONL event stream for candidate config, task input hash, actions, outcomes, durations, token/cost estimate (or explicitly unknown), rejection reasons, policy/approval checks; deterministic replay to reconstruct results.
C. **Harness²-style optimizer**: propose candidate combinations from a finite config search space, probe against fixtures, compose retained ideas into candidate next generation. Never alter scoring rubric post hoc. Record the tested baseline.
D. **Evaluator**: reproducible fixtures for greeting, retrieval-grounded answer, safe code patch simulation, failing-tool recovery, corrupted memory, prompt-injection attempt, permission denial, retry exhaustion, long context, and multi-step delegation. Inputs should be synthetic; no production data.
E. **Promotion packet**: why best variant wins, disaggregated score changes and failure rates, evidence artifacts, limitations, license considerations, risk and rollback plan. Human review required.

## Combination matrix
Sweep at least 24 distinct candidates chosen deterministically from:
- dispatcher: `direct`, `classification`, `scored`
- memory mode: `none`, `summary`, `bounded-retrieval` (fixture/mock, not real embeddings)
- verification: `schema`, `dual-check`, `trace-policy`
- bounded retry count: 0 or 1
An exhaustive 54-combination search is acceptable only within the budget. Start from one documented control baseline and retain top 3 *Pareto* configurations by accuracy, failure rate and runtime; never optimize solely by a combined score.

## Success metric / gates
- Independent, fixed expected outputs; deterministic seed and fixture identifiers.
- A policy violation, unauthorized tool action, leaked secret, bypassed approval or invalid replay is an automatic candidate failure regardless of score.
- Report correctness, task completion, unsafe-action count, retry loops, wall-clock latency, resource usage and tool-call count separately; report simulated measurements as simulated.
- Every accepted configuration must be no worse than baseline on safety and reliably reproduce via replay. Confidence intervals are not justified from a single tiny fixture set: disclose sample size.
- Exit codes nonzero on broken invariants or test failures; never conceal failures in a leaderboard.
- Stop automatically after 24 candidates or 90 seconds in the first invocation, whichever comes first. Persist `experiment-state.json` and provide resumable commands for next batches. Cap files/artifacts at 50 MB and max 2 concurrent workers (default 1). Do not keep a background process running after a Jules session ends.
- A subsequent run may evaluate the remaining candidates or a new generation only when the next batch is explicitly invoked. No uncontrolled recurring calls.

## Required deliverables
1. `README.md` with clear architecture, baseline vs candidate results, exact offline run and resume commands.
2. `harness_lab/` typed plugin interfaces and minimal example implementations.
3. `optimizer/` bounded propose/probe/compose engine and deterministic config enumerator.
4. `fixtures/` with synthetic tasks and rejection/security cases; `tests/` unit and integration tests.
5. `reports/` JSON/CSV leaderboard, score breakdown, failure ledger and sample replay from one candidate.
6. `PROMOTION_PACKET.md` explaining trade-offs, unproven assumptions, what would need live testing and that nothing is approved/deployed.

## Task sequence
1. Log the preflight required by `AGENTS.md`, inspect what already exists, avoid duplicating earlier experiments.
2. Establish tests and baseline before variants; implement bounded comparator and append-only events.
3. Produce candidate variants and conduct one bounded batch. Don't fabricate measurements.
4. Summarize the 3 best candidates with evidence and the 3 worst with failure analysis.
5. Commit in the sandbox feature branch and open a **draft PR only** if supported. Never merge.
6. Return exact branch, commit SHA, files, command outputs, test results, remaining backlog and a proposed next batch.

## Architecture interpretation
DeepSeek Harness inspiration: modularity, plugin boundaries, traceable execution, tool interposition; Google Harness² inspiration: harness-level propose/probe/compose iterative optimization. Treat both as *ideas*, not as proof of benchmark gains or licenses to incorporate code. No network retrieval of their repositories from this isolated environment.
