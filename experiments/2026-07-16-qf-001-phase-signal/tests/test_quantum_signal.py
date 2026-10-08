"""Executable proof of the funding-rate phase circuit.

- Cases A/B/C/D exercise the corrected Y-basis circuit (get_quantum_signal).
- The regression case proves the ORIGINAL X-basis circuit is sign-blind.

Scope: this validates phase encoding and phase-sign readout only. It does not
predict markets; the funding-rate sign is classical market data.
"""

import math
import sys
from pathlib import Path

import pytest

# Make the module importable when pytest is run from the folder root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from quantum_signal import (  # noqa: E402
    get_original_signal,
    get_quantum_signal,
)

HALF_PI = math.pi / 2  # ~= 1.570796


# --------------------------------------------------------------------------- #
# A. Positive funding
# --------------------------------------------------------------------------- #
def test_positive_funding():
    result = get_quantum_signal(0.0123, 1024)

    assert result["input_sign"] == "positive"
    assert result["phase"] == pytest.approx(1.570796, abs=1e-6)
    assert result["prob_zero"] >= 0.99
    assert result["prob_one"] <= 0.01
    assert result["phase_score"] > 0
    assert result["measured_phase_sign"] == "positive"


# --------------------------------------------------------------------------- #
# B. Negative funding
# --------------------------------------------------------------------------- #
def test_negative_funding():
    result = get_quantum_signal(-0.008, 1024)

    assert result["input_sign"] == "negative"
    assert result["phase"] == pytest.approx(-1.570796, abs=1e-6)
    assert result["prob_one"] >= 0.99
    assert result["prob_zero"] <= 0.01
    assert result["phase_score"] < 0
    assert result["measured_phase_sign"] == "negative"


# --------------------------------------------------------------------------- #
# C. Neutral funding
# --------------------------------------------------------------------------- #
def test_neutral_funding():
    result = get_quantum_signal(0.0, 8192)

    assert result["input_sign"] == "neutral"
    assert result["phase"] == 0
    assert 0.47 <= result["prob_zero"] <= 0.53
    assert 0.47 <= result["prob_one"] <= 0.53
    assert result["measured_phase_sign"] == "neutral"


# --------------------------------------------------------------------------- #
# D. Input validation
# --------------------------------------------------------------------------- #
def test_zero_shots_raises_value_error():
    with pytest.raises(ValueError):
        get_quantum_signal(0.0123, 0)


def test_negative_shots_raises_value_error():
    with pytest.raises(ValueError):
        get_quantum_signal(0.0123, -100)


def test_non_numeric_funding_raises_type_error():
    with pytest.raises(TypeError):
        get_quantum_signal("not-a-number", 1024)


@pytest.mark.parametrize("funding_rate", [True, False])
@pytest.mark.parametrize("signal", [get_quantum_signal, get_original_signal])
def test_boolean_funding_raises_type_error(signal, funding_rate):
    with pytest.raises(TypeError):
        signal(funding_rate, 1024)


def test_none_funding_raises_type_error():
    with pytest.raises(TypeError):
        get_quantum_signal(None, 1024)


@pytest.mark.parametrize("funding_rate", [True, False])
def test_boolean_funding_raises_type_error(funding_rate):
    with pytest.raises(TypeError):
        get_quantum_signal(funding_rate, 1024)


def test_nan_funding_raises_value_error():
    with pytest.raises(ValueError):
        get_quantum_signal(math.nan, 1024)


def test_inf_funding_raises_value_error():
    with pytest.raises(ValueError):
        get_quantum_signal(math.inf, 1024)


def test_neg_inf_funding_raises_value_error():
    with pytest.raises(ValueError):
        get_quantum_signal(-math.inf, 1024)


# --------------------------------------------------------------------------- #
# 3. Regression: the ORIGINAL circuit is sign-blind
#    H -> RZ(theta) -> H -> measure, run with +pi/2 and -pi/2, both ~ 50/50.
# --------------------------------------------------------------------------- #
def test_original_circuit_is_sign_blind():
    positive = get_original_signal(0.0123, 8192)   # theta = +pi/2
    negative = get_original_signal(-0.008, 8192)    # theta = -pi/2

    # Both signs collapse to ~50/50 -> the original circuit cannot tell them apart.
    for res in (positive, negative):
        assert 0.47 <= res["prob_zero"] <= 0.53
        assert 0.47 <= res["prob_one"] <= 0.53
        assert res["measured_phase_sign"] == "neutral"

    # Opposite encoded phases, yet indistinguishable outputs.
    assert positive["phase"] == pytest.approx(1.570796, abs=1e-6)
    assert negative["phase"] == pytest.approx(-1.570796, abs=1e-6)
    assert abs(positive["phase_score"] - negative["phase_score"]) < 0.06


def test_corrected_circuit_separates_signs():
    """Companion to the regression: the corrected circuit DOES separate them."""
    positive = get_quantum_signal(0.0123, 8192)
    negative = get_quantum_signal(-0.008, 8192)

    assert positive["measured_phase_sign"] == "positive"
    assert negative["measured_phase_sign"] == "negative"
    # Large, opposite-signed separation the original circuit never produces.
    assert positive["phase_score"] > 0.9
    assert negative["phase_score"] < -0.9
