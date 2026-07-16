"""Quantum phase-encoding of a funding-rate sign, with a runnable proof that
the original X-basis circuit is sign-blind and the corrected Y-basis circuit is
not.

IMPORTANT SCOPE NOTE
--------------------
This module does NOT predict markets. The funding-rate value and its sign come
from classical market data supplied by the caller. What the quantum circuit
does is (a) *encode* that classical sign into a relative phase and (b) *read the
sign back out*. This file validates phase encoding and phase-sign readout only.

The physics
-----------
Prepare |0>, apply H, then RZ(theta). Up to a global phase the state is

    (|0> + e^{i*theta} |1>) / sqrt(2).

Original circuit ("X-basis readout"):  H -> RZ(theta) -> H -> measure
    P(0) = (1 + cos(theta)) / 2.
    cos is an *even* function, so theta = +pi/2 and theta = -pi/2 both give
    P(0) = 0.5. The circuit cannot see the sign -> SIGN-BLIND.

Corrected circuit ("Y-basis readout"): H -> RZ(theta) -> Sdg -> H -> measure
    Sdg rotates the relative phase by -pi/2, so
    P(0) = (1 + sin(theta)) / 2.
    sin is an *odd* function:
        theta = +pi/2 -> P(0) = 1   (reads "positive")
        theta = -pi/2 -> P(0) = 0   (reads "negative")
        theta =    0  -> P(0) = 0.5 (reads "neutral")
    The corrected circuit recovers the encoded sign.
"""

from __future__ import annotations

import math
import numbers

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

# Phase-encoding convention: the sign of the classical funding rate maps to the
# sign of a +/- pi/2 relative phase.
POSITIVE_PHASE = math.pi / 2
NEGATIVE_PHASE = -math.pi / 2
ZERO_PHASE = 0.0

NEUTRAL_TOLERANCE = 0.10
SEED_SIMULATOR = 42


def _validate_inputs(funding_rate, shots) -> None:
    """Raise TypeError for non-numeric funding, ValueError for bad shot counts."""
    # bool is a subclass of int; funding rates are real numbers, not booleans.
    if isinstance(funding_rate, bool) or not isinstance(funding_rate, numbers.Real):
        raise TypeError(
            f"funding_rate must be a real number, got {type(funding_rate).__name__}"
        )
    if math.isnan(funding_rate) or math.isinf(funding_rate):
        raise ValueError("funding_rate must be finite")
    if isinstance(shots, bool) or not isinstance(shots, numbers.Integral):
        raise TypeError(f"shots must be an integer, got {type(shots).__name__}")
    if shots <= 0:
        raise ValueError(f"shots must be a positive integer, got {shots}")


def input_sign(funding_rate: float) -> str:
    """Classical sign of the supplied market funding rate."""
    if funding_rate > 0:
        return "positive"
    if funding_rate < 0:
        return "negative"
    return "neutral"


def funding_to_phase(funding_rate: float) -> float:
    """Map the classical funding-rate sign to an encoded relative phase."""
    sign = input_sign(funding_rate)
    if sign == "positive":
        return POSITIVE_PHASE
    if sign == "negative":
        return NEGATIVE_PHASE
    return ZERO_PHASE


def build_corrected_circuit(theta: float) -> QuantumCircuit:
    """Corrected Y-basis circuit: H -> RZ(theta) -> Sdg -> H -> measure."""
    qc = QuantumCircuit(1, 1)
    qc.h(0)
    qc.rz(theta, 0)
    qc.sdg(0)
    qc.h(0)
    qc.measure(0, 0)
    return qc


def build_original_circuit(theta: float) -> QuantumCircuit:
    """Original X-basis circuit (sign-blind): H -> RZ(theta) -> H -> measure."""
    qc = QuantumCircuit(1, 1)
    qc.h(0)
    qc.rz(theta, 0)
    qc.h(0)
    qc.measure(0, 0)
    return qc


def _run_counts(qc: QuantumCircuit, shots: int) -> dict[str, int]:
    """Execute a circuit on the seeded Aer simulator and return raw counts."""
    simulator = AerSimulator()
    compiled = transpile(qc, simulator)
    result = simulator.run(
        compiled, shots=shots, seed_simulator=SEED_SIMULATOR
    ).result()
    return result.get_counts()


def _probs(counts: dict[str, int], shots: int) -> tuple[float, float]:
    """Return (prob_zero, prob_one) from measurement counts."""
    prob_zero = counts.get("0", 0) / shots
    prob_one = counts.get("1", 0) / shots
    return prob_zero, prob_one


def classify_phase_score(phase_score: float) -> str:
    """Read the measured phase sign from the phase score, with a neutral band."""
    if phase_score > NEUTRAL_TOLERANCE:
        return "positive"
    if phase_score < -NEUTRAL_TOLERANCE:
        return "negative"
    return "neutral"


def get_quantum_signal(funding_rate: float, shots: int) -> dict:
    """Encode the funding-rate sign as a phase and read it back (corrected circuit).

    Returns a dictionary describing the classical input, the encoded phase, the
    measured probabilities, the phase score, and the measured phase sign.
    """
    _validate_inputs(funding_rate, shots)

    sign = input_sign(funding_rate)
    theta = funding_to_phase(funding_rate)

    qc = build_corrected_circuit(theta)
    counts = _run_counts(qc, shots)
    prob_zero, prob_one = _probs(counts, shots)

    # Phase score instead of a raw two-probability comparison: it is signed,
    # symmetric, and directly maps to the neutral tolerance band.
    phase_score = prob_zero - prob_one
    measured_phase_sign = classify_phase_score(phase_score)

    return {
        "funding_rate": funding_rate,
        "input_sign": sign,
        "phase": theta,
        "shots": shots,
        "counts": counts,
        "prob_zero": prob_zero,
        "prob_one": prob_one,
        "phase_score": phase_score,
        "neutral_tolerance": NEUTRAL_TOLERANCE,
        "measured_phase_sign": measured_phase_sign,
        "circuit": "corrected_y_basis",
    }


def get_original_signal(funding_rate: float, shots: int) -> dict:
    """Same encoding, but read out with the ORIGINAL sign-blind X-basis circuit.

    Used by the regression demonstration to prove the original circuit collapses
    both signs onto P(0) ~= P(1) ~= 0.5.
    """
    _validate_inputs(funding_rate, shots)

    sign = input_sign(funding_rate)
    theta = funding_to_phase(funding_rate)

    qc = build_original_circuit(theta)
    counts = _run_counts(qc, shots)
    prob_zero, prob_one = _probs(counts, shots)
    phase_score = prob_zero - prob_one

    return {
        "funding_rate": funding_rate,
        "input_sign": sign,
        "phase": theta,
        "shots": shots,
        "counts": counts,
        "prob_zero": prob_zero,
        "prob_one": prob_one,
        "phase_score": phase_score,
        "neutral_tolerance": NEUTRAL_TOLERANCE,
        "measured_phase_sign": classify_phase_score(phase_score),
        "circuit": "original_x_basis",
    }


if __name__ == "__main__":
    import json

    for fr, sh in [(0.0123, 1024), (-0.008, 1024), (0.0, 8192)]:
        print(f"get_quantum_signal({fr}, {sh}) =")
        print(json.dumps(get_quantum_signal(fr, sh), indent=2))
        print()
