// SEE v0.1 — full automatic vertical slice.
// Capture → Reconstruct → Extract Geometry → Match Echoes → Form Hypothesis →
// Design Test → Execute → Audit → Apply → Measure → Learn. No human step.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { openDb } from "./engine/db.mjs";
import { collectSeeds, reconstruct, extractGeometry, EXTRACTOR_VERSION } from "./engine/analyze.mjs";
import { runLoop } from "./engine/loop.mjs";
import { runAudit } from "./engine/audit.mjs";

const ROOT = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");
const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

// Rebuild the store from committed seeds every run: derived projection, never a ledger.
const db = openDb(`${ROOT}/see.db`, { rebuild: true });
const c = collectSeeds(db, `${ROOT}/seeds/trajectories.json`);
reconstruct(db);
extractGeometry(db);
console.log(`CAPTURE+RECONSTRUCT+GEOMETRY: ${c.trajectories} trajectories, ${c.events} events, extractor ${EXTRACTOR_VERSION}`);

const loop = runLoop(db, ROOT);
console.log(`ECHOES: ${loop.echoes.length} evaluated, ${loop.strongEchoes.length} strong, ${loop.echoes.filter((e) => e.suppressed).length} suppressed`);
console.log(`EXPERIMENT: ${loop.experiment.result_summary}`);
console.log(`CLASSIFICATION: ${loop.experiment.classification}`);

const audit = runAudit(db, ROOT, loop);
loop.utility.signals.survived_audit = audit.verdict === "pass" || audit.verdict === "pass_narrowed";
for (const chk of audit.checks) console.log(`${chk.result.toUpperCase().padEnd(4)} ${chk.check}${chk.detail ? " — " + chk.detail : ""}`);
console.log(`AUDIT VERDICT: ${audit.verdict}`);

// ---- evidence + Kairoth read-model projection --------------------------------
const evidence = {
  schema_version: "see-0.1", generated_at: now(),
  records: [...loop.records, audit],
};
writeFileSync(`${ROOT}/evidence/see-exp-001-records.json`, JSON.stringify(evidence, null, 2) + "\n");

// Chronology + source binding: prove the stage order with machine stamps and
// bind the evidence to the exact source revision that produced it. The
// combined digest is commit-independent (recomputable from any checkout), so
// it survives the evidence-then-commit chicken-and-egg.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
const SOURCE_FILES = [
  "contracts/see-v0.1.schema.json", "contracts/prereg-epoch-b.json", "contracts/prereg.json",
  "seeds/trajectories.json", "engine/db.mjs", "engine/analyze.mjs", "engine/matching.mjs",
  "engine/loop.mjs", "engine/audit.mjs", "run-slice.mjs",
].sort();
const fileDigests = Object.fromEntries(SOURCE_FILES.map((f) => [f, "sha256:" + createHash("sha256").update(readFileSync(`${ROOT}/${f}`)).digest("hex")]));
const combined = "sha256:" + createHash("sha256").update(SOURCE_FILES.map((f) => `${f}=${fileDigests[f]}`).join("\n")).digest("hex");
writeFileSync(`${ROOT}/evidence/chronology.json`, JSON.stringify({
  note: "Machine-stamped stage chronology (see-audit-0.2 check #12 verifies monotonicity) and source binding. Recompute the combined digest from any checkout to prove which revision generated this evidence: sha256 over 'path=sha256:<file digest>' lines, sorted by path, joined by newlines.",
  epoch: "epoch:see-2026-07-16-b",
  preregistration: { file: "contracts/prereg-epoch-b.json", digest: loop.preregDigest, preregistered_at: loop.prereg.preregistered_at },
  stages: {
    prereg_loaded_at: loop.preregLoadedAt,
    rankings_generated_at: loop.rankingsProducedAt,
    ground_truth_scored_at: loop.scoredAt,
    audit_issued_at: audit.issued_at,
  },
  source_binding: { files: fileDigests, combined },
}, null, 2) + "\n");
console.log(`CHRONOLOGY: ${loop.prereg.preregistered_at} (prereg) -> ${loop.preregLoadedAt} (loaded) -> ${loop.rankingsProducedAt} (ranked) -> ${loop.scoredAt} (scored) -> ${audit.issued_at} (audited)`);
console.log(`SOURCE BINDING: ${combined}`);
writeFileSync(`${ROOT}/evidence/rankings.json`, JSON.stringify({
  produced_at: loop.rankingsProducedAt,
  note: "Raw rankings for every probe and method, produced before ground-truth scoring.",
  rankings: Object.fromEntries(Object.entries(loop.allRankings).map(([probe, byMethod]) => [
    probe,
    Object.fromEntries(Object.entries(byMethod).map(([m, list]) => [m, list.map((x) => ({ id: x.id, score: Math.round(x.score * 1000) / 1000 }))])),
  ])),
}, null, 2) + "\n");

const projection = {
  view: "kairoth-echo-engine-v0.1",
  generated_at: now(),
  current_trajectory: { id: "traj:see-slice-itself", title: "SEE v0.1 vertical slice", status: "completed" },
  detected_echoes: loop.strongEchoes.map((e) => ({
    probe: e.probe_trajectory, matched: e.matched_trajectory, score: e.score,
    why: e.explanation, shared_anchors: e.shared_anchors,
  })),
  hypothesis: { id: loop.hypothesis.id, implication: loop.hypothesis.predicted_implication, risk_class: loop.hypothesis.risk_class },
  experiment_state: { id: loop.experiment.id, status: loop.experiment.status, classification: loop.experiment.classification, summary: loop.experiment.result_summary },
  audit_state: { id: audit.id, verdict: audit.verdict, auditor_is_builder: audit.auditor_is_builder, checks_passed: audit.checks.filter((x) => x.result === "pass").length, checks_total: audit.checks.length },
  promotion_state: { governed_memory: loop.lesson.governed_memory_status, note: "Independent (non-builder) review required before any promotion; autonomy in calibration." },
  measured_result: loop.utility.signals,
  lesson: { id: loop.lesson.id, status: loop.lesson.status, statement: loop.lesson.statement },
  exceptions_for_manuel: evidence.records.filter((r) => r.record_type === "exception" && r.requires_manuel),
  routine_summary: loop.exception.summary,
};
writeFileSync(`${ROOT}/evidence/kairoth-projection.json`, JSON.stringify(projection, null, 2) + "\n");

console.log(`LESSON: [${loop.lesson.status}] ${loop.lesson.statement}`);
console.log(`ROUTINE SUMMARY FOR MANUEL: ${loop.exception.summary}`);
const ok = audit.verdict === "pass" || audit.verdict === "pass_narrowed";
console.log(`SLICE: ${ok ? "COMPLETE" : "AUDIT-REJECTED"} (records: ${evidence.records.length})`);
process.exit(ok ? 0 : 1);
