import { route, MATRIX } from "./router.mjs";
import { readFileSync } from "node:fs";

const schema = JSON.parse(readFileSync(new URL("../../canon/schemas/aced-route-decision.schema.json", import.meta.url)));

let failures = 0;
const expect = (name, cond) => {
  if (cond) console.log("PASS", name);
  else { console.error("FAIL", name); failures += 1; }
};

const job = (over = {}) => ({
  job_id: "t1", project: "test", task_type: "docs_drafting", privacy_class: "Green",
  risk_level: "low", repo_target: "jules-playground", needs_code_edit: false,
  preferred_cost: "zero", required_output: "doc", ...over
});

// 1. Every decision carries all canon-schema required fields.
const d1 = route(job());
expect("all schema-required fields present", (schema.required ?? []).every((f) => f in d1));

// 2. Deterministic.
expect("deterministic", JSON.stringify(route(job())) === JSON.stringify(route(job())));

// 3. Cheapest safe path: deterministic task -> lane 0, zero cost.
const calc = route(job({ task_type: "deterministic_calc" }));
expect("deterministic_calc routes lane 0", calc.selected_lane === "lane_0" && calc.estimated_cost_class === "zero");

// 4. Red privacy never reaches cloud.
const red = route(job({ task_type: "docs_drafting", privacy_class: "Red" }));
expect("Red never cloud (fails closed to human)", red.selected_lane === "human_only" || red.selected_target === "local-llm-agora" || red.selected_target === "deterministic-script");

// 5. memory_ops stays local even at Green.
const mem = route(job({ task_type: "memory_ops" }));
expect("memory_ops stays local", ["local-llm-agora", "deterministic-script"].includes(mem.selected_target));

// 6. No premium lane in v0.1: no target is lane 3, and code_large restricted
// to lane 3 fails closed to human rather than inventing a paid path.
const noPremiumTargets = Object.values(MATRIX.targets).every((t) => t.lane !== 3);
expect("v0.1 has no premium (lane 3) target", noPremiumTargets && MATRIX.budget_caps.premium_lane_enabled === false);
const forcedPremium = route(job({ task_type: "code_large", allowed_lanes: [3] }));
expect("lane-3-only job fails closed to human", forcedPremium.selected_lane === "human_only");

// 7. Free path never requires approval for Green docs.
expect("free lane no approval", d1.requires_user_approval === false && d1.selected_lane === "lane_2");

// 8. Canon mutation without packet is blocked.
const canon = route(job({ task_type: "code_small", needs_code_edit: true, repo_target: "Jester-Intelligence" }));
expect("canon edit without packet blocked", canon.selected_lane === "blocked" && canon.requires_user_approval === true);

// 9. With a promotion packet, canon code routes normally.
const canonOk = route(job({ task_type: "code_small", needs_code_edit: true, repo_target: "Jester-Intelligence", has_promotion_packet: true, privacy_class: "Amber-sanitized" }));
expect("canon edit with packet routes", canonOk.selected_lane === "lane_2");

// 10. blocked_lanes respected; unknown task fails closed.
const noLane2 = route(job({ blocked_lanes: [2] }));
expect("blocked_lanes respected", noLane2.selected_lane !== "lane_2");
const unknown = route(job({ task_type: "nonsense" }));
expect("unknown task fails closed to human", unknown.selected_lane === "human_only");

// 11. Matrix sanity: every task-class target exists; every privacy gate target exists.
const targets = new Set(Object.keys(MATRIX.targets));
const allRefs = Object.values(MATRIX.task_classes).flatMap((t) => [...t.route, ...(t.escalation ? [t.escalation] : [])]);
expect("matrix internally consistent", allRefs.every((t) => targets.has(t)) &&
  Object.values(MATRIX.privacy_gates).flat().every((t) => targets.has(t)));

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
