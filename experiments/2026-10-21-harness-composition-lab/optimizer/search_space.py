"""Deterministic candidate search space enumerator."""

import itertools
from typing import List
from harness_lab.interfaces import CandidateConfig


def generate_candidate_space() -> List[CandidateConfig]:
    """Generates all 54 deterministic candidate configurations."""
    dispatchers = ["direct", "classification", "scored"]
    memory_modes = ["none", "summary", "bounded-retrieval"]
    verifiers = ["schema", "dual-check", "trace-policy"]
    retries = [0, 1]

    candidates = []
    idx = 0
    for d, m, v, r in itertools.product(dispatchers, memory_modes, verifiers, retries):
        cand_id = f"cand_{idx:02d}"
        candidates.append(
            CandidateConfig(
                candidate_id=cand_id,
                dispatcher=d,
                memory_mode=m,
                verifier=v,
                bounded_retries=r,
            )
        )
        idx += 1
    return candidates


def get_baseline_candidate() -> CandidateConfig:
    """Returns candidate_00: control baseline (direct / none / schema / 0 retries)."""
    return CandidateConfig(
        candidate_id="cand_00",
        dispatcher="direct",
        memory_mode="none",
        verifier="schema",
        bounded_retries=0,
    )
