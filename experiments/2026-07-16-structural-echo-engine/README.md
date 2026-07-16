# SIPR Structural Echo Engine (SEE) v0.1 — first automatic vertical slice

**STATUS: EXPERIMENTAL, NON-CANONICAL.** Manuel is the sole promotion
authority. The engine's own loop is fully automatic; promotion into canon or
ACED-Mem is governed and staged (autonomy: calibration).

SEE gives Kairoth an automatic memory of **reasoning geometry**: it captures
meaningful work events, reconstructs trajectories, extracts structural
anchors, detects **structural echoes** between current and historical work,
turns strong echoes into falsifiable hypotheses, tests them under SIPR-style
preregistration and comparator discipline, audits independently, measures
utility from downstream observables, and learns — with no routine human step.

SIPR here is an **engineering and validation architecture**, not a claim that
physical SIPR is validated (the baseline defers cross-domain generality and
forbids reading mechanism from morphology; those boundaries are preserved).

## Run

```bash
npm install          # ajv only (contract validation); store is node:sqlite
node run-slice.mjs   # full loop: rebuild store → capture → … → learn
```

Every run deletes and rebuilds `see.db` from `seeds/trajectories.json` —
the graph is a derived, rebuildable projection, never a second ledger.

## Layout

| Path | Role |
| --- | --- |
| `contracts/see-v0.1.schema.json` | Versioned contracts: trajectory, event, anchor, relation, fingerprint, echo, hypothesis, experiment, audit, utility, lesson, exception. |
| `contracts/prereg.json` + `PREREGISTRATION.md` | SEE-EXP-001 preregistration: probe pairs, thresholds, confounds, claim ceiling. The matcher never reads these (audited). |
| `seeds/trajectories.json` | 15 real trajectories / 89 events curated from verifiable evidence with provenance. |
| `engine/db.mjs` | `node:sqlite` store (zero-dependency). |
| `engine/analyze.mjs` | Event Collector, Trajectory Reconstructor, Geometry Extractor (12-anchor vocabulary `see-geometry-0.1`, deterministic sequence rules — no manual tagging). |
| `engine/matching.mjs` | Echo Reasoner: 6 retrieval methods (structural, sequence ablation, TF-IDF semantic, keyword, recency, seeded random). Blind to ground truth. |
| `engine/loop.mjs` | Echoes (with mandatory explanations + suppression), automatic hypothesis, experiment scoring, utility signals, lesson classification, exception stream, Mission Control outbox. |
| `engine/audit.mjs` | Independent Audit Governor, evaluator `see-audit-0.1`: 11 deterministic checks incl. matcher blindness, reproducibility, resource equivalence, claim recomputation. `auditor_is_builder: true` → can never authorize promotion alone. |
| `run-slice.mjs` | Orchestrates the full loop and writes evidence + the Kairoth read-model projection. |
| `evidence/` | Committed run outputs: records, raw rankings, `kairoth-projection.json`. |
| `events/outbox/` | Mission Control events (outbox pattern; a governed courier relays). |
| `EVIDENCE.md` | Results, the audit's reject→fix→rerun cycle, errata, rollback. |

## Result of the first cycle

Structural retrieval MRR **0.511** vs semantic 0.257 / keyword 0.228 /
recency 0.244 / random 0.250; the deepest cross-domain pair (CSP blank window
↔ phone freeze) ranked #1 with an explained match. Classification
**provisional** per preregistration; lesson stored `engine_only`.

## What SEE v0.1 is not

No live capture adapters yet (seeds bootstrap the corpus); no daemon/scheduler
(the loop runs per invocation; hosting is a deployment decision); no writes to
Mission Control, ACED-Mem, or any other repository; no model calls; no
embeddings (TF-IDF earns its keep as the semantic baseline until embeddings
prove material lift); no graph platform — a graph data model over SQLite.

## Next epoch (`epoch:see-2026-07-16-b` candidates)

Live capture adapters (session transcripts, PR events, audit verdicts as event
sources), replication on non-curated trajectories, anchor vocabulary v0.2,
independent AI review integration, scheduled reconciliation, Kairoth surface.
