# Epoch binding evaluator change review

Independent review by ChatGPT Work, 2026-10-04; sandbox maintenance only, no canon promotion.

The import-isolation audit could emit PASS under epoch:2026-10-04-import-isolation while the active MANIFEST named epoch:2026-07-16-a. All fields individually passed schema validation because no cross-record binding check existed. The previous 13-check PASS did not establish manifest/evaluator agreement.

This replacement introduces epoch:2026-10-04-epoch-binding. The active manifest has a distinct experiment ID, supersedes the original ID and records lineage. Original preregistration is archived verbatim as manifests/2026-07-16-a.MANIFEST.json; the original active manifest is not silently relabeled as newly preregistered. The new maintenance manifest has no preregistered timestamp. The frozen previous registry is archived verbatim.

New acceptance requires manifest.evaluator_epoch, registry.epoch, every evaluator-definition epoch and the emitted verdict's fixed epoch to agree. The emitted subject_ref comes from the active manifest ID. New verdict output goes to autoaudit/verdict-active.json, leaving historical autoaudit/verdict.json untouched. All existing schema, digest, resource, promotion-policy, secret, scientific-claim and Python checks remain in effect. This tightens acceptance; no threshold is weakened.

Exact new autoaudit source SHA256: 6187865cc2e03fbeff5a403ee4e90038de4848af7b2c914de210a0a56aa83268. The other evaluator source digests remain unchanged.

Validation: full equipped isolated-Python KCES audit passes 14/14 checks including 12/12 quantum tests in 1460ms against the original 120000ms budget. Regression harness executes positive and three negative full audits in disposable directories: historical manifest epoch, registry root epoch and individual evaluator epoch. Every mismatch produces BLOCKED and exit 1; positive produces PASS; historical verdict bytes are unchanged in every case. No new verdict is committed as historical proof.

Rollback: revert these maintenance commits; original manifest and both historical registries remain available. No runtime worker or canonical repository changed.
