#!/usr/bin/env node
// ACED Extraction Gate prototype v0.1
// Validates an extraction verdict against the canon schema
// (canon/schemas/aced-extraction-verdict.schema.json) and enforces the
// doctrine rules from canon/docs/contracts/aced-extraction-gate-v0.1.md.
// Zero dependencies: Lane 0 deterministic logic under the Budget Governor.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(HERE, "../../canon/schemas/aced-extraction-verdict.schema.json");

export function loadSchema() {
  return JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
}

function typeOk(value, type) {
  if (type === "string") return typeof value === "string";
  if (type === "boolean") return typeof value === "boolean";
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  return true;
}

// Minimal structural validation driven by the canon schema itself:
// required fields, property types, enums, array item types.
export function validateAgainstSchema(verdict, schema = loadSchema()) {
  const problems = [];
  for (const field of schema.required ?? []) {
    if (!(field in verdict)) problems.push(`missing required field: ${field}`);
  }
  for (const [field, rule] of Object.entries(schema.properties ?? {})) {
    if (!(field in verdict)) continue;
    const value = verdict[field];
    if (rule.type && !typeOk(value, rule.type)) {
      problems.push(`field ${field}: expected ${rule.type}`);
      continue;
    }
    if (rule.enum && !rule.enum.includes(value)) {
      problems.push(`field ${field}: "${value}" not in [${rule.enum.join(", ")}]`);
    }
    if (rule.type === "array" && rule.items?.type) {
      value.forEach((item, i) => {
        if (!typeOk(item, rule.items.type)) problems.push(`field ${field}[${i}]: expected ${rule.items.type}`);
      });
    }
  }
  return problems;
}

// Doctrine rules from aced-extraction-gate-v0.1.md. These are enforced even
// if the schema's conditional (allOf) is ignored by a naive producer.
export function enforceDoctrine(verdict) {
  const problems = [];
  if (verdict.privacy_class === "Red" && verdict.verdict === "Keep") {
    problems.push("doctrine: Red privacy class can never receive Keep (max Rewrite)");
  }
  const testsMissing = !Array.isArray(verdict.tests_run) || verdict.tests_run.length === 0 || verdict.tests_passed !== true;
  if (testsMissing && verdict.verdict === "Keep") {
    problems.push("doctrine: missing/failing tests cap the verdict at Rewrite");
  }
  if (verdict.verdict === "Keep" && verdict.human_approval !== false) {
    // A gate-produced packet must arrive unapproved; approval is the human's move.
    if (verdict.human_approval === true) {
      problems.push("doctrine: agent output must not arrive pre-approved (human_approval must be false at gate time)");
    }
  }
  if (verdict.verdict === "Rewrite" && (!Array.isArray(verdict.required_rewrites) || verdict.required_rewrites.length === 0)) {
    problems.push("doctrine: Rewrite verdict requires a non-empty required_rewrites list");
  }
  return problems;
}

export function gate(verdict) {
  const problems = [...validateAgainstSchema(verdict), ...enforceDoctrine(verdict)];
  return { admissible: problems.length === 0, problems };
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: node gate.mjs <verdict.json>");
    process.exit(2);
  }
  const verdict = JSON.parse(readFileSync(file, "utf8"));
  const result = gate(verdict);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.admissible ? 0 : 1);
}
