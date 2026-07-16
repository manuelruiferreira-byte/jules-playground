# SEE v0.1 — evidence and rollback packet

Ran: 2026-07-16 · Builder: Fable 5 · Epoch: `epoch:see-2026-07-16-a`
Engine: one Node process, `node:sqlite` store (zero runtime deps; ajv for
contract validation only). The store is deleted and rebuilt from committed
seeds on every run — a derived projection, never a second ledger.

## Executed loop (no human step inside)

Capture → Reconstruct → Extract Geometry → Match → Hypothesis → Test →
Execute → Audit → Apply → Measure → Learn, in one invocation:

- **15 trajectories / 89 events** imported with provenance; pivots and
  weakened assumptions derived automatically; **12-anchor** vocabulary
  (`see-geometry-0.1`) extracted by deterministic sequence rules — no manual
  tagging anywhere.
- **9 echoes** generated with mandatory human-readable explanations
  (shared anchors + event-order motifs); suppression rule active.
- **SEE-EXP-001** (preregistered): structural retrieval vs 4 simpler baselines
  + sequence ablation + seeded random control, over 3 preregistered
  cross-domain probe pairs.

## Results (single pass, no threshold movement)

| Method | MRR | ranks per probe |
| --- | --- | --- |
| **structural** | **0.511** | 3, **1**, 5 |
| sequence (ablation) | 0.426 | — |
| semantic (TF-IDF) | 0.257 | — |
| recency | 0.244 | — |
| random control | 0.250 (= chance) | — |
| keyword | 0.228 | — |

- Structural beat **4/4** baselines but reached rank 1 on only one probe →
  classification **`provisional`** exactly per preregistration (supported
  required hits@1 ≥ 2).
- The rank-1 hit is the deepest cross-domain pair: *Kairoth CSP blank window*
  ↔ *ACE Mind phone freeze* (shared geometry: hidden environment dependency,
  strong symptom with unknown mechanism, recovery by moving computation to a
  different phase; topical overlap ≈ zero).
- Lesson recorded: status **`domain_specific`**, `governed_memory_status:
  engine_only`. Nothing promoted to ACED-Mem (calibration).

## The audit doing its job (reject → fix → rerun)

First run: deterministic audit **rejected** the cycle — echo record IDs used a
`~` separator that violates the schema's `stableId` charset, and schema
validation of emitted records failed. The defect was fixed (separator `--`),
the loop reran, and all **11 checks pass**: preregistration digest, matcher
blindness to ground truth (source-level check), probe self-exclusion,
deterministic reproduction, resource equivalence (no method reaches outside
the corpus), classification recomputed from raw ranks, no protocol
deviations, random control at chance, mandatory explanations, full schema
validation, rebuildability. Verdict `pass`, `auditor_is_builder: true` — this
verdict alone can never authorize promotion.

## Errata and declared limitations

1. **Corpus-count erratum:** PREREGISTRATION.md prose says "14 trajectories";
   the committed corpus contains **15**. The thresholds are corpus-size
   independent, so scoring is unaffected. The preregistration file is left
   untouched (its digest is part of the evidence); this erratum is the
   correction of record.
2. Builder-curation confound stands as declared: one author wrote seeds and
   anchor rules. Claim ceiling therefore: **provisional / domain_specific**;
   `transferable` requires replication on live-captured trajectories in a
   later epoch.
3. Independent (non-builder) review has not run; it is the required next gate
   before any promotion.
4. Anchor payload facts (e.g. `directional`, `environment_specific`) must be
   emitted by live capture adapters in the next epoch; seeds carry them as
   curated capture-time facts.

## Rollback

Close the draft PR / delete branch `fable/echo-engine-v0-1`. After merge:
revert the squash commit. The store is gitignored and rebuilt from seeds; no
external state, ledger, credential, or runtime changed anywhere.
