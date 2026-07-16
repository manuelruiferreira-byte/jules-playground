// SEE v0.1 store — node:sqlite (zero dependencies). The database is a DERIVED,
// REBUILDABLE projection of canonical evidence: run-slice deletes and rebuilds
// it from committed seeds on every run to prove that property. It is never a
// second canonical ledger.
import { DatabaseSync } from "node:sqlite";
import { existsSync, rmSync } from "node:fs";

export function openDb(path, { rebuild = false } = {}) {
  if (rebuild && existsSync(path)) rmSync(path);
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS trajectories(
      id TEXT PRIMARY KEY, title TEXT NOT NULL, objective TEXT NOT NULL,
      status TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT,
      outcome TEXT, domains TEXT NOT NULL, repositories TEXT NOT NULL,
      agents TEXT NOT NULL, provenance TEXT NOT NULL,
      pivots TEXT NOT NULL DEFAULT '[]',
      weakened_assumptions TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS events(
      id TEXT PRIMARY KEY, trajectory_id TEXT NOT NULL REFERENCES trajectories(id),
      seq INTEGER NOT NULL, kind TEXT NOT NULL, at TEXT NOT NULL,
      summary TEXT NOT NULL, payload TEXT NOT NULL DEFAULT '{}',
      provenance TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS anchors(
      key TEXT PRIMARY KEY, version TEXT NOT NULL, rule TEXT NOT NULL,
      description TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS trajectory_anchors(
      trajectory_id TEXT NOT NULL REFERENCES trajectories(id),
      anchor_key TEXT NOT NULL REFERENCES anchors(key),
      evidence_event_id TEXT, note TEXT,
      PRIMARY KEY (trajectory_id, anchor_key)
    );
    CREATE TABLE IF NOT EXISTS fingerprints(
      trajectory_id TEXT PRIMARY KEY REFERENCES trajectories(id),
      anchors TEXT NOT NULL, bigrams TEXT NOT NULL, extractor_version TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS echoes(
      id TEXT PRIMARY KEY, probe TEXT NOT NULL, matched TEXT NOT NULL,
      method TEXT NOT NULL, score REAL NOT NULL, explanation TEXT NOT NULL,
      shared_anchors TEXT NOT NULL DEFAULT '[]',
      suppressed INTEGER NOT NULL DEFAULT 0, suppression_reason TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS records(
      id TEXT PRIMARY KEY, record_type TEXT NOT NULL, body TEXT NOT NULL
    );
  `);
  return db;
}

export const j = JSON.stringify;
export const p = (s) => JSON.parse(s);
