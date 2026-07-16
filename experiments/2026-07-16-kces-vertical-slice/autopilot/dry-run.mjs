// Promotion Autopilot v0.1 — DRY RUN ONLY.
// Reads fixture candidates, applies Governor policy, emits promotionDecision
// records with dry_run=true. Performs NO git, network, ledger, or file
// mutation outside this experiment folder. Real promotion authority does not
// exist in KCES v0.1 and unlocking it is an R3 constitutional decision.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const AUTONOMY_MODE = "calibration"; // constitutionally locked for v0.1

/**
 * Governor policy, executable form.
 * Order matters: hard invariants first, then evidence, then autonomy mode.
 */
export function decide(candidate, autonomyMode = AUTONOMY_MODE) {
  const verdicts = candidate.verdicts ?? [];
  const independent = verdicts.filter((v) => !v.auditor_is_builder);
  const anyBlockedOrRewrite = verdicts.some((v) => v.verdict === "BLOCKED" || v.verdict === "REWRITE");
  const allIndependentPass =
    independent.length > 0 && independent.every((v) => v.verdict === "PASS");

  let decision, rationale;
  if (candidate.risk_class === "R3") {
    decision = "route_to_manuel";
    rationale = "R3 sovereign class: Manuel approval is mandatory and never delegable.";
  } else if (anyBlockedOrRewrite) {
    decision = "reject";
    rationale = "A verdict is BLOCKED or REWRITE; promotion is impossible regardless of autonomy.";
  } else if (!allIndependentPass) {
    decision = "hold_insufficient_evidence";
    rationale = "No passing independent (non-builder) verdict exists; a builder may never approve its own work.";
  } else if (autonomyMode === "calibration") {
    decision = "route_to_manuel";
    rationale = "All gates pass, but autonomy mode is calibration: every promotion routes to Manuel while reliability evidence accumulates.";
  } else if (autonomyMode === "r0_delegated" && candidate.risk_class === "R0") {
    decision = "promote";
    rationale = "R0 delegated by explicit policy and all gates pass. (Not reachable in v0.1.)";
  } else if (autonomyMode === "r1_delegated" && (candidate.risk_class === "R0" || candidate.risk_class === "R1")) {
    decision = "promote";
    rationale = "R0/R1 delegated by explicit policy and all gates pass. (Not reachable in v0.1.)";
  } else {
    decision = "route_to_manuel";
    rationale = "Risk class exceeds the delegated autonomy level.";
  }

  return {
    record_type: "promotion_decision",
    id: `decision:${candidate.id.replace(/^candidate:/, "")}`,
    subject_ref: candidate.id,
    risk_class: candidate.risk_class,
    autonomy_mode: autonomyMode,
    decision,
    decided_by: "kces-promotion-autopilot-v0.1",
    requires_manuel: decision === "route_to_manuel" || candidate.risk_class === "R3",
    verdict_refs: verdicts.length ? verdicts.map((v) => v.id) : ["verdict:none"],
    decided_at: new Date().toISOString(),
    rollback_path: "Dry run: nothing to roll back. A real promotion would carry the exact revert command for its merge commit.",
    dry_run: true,
    rationale,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fixture = JSON.parse(readFileSync(new URL("fixtures/candidates.json", import.meta.url), "utf8"));
  const decisions = fixture.candidates.map((c) => decide(c, fixture.autonomy_mode));
  writeFileSync(new URL("decisions.json", import.meta.url), JSON.stringify({ generated_at: new Date().toISOString(), autonomy_mode: fixture.autonomy_mode, decisions }, null, 2) + "\n");

  mkdirSync(new URL("../events/outbox/", import.meta.url), { recursive: true });
  writeFileSync(new URL("../events/outbox/autopilot-dry-run.json", import.meta.url), JSON.stringify({
    record_type: "evolution_event", id: "event:autopilot-dry-run-2026-07-16",
    event_type: "promotion_decided", subject_ref: "experiment:kces-vertical-slice",
    occurred_at: new Date().toISOString(),
    summary: `Autopilot dry run over ${decisions.length} fixture candidates: ${decisions.map((d) => `${d.subject_ref}→${d.decision}`).join("; ")}.`,
    delivery: "outbox",
  }, null, 2) + "\n");

  for (const d of decisions) console.log(`${d.subject_ref}  [${d.risk_class}]  ${d.decision}  requires_manuel=${d.requires_manuel}`);
  const invariantOk = decisions.every((d) =>
    (d.risk_class !== "R3" || d.decision !== "promote") &&
    (d.autonomy_mode !== "calibration" || d.decision !== "promote") &&
    d.dry_run === true);
  console.log("INVARIANTS:", invariantOk ? "PASS" : "FAIL");
  process.exit(invariantOk ? 0 : 1);
}
