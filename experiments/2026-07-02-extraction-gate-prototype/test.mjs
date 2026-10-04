import { gate } from "./gate.mjs";

const base = {
  verdict: "Keep",
  experiment_path: "experiments/2026-07-02-extraction-gate-prototype",
  source_repo: "manuelruiferreira-byte/jules-playground",
  target_repo: "manuelruiferreira-byte/Jester-Intelligence",
  evidence: ["gate.mjs reviewed", "test.mjs run"],
  tests_run: ["node test.mjs"],
  tests_passed: true,
  risk_class: "Green",
  privacy_class: "Green",
  dependency_review: "zero dependencies",
  doctrine_conflicts: [],
  promotion_recommendation: "promote gate.mjs into canon after review",
  reviewer: "Claude Fable 5 (twin mode)",
  human_approval: false,
  ledger_entry_id: "test-0001"
};

let failures = 0;
function expect(name, condition) {
  if (condition) console.log("PASS", name);
  else { console.error("FAIL", name); failures += 1; }
}

// 1. A clean Keep verdict is admissible.
expect("clean Keep admissible", gate(base).admissible === true);

// 2. Red privacy + Keep is blocked by doctrine.
const red = { ...base, privacy_class: "Red" };
expect("Red privacy blocks Keep", gate(red).admissible === false);

// 3. Red privacy + Rewrite is allowed (with required_rewrites).
const redRewrite = { ...base, privacy_class: "Red", verdict: "Rewrite", required_rewrites: ["reimplement without tainted artifact"] };
expect("Red privacy allows Rewrite", gate(redRewrite).admissible === true);

// 4. Missing tests cap Keep.
const untested = { ...base, tests_run: [], tests_passed: false };
expect("missing tests block Keep", gate(untested).admissible === false);

// 5. Pre-approved agent output is rejected.
const preApproved = { ...base, human_approval: true };
expect("pre-approved output rejected", gate(preApproved).admissible === false);

// 6. Missing required field is caught via the canon schema.
const { ledger_entry_id, ...missingLedger } = base;
expect("missing ledger_entry_id caught", gate(missingLedger).admissible === false);

// 7. Invalid enum caught via the canon schema.
const badVerdict = { ...base, verdict: "Maybe" };
expect("invalid verdict enum caught", gate(badVerdict).admissible === false);

// 8. Rewrite without required_rewrites is rejected.
const emptyRewrite = { ...base, verdict: "Rewrite", required_rewrites: [] };
expect("Rewrite requires required_rewrites", gate(emptyRewrite).admissible === false);

// 9. Array item type validation fails on bad items.
const badArrayItem = { ...base, evidence: ["gate.mjs reviewed", 123] };
expect("array item type validation catches non-string", gate(badArrayItem).admissible === false);

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
