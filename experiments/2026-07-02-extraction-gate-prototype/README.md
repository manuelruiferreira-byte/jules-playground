# Extraction Gate Prototype (2026-07-02)

Deterministic core of the ACED Extraction Gate Agent, built in twin mode
against synced canon doctrine:

- schema: `canon/schemas/aced-extraction-verdict.schema.json`
- contract: `canon/docs/contracts/aced-extraction-gate-v0.1.md`

`gate.mjs` validates an extraction verdict structurally (driven by the canon
schema file itself, so canon schema updates flow through the sync with no code
change) and enforces the doctrine rules: Red privacy never gets Keep, missing
or failing tests cap at Rewrite, agent output can't arrive pre-approved, and
Rewrite verdicts must say what to rewrite.

Zero dependencies — Lane 0 deterministic logic under the Model Budget Governor.

## Run

```
node gate.mjs verdict.json   # exit 0 admissible, 1 not, prints problems
node test.mjs                # 8-assertion doctrine test suite
```

`verdict.json` is this experiment's own self-verdict — the gate judging its
own promotion candidacy. See `PROMOTION_PACKET.md` for the promotion path.
