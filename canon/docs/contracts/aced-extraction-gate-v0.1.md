# ACED Extraction Gate v0.1

## Purpose

Decides what playground/twin work comes back toward canon. Nothing self-promotes.
The gate consumes a finished experiment plus its Promotion Packet and produces an
extraction verdict.

## Verdict classes

- **Keep** — promote as-is via Promotion Packet; human ports it.
- **Rewrite** — idea is right, implementation is not; canon reimplements from the spec.
- **Archive** — not promoting now, but keep as reference in the playground.
- **Reject** — discard; record why so the lesson is not lost.

## Verdict fields

- verdict (Keep | Rewrite | Archive | Reject)
- experiment_path
- source_repo
- target_repo
- evidence (files reviewed, behaviors observed)
- tests_run
- tests_passed
- risk_class (Green | Amber | Red)
- privacy_class (Green | Amber | Red)
- dependency_review
- doctrine_conflicts
- promotion_recommendation
- required_rewrites (when verdict is Rewrite)
- reviewer (agent name + model, or human)
- human_approval (always required before canon mutation)
- ledger_entry_id

Schema: `schemas/aced-extraction-verdict.schema.json`.

## Rules

- The gate reads playground output; it never edits canon.
- A Keep verdict is a recommendation, not a promotion. Human approval and a
  Promotion Packet are still required, per Promotion Packet v0.1.
- Red privacy class can never receive Keep; maximum is Rewrite (canon
  reimplements without the tainted artifact).
- Missing tests caps the verdict at Rewrite.
- Every verdict is written to the audit ledger and surfaced in Mission Control.
- Agent-produced verdicts are Lane 2 (free) work under the Model Budget Governor.
