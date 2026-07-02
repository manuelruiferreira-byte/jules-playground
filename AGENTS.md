# AGENTS.md — Jules Playground Rules

**System/Project Context:** ACED/Jester Intelligence — Free Agent Playground
**Status:** Active. This repo is the unbounded sandbox lane.

## What this repo is

This is the ACED playground for free coding agents (Google Jules, Codex free tier,
and similar). Inside this repository you may operate **unbounded**: create branches,
install dependencies, run builds and tests, scaffold whole apps, refactor freely,
open pull requests. Auto-edit mode is permitted here.

This repo is intentionally isolated. You have no access to any other repository,
and nothing here is canon until a human promotes it.

## Preflight (log at the start of every session)

Per the [Free Agent Test Bench](canon/docs/agents/free-agent-test-bench-v0.1.md):

- Tool/Agent name and model name
- Auto-Edit mode: enabled or disabled
- Current branch and initial `git status`

## Hard boundaries

- Never reference, clone, fetch, or attempt to push to any other repository
  (Jester-Intelligence, ACED-Mobile-Platform, flamewalker-runtime, or any other).
- Never commit secrets, tokens, API keys, or `.env` files. Use `.env.example`
  with placeholder values instead.
- Never add paid-service dependencies. This is a Lane 2 (free/BYOK) environment
  under the ACED Model Budget Governor: stay at cost 0.
- Never edit anything under `canon/`. It is a receive-only mirror of the
  canon doctrine (contracts, schemas, agent protocols), overwritten
  automatically on every canon push — treat it as read-only reference.
- Do not delete or rewrite this file.

## Working structure

Put each task in its own folder under `experiments/`:

```
experiments/<yyyy-mm-dd>-<short-slug>/
  README.md        # what this experiment is, how to run it
  ...              # the actual work, self-contained
```

Keep experiments self-contained — their own package.json / requirements.txt,
no cross-experiment imports.

## Promotion path (how work leaves this repo)

Nothing self-promotes. When an experiment is worth keeping, finish it with a
`PROMOTION_PACKET.md` in the experiment folder following
[Promotion Packet v0.1](canon/docs/agents/promotion-packet-v0.1.md): source repo, changed
files, risk class, privacy class, tests run, rollback plan. A human reviews the
packet and ports the work into a canon repo. Per doctrine:

> No sandbox or mobile work self-promotes into Jester-Intelligence.
