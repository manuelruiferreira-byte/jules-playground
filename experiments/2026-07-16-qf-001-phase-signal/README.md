# Quantum funding-rate phase circuit — encoding & sign-readout proof

Isolated, self-contained experiment. **Not** part of any production repository.

## Scope and disclaimer

This experiment **does not predict the market**. The funding-rate value and its
sign are classical market data supplied by the caller. The quantum circuit only:

1. **encodes** that classical sign into a relative phase, and
2. **reads the sign back out**.

It validates **phase encoding and phase-sign readout**, nothing more.

## What it proves

| Circuit | Gates | P(0) | Sign-aware? |
|---|---|---|---|
| Original (X-basis) | `H → RZ(θ) → H → measure` | `(1+cos θ)/2` | **No** — `cos` is even, so `θ=+π/2` and `θ=−π/2` both give 0.5/0.5 |
| Corrected (Y-basis) | `H → RZ(θ) → Sdg → H → measure` | `(1+sin θ)/2` | **Yes** — `sin` is odd: `+π/2→1`, `−π/2→0`, `0→0.5` |

Sign mapping: positive funding → `θ=+π/2`, negative → `θ=−π/2`, zero → `θ=0`.

Readout uses a **phase score** with a neutral band:

```
phase_score = prob_zero - prob_one
neutral_tolerance = 0.10
> +tol → "positive" ; < -tol → "negative" ; else → "neutral"
```

## Run

```bash
python -m pip install qiskit qiskit-aer pytest
python -m pytest -q          # test suite (incl. sign-blind regression)
python quantum_signal.py     # prints the three returned dictionaries
```

Simulator runs are seeded (`seed_simulator=42`) for reproducibility.

## Provenance (KCES durable import)

Imported 2026-07-16 by Fable 5 as part of the KCES v0.1 vertical slice.
Origin: isolated git repository created in the 2026-07-16 session container,
commit `f6c521d` ("Quantum funding-rate phase circuit: encoding + sign-readout
proof"), previously existing nowhere durable. Files copied verbatim
(`quantum_signal.py`, `tests/test_quantum_signal.py`, original README above).
Original verified results: 9/9 pytest passing on qiskit 2.5.0 / qiskit-aer
0.17.2 / Python 3.11; corrected Y-basis circuit separates funding-rate sign
(P0=1.0 vs P0=0.0), original X-basis circuit proven sign-blind (~0.5/0.5 both
signs). Scope: validates phase encoding and phase-sign readout only; the
funding value and sign are classical market data; no market prediction is
claimed and no trading authority exists.
