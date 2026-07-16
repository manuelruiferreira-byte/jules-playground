# KCES v0.1 vertical slice — evidence and rollback packet

Ran: 2026-07-16 · Builder: Fable 5 · Epoch: `epoch:2026-07-16-a`
Environment: Node 22-class runtime in an isolated cloud container; Python 3.11
with qiskit 2.5.0 / qiskit-aer 0.17.2 / pytest 9.1.1 for the QF-001 checks.

## Executed evidence

1. **Promotion Autopilot dry run** — 6 fixture candidates:
   R0/R1/R2 all-gates-pass → `route_to_manuel` (calibration); R3 → `route_to_manuel`
   (never delegable); failed audit → `reject`; builder-only evidence →
   `hold_insufficient_evidence`. Constitutional invariants: **PASS**. Output:
   `autopilot/decisions.json` (all `dry_run: true`).
2. **SIPR-EXP-001** — preregistered hypothesis **falsified and preserved**:
   single-pass serializer measured **−14.5% mean gain** vs baseline across 3
   replications (seeds 11/23/47); negative control ≈ 0 ✓; reversed control
   negative ✓; plateaus stable (CV < 0.15) ✓ → classification **`unsupported`**
   per the preregistered rules. No post-hoc tuning was performed. Lesson: V8's
   native `JSON.stringify` outperforms hand-built single-pass string assembly;
   the production baseline serializer is already the better design. Output:
   `sipr-experiment/results.json` (raw windows included).
3. **Deterministic AutoAudit** — **13/13 checks PASS** (schema compile, drift,
   record validation, evaluator freeze digests, promotion invariants, SIPR
   recomputation from raw windows, outbox validation, secret scan, QF-001
   provenance + 9/9 pytest, resource budget 11 952 ms of 120 000 ms). Output:
   `autoaudit/verdict.json`, verdict `PASS` with `auditor_is_builder: true`.
4. **QF-001 rescue** — origin commit `f6c521d` imported verbatim from the
   session container (its only prior copy) with provenance; 9/9 tests pass in
   the new location.

## Honest findings recorded for v0.2

- The `evolutionEvent.event_type` enum lacks `experiment_completed`; the SIPR
  completion event uses `experiment_started` semantics. Contract improvement
  queued for the next epoch, not silently patched into generated evidence.
- Independent (non-builder) verdicts do not exist yet for this slice; by
  Governor policy nothing here can promote until one exists.

## Promotion status

`route_to_manuel`. This slice is R2 under `calibration` autonomy: the
deterministic PASS plus this packet are necessary but not sufficient.
Required next gates: independent AI review (non-Fable model) and Manuel's
decision on the draft PR.

## Rollback

Before merge: close the draft PR, delete branch `fable/kces-vertical-slice-v0-1`.
After merge: `git revert` the squash commit — both experiment folders are
self-contained; no external state, ledger, credential, or runtime changed.
