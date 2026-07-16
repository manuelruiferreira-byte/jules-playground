// SEE v0.1 — Event Collector, Trajectory Reconstructor, Geometry Extractor.
// All extraction is deterministic and versioned. Anchors derive from event-kind
// SEQUENCES and capture-time payload facts, never from retrospective tags.
import { readFileSync } from "node:fs";
import { j, p } from "./db.mjs";

export const EXTRACTOR_VERSION = "see-geometry-0.1";

/** Anchor vocabulary v0.1 — versioned, extensible, deliberately small. */
export const ANCHORS = [
  ["resolution_through_control", "control_added followed later by result_stabilized", "A verifying control was added and the trajectory stabilized after it."],
  ["recovery_after_reframing", "pivot_taken followed later by result_stabilized", "The trajectory recovered after reframing the approach."],
  ["premature_convergence", "decision_made followed later by decision_superseded", "An early decision had to be superseded."],
  ["conflicting_observers", "contradiction_detected with two or more sources", "Two observation channels asserted incompatible truths."],
  ["repeated_failure_under_assumption", "two or more test_failed sharing payload.assumption", "The same assumption produced repeated failures before being questioned."],
  ["directional_asymmetry", "any event with payload.directional = true", "Behavior depends on direction or sign, not only magnitude."],
  ["strong_signal_weak_mechanism", "evidence_found with payload.mechanism = unknown", "A clear symptom existed while its mechanism was initially unknown."],
  ["hidden_environment_dependency", "test_failed with payload.environment_specific = true", "It worked in one environment and failed in the real one."],
  ["boundary_calibration", "pivot_taken with payload.correction in {too_weak, too_strong}", "An enforcement boundary had to be recalibrated (under- or over-blocking)."],
  ["relapse_after_recovery", "result_stabilized followed later by test_failed or rollback_triggered", "Apparent recovery was followed by relapse."],
  ["disconfirmation_honored", "decision_made with payload.accepted_falsification = true", "A falsifying result was accepted instead of being explained away."],
  ["failed_assumption_reframed", "test_failed carrying an assumption followed later by pivot_taken", "A named assumption failed and the approach was reframed."],
];

export function collectSeeds(db, seedPath) {
  const doc = p(readFileSync(seedPath, "utf8"));
  const insT = db.prepare(`INSERT INTO trajectories(id,title,objective,status,started_at,ended_at,outcome,domains,repositories,agents,provenance)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)`);
  const insE = db.prepare(`INSERT INTO events(id,trajectory_id,seq,kind,at,summary,payload,provenance)
    VALUES(?,?,?,?,?,?,?,?)`);
  let events = 0;
  for (const t of doc.trajectories) {
    insT.run(t.id, t.title, t.objective, t.status, t.started_at, t.ended_at ?? null, t.outcome ?? null,
      j(t.domains), j(t.repositories ?? []), j(t.agents ?? []), j(t.provenance));
    t.events.forEach((e, i) => {
      // Seed events inherit trajectory provenance and evenly spaced synthetic
      // times inside the trajectory window when not individually stamped.
      const at = e.at ?? syntheticAt(t, i, t.events.length);
      insE.run(`${t.id}/e${i}`, t.id, i, e.kind, at, e.summary, j(e.payload ?? {}), j(t.provenance));
      events++;
    });
  }
  return { trajectories: doc.trajectories.length, events };
}

