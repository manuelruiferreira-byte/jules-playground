#!/usr/bin/env node
// Cost Router v0.1 prototype (twin mode).
// Deterministic: agent job (canon/schemas/aced-agent-job.schema.json) in,
// route decision (canon/schemas/aced-route-decision.schema.json) out.
// Doctrine: cheapest safe path; Red never leaves local; premium always
// requires approval; stop rules beat throughput. Zero dependencies.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const MATRIX = JSON.parse(readFileSync(resolve(HERE, "cost-router-matrix.v0.1.json"), "utf8"));

/**
 * @param {object} job aced-agent-job fields (job_id, task_type, privacy_class,
 *   repo_target, needs_code_edit, preferred_cost, allowed_lanes, blocked_lanes...)
 * @returns {object} aced-route-decision record
 */
export function route(job) {
  const taskClass = MATRIX.task_classes[job.task_type];
  const decisionBase = {
    ledger_entry_id: `route-${job.job_id}`,
    privacy_result: job.privacy_class ?? "Green",
    required_handoff: "",
    blocked_targets: []
  };

  if (!taskClass) {
    return {
      ...decisionBase,
      selected_lane: "human_only",
      selected_target: "human",
      reason: `Unknown task_type '${job.task_type}': fail closed to human routing.`,
      requires_user_approval: true,
      estimated_cost_class: "zero"
    };
  }

  // Canon mutation without a promotion packet stops routing outright.
  const canonRepos = ["Jester-Intelligence", "ACED-Mobile-Platform"];
  if (job.needs_code_edit && canonRepos.some((r) => (job.repo_target ?? "").includes(r)) && !job.has_promotion_packet) {
    return {
      ...decisionBase,
      selected_lane: "blocked",
      selected_target: "none",
      reason: "Canon repo mutation without a Promotion Packet is forbidden (stop rule 3).",
      requires_user_approval: true,
      estimated_cost_class: "zero"
    };
  }

  const privacy = job.privacy_class ?? "Green";
  const allowedByPrivacy = new Set(MATRIX.privacy_gates[privacy] ?? MATRIX.privacy_gates.Red);
  const blockedLanes = new Set(job.blocked_lanes ?? []);
  const allowedLanes = job.allowed_lanes ? new Set(job.allowed_lanes) : null;

  const candidates = [...(taskClass.route ?? []), ...(taskClass.escalation ? [taskClass.escalation] : [])];
  const blockedTargets = [];

  for (const target of candidates) {
    const def = MATRIX.targets[target];
    if (!def) continue;
    if (!allowedByPrivacy.has(target)) { blockedTargets.push(`${target} (privacy ${privacy})`); continue; }
    if (blockedLanes.has(def.lane)) { blockedTargets.push(`${target} (lane ${def.lane} blocked by job)`); continue; }
    if (allowedLanes && !allowedLanes.has(def.lane)) { blockedTargets.push(`${target} (lane ${def.lane} not in allowed_lanes)`); continue; }

    const isPremium = def.lane === 3;
    return {
      ...decisionBase,
      selected_lane: `lane_${def.lane}`,
      selected_target: target,
      reason: isPremium
        ? `Escalation to premium for '${job.task_type}' - free lanes exhausted or insufficient; approval mandatory (daily premium cap ${MATRIX.budget_caps.daily_premium_usd} USD).`
        : `Cheapest safe path for '${job.task_type}' at privacy ${privacy}: lane ${def.lane} (${def.cost_class}).`,
      requires_user_approval: isPremium,
      estimated_cost_class: def.cost_class,
      blocked_targets: blockedTargets
    };
  }

  return {
    ...decisionBase,
    selected_lane: "human_only",
    selected_target: "human",
    reason: `No target passes privacy ${privacy} + lane constraints for '${job.task_type}'; fail closed to human.`,
    requires_user_approval: true,
    estimated_cost_class: "zero",
    blocked_targets: blockedTargets
  };
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const file = process.argv[2];
  if (!file) { console.error("usage: node router.mjs <job.json>"); process.exit(2); }
  console.log(JSON.stringify(route(JSON.parse(readFileSync(file, "utf8"))), null, 2));
}
