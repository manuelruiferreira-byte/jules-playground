// SEE v0.1 — Echo Reasoner, automatic Hypothesis + Experiment Controller,
// Utility measurement, Promotion & Learning Governor, exception stream.
// The normal loop contains NO Manuel step: lessons land automatically in the
// engine's derived store; only canon/ACED-Mem promotion stages a packet.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { j, p } from "./db.mjs";
import { explainStructural, loadCorpus, rankAll } from "./matching.mjs";
import { createHash } from "node:crypto";

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const sha256File = (path) => "sha256:" + createHash("sha256").update(readFileSync(path)).digest("hex");

export const PREREG_FILE = "contracts/prereg-epoch-b.json";
export const EPOCH = "epoch:see-2026-07-16-b";

export function runLoop(db, root) {
  const t0 = Date.now();
  const corpus = loadCorpus(db);
  // Chronology is machine-stamped at every stage; hand-written timestamps are
  // banned from the protocol after the epoch-a preregistered_at defect.
  const preregLoadedAt = now();
  const prereg = p(readFileSync(`${root}/${PREREG_FILE}`, "utf8"));
  const preregDigest = sha256File(`${root}/${PREREG_FILE}`);
  const records = [];
  const deviations = [];

  // ---- 1. MATCH first (rankings are produced before ground truth is scored) ----
  const allRankings = {};
  for (const pair of prereg.pairs) allRankings[pair.probe] = rankAll(corpus, pair.probe);
  const rankingsProducedAt = now();

  // ---- 2. ECHOES from structural rankings (with mandatory explanations) ----
  const insEcho = db.prepare(`INSERT INTO echoes(id,probe,matched,method,score,explanation,shared_anchors,suppressed,suppression_reason,created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)`);
  const echoes = [];
  for (const pair of prereg.pairs) {
    const top = allRankings[pair.probe].structural.slice(0, 3);
    for (const cand of top) {
      const ex = explainStructural(db, corpus, pair.probe, cand.id);
      const suppressed = ex.shared.length < 2;
      const echo = {
        record_type: "echo", id: `echo:${pair.probe.replace("traj:", "")}--${cand.id.replace("traj:", "")}`,
        probe_trajectory: pair.probe, matched_trajectory: cand.id, method: "structural",
        score: round(cand.score), explanation: ex.explanation, shared_anchors: ex.shared,
        suppressed, suppression_reason: suppressed ? "fewer than 2 shared anchors: weak or purely topical" : null,
        created_at: now(),
      };
      insEcho.run(echo.id, pair.probe, cand.id, "structural", echo.score, echo.explanation, j(ex.shared), suppressed ? 1 : 0, echo.suppression_reason, echo.created_at);
      echoes.push(echo);
      records.push(echo);
    }
  }
  const strongEchoes = echoes.filter((e) => !e.suppressed && e.score >= prereg.echo_threshold);

  // ---- 3. HYPOTHESIS (automatic, from the evaluation design) ----
  const hypothesis = {
    record_type: "hypothesis", id: "hyp:see-structural-beats-simple-retrieval",
    source_trajectories: prereg.pairs.map((x) => x.probe),
    matching_features: [...new Set(strongEchoes.flatMap((e) => e.shared_anchors))],
    predicted_implication: "Structural anchor retrieval ranks the preregistered cross-domain matches above TF-IDF semantic, keyword, recency and random retrieval on this corpus.",
    confidence: 0.5,
    expected_information_gain: "Decides whether reasoning-geometry retrieval earns a place in Kairoth or simpler retrieval suffices at this scale.",
    risk_class: "R1",
    disconfirming_result: "MRR(structural) fails the preregistered thresholds against the baselines.",
    resource_budget_ms: 60000,
    permissions: ["read: committed seed corpus only"],
    possible_harm: "None: isolated retrieval evaluation over committed evidence.",
    rollback_path: "Delete the experiment folder; the store is a rebuildable projection.",
  };
  records.push(hypothesis);

  // ---- 4. EXPERIMENT: score rankings against preregistered ground truth ----
  const perMethod = {};
  const methods = ["structural", "sequence", "semantic", "keyword", "recency", "random_control"];
  for (const m of methods) {
    const ranks = prereg.pairs.map((pair) => {
      const list = allRankings[pair.probe][m];
      return list.findIndex((x) => x.id === pair.expected) + 1; // 1-based
    });
    perMethod[m] = {
      ranks,
      mrr: round(ranks.reduce((s, r) => s + 1 / r, 0) / ranks.length),
      hits_at_1: ranks.filter((r) => r === 1).length,
      hits_at_3: ranks.filter((r) => r <= 3).length,
    };
  }
  const scoredAt = now();
  const S = perMethod.structural;
  const baselines = prereg.baselines_for_success;
  const beats = baselines.filter((m) => S.mrr > perMethod[m].mrr);
  let classification = "unsupported";
  if (perMethod.random_control.mrr >= prereg.thresholds.invalid_if_random_mrr_gte) classification = "invalid";
  else if (beats.length === baselines.length && S.hits_at_1 >= 2) classification = "supported";
  else if (beats.length >= 3 && S.hits_at_3 >= 2) classification = "provisional";

  const experiment = {
    record_type: "experiment", id: "exp:see-exp-001b", hypothesis_id: hypothesis.id,
    preregistration_digest: preregDigest,
    baseline: "Simpler retrieval methods: TF-IDF semantic, keyword Jaccard, recency, seeded random control.",
    intervention: "Structural retrieval: IDF-weighted anchor fingerprints plus event-kind bigram signature.",
    comparators: methods,
    negative_controls: ["random_control (seeded)", "recency (time proximity only)"],
    measurement_window: "Single evaluation over 14 committed trajectories, 3 preregistered probes.",
    success_threshold: prereg.thresholds.supported,
    failure_threshold: "Anything below the provisional threshold.",
    stopping_condition: "One pass; no re-runs with modified thresholds.",
    resource_account_ms: Date.now() - t0,
    protocol_deviations: deviations,
    status: "completed",
    result_summary: `MRR — structural ${S.mrr}, sequence ${perMethod.sequence.mrr}, semantic ${perMethod.semantic.mrr}, keyword ${perMethod.keyword.mrr}, recency ${perMethod.recency.mrr}, random ${perMethod.random_control.mrr}. Structural ranks (per probe): ${S.ranks.join(", ")}. Beats ${beats.length}/${baselines.length} baselines; hits@1=${S.hits_at_1}.`,
    classification,
  };
  records.push(experiment);

  // ---- 5. UTILITY (automatic, from downstream observables — no ratings) ----
  const utility = {
    record_type: "utility_outcome", id: "utility:see-exp-001", echo_cycle_ref: experiment.id,
    signals: {
      generated_experiment: strongEchoes.length > 0,
      survived_audit: false, // set truthfully by the audit stage afterwards
      uncertainty_reduced: classification !== "invalid",
      beat_simpler_retrieval: classification === "supported" ? true : classification === "unsupported" ? false : null,
      caused_rollback: false,
      resource_cost_ms: Date.now() - t0,
      information_gain_note: `Structural vs best baseline MRR gap: ${round(S.mrr - Math.max(...baselines.map((m) => perMethod[m].mrr)))}.`,
    },
    manual_feedback: null,
    measured_at: now(),
  };
  records.push(utility);

  // ---- 6. LEARNING (automatic classification; promotion stays governed) ----
  const lessonStatus = classification === "supported" ? "provisional"
    : classification === "provisional" ? "domain_specific"
    : classification === "invalid" ? "quarantined" : "rejected";
  const lesson = {
    record_type: "lesson", id: "lesson:structural-retrieval-v0-1b",
    status: lessonStatus,
    statement: classification === "unsupported"
      ? `On a ${corpus.rows.length}-trajectory curated corpus, simpler retrieval matched or beat structural anchor retrieval; structural matching does not yet earn a place and must not be claimed as superior.`
      : `Structural anchor retrieval ${classification === "supported" ? "outranked every simpler baseline" : "outranked most baselines"} at locating preregistered cross-domain matches on a ${corpus.rows.length}-trajectory corpus (claim ceiling: ${prereg.claim_ceiling}).`,
    links: {
      source_events: [], source_trajectories: prereg.pairs.map((x) => x.probe),
      experiment: experiment.id, code_revision: null, evaluator_version: "see-audit-0.2",
      audit: "audit:see-exp-001b-deterministic", promotion: null,
      measurement_window: experiment.measurement_window, supersedes: "lesson:structural-retrieval-v0-1",
    },
    governed_memory_status: "engine_only",
    created_at: now(),
  };
  records.push(lesson);

  // ---- 7. EXCEPTIONS (only what genuinely matters surfaces) ----
  const exception = {
    record_type: "exception", id: "exception:see-exp-001-outcome",
    severity: "info",
    summary: classification === "supported"
      ? "A structural echo evaluation passed its full comparator battery and awaits independent review before any promotion."
      : classification === "unsupported"
        ? "A structural echo evaluation was tested and did not beat simpler retrieval. No intervention required; lesson recorded as rejected."
        : `Structural echo evaluation classified ${classification}. No intervention required.`,
    requires_manuel: false,
    raised_at: now(),
  };
  records.push(exception);

  mkdirSync(`${root}/events/outbox`, { recursive: true });
  writeFileSync(`${root}/events/outbox/see-exp-001-cycle.json`, j({ schema_version: "see-0.1", generated_at: now(), records: [experiment, utility, lesson, exception] }, null, 2) + "\n");

  return { corpus, prereg, preregDigest, preregLoadedAt, rankingsProducedAt, scoredAt, allRankings, echoes, strongEchoes, hypothesis, experiment, perMethod, utility, lesson, exception, records };
}

const round = (x) => Math.round(x * 1000) / 1000;
