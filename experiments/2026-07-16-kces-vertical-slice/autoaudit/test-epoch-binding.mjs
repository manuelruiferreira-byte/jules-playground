import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const historical = readFileSync(join(root, 'autoaudit/verdict.json'), 'utf8');
for (const mutation of ['none', 'manifest', 'registry', 'entry', 'event', 'event-id', 'event-missing']) {
  const temporary = mkdtempSync(join(tmpdir(), 'kces-epoch-test-'));
  try {
    const copy = join(temporary, 'kces');
    cpSync(root, copy, { recursive: true, filter: (path) => !path.includes('node_modules') && !path.includes('__pycache__') });
    symlinkSync(join(root, 'node_modules'), join(copy, 'node_modules'), 'dir');
    cpSync(join(root, '../2026-07-16-qf-001-phase-signal'), join(temporary, '2026-07-16-qf-001-phase-signal'), { recursive: true, filter: (path) => !path.includes('__pycache__') });
    const historicalEventPath = join(copy, 'events/outbox/autopilot-dry-run.json');
    const historicalEvent = readFileSync(historicalEventPath, 'utf8');
    const generated = spawnSync(process.execPath, [join(copy, 'autopilot/dry-run.mjs')], { encoding: 'utf8', cwd: copy });
    assert.equal(generated.status, 0, generated.stdout + generated.stderr);
    const eventPath = join(copy, 'events/outbox/autopilot-dry-run-active.json');
    const manifestPath = join(copy, 'MANIFEST.json');
    const registryPath = join(copy, 'evaluators/registry.json');
    if (mutation === 'manifest') {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      manifest.evaluator_epoch = 'epoch:2026-07-16-a';
      writeFileSync(manifestPath, JSON.stringify(manifest));
    } else if (mutation === 'registry' || mutation === 'entry') {
      const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
      if (mutation === 'registry') registry.epoch = 'epoch:2026-07-16-a';
      else registry.evaluators[0].epoch = 'epoch:2026-07-16-a';
      writeFileSync(registryPath, JSON.stringify(registry));
    }
    if (mutation === 'event' || mutation === 'event-id') {
      const event = JSON.parse(readFileSync(eventPath, 'utf8'));
      if (mutation === 'event') event.subject_ref = 'experiment:kces-vertical-slice';
      else event.id = 'event:autopilot-dry-run-2026-07-16';
      writeFileSync(eventPath, JSON.stringify(event));
    } else if (mutation === 'event-missing') rmSync(eventPath);
    const result = spawnSync(process.execPath, [join(copy, 'autoaudit/run-autoaudit.mjs')], { encoding: 'utf8', cwd: copy });
    assert.equal(result.status, mutation === 'none' ? 0 : 1, result.stdout + result.stderr);
    const verdict = JSON.parse(readFileSync(join(copy, 'autoaudit/verdict-active.json'), 'utf8'));
    assert.equal(verdict.verdict, mutation === 'none' ? 'PASS' : 'BLOCKED');
    const binding = verdict.evidence.find((e) => e.check === (mutation.startsWith('event') ? 'active autopilot event binds to manifest and epoch' : 'manifest, registry and verdict epochs agree'));
    assert.equal(binding.result, mutation === 'none' ? 'pass' : 'fail');
    assert.equal(readFileSync(join(copy, 'autoaudit/verdict.json'), 'utf8'), historical);
    assert.equal(readFileSync(historicalEventPath, 'utf8'), historicalEvent);
    if (mutation === 'none') {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
      assert.equal(verdict.evaluator_epoch, manifest.evaluator_epoch);
      assert.equal(verdict.evaluator_epoch, registry.epoch);
      assert.equal(verdict.subject_ref, manifest.id);
    }
    console.log(`PASS ${mutation}: epoch/event binding and historical evidence preservation`);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
