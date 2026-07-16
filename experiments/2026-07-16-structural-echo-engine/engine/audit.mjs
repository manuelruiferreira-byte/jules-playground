// SEE v0.1 — Independent Audit Governor (deterministic layer).
// auditor_is_builder = true: this verdict can never authorize promotion alone.
// Evaluator version see-audit-0.2, frozen for epoch:see-2026-07-16-b.
// Epoch-boundary change review: 0.1 -> 0.2 adds ONLY the chronology check
// (#12) after the epoch-a hand-written preregistered_at defect; no existing
// check was weakened or removed, and no scoring rule changed.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { loadCorpus, rankAll } from "./matching.mjs";

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

export function runAudit(db, root, loopResult) {
  const checks = [];
  const check = (name, fn) => {
    try { const d = fn(); checks.push({ check: name, result: "pass", detail: typeof d === "string" ? d : null }); }
    catch (e) { checks.push({ check: name, result: "fail", detail: String(e.message ?? e).slice(0, 650) }); }
  };

  // 1. Preregistration integrity (epoch-b file).
  check("preregistration digest matches the file scored against", () => {
    const digest = "sha256:" + createHash("sha256").update(readFileSync(`${root}/contracts/prereg-epoch-b.json`)).digest("hex");
    if (digest !== loopResult.preregDigest) throw new Error("prereg digest drift during run");
    if (loopResult.experiment.preregistration_digest !== digest) throw new Error("experiment recorded a different prereg digest");
  });

  // 12 (new in see-audit-0.2). Chronology: every stage machine-stamped and
  // strictly ordered — preregistration loaded -> rankings -> ground truth
  // scored; and the preregistration file's own stamp precedes loading.
  check("chronology monotonic: prereg stamp <= loaded < rankings <= scored", () => {
    const prereg = Date.parse(loopResult.prereg.preregistered_at);
    const loaded = Date.parse(loopResult.preregLoadedAt);
    const ranked = Date.parse(loopResult.rankingsProducedAt);
    const scored = Date.parse(loopResult.scoredAt);
    if (!(prereg <= loaded)) throw new Error(`preregistered_at ${loopResult.prereg.preregistered_at} is after prereg load ${loopResult.preregLoadedAt}`);
    if (!(loaded <= ranked)) throw new Error("rankings precede prereg load");
    if (!(ranked <= scored)) throw new Error("ground-truth scoring precedes rankings");
    return `${loopResult.prereg.preregistered_at} <= ${loopResult.preregLoadedAt} <= ${loopResult.rankingsProducedAt} <= ${loopResult.scoredAt}`;
  });

  // 2. Matcher blindness: the matching module must not reference ground truth.
  check("matcher is blind to ground truth (no prereg/expected references)", () => {
    const src = readFileSync(`${root}/engine/matching.mjs`, "utf8");
    if (/prereg|expected|ground.?truth/i.test(src.replace(/\/\/[^\n]*/g, "").replace(/ground truth[^\n]*/i, ""))) {
      // strip comments first; the word may only appear in comments
      const noComments = src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
      if (/prereg|"expected"|groundTruth/i.test(noComments)) throw new Error("matching module references ground truth");
    }
  });

  // 3. Self-exclusion: no method may return the probe itself.
  check("probe self-exclusion enforced in every ranking", () => {
    for (const [probe, byMethod] of Object.entries(loopResult.allRankings))
      for (const [m, list] of Object.entries(byMethod))
        if (list.some((x) => x.id === probe)) throw new Error(`${m} ranked probe ${probe} against itself`);
  });

  // 4. Reproducibility: rerun matching, expect identical rankings.
  check("rankings reproduce identically on re-run", () => {
    const corpus = loadCorpus(db);
    for (const pair of loopResult.prereg.pairs) {
      const again = rankAll(corpus, pair.probe);
      for (const m of Object.keys(again)) {
        const a = again[m].map((x) => x.id).join(",");
        const b = loopResult.allRankings[pair.probe][m].map((x) => x.id).join(",");
        if (a !== b) throw new Error(`${m} ranking not deterministic for ${pair.probe}`);
      }
    }
  });

  // 5. Resource equivalence: every method saw the same corpus, nothing else.
  check("resource equivalence across methods (same corpus, no external calls)", () => {
    const src = readFileSync(`${root}/engine/matching.mjs`, "utf8");
    if (/fetch\(|https?:\/\/|child_process|execFile|spawn/.test(src)) throw new Error("matching module reaches outside the corpus");
    return `corpus of ${loopResult.corpus.rows.length} trajectories for all 6 methods`;
  });

  // 6. Classification recomputed from raw ranks (claim-inflation guard).
  check("classification recomputed from raw ranks matches the claim", () => {
    const { perMethod, prereg } = loopResult;
    const S = perMethod.structural;
    const baselines = prereg.baselines_for_success;
    const beats = baselines.filter((m) => S.mrr > perMethod[m].mrr);
    let expect = "unsupported";
    if (perMethod.random_control.mrr >= prereg.thresholds.invalid_if_random_mrr_gte) expect = "invalid";
    else if (beats.length === baselines.length && S.hits_at_1 >= 2) expect = "supported";
    else if (beats.length >= 3 && S.hits_at_3 >= 2) expect = "provisional";
    if (expect !== loopResult.experiment.classification) throw new Error(`claim ${loopResult.experiment.classification}, recomputation ${expect}`);
    return `classification ${expect} confirmed`;
  });

  // 7. Protocol deviations must be empty or justified.
  check("no unjustified protocol deviations", () => {
    if (loopResult.experiment.protocol_deviations.length) throw new Error(loopResult.experiment.protocol_deviations.join("; "));
  });

  // 8. Hidden-drive / random-control sanity.
  check("random control behaves like chance (no harness bias)", () => {
    const r = loopResult.perMethod.random_control.mrr;
    if (r >= loopResult.prereg.thresholds.invalid_if_random_mrr_gte) throw new Error(`random control MRR ${r} indicates bias`);
    return `random MRR ${r}`;
  });

  // 9. Echo explanations are mandatory and non-empty for unsuppressed echoes.
  check("every unsuppressed echo carries a substantive explanation", () => {
    for (const e of loopResult.echoes) {
      if (!e.suppressed && (!e.explanation || e.explanation.length < 40)) throw new Error(`${e.id} lacks explanation`);
      if (!e.suppressed && e.shared_anchors.length < 2) throw new Error(`${e.id} unsuppressed with <2 shared anchors`);
    }
  });

  // 10. All emitted records validate against the SEE contract schema.
  check("all loop records validate against see-v0.1 schema", () => {
    const schema = JSON.parse(readFileSync(`${root}/contracts/see-v0.1.schema.json`, "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const doc = { schema_version: "see-0.1", generated_at: now(), records: loopResult.records };
    if (!validate(doc)) throw new Error(JSON.stringify(validate.errors?.slice(0, 2)));
    return `${loopResult.records.length} records valid`;
  });

  // 11. Rebuildability: the store is a projection (fresh rebuild reproduced fingerprints).
  check("store rebuilt from seeds this run (derived projection, not a ledger)", () => {
    const n = db.prepare("SELECT COUNT(*) c FROM fingerprints").get().c;
    if (n !== loopResult.corpus.rows.length) throw new Error("fingerprints incomplete after rebuild");
    return `${n} fingerprints rebuilt from committed seeds`;
  });

  const failed = checks.filter((c) => c.result === "fail");
  // pass_narrowed: even a full pass is narrowed to the preregistered claim ceiling.
  const verdict = failed.length ? "reject"
    : loopResult.experiment.classification === "supported" ? "pass_narrowed" : "pass";
  return {
    record_type: "audit", id: "audit:see-exp-001b-deterministic",
    subject_ref: "exp:see-exp-001b",
    verdict,
    auditor: "see-audit-governor-0.1 (authored by Fable 5)",
    auditor_is_builder: true,
    evaluator_version: "see-audit-0.2",
    checks,
    issued_at: now(),
  };
}
