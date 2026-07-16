# Durable import plan — quantum and research artifacts (KCES slice item 8)

Status: PLAN. Only step 1 is executed in this pull request. Every other step is
a proposal requiring Manuel's approval, because destination repositories are
canon-adjacent.

| Artifact | Verified? | Where it is now | Proposed durable home | Executed? |
| --- | --- | --- | --- | --- |
| QF-001 phase-sign circuit (commit `f6c521d`) | VERIFIED (local repo in this session's container) | `experiments/2026-07-16-qf-001-phase-signal/` (this PR) | jules-playground (done) → candidate later for `apps/ace-quantum` | ✅ this PR |
| SIPR Reconstructed Baseline v0.1 (2026-06-11 docx) | VERIFIED in-session (supplied by Manuel; sha256 digest recorded in `research/cards.json`) | Manuel's machine + session upload | `Jester-Intelligence/apps/ace-quantum/research/` — committed by Manuel or a governed courier, never via the agent-writable playground | ❌ proposal |
| FET Quantum Trading Theory v0.1 | UNVERIFIED (Mission Control runtime state, unreachable from cloud sessions) | Mission Control ledger | Export from Mission Control as a snapshot record; digest into a research card; file into `apps/ace-quantum/research/` | ❌ proposal |
| FET Grid Probe 001 records | UNVERIFIED (same) | Mission Control ledger | Same export path; shadow-mode only, no execution authority ever attaches to the import | ❌ proposal |
| Maya temporal phase-drift asymmetry proposal | UNVERIFIED (same) | Mission Control ledger | Import as a research card with `evidence_class: model_generated`, `is hypothesis` framing preserved — Oracle output never becomes verified status by import | ❌ proposal |
| PFP-CONSOLIDATED-002 v1.2 | UNVERIFIED (same) | Mission Control ledger | Digest + research card first; home decided by Manuel after content review | ❌ proposal |

## Rules applied

1. Nothing UNVERIFIED is reconstructed from memory; each import waits for the
   real artifact and records a digest on arrival.
2. Lane 1 (physically grounded) research material belongs in the ace-quantum
   area of governance canon, not in the free-agent playground.
3. Trading-related material imports as **shadow-mode records only**. No import
   creates execution authority, capital access, or live-trading linkage.
4. Every import emits an `evolution_event` and a research card so Evolution
   Memory preserves provenance and supersession.
