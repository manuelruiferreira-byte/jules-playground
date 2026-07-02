# ACED Model Budget Governor v0.1

## Routing doctrine

Pick the cheapest safe path that can complete the task.

## Lanes

- Lane 0: Deterministic local logic, cost 0.
- Lane 1: Local AI, cost 0 after setup.
- Lane 2: Free or BYOK cloud, Green or sanitized Amber only.
- Lane 3: Premium handoff, explicit approval required.

## Never

- Never use premium if deterministic logic can do it.
- Never use cloud if local can do it safely.
- Never send Red data to cloud.
- Never use Codex or Claude Code for jobs that only need a packet.
- Never mutate canon repos without a Promotion Packet.