function syntheticAt(t, i, n) {
  const a = Date.parse(t.started_at), b = Date.parse(t.ended_at ?? t.started_at) || a + 3600e3;
  return new Date(a + ((b - a) * (i + 1)) / (n + 1)).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Reconstructor: derive pivots, weakened assumptions, and activity state. */
export function reconstruct(db) {
  const upd = db.prepare("UPDATE trajectories SET pivots=?, weakened_assumptions=? WHERE id=?");
  for (const t of db.prepare("SELECT id FROM trajectories").all()) {
    const evs = db.prepare("SELECT * FROM events WHERE trajectory_id=? ORDER BY seq").all(t.id);
    const pivots = evs.filter((e) => e.kind === "pivot_taken").map((e) => e.id);
    const weakened = [...new Set(evs
      .filter((e) => ["test_failed", "contradiction_detected"].includes(e.kind))
      .map((e) => p(e.payload).assumption)
      .filter(Boolean))];
    upd.run(j(pivots), j(weakened), t.id);
  }
}

/** Geometry Extractor: anchors + event-kind bigram signature per trajectory. */
export function extractGeometry(db) {
  const insA = db.prepare("INSERT OR IGNORE INTO anchors(key,version,rule,description) VALUES(?,?,?,?)");
  for (const [key, rule, desc] of ANCHORS) insA.run(key, EXTRACTOR_VERSION, rule, desc);

  const insTA = db.prepare("INSERT OR REPLACE INTO trajectory_anchors(trajectory_id,anchor_key,evidence_event_id,note) VALUES(?,?,?,?)");
  const insFP = db.prepare("INSERT OR REPLACE INTO fingerprints(trajectory_id,anchors,bigrams,extractor_version) VALUES(?,?,?,?)");

  for (const t of db.prepare("SELECT id FROM trajectories").all()) {
    const evs = db.prepare("SELECT * FROM events WHERE trajectory_id=? ORDER BY seq").all(t.id)
      .map((e) => ({ ...e, payload: p(e.payload) }));
    const found = detectAnchors(evs);
    for (const f of found) insTA.run(t.id, f.key, f.evidence, f.note);
    const bigrams = {};
    for (let i = 0; i + 1 < evs.length; i++) {
      const k = `${evs[i].kind}>${evs[i + 1].kind}`;
      bigrams[k] = (bigrams[k] ?? 0) + 1;
    }
    insFP.run(t.id, j(found.map((f) => f.key).sort()), j(bigrams), EXTRACTOR_VERSION);
  }
}

export function detectAnchors(evs) {
  const found = [];
  const idx = (kind, from = 0) => evs.findIndex((e, i) => i >= from && e.kind === kind);
  const has = (pred) => evs.find(pred);
  const after = (aKind, bPred) => {
    const i = idx(aKind);
    return i >= 0 && evs.slice(i + 1).some(bPred) ? evs[i] : null;
  };

  let e;
  if ((e = after("control_added", (x) => x.kind === "result_stabilized")))
    found.push({ key: "resolution_through_control", evidence: e.id, note: null });
  if ((e = after("pivot_taken", (x) => x.kind === "result_stabilized")))
    found.push({ key: "recovery_after_reframing", evidence: e.id, note: null });
  if ((e = after("decision_made", (x) => x.kind === "decision_superseded")))
    found.push({ key: "premature_convergence", evidence: e.id, note: null });
  if ((e = has((x) => x.kind === "contradiction_detected" && (x.payload.sources ?? 0) >= 2)))
    found.push({ key: "conflicting_observers", evidence: e.id, note: null });
  {
    const byAssumption = {};
    for (const x of evs) if (x.kind === "test_failed" && x.payload.assumption)
      (byAssumption[x.payload.assumption] ??= []).push(x);
    const repeated = Object.entries(byAssumption).find(([, xs]) => xs.length >= 2);
    if (repeated) found.push({ key: "repeated_failure_under_assumption", evidence: repeated[1][0].id, note: repeated[0] });
  }
  if ((e = has((x) => x.payload.directional === true)))
    found.push({ key: "directional_asymmetry", evidence: e.id, note: null });
  if ((e = has((x) => x.kind === "evidence_found" && x.payload.mechanism === "unknown")))
    found.push({ key: "strong_signal_weak_mechanism", evidence: e.id, note: null });
  if ((e = has((x) => x.kind === "test_failed" && x.payload.environment_specific === true)))
    found.push({ key: "hidden_environment_dependency", evidence: e.id, note: null });
  if ((e = has((x) => x.kind === "pivot_taken" && ["too_weak", "too_strong"].includes(x.payload.correction))))
    found.push({ key: "boundary_calibration", evidence: e.id, note: e.payload.correction });
  if ((e = after("result_stabilized", (x) => ["test_failed", "rollback_triggered"].includes(x.kind))))
    found.push({ key: "relapse_after_recovery", evidence: e.id, note: null });
  if ((e = has((x) => x.kind === "decision_made" && x.payload.accepted_falsification === true)))
    found.push({ key: "disconfirmation_honored", evidence: e.id, note: null });
  {
    const i = evs.findIndex((x) => x.kind === "test_failed" && x.payload.assumption);
    if (i >= 0 && evs.slice(i + 1).some((x) => x.kind === "pivot_taken"))
      found.push({ key: "failed_assumption_reframed", evidence: evs[i].id, note: evs[i].payload.assumption });
  }
  return found;
}
