# SIPR-EXP-001 — Preregistration (declared before first run)

Category: `classical_software` (explicitly NOT quantum; no physical quantum
language applies). Risk class: R1 (isolated benchmark; no production change).

## Hypothesis

A single-pass canonical JSON serializer (building the output string during
recursion) yields higher steady-state canonical-hash throughput than the
baseline two-pass serializer (recursive key-sorted object rebuild followed by
`JSON.stringify`), on representative Kairoth-shaped state documents.

Falsifiable: if steady-state throughput gain ≤ 0, the hypothesis is false.

## SIPR declaration

- **System boundary:** one Node.js process in this experiment folder; no
  network; no external state. Input corpus generated deterministically from a
  seeded PRNG.
- **Observable / primary metric:** canonicalizations per second (ops/sec) over
  fixed-size measurement windows.
- **Measurement map:** `ops_in_window / window_wall_time_seconds`, measured with
  `performance.now()`.
- **Baseline:** two-pass serializer (faithful port of the production
  `canonicalSerialize` pattern: recursive sorted rebuild + `JSON.stringify`).
- **Intervention:** single-pass serializer (direct string construction with
  sorted keys and `JSON.stringify` for scalar escaping).
- **Immediate disturbance & recovery:** the first `WARMUP_WINDOWS` windows are
  the recovery trajectory (JIT warm-up); they are recorded but excluded from
  the plateau statistic.
- **Plateau window:** the subsequent `STEADY_WINDOWS` windows. Plateau is
  *stable* when `stddev/mean` of window throughput < 0.15.
- **Resource input:** wall time per phase and process peak RSS, recorded in the
  results (`cost_basis: measured`).
- **Confounds:** JIT warm-up order, GC pauses, container CPU contention.
  Mitigations: per-variant warm-up, interleaved run order across replications,
  identical corpus per variant, ≥3 replications.
- **Negative control:** the baseline function registered a second time under an
  intervention label. Expected gain ≈ 0 (|gain| < 10%). If it exceeds 10%,
  the harness is biased and the run is invalid.
- **Reversed control:** a deliberately pessimized variant (redundant deep clone
  before serializing). Expected gain strictly negative. If it shows a positive
  gain, the harness is invalid.
- **Replication requirement:** 3 independent replications (fresh corpora from
  distinct seeds). The effect sign must agree in all 3.
- **Failure condition:** intervention steady-state gain ≤ 0 in any replication,
  or any control violates its expectation, or plateau unstable in baseline or
  intervention.
- **Rollback condition:** none needed — no production system is modified. The
  experiment folder is deletable; adoption of the optimized serializer into
  Kairoth would be a separate R2 candidate requiring its own audits.

## Declared thresholds (fixed now, not tunable after results)

| Constant | Value |
| --- | --- |
| WARMUP_WINDOWS | 3 |
| STEADY_WINDOWS | 5 |
| OPS_PER_WINDOW | 300 |
| PLATEAU_CV_MAX | 0.15 |
| NEGATIVE_CONTROL_MAX_ABS_GAIN | 0.10 |
| REPLICATIONS | 3 |
| SEEDS | 11, 23, 47 |

## Claim classification rules

- `unsupported` — failure condition met or controls invalid.
- `provisional` — 1–2 replications pass, controls valid.
- `replicated` — all 3 replications pass with agreeing sign, controls valid,
  plateaus stable.
- `production_proven` — NOT reachable inside this experiment; requires adoption
  plus post-merge runtime measurement under a separate manifest.

Preregistered: 2026-07-16. Builder: Fable 5. Any post-hoc threshold change
invalidates the run and requires a new manifest superseding this one.
