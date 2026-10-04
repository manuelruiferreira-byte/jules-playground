// KCES AutoAudit v0.1 — Layer 1 (deterministic engineering checks). Runs for
// real. Emits an auditVerdict record. auditor_is_builder=true because Fable
// authored both the code and this pipeline: by contract this verdict can NEVER
// authorize promotion on its own (see Governor policy / promotion invariants).
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const EVALUATOR_EPOCH = "epoch:2026-10-04-epoch-binding";
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const sha256 = (s) => "sha256:" + createHash("sha256").update(s).digest("hex");
const evidence = [];
const check = (name, fn) => {
  try {
    const detail = fn();
    evidence.push({ check: name, result: "pass", detail: typeof detail === "string" ? detail : null });
  } catch (e) {
    if (e && e.skip) evidence.push({ check: name, result: "skip", detail: String(e.message) });
    else evidence.push({ check: name, result: "fail", detail: String(e.message ?? e).slice(0, 900) });
  }
};
const skip = (msg) => { const e = new Error(msg); e.skip = true; throw e; };
const t0 = Date.now();

// 1. Schema compiles (Draft 2020-12) and sub-validators resolve.
const schemaSrc = read("schemas/kairoth-evolution-v0.1.schema.json");
const schema = JSON.parse(schemaSrc);
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(schema, "evolution");
const forDef = (def) => ajv.compile({ $ref: `evolution#/$defs/${def}` });
const validators = {};
check("schema compiles", () => {
  for (const def of ["researchCard", "experimentManifest", "evaluatorDefinition", "auditVerdict", "promotionDecision", "reliabilityRecord", "evolutionEvent", "exceptionBrief"]) {
    validators[def] = forDef(def);
  }
  return "8 record validators compiled";
});
const mustValidate = (def, value, label) => {
  const v = validators[def];
  if (!v(value)) throw new Error(`${label} invalid vs ${def}: ${JSON.stringify(v.errors?.slice(0, 2))}`);
};

// 2. Vendored-schema drift check against recorded provenance digest.
check("vendored schema digest matches provenance", () => {
  const prov = JSON.parse(read("schemas/PROVENANCE.json"));
  if (prov.digest !== sha256(schemaSrc)) throw new Error(`digest drift: recorded ${prov.digest} actual ${sha256(schemaSrc)}`);
  return prov.canonical_home;
});

// 3. Every committed record validates against its contract.
check("MANIFEST.json validates as experimentManifest", () => {
  mustValidate("experimentManifest", JSON.parse(read("MANIFEST.json")), "MANIFEST.json");
});
check("research cards document validates", () => {
  const doc = JSON.parse(read("research/cards.json"));
  const full = ajv.getSchema("evolution");
  if (!full(doc)) throw new Error(JSON.stringify(full.errors?.slice(0, 2)));
  return `${doc.records.length} records`;
});
check("evaluator registry entries validate and are frozen", () => {
  const reg = JSON.parse(read("evaluators/registry.json"));
  for (const ev of reg.evaluators) {
    mustValidate("evaluatorDefinition", ev, ev.id);
    if (!ev.frozen) throw new Error(`${ev.id} is not frozen during active epoch`);
  }
  return `epoch ${reg.epoch}, ${reg.evaluators.length} evaluators`;
});

// An audit must bind the active experiment, registry and emitted verdict to one epoch.
check("manifest, registry and verdict epochs agree", () => {
  const manifest = JSON.parse(read("MANIFEST.json"));
  const registry = JSON.parse(read("evaluators/registry.json"));
  if (manifest.evaluator_epoch !== EVALUATOR_EPOCH || registry.epoch !== EVALUATOR_EPOCH
      || registry.evaluators.some((ev) => ev.epoch !== EVALUATOR_EPOCH)) {
    throw new Error(`epoch mismatch: manifest=${manifest.evaluator_epoch}, registry=${registry.epoch}, verdict=${EVALUATOR_EPOCH}`);
  }
  return EVALUATOR_EPOCH;
});

// 4. Evaluator freeze integrity: registry digests match current file bytes.
check("evaluator definition digests match file contents (no silent weakening)", () => {
  const reg = JSON.parse(read("evaluators/registry.json"));
  for (const ev of reg.evaluators) {
    const actual = sha256(read(ev.name));
    if (actual !== ev.definition_digest) throw new Error(`${ev.name}: digest ${actual} != registered ${ev.definition_digest}`);
  }
});

// 5. Autopilot decisions validate and respect constitutional invariants.
check("autopilot decisions validate and invariants hold", () => {
  const { decisions } = JSON.parse(read("autopilot/decisions.json"));
  for (const d of decisions) {
    mustValidate("promotionDecision", d, d.id);
    if (d.risk_class === "R3" && d.decision === "promote") throw new Error(`${d.id}: R3 promoted`);
    if (d.autonomy_mode === "calibration" && d.decision === "promote") throw new Error(`${d.id}: promoted in calibration`);
    if (!d.dry_run) throw new Error(`${d.id}: dry_run must be true in v0.1`);
  }
  return `${decisions.length} decisions`;
});

