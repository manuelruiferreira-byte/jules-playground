# Jules Playground

Unbounded sandbox for free coding agents (Google Jules and friends) inside the
ACED/Jester Intelligence system. Agents may do anything **within this repo**;
it is structurally isolated from the canon repos, which agents connected here
cannot see or touch.

- Agent rules: [AGENTS.md](AGENTS.md)
- Safety protocol: [docs/free-agent-test-bench-v0.1.md](docs/free-agent-test-bench-v0.1.md)
- How work graduates to canon repos: [docs/promotion-packet-v0.1.md](docs/promotion-packet-v0.1.md)

## Layout

Each task lives in its own self-contained folder under `experiments/`
(`experiments/<yyyy-mm-dd>-<slug>/` with its own README). Finished work worth
keeping gets a `PROMOTION_PACKET.md` and is ported to a canon repo by a human
after review — never merged across automatically.

## Connecting an agent

Grant the agent's GitHub app access to **this repository only**. Do not grant
access to any other repo; the isolation is the whole point.
