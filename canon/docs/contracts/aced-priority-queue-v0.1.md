# ACED Priority Queue v0.1

## Purpose

Turns Mission Control state into a daily recommended order: what is next, what
is stale, what is blocked, what needs the human.

## Lanes

- **firebreak** — active incident or hard external deadline; preempts everything.
- **now** — in-flight work; finish before starting new.
- **next** — ready to start; ranked by score.
- **planned** — shaped but not ready; excluded from the daily order.
- **waiting** — blocked on human, hardware, or external events; surfaced, not ranked.

## Scoring fields

Score each `next` task 0–100:

- priority (Mission Control 1–9, weight 40)
- unblocks_count (how many tasks/blockers it would release, weight 25)
- staleness_days (since updatedAt, weight 15; stale-but-important rises)
- cost_class (Lane 0/1 free work scores higher, weight 10)
- risk_class (lower risk first at equal value, weight 10)

## Staleness

- A `now` task untouched for 7+ days is stale: demote to `next` or `waiting`
  with a note, or close it.
- A dated task whose window has passed is stale by definition; it must be
  re-planned, not silently kept.

## Rules

- Firebreak entry/exit requires an explicit human decision, logged.
- The queue recommends; the human approves. Promotion/demotion of a task's
  lane is a Mission Control write with an idempotency key.
- The daily order lists at most 5 items; more is noise, not a plan.
- Every daily order names exactly one **next recommended action** at the top.
