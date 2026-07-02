# ACED Agent Harness v0.1

## Purpose

One architecture connecting the ACED agents so work flows: intake → triage →
routing → execution lane → extraction → Mission Control. Spec only; no canon
implementation without explicit approval (see Rules).

## Agents

- **Triage Agent** — classifies incoming work: task_class, privacy_class,
  risk_class, urgency. Produces an agent job (`schemas/aced-agent-job.schema.json`).
- **Mission Control Agent** — reads/writes Mission Control state through the
  REST wrapper only (idempotency keys mandatory). Owns task hygiene: stale
  detection, duplicate detection, status reconciliation, daily recommended
  order per Priority Queue v0.1.
- **Extraction Gate Agent** — reviews playground output and issues extraction
  verdicts per Extraction Gate v0.1.

## Shared services (not agents)

- **Cost Router** — turns an agent job into a route decision
  (`schemas/aced-route-decision.schema.json`) under Agent Router v0.1 and the
  routing packet schema (`docs/skills/cost-router/routing-packet-schema.md`).
- **Privacy Gate** — Green/Amber/Red classification; Red never leaves local.
- **Model Budget Governor** — lane doctrine and spend caps; cheapest safe path.
- **Audit Ledger** — every route decision, verdict, and canon mutation logs an entry.

## Modes

- **plan** — produce specs/packets only; no file mutation.
- **execute** — mutate files in the granted lane only.
- **canon** — Jester-Intelligence and other canon repos; human-approved
  Promotion Packets only; agents never push here directly.
- **twin** — jules-playground and future twins; unbounded execute within repo.

## Boundaries

- Agents talk to Mission Control only via the REST/OpenAPI wrapper; no direct
  state-file writes.
- Tool allowlist per agent is declared in its skill manifest
  (capability profile per the gateway enforcement layer in ACED-Mobile-Platform).
- Elevated surfaces (write, network, shell, repo) follow the gateway doctrine:
  deny by default, approval required.
- Free agents (Jules and similar) exist only in twin mode and only see the
  playground's synced canon doctrine, never canon code.

## Flow

1. Work arrives (user, GPT, mobile app, inbox) → Triage Agent classifies.
2. Cost Router + Privacy Gate + Budget Governor produce a route decision.
3. Execution happens in the selected lane (deterministic, local AI, twin
   free-agent, or approved premium handoff).
4. Twin output passes the Extraction Gate; verdict recorded.
5. Mission Control Agent updates state, recomputes the recommended order,
   and surfaces blockers needing human action.

## Rules

- Harness implementation prototypes belong in the playground first, promoted
  through the Extraction Gate like any other twin work.
- v0.1 targets the three agents above; more agents require a new contract
  version, not ad-hoc additions.
