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

## Chronology defect, root cause, and epoch-b repair (closure)

**Defect:** the epoch-a machine preregistration carried
`preregistered_at: 2026-07-16T13:40:00Z` while the run evidence carried
`generated_at: 2026-07-16T12:56:45Z` — as recorded, results preceded
preregistration.

**Root cause (proven, not narrated):** the `preregistered_at` value was a
**hand-authored estimate typed into the file, not a clock read**. Container
disk evidence proves the true order: `PREREGISTRATION.md` mtime
**08:29:31Z** and `contracts/prereg.json` mtime **08:31:58Z** precede the
rankings (**12:56:45Z**, matching the runner's real-clock `generated_at`
exactly) by ~4.4 hours. Preregistration genuinely preceded execution; only
the embedded stamp was wrong.

**Repair (auditable, non-destructive):**
- Epoch-a evidence preserved verbatim under `evidence/epoch-a/` — nothing
  rewritten. Epoch-a is reclassified **"preregistration timestamp defective —
  superseded by the epoch-b clean rerun"**; its scientific result stands and
  is reproduced below.
- New frozen epoch `epoch:see-2026-07-16-b`: `contracts/prereg-epoch-b.json`
  is **machine-stamped at creation** (13:09:37Z; file mtime identical),
  byte-equivalent to epoch a in pairs, baselines, thresholds, and rules —
  a chronology repair, not a second attempt.
- Hand-written protocol timestamps are banned: every stage is now
  machine-stamped and persisted in `evidence/chronology.json`, and the audit
  evaluator (`see-audit-0.2`, epoch-boundary change adding only check #12,
  nothing weakened) verifies **prereg stamp ≤ loaded ≤ rankings ≤ scored**;
  the audit's own `issued_at` completes the chain.
- **Epoch-b result: identical to epoch a** (structural MRR 0.511, ranks
  3/1/5, classification `provisional`) — the determinism claim held.
- **Source binding:** `evidence/chronology.json` records per-file sha256
  digests of every source input and a combined digest
  (`sha256:c58e0649aa5429b11f13f46ff49266dead1792678a8f2a5a75d72e0ddaade28a`),
  recomputable from any checkout, proving which revision generated the
  records independent of commit SHA.

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
