import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AUTOPILOT_FILE, Autopilot, isQuiet, parsePlan, type AutopilotQueue } from '../src/server/autopilot.js';
import type { QueueTask } from '../src/shared/protocol.js';

function fixture(plan?: unknown) {
  const dir = mkdtempSync(path.join(tmpdir(), 'office-autopilot-'));
  if (plan !== undefined) writeFileSync(path.join(dir, AUTOPILOT_FILE), typeof plan === 'string' ? plan : JSON.stringify(plan));
  const tasks: QueueTask[] = [];
  const added: { prompt: string; by: string; title?: string; owner?: string }[] = [];
  const queue: AutopilotQueue = {
    state: () => ({ tasks, maxWorkers: 3 }),
    add(prompt, by, title, _i, _p, _m, _e, owner) {
      added.push({ prompt, by, title, owner });
      tasks.push({ id: String(tasks.length), provider: 'claude', title: title ?? '', prompt, addedBy: by, addedAt: 0, status: 'queued' });
      return undefined;
    },
  };
  const toasts: string[] = [];
  let clock = new Date(2026, 10, 18, 12, 0);
  const pilot = (dataDir = dir) => new Autopilot(dir, dataDir, queue, (t) => toasts.push(t), () => clock);
  return {
    dir, tasks, added, toasts, pilot,
    at(h: number, m = 0, day = 18) { clock = new Date(2026, 10, day, h, m); },
    close: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const PLAN = { everyMinutes: 60, prompt: 'Produce the next video', title: 'Next video' };

test('autopilot is off without its file, or with enabled: false', (t) => {
  const f = fixture(); t.after(f.close);
  assert.equal(f.pilot().check(), 'off');
  writeFileSync(path.join(f.dir, AUTOPILOT_FILE), JSON.stringify({ ...PLAN, enabled: false }));
  assert.equal(f.pilot().check(), 'off');
  assert.equal(f.added.length, 0);
});

test('autopilot queues its task, waits for it to finish and for the gap, then queues it again', (t) => {
  const f = fixture({ ...PLAN, owner: 'omar' }); t.after(f.close);
  const p = f.pilot();
  assert.equal(p.check(), 'queued');
  assert.deepEqual(f.added[0], { prompt: 'Produce the next video', by: 'Autopilot', title: 'Next video', owner: 'omar' });
  f.at(14);
  assert.equal(p.check(), 'busy', 'the last run is still on the queue');
  f.tasks[0].status = 'done';
  f.at(12, 30);
  assert.equal(p.check(), 'waiting');
  f.at(13, 0);
  assert.equal(p.check(), 'queued');
  assert.equal(f.added.length, 2);
});

test('autopilot remembers its last run across a restart', (t) => {
  const f = fixture(PLAN); t.after(f.close);
  assert.equal(f.pilot().check(), 'queued');
  f.tasks[0].status = 'done';
  f.at(12, 20);
  assert.equal(f.pilot().check(), 'waiting');
});

test('autopilot keeps quiet hours, wrapping past midnight', (t) => {
  const f = fixture({ ...PLAN, quietHours: [23, 7] }); t.after(f.close);
  f.at(2);
  assert.equal(f.pilot().check(), 'quiet');
  assert.equal(isQuiet(23, [23, 7]), true);
  assert.equal(isQuiet(7, [23, 7]), false);
  assert.equal(isQuiet(10, [9, 17]), true);
  assert.equal(isQuiet(17, [9, 17]), false);
});

test('a bad plan is reported once and queues nothing', (t) => {
  const f = fixture('{ nope'); t.after(f.close);
  const p = f.pilot();
  assert.equal(p.check(), 'invalid');
  assert.equal(p.check(), 'invalid');
  assert.equal(f.toasts.length, 1);
  assert.match(String(parsePlan({ ...PLAN, everyMinutes: 1 })), /everyMinutes/);
  assert.match(String(parsePlan({ everyMinutes: 60 })), /prompt/);
  assert.match(String(parsePlan({ ...PLAN, quietHours: [25, 3] })), /quietHours/);
});
