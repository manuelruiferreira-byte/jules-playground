# KCES v0.1 — Kairoth Continuous Evolution System, vertical slice

**STATUS: EXPERIMENTAL, NON-CANONICAL.** Nothing here is promoted. Manuel is
the sole promotion authority. The Promotion Autopilot in this folder is a
**dry run on fixtures** — it has no git, network, or ledger authority, and
autonomy is constitutionally locked to `calibration` (everything routes to
Manuel).

This is the first working pass of the governed loop:

```
research cards ──▶ preregistered experiment ──▶ deterministic AutoAudit
      ▲                                                    │
      │                                                    ▼
evolution memory ◀── evidence + rollback ◀── promotion decisions (dry run)
```

## Contents

| Path | What it is |
| --- | --- |
| `schemas/kairoth-evolution-v0.1.schema.json` | Vendored copy of the KCES record contracts (canonical home: Kairoth-Command-Center). Digest pinned in `schemas/PROVENANCE.json`; the audit fails on drift. |
| `research/cards.json` | Four seeded Research Cards (incl. the verified SIPR Reconstructed Baseline with digest). |
| `MANIFEST.json` | This slice's own experiment manifest (self-describing, schema-valid). |
| `evaluators/registry.json` | Evaluator epoch `epoch:2026-10-04-event-binding`; definitions frozen with file digests — silent weakening fails the audit. |
| `sipr-experiment/` | SIPR-EXP-001: preregistered software experiment (canonical-hash throughput) with baseline, intervention, recovery/plateau windows, negative + reversed controls, 3 replications, resource accounting, and honest classification. |
| `autoaudit/run-autoaudit.mjs` | Layer-1 deterministic audit (15 checks), writing `autoaudit/verdict-active.json`. Emits a schema-valid `auditVerdict` with `auditor_is_builder: true` — it can never authorize promotion alone. |
| `autopilot/` | Promotion Autopilot dry run over six fixture candidates (R0–R3, failed-audit, self-approved-only). Emits schema-valid `promotionDecision` records, all `dry_run: true`. |
| `events/outbox/` | Mission Control `evolution_event` records. Outbox pattern: an isolated experiment never writes the ledger directly; a governed courier relays later. |
| `IMPORT_PLAN.md` | Durable import plan for QF-001 (executed), SIPR baseline, FET material, Maya proposal, PFP (proposals). |
| `EVIDENCE.md` | Run evidence and rollback packet. |

The sibling folder `../2026-07-16-qf-001-phase-signal/` is the durable import
of QF-001 (origin commit `f6c521d`, this session's container).

## Run

```bash
cd experiments/2026-07-16-kces-vertical-slice
npm install                      # ajv + ajv-formats only (free)
node autopilot/dry-run.mjs       # generates active manifest-bound promotion event (required before audit)
node sipr-experiment/run-experiment.mjs   # optional new measurement; rewrites historical SIPR outputs
node autoaudit/run-autoaudit.mjs # 15 checks; active event/epoch binding required
node autoaudit/test-epoch-binding.mjs # positive + six negative full-audit cases
```

## What this is not

No live adapters, no credentials, no paid services, no trading surface, no
shell authority, no writes to any other repository, no self-approval: the
builder-authored audit verdict is structurally barred from authorizing
promotion, and independent (non-Fable) review is a required next gate.

## Active maintenance evidence

The active manifest has ID `experiment:kces-vertical-slice-event-binding` and supersedes the earlier epoch-binding maintenance manifest. Original preregistration and historical maintenance manifests are archived under `manifests/`; frozen previous registries are under `evaluators/epochs/`. Historical `autoaudit/verdict.json` and `events/outbox/autopilot-dry-run.json` remain unchanged. New generation writes `events/outbox/autopilot-dry-run-active.json`; its ID contains the active manifest ID and evaluator epoch. The audit requires that active event and rejects stale, absent or mismatched bindings while retaining schema validation of historical outbox events.

Install `qiskit`, `qiskit-aer` and `pytest` into the actual Python virtual environment used by `python3 -I` to exercise the quantum test check. Missing packages for that isolated interpreter produce the documented optional skip. A PASS with that skip is not evidence that the quantum suite ran. This maintenance audit does not relabel original experiment outcomes or promote this sandbox into canon.
