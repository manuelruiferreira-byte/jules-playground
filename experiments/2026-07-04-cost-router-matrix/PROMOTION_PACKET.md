# Promotion Packet — Cost Router Matrix v0.1

Per `canon/docs/agents/promotion-packet-v0.1.md`.

- **source_repo:** manuelruiferreira-byte/jules-playground
- **target_repo:** manuelruiferreira-byte/Jester-Intelligence
- **branch:** main (playground)
- **base_commit:** playground main at experiment time (canon docs at Jester main post-#17)
- **changed_files:** `cost-router-matrix.v0.1.json`, `router.mjs`, `test.mjs`, `verdict.json`, `README.md` (all new, self-contained)
- **risk_class:** Green — pure routing logic, no network, no state mutation
- **privacy_class:** Green — routes metadata about jobs, never job content
- **security_review:** zero dependencies, no eval, no shell, no provider calls; the router only *decides*, execution stays with existing lanes
- **dependency_review:** node builtins only
- **tests_run:** `node test.mjs` — 12/12 (schema completeness, determinism, cheapest-safe-path, Red-never-cloud, memory-stays-local, premium-approval, free-no-approval, canon-packet block, packet-unblock, blocked_lanes, fail-closed-unknown, matrix consistency)
- **rollback_plan:** delete promoted files; experiment remains in playground
- **Mission Control record:** MC task "Design Cost Router Agent v0.1" closed with evidence on packet creation; verdict POST to /api/extraction/verdict once PR #18 merges (ledger_entry_id playground-crm-20260704-001)
- **human_approval:** PENDING — Manuel. Cap decision recorded 2026-07-04:
  **no premium lane in v0.1** (flat-rate/free lanes only; lanes 0-2 or fail
  closed to human). Promotion path decision: **wait for PR #18** (the
  /api/extraction/verdict endpoint) to merge, route this verdict through it as
  the first live gate use, then open the promotion PR.
- **independent_review_verdict:** PENDING — self-verdict `Keep` is a recommendation, not a promotion

## Suggested promotion target

`apps/mission-control/scripts/cost-router.mjs` + matrix beside it; wire as the
Triage Agent's routing core per Agent Harness v0.1 once the harness prototype
lands. The Extraction Gate endpoint (PR #18) is the entry door for this
verdict itself — first live use of the full loop.
