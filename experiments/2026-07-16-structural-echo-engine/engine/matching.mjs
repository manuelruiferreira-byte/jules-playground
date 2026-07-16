// SEE v0.1 — Echo Reasoner retrieval methods. SIX methods, identical corpus,
// no external data, no model calls. This module is BLIND to ground truth: it
// must never read the preregistration (an audit check greps this file).
import { p } from "./db.mjs";

const ANCHOR_WEIGHT = 0.65, BIGRAM_WEIGHT = 0.35;

// ---------- shared helpers ----------
const tokenize = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
const STOP = new Set(["the", "and", "with", "for", "was", "were", "that", "this", "from", "its", "are", "not", "but", "had", "has", "have", "into", "than", "then", "when", "while", "both", "after", "before", "over", "under"]);
const terms = (s) => tokenize(s).filter((w) => !STOP.has(w));

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const x = a[k] ?? 0, y = b[k] ?? 0;
    dot += x * y; na += x * x; nb += y * y;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const strSeed = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// ---------- corpus assembly ----------
export function loadCorpus(db) {
  const rows = db.prepare("SELECT * FROM trajectories").all();
  const anchorRows = db.prepare("SELECT trajectory_id, anchors, bigrams FROM fingerprints").all();
  const fp = Object.fromEntries(anchorRows.map((r) => [r.trajectory_id, { anchors: p(r.anchors), bigrams: p(r.bigrams) }]));
  const docs = {};
  for (const t of rows) {
    const evs = db.prepare("SELECT summary FROM events WHERE trajectory_id=? ORDER BY seq").all(t.id);
    docs[t.id] = `${t.title} ${t.objective} ${evs.map((e) => e.summary).join(" ")}`;
  }
  // anchor document frequency for IDF weighting
  const df = {};
  for (const { anchors } of Object.values(fp)) for (const a of anchors) df[a] = (df[a] ?? 0) + 1;
  const N = rows.length;
  const idf = (a) => Math.log((N + 1) / ((df[a] ?? 0) + 1)) + 1;
  return { rows, fp, docs, idf };
}

// ---------- the six methods ----------
export function structuralScore(corpus, aId, bId) {
  const A = corpus.fp[aId], B = corpus.fp[bId];
  const shared = A.anchors.filter((x) => B.anchors.includes(x));
  const union = [...new Set([...A.anchors, ...B.anchors])];
  const wShared = shared.reduce((s, a) => s + corpus.idf(a), 0);
  const wUnion = union.reduce((s, a) => s + corpus.idf(a), 0) || 1;
  const anchorSim = wShared / wUnion;
  const bigramSim = cosine(A.bigrams, B.bigrams);
  return { score: ANCHOR_WEIGHT * anchorSim + BIGRAM_WEIGHT * bigramSim, shared, bigramSim };
}

function tfidfVectors(corpus) {
  const docTerms = Object.fromEntries(Object.entries(corpus.docs).map(([id, d]) => [id, terms(d)]));
  const df = {};
  for (const ts of Object.values(docTerms)) for (const w of new Set(ts)) df[w] = (df[w] ?? 0) + 1;
  const N = Object.keys(docTerms).length;
  const vecs = {};
  for (const [id, ts] of Object.entries(docTerms)) {
    const tf = {};
    for (const w of ts) tf[w] = (tf[w] ?? 0) + 1;
    vecs[id] = Object.fromEntries(Object.entries(tf).map(([w, c]) => [w, (1 + Math.log(c)) * Math.log((N + 1) / (df[w] + 1))]));
  }
  return vecs;
}

/** Rank all candidates for a probe, per method. Higher score = better. */
export function rankAll(corpus, probeId) {
  const candidates = corpus.rows.map((r) => r.id).filter((id) => id !== probeId);
  const tfidf = tfidfVectors(corpus);
  const probeRow = corpus.rows.find((r) => r.id === probeId);
  const probeTokens = new Set(terms(`${probeRow.title} ${probeRow.objective}`));
  const probeEnd = Date.parse(probeRow.ended_at ?? probeRow.started_at);
  const rnd = mulberry32(strSeed(probeId));
  const randomScores = Object.fromEntries(candidates.map((id) => [id, rnd()]));

  const methods = {
    structural: (id) => structuralScore(corpus, probeId, id).score,
    sequence: (id) => cosine(corpus.fp[probeId].bigrams, corpus.fp[id].bigrams),
    semantic: (id) => cosine(tfidf[probeId], tfidf[id]),
    keyword: (id) => {
      const row = corpus.rows.find((r) => r.id === id);
      const other = new Set(terms(`${row.title} ${row.objective}`));
      const inter = [...probeTokens].filter((w) => other.has(w)).length;
      const uni = new Set([...probeTokens, ...other]).size || 1;
      return inter / uni;
    },
    recency: (id) => {
      const row = corpus.rows.find((r) => r.id === id);
      const days = Math.abs(probeEnd - Date.parse(row.ended_at ?? row.started_at)) / 86400e3;
      return 1 / (1 + days);
    },
    random_control: (id) => randomScores[id],
  };

  const rankings = {};
  for (const [name, fn] of Object.entries(methods)) {
    rankings[name] = candidates
      .map((id) => ({ id, score: fn(id) }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  }
  return rankings;
}

/** Human-readable WHY for a structural match. Never only a score. */
export function explainStructural(db, corpus, probeId, matchId) {
  const { score, shared, bigramSim } = structuralScore(corpus, probeId, matchId);
  const descs = Object.fromEntries(db.prepare("SELECT key, description FROM anchors").all().map((r) => [r.key, r.description]));
  const A = corpus.fp[probeId].bigrams, B = corpus.fp[matchId].bigrams;
  const sharedMotifs = Object.keys(A).filter((k) => B[k]).slice(0, 4);
  const why = shared.length
    ? `Both trajectories exhibit: ${shared.map((a) => `${a} (${descs[a]})`).join("; ")}. Shared event-order motifs: ${sharedMotifs.map((m) => m.replace(">", " → ")).join(", ") || "none"}.`
    : "No shared structural anchors.";
  return { score, shared, bigramSim, explanation: why };
}
