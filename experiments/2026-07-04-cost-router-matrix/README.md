# Cost Router Matrix v0.1 (2026-07-04, twin mode)

Answers the Mission Control task "Design Cost Router Agent v0.1" in full:
task classes, allowed targets, free-tier limits, cost classes, escalation
rules, privacy gates, daily/monthly caps, stop rules, usage-ledger fields,
and Mission Control reporting — as executable data + a deterministic router.

Built against synced canon: `aced-agent-job` in, `aced-route-decision` out,
Budget Governor v0.1 doctrine throughout.

- `cost-router-matrix.v0.1.json` — the matrix. v0.1 has NO premium metered
  lane (Manuel 2026-07-04): only free/flat-rate lanes; work that can't run on
  lanes 0-2 fails closed to human. A future version may add lane 3 with caps.
- `router.mjs` — cheapest-safe-path routing; Red never leaves local;
  premium always requires approval; canon edits without a Promotion Packet
  are blocked outright; unknown work fails closed to human.
- `test.mjs` — 12 doctrine assertions (`node test.mjs`).

## Run

```
node test.mjs
node router.mjs sample-job.json   # any aced-agent-job record
```

Promotion path: see PROMOTION_PACKET.md. Suggested canon home after review:
`apps/mission-control/scripts/cost-router.mjs` + matrix under `data/` or the
agentic engine package once it activates.
