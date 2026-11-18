import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { QueueState } from '../shared/protocol.js';

/** The file in a project's checkout that turns its floor's autopilot on. It's committed with the project. */
export const AUTOPILOT_FILE = 'agent-office.autopilot.json';
/** The shortest gap between two autopilot tasks, so a typo can't flood the queue. */
export const MIN_EVERY_MINUTES = 15;
const CHECK_MS = 60_000;

/** What `agent-office.autopilot.json` says. */
export interface AutopilotPlan {
  /** Minutes between one task being queued and the next. */
  everyMinutes: number;
  /** The task the queue gets each time. */
  prompt: string;
  /** Its title on the queue; the autopilot also knows its own tasks by it. */
  title: string;
  /** Hours of the day (0–23, the office machine's clock) when nothing is queued: [from, to), wrapping past midnight. */
  quietHours?: [number, number];
  /** The account whose sign-ins the task runs on (accounts only); the machine's own without it. */
  owner?: string;
}

/** What the autopilot needs from the floor's task queue. */
export interface AutopilotQueue {
  state(): QueueState;
  add(prompt: string, by: string, title?: string, issue?: undefined, provider?: undefined, model?: undefined, effort?: undefined, owner?: string): string | undefined;
}

/** Reads and checks the plan; a string says what's wrong with it, undefined means there's none (autopilot off). */
export function readPlan(dir: string): AutopilotPlan | string | undefined {
  const file = path.join(dir, AUTOPILOT_FILE);
  if (!existsSync(file)) return undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    return `${AUTOPILOT_FILE} isn't valid JSON: ${(e as Error).message}`;
  }
  return parsePlan(raw);
}

export function parsePlan(raw: unknown): AutopilotPlan | string | undefined {
  if (!raw || typeof raw !== 'object') return `${AUTOPILOT_FILE} must be an object`;
  const r = raw as Record<string, unknown>;
  if (r.enabled === false) return undefined;
  const every = Number(r.everyMinutes);
  if (!Number.isFinite(every) || every < MIN_EVERY_MINUTES) return `everyMinutes must be a number, ${MIN_EVERY_MINUTES} or more`;
  const prompt = typeof r.prompt === 'string' ? r.prompt.trim() : '';
  if (!prompt) return 'prompt is missing';
  const title = (typeof r.title === 'string' && r.title.trim()) || 'Autopilot';
  let quietHours: [number, number] | undefined;
  if (r.quietHours !== undefined) {
    const q = r.quietHours;
    const hour = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 23;
    if (!Array.isArray(q) || q.length !== 2 || !hour(q[0]) || !hour(q[1])) return 'quietHours must be [from, to], hours 0–23';
    quietHours = [q[0], q[1]];
  }
  const owner = typeof r.owner === 'string' && r.owner.trim() ? r.owner.trim() : undefined;
  return { everyMinutes: every, prompt, title: title.slice(0, 120), quietHours, owner };
}

/** Whether `hour` falls in [from, to), which may wrap past midnight. */
export function isQuiet(hour: number, quiet?: [number, number]): boolean {
  if (!quiet || quiet[0] === quiet[1]) return false;
  const [from, to] = quiet;
  return from < to ? hour >= from && hour < to : hour >= from || hour < to;
}

/**
 * The floor's autopilot: when its project has an `agent-office.autopilot.json`, the same task goes on
 * the 📋 queue every `everyMinutes`, so the floor keeps working when nobody's there. A new one is only
 * queued once the last one is done, so a slow run never stacks up. The file is read again each minute,
 * so editing it (or pulling a change to it) takes effect without a restart.
 */
export class Autopilot {
  private timer?: NodeJS.Timeout;
  private lastAt = 0;
  private lastError?: string;
  private statePath: string;

  constructor(
    private dir: string,
    dataDir: string,
    private queue: AutopilotQueue,
    private toast: (text: string, level: 'info' | 'warn' | 'error') => void,
    private now: () => Date = () => new Date(),
  ) {
    this.statePath = path.join(dataDir, 'autopilot.json');
    try {
      this.lastAt = Number(JSON.parse(readFileSync(this.statePath, 'utf8')).lastAt) || 0;
    } catch {
      this.lastAt = 0;
    }
  }

  start(intervalMs = CHECK_MS) {
    this.timer = setInterval(() => this.check(), intervalMs);
    return this;
  }

  /** Queues the plan's task if it's due. Returns what it did, for tests and logs. */
  check(): 'off' | 'invalid' | 'quiet' | 'busy' | 'waiting' | 'queued' | 'refused' {
    const plan = readPlan(this.dir);
    if (plan === undefined) return 'off';
    if (typeof plan === 'string') {
      if (plan !== this.lastError) this.toast(`🤖 Autopilot is off: ${plan}`, 'warn');
      this.lastError = plan;
      return 'invalid';
    }
    this.lastError = undefined;
    const now = this.now();
    if (isQuiet(now.getHours(), plan.quietHours)) return 'quiet';
    if (this.queue.state().tasks.some((t) => t.title === plan.title && t.addedBy === 'Autopilot' && t.status !== 'done')) return 'busy';
    if (now.getTime() - this.lastAt < plan.everyMinutes * 60_000) return 'waiting';
    const err = this.queue.add(plan.prompt, 'Autopilot', plan.title, undefined, undefined, undefined, undefined, plan.owner);
    if (err) {
      if (err !== this.lastError) this.toast(`🤖 Autopilot couldn't queue its task: ${err}`, 'warn');
      this.lastError = err;
      return 'refused';
    }
    this.lastAt = now.getTime();
    try {
      writeFileSync(this.statePath, JSON.stringify({ lastAt: this.lastAt }));
    } catch {
      // Not being able to save only means the next run may come early after a restart.
    }
    this.toast(`🤖 Autopilot queued: ${plan.title}`, 'info');
    return 'queued';
  }

  shutdown() {
    clearInterval(this.timer);
  }
}
