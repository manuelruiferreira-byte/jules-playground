# Import isolation evaluator change review

Reviewer: ChatGPT Work independent review of Jules PR #7, 2026-10-04. Scope is sandbox maintenance; this review does not promote anything into canon.

## Problem and corrected proposal

The prior implementation already uses execFileSync with an argument array and does not interpolate a shell command. The justified hardening is protection against accidental Python import-path hijacking, not removal of a demonstrated shell injection. PR #7 inconsistently probes normal Python and then runs isolated Python. A real environment with user-site qiskit and pytest passes that probe but fails isolated execution with `No module named pytest`.

The replacement probes and executes the same `python3 -I` interpreter, checks qiskit_aer as well as qiskit and pytest, and passes the absolute test path after `--`. Test files still explicitly insert the experiment directory in sys.path, so this is not a sandbox or protection against hostile repository tests. The optional-toolchain skip rule stays unchanged in substance: absence of dependencies for the actual execution interpreter is a skip. No existing PASS/FAIL assertion or claim threshold is weakened.

## Epoch and comparison

Previous epoch: epoch:2026-07-16-a. Its registry is archived verbatim in evaluators/epochs/2026-07-16-a.registry.json. New epoch: epoch:2026-10-04-import-isolation. All definitions other than autoaudit retain their digests; autoaudit also updates its emitted evaluator_epoch to the new epoch. Registry change_review points to this file. The prior committed verdict remains untouched and is historical evidence.

## Evidence and limits

- Original normal preflight succeeds with user-site dependencies; proposed PR #7 isolated invocation fails because pytest is not visible. Reproduced on Python 3.12.
- Corrected autoaudit source passes node --check on Node 24.19.0.
- Exact PR #12 full quantum tests pass 12/12 using the normal dependency-equipped interpreter. This does not substitute for a full autoaudit run.
- The corrected source SHA256 is fcc72db387cc3fabefe9244f5b6c4d4aae97d56db738f142b8e65c06e83fefd7.
- Full new-epoch autoaudit passes all 13 checks with an isolated dependency-equipped Python virtual environment, including 12/12 quantum tests, in 1489ms against the 120000ms budget. With only user-site dependencies available, the same audit passes 12 checks and reports one correct optional-toolchain skip.
- SHA provenance and all evaluator-definition digest checks pass against exact remote source bytes. Temporary verdicts are test outputs and are not committed over the historical verdict.

Rollback: revert replacement commits; archived prior registry preserves the frozen previous definition. No production runtime changed.
