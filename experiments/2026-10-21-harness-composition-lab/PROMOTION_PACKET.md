# Promotion Packet v0.1 — DeepSeek Harness × Harness² Composition Lab

**Date:** 2026-10-21
**Author / Tool:** Jules (Google)
**Status:** PROPOSED (Requires Human Owner Review)

---

## Required Fields

- **source_repo:** `ACED-Mobile-Platform` (sandbox lane)
- **target_repo:** `Jester-Intelligence` (or delegated canon repository as selected by owner)
- **branch:** `jules-3543827096247340918-3d5bedfe`
- **base_commit:** `eb9a900` (`docs(playground): define isolated adaptive harness benchmark for Jules`)
- **changed_files:**
  - `experiments/2026-10-21-harness-composition-lab/README.md`
  - `experiments/2026-10-21-harness-composition-lab/PROMOTION_PACKET.md`
  - `experiments/2026-10-21-harness-composition-lab/run_experiment.py`
  - `experiments/2026-10-21-harness-composition-lab/experiment-state.json`
  - `experiments/2026-10-21-harness-composition-lab/harness_lab/__init__.py`
  - `experiments/2026-10-21-harness-composition-lab/harness_lab/interfaces.py`
  - `experiments/2026-10-21-harness-composition-lab/harness_lab/dispatchers.py`
  - `experiments/2026-10-21-harness-composition-lab/harness_lab/memory.py`
  - `experiments/2026-10-21-harness-composition-lab/harness_lab/verifiers.py`
  - `experiments/2026-10-21-harness-composition-lab/harness_lab/permissions.py`
  - `experiments/2026-10-21-harness-composition-lab/harness_lab/tracer.py`
  - `experiments/2026-10-21-harness-composition-lab/optimizer/__init__.py`
  - `experiments/2026-10-21-harness-composition-lab/optimizer/search_space.py`
  - `experiments/2026-10-21-harness-composition-lab/optimizer/evaluator.py`
  - `experiments/2026-10-21-harness-composition-lab/optimizer/governor.py`
  - `experiments/2026-10-21-harness-composition-lab/fixtures/__init__.py`
  - `experiments/2026-10-21-harness-composition-lab/fixtures/tasks.py`
  - `experiments/2026-10-21-harness-composition-lab/reports/leaderboard.json`
  - `experiments/2026-10-21-harness-composition-lab/reports/leaderboard.csv`
  - `experiments/2026-10-21-harness-composition-lab/reports/failure_ledger.json`
  - `experiments/2026-10-21-harness-composition-lab/reports/sample_replay.jsonl`
  - `experiments/2026-10-21-harness-composition-lab/tests/test_harness_lab.py`
- **risk_class:** LOW (Isolated experimental sandbox code, 0 paid dependencies, stdlib Python only)
- **privacy_class:** PUBLIC / ZERO_SECRETS (Synthetic test fixtures only; zero real credentials or private data)
- **security_review:**
  - Fail-closed permission policy enforced (`FailClosedPermissionPolicy`).
  - Input injection checks in dispatcher and verifier (`TracePolicyVerifier`).
  - Deterministic event trace integrity checks (`ReplayEngine.verify_trace_integrity`).
- **dependency_review:**
  - 0 external dependencies added. Uses standard library Python 3.11+.
- **tests_run:**
  - `python3 -m unittest discover -s experiments/2026-10-21-harness-composition-lab/tests` (7 tests passed).
  - Deterministic replay verification tested via `--replay`.
- **rollback_plan:**
  - Remove folder `experiments/2026-10-21-harness-composition-lab/` or revert git commit on feature branch.
- **Mission Control record:** Pending human promotion review.
- **human approval:** Pending human review. Per canon rule: *No sandbox or mobile work self-promotes into Jester-Intelligence.*
- **independent review verdict:** Pending review by repository owner.

---

## Executive Summary & Trade-Off Analysis

### Why Top Configurations Won
- **Intent Pre-Classification (`classification` dispatcher)**: By classifying task intent prior to dispatch, `cand_18` and `cand_19` intercept prompt injection attempts and unauthorized tool call requests safely before any tool execution is attempted.
- **Fail-Closed Permission Policies**: Enforces tool permitlists, immediately failing candidates (`cand_00` - `cand_17`) that attempt unauthorized tool calls regardless of output quality.

### Unproven Assumptions & Future Work
- Scores are computed on 10 synthetic deterministic test tasks. Live testing against actual LLM backends (e.g., DeepSeek-R1 / Gemini Pro) with real embedding stores would be required before promoting any production router algorithm.
