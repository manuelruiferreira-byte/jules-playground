# Active event binding change review

Independent maintenance review of PR15 comments4176585513 and4176585518, 2026-10-04. Sandbox only; no canon promotion.

Currentmain763baa69047db8620bb9113a4a34e82710427591 still generates a promotion event with the superseded July experiment ID, and README still states the July epoch and10checks. The schema-only outbox audit accepts that stale subject. Both comments remain applicable after the timestamp-only final PR15 commit.

New epoch: epoch:2026-10-04-event-binding. Previous manifest and frozen registry are archived verbatim. The active maintenance manifest supersedes the epoch-binding manifest and preserves lineage. Autopilot reads MANIFEST.json, uses manifest.id as subject_ref, and includes manifest.id plus evaluator_epoch in its stable event ID. It writes autopilot-dry-run-active.json, leaving historical autopilot-dry-run.json unchanged. The audit requires that active event to exist and match the active manifest ID, epoch-bound event ID and promotion_decided type. Existing schema and delivery checks still validate every historical outbox event. A stale historical event can therefore remain historical without masquerading as active output.

Acceptance is stricter: wrong subject, stale ID or missing active output is BLOCKED. No schema, calibration, risk, scientific claim, resource or optional Python rule is weakened. README describes the active15checks, verdict-active.json and the required generator-first workflow.

Exact changed evaluator source SHA256s:
- autoaudit/run-autoaudit.mjs: ed875637bd683d0cbfd57fbb61c9a73f845928ba924391fcaf3815e9c8418bec
- autopilot/dry-run.mjs: fa7b842a76a1c31bc76abe61f4f83212554deb82c6a16e44c5e39650da45cb17
The SIPR harness digest remains unchanged.

Validation: full equipped isolated-Python audit15/15PASS, including12/12existing quantum tests,1702ms against120000ms budget. Seven-case disposable regression passes: correct output succeeds; manifest, registry, individual-entry, active-subject, active-ID and missing-active-output each BLOCKED/exit1. Every case preserves historical verdict and original event bytes. No new runtime event or verdict is committed as historical proof.

Rollback: revert maintenance commits; archived manifests/registries and historical evidence remain available. No live worker modified.
