#!/usr/bin/env node
/**
 * PlanDelta generator for development workflow.
 * Creates/updates orchestration/plan/plan_delta.json with metadata derived from the triggering event.
 *
 * Usage:
 *   node scripts/plan/generate-plan-delta.js --event tmp/event.json --plan orchestration/plan/current_plan.json --delta orchestration/plan/plan_delta.json
 * Environment fallback:
 *   EVENT_PAYLOAD can be provided as JSON string if --event is omitted.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

function parseArgs(argv) {
  const map = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.replace(/^--/, "");
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        map[key] = next;
        i += 1;
      } else {
        map[key] = "true";
      }
    }
  }
  return map;
}

function readJson(path, fallback = {}) {
  if (!path || !existsSync(path)) {
    return fallback;
  }
  const raw = readFileSync(path, "utf-8");
  if (!raw.trim()) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON at ${path}: ${error.message}`);
  }
}

function detectEventType(eventPayload) {
  if (!eventPayload || typeof eventPayload !== "object") return "unknown";
  if (Array.isArray(eventPayload.events) && eventPayload.events.length > 0) {
    return eventPayload.events[0]?.type ?? "line_event";
  }
  if (eventPayload.event_type && eventPayload.task_id) {
    return eventPayload.event_type;
  }
  return "unknown";
}

const args = parseArgs(process.argv.slice(2));
const eventPath = args.event;
const planPath =
  args.plan ?? resolve("orchestration", "plan", "current_plan.json");
const deltaPath =
  args.delta ?? resolve("orchestration", "plan", "plan_delta.json");

let eventPayload = {};
if (eventPath) {
  eventPayload = readJson(eventPath, {});
} else if (process.env.EVENT_PAYLOAD) {
  try {
    eventPayload = JSON.parse(process.env.EVENT_PAYLOAD);
  } catch (error) {
    console.warn("Failed to parse EVENT_PAYLOAD, using empty payload.", error);
  }
}

// Ensure plan file exists (create minimal default if missing)
if (!existsSync(planPath)) {
  const defaultPlan = {
    title: "Default Plan",
    risk: {
      level: "unknown",
      reasons: [],
      approval: "pending",
    },
    steps: [],
    observability: {
      success_metrics: [],
      logs: [],
    },
  };
  mkdirSync(dirname(planPath), { recursive: true });
  writeFileSync(planPath, JSON.stringify(defaultPlan, null, 2));
}

const planJson = readJson(planPath);
const eventType = detectEventType(eventPayload);
const delta = {
  decision: "continue",
  reasons: [`Auto-generated for event_type="${eventType}"`],
  actions: [],
  metadata: {
    event_type: eventType,
    plan_title: planJson.title ?? "unknown",
    generated_at: new Date().toISOString(),
  },
};

mkdirSync(dirname(deltaPath), { recursive: true });
writeFileSync(deltaPath, JSON.stringify(delta, null, 2));

console.log(
  `Plan delta generated at ${deltaPath} (decision=${delta.decision}, event_type=${eventType})`,
);
