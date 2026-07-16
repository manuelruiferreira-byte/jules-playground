# SEE-EXP-001 — Preregistration (declared before the matcher was built or run)

Category: `classical_software`. Risk class: R1 (isolated retrieval evaluation;
no production change). Evaluation epoch: `epoch:see-2026-07-16-a`.

## Hypothesis

Structural retrieval (anchor fingerprints + event-kind sequence signature)
ranks the preregistered true cross-domain match higher than simpler retrieval
methods (TF-IDF semantic, keyword, recency, random control) on a corpus of 14
real completed trajectories.

Falsifiable: if structural retrieval fails the thresholds below, the
hypothesis is classified `unsupported` and the lesson records that simpler
retrieval suffices at this corpus size.

## Ground-truth probe pairs (declared now, hidden from the matcher)

The matcher never reads this file; the Experiment Controller loads it only to
*score* rankings after they are produced. An audit check verifies the matching
module contains no reference to the pairs.

| Probe | Expected match | Shared geometry (rationale) | Topical overlap |
| --- | --- | --- | --- |
| `traj:netlify-gate-drift` | `traj:v03-contracts-hardening` | A validator asserts a wrong boundary; the fix moves the assertion without weakening enforcement; a negative control proves the gate still rejects bad input. | Low (CI/deploy config vs JSON-schema contracts) |
| `traj:kairoth-csp-blank-window` | `traj:ace-mind-annual-freeze` | Works in development, dies in the real runtime; strong symptom with initially unknown mechanism; resolution by moving computation to a different phase (build-time / lazy per-date). | Very low (Tauri CSP vs supplement planning on phones) |
| `traj:mystic-web-proof-audit` | `traj:qf-001` | Information is present but unreadable through the current observation channel; repeated failure under the "current channel is sufficient" assumption; fix switches or adds a readout channel, verified by an added control. | Near zero (screen-reader accessibility vs quantum phase readout) |

## Methods compared

`structural` (anchors + bigram signature, with mandatory explanation),
`sequence` (event-kind similarity only — ablation), `semantic` (TF-IDF cosine
over titles/objectives/summaries), `keyword` (token Jaccard over title +
objective), `recency` (time proximity), `random_control` (seeded).

Resource equivalence: every method sees exactly the same corpus and nothing
else; no method may consult ground truth, external data, or extra model calls.

## Metrics and thresholds (fixed now)

For each probe, each method ranks the other 13 trajectories. Metrics: rank of
the expected match, MRR across the 3 probes, hits@1, hits@3.

- **supported** — `MRR(structural)` strictly greater than MRR of *each* of
  {semantic, keyword, recency, random_control} AND `hits@1(structural) ≥ 2`.
- **provisional** — `MRR(structural)` strictly greater than at least 3 of
  those 4 baselines AND `hits@3(structural) ≥ 2`.
- **unsupported** — anything else.
- **invalid** — `MRR(random_control) ≥ 0.6` (harness bias), or any protocol
  deviation recorded without justification, or ground-truth leakage detected.

The `sequence` ablation is reported but does not enter the success criteria;
it measures how much the anchor layer adds beyond raw event order.

## Declared confounds and claim ceiling

1. One author curated all seed summaries and wrote the anchor rules
   (builder-curation bias). Mitigations: anchors key off event kinds and
   capture-time payload facts, not summary prose; the semantic and keyword
   baselines consume the very same prose, so wording bias assists them too.
2. n = 14 trajectories, 3 probes: even a full pass yields at most a
   **provisional, domain_specific** lesson. Claiming `transferable` requires
   replication on live-captured (non-curated) trajectories in a later epoch.
3. Morphology is not mechanism (SIPR baseline rule): a win here shows
   retrieval utility on this corpus, not that "reasoning geometry" is a
   validated cross-domain invariant.

Post-hoc threshold changes invalidate the run and require a superseding
manifest. Preregistered 2026-07-16 by Fable 5.