// 6. SIPR results: recompute classification from raw windows (claim-inflation guard).
check("SIPR classification recomputed from raw windows matches claim", () => {
  const r = JSON.parse(read("sipr-experiment/results.json"));
  const { PLATEAU_CV_MAX, NEG_CTRL_MAX, SEEDS } = r.thresholds;
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const cvf = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) / m; };
  const plateau = (ws) => ws.filter((w) => w.phase === "plateau").map((w) => w.ops_per_sec);
  let passes = 0, controlsValid = true, plateausStable = true;
  for (const rep of r.replications) {
    const base = mean(plateau(rep.windows.baseline));
    const gain = mean(plateau(rep.windows.intervention)) / base - 1;
    const neg = mean(plateau(rep.windows.negative_control)) / base - 1;
    const rev = mean(plateau(rep.windows.reversed_control)) / base - 1;
    if (Math.abs(gain - rep.derived.intervention_gain) > 1e-9) throw new Error(`seed ${rep.seed}: derived gain mismatch`);
    if (gain > 0) passes++;
    if (Math.abs(neg) >= NEG_CTRL_MAX || rev >= 0) controlsValid = false;
    if (cvf(plateau(rep.windows.baseline)) >= PLATEAU_CV_MAX || cvf(plateau(rep.windows.intervention)) >= PLATEAU_CV_MAX) plateausStable = false;
  }
  let expected = "unsupported";
  if (controlsValid && plateausStable) expected = passes === SEEDS.length ? "replicated" : passes >= 1 ? "provisional" : "unsupported";
  if (expected !== r.claim_classification) throw new Error(`claim says ${r.claim_classification}, recomputation says ${expected}`);
  return `classification ${expected} confirmed (${passes}/${SEEDS.length} replications)`;
});

// 7. Events in the outbox validate; none claims direct ledger delivery.
check("event outbox validates and is outbox-only", () => {
  const dir = join(ROOT, "events/outbox");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) throw new Error("outbox empty");
  for (const f of files) {
    const ev = JSON.parse(readFileSync(join(dir, f), "utf8"));
    mustValidate("evolutionEvent", ev, f);
    if (ev.delivery !== "outbox") throw new Error(`${f}: delivery=${ev.delivery}, isolated experiments may only write outbox`);
  }
  return `${files.length} events`;
});

// 8. Secret scan over the experiment tree (excluding dependency dirs).
check("secret scan", () => {
  const bad = /(api[_-]?key\s*[:=]\s*["'][A-Za-z0-9]{12,}|BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{20,}|xox[baprs]-|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,})/;
  const walk = (dir) => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (f === "node_modules" || f === "__pycache__" || f === ".git") return [];
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
  for (const p of walk(ROOT)) {
    if (bad.test(readFileSync(p, "utf8"))) throw new Error(`potential secret in ${relative(ROOT, p)}`);
  }
});

// 9. QF-001 import: provenance recorded; tests run when toolchain is present.
check("QF-001 provenance recorded", () => {
  const readme = readFileSync(join(ROOT, "../2026-07-16-qf-001-phase-signal/README.md"), "utf8");
  if (!readme.includes("f6c521d")) throw new Error("QF-001 README lacks origin commit f6c521d");
});
check("QF-001 pytest (optional toolchain)", () => {
  try { execFileSync("python3", ["-I", "-c", "import qiskit, qiskit_aer, pytest"], { stdio: "pipe" }); }
  catch { skip("qiskit/qiskit-aer/pytest not installed for isolated Python"); }
  const targetDir = join(ROOT, "../2026-07-16-qf-001-phase-signal");
  const out = execFileSync("python3", ["-I", "-m", "pytest", "-q", "--", join(targetDir, "tests")], { cwd: targetDir, stdio: "pipe" }).toString();
  const m = out.match(/(\d+) passed/);
  if (!m) throw new Error(`pytest did not report passes: ${out.slice(-200)}`);
  return `${m[1]} tests passed`;
});

// 10. Resource budget: audit itself stays within the manifest budget.
const wallMs = Date.now() - t0;
check("resource budget respected", () => {
  const manifest = JSON.parse(read("MANIFEST.json"));
  const budget = manifest.resource_budget.wall_time_ms;
  if (budget && wallMs > budget) throw new Error(`audit wall time ${wallMs}ms exceeds budget ${budget}ms`);
  return `${wallMs}ms of ${budget}ms budget`;
});

// --- verdict -----------------------------------------------------------------
const failed = evidence.filter((e) => e.result === "fail");
const verdictValue = failed.length === 0 ? "PASS" : "BLOCKED";
let commit = "0000000";
try { commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, stdio: "pipe" }).toString().trim(); } catch { /* not in git yet */ }
const verdict = {
  record_type: "audit_verdict",
  id: `verdict:kces-slice-deterministic-${new Date().toISOString().slice(0, 10)}`,
  subject_ref: JSON.parse(read("MANIFEST.json")).id,
  layer: "deterministic",
  verdict: verdictValue,
  auditor: "kces-autoaudit-v0.1 (authored by Fable 5)",
  auditor_is_builder: true,
  commit_sha: commit,
  diff_digest: null,
  evaluator_epoch: EVALUATOR_EPOCH,
  issued_at: new Date().toISOString(),
  evidence,
  resource_account: { cost_basis: "measured", wall_time_ms: wallMs, peak_memory_mb: Math.round(process.memoryUsage().rss / 1048576) },
  notes: "Builder-authored deterministic layer. This verdict cannot authorize promotion on its own; an independent (non-builder) verdict is required by Governor policy.",
};
mustValidate("auditVerdict", verdict, "verdict.json");
writeFileSync(join(ROOT, "autoaudit/verdict-active.json"), JSON.stringify(verdict, null, 2) + "\n");
for (const e of evidence) console.log(`${e.result.toUpperCase().padEnd(5)} ${e.check}${e.detail ? " — " + e.detail : ""}`);
console.log(`VERDICT: ${verdictValue} (${evidence.length} checks, ${failed.length} failed, ${wallMs}ms)`);
process.exit(failed.length === 0 ? 0 : 1);
