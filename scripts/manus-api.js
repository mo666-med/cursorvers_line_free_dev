#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  createManusTask,
  getManusTask,
  cancelManusTask,
  resolveConfig,
} from "./lib/manus-api.js";

function usage() {
  const script = path.basename(process.argv[1] ?? "manus-api.js");
  return `Usage:
  node ${script} create <brief-file> <plan-json> [--webhook <url>] [--metadata <json>]
  node ${script} get <task-id>
  node ${script} cancel <task-id>

Environment variables:
  MANUS_API_KEY                Manus API key (required)
  MANUS_BASE_URL               Manus API base URL (default: https://api.manus.ai)
  PROGRESS_WEBHOOK_URL         Default webhook URL when dispatching tasks
`;
}

function parseFlags(rawArgs) {
  const flags = {};
  const positional = [];

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const [key, value] = arg.split("=", 2);
    const flagName = key.replace(/^--/, "");
    if (value !== undefined) {
      flags[flagName] = value;
      continue;
    }

    const next = rawArgs[i + 1];
    if (next && !next.startsWith("--")) {
      flags[flagName] = next;
      i += 1;
    } else {
      flags[flagName] = true;
    }
  }

  return { flags, positional };
}

async function handleCreate(args, flags) {
  const [briefPath, planPath, positionalWebhook] = args;
  if (!briefPath || !planPath) {
    throw new Error("create command requires <brief-file> and <plan-json> arguments");
  }

  const brief = await readFile(briefPath, "utf8");
  const planRaw = await readFile(planPath, "utf8");

  let plan;
  try {
    plan = JSON.parse(planRaw);
  } catch (error) {
    throw new Error(`Failed to parse plan JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  let metadata;
  if (flags.metadata) {
    try {
      metadata = JSON.parse(flags.metadata);
    } catch (error) {
      throw new Error(`Failed to parse --metadata JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else if (flags["metadata-file"]) {
    const metadataRaw = await readFile(flags["metadata-file"], "utf8");
    try {
      metadata = JSON.parse(metadataRaw);
    } catch (error) {
      throw new Error(`Failed to parse metadata file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  let webhook = flags.webhook;
  if (!webhook && positionalWebhook) {
    webhook = positionalWebhook;
  }

  const overrides = {};
  if (flags["base-url"]) overrides.baseUrl = flags["base-url"];
  if (flags["api-key"]) overrides.apiKey = flags["api-key"];
  if (webhook) overrides.webhookUrl = webhook;

  // Resolve config early to surface missing API key.
  resolveConfig(overrides);

  const result = await createManusTask({
    brief,
    plan,
    webhookUrl: webhook,
    metadata,
    overrides,
  });

  return { status: "ok", action: "create", result };
}

async function handleGet(args, flags) {
  const [taskId] = args;
  if (!taskId) throw new Error("get command requires <task-id>");

  const overrides = {};
  if (flags["base-url"]) overrides.baseUrl = flags["base-url"];
  if (flags["api-key"]) overrides.apiKey = flags["api-key"];

  const result = await getManusTask(taskId, overrides);
  return { status: "ok", action: "get", taskId, result };
}

async function handleCancel(args, flags) {
  const [taskId] = args;
  if (!taskId) throw new Error("cancel command requires <task-id>");

  const overrides = {};
  if (flags["base-url"]) overrides.baseUrl = flags["base-url"];
  if (flags["api-key"]) overrides.apiKey = flags["api-key"];

  const result = await cancelManusTask(taskId, overrides);
  return { status: "ok", action: "cancel", taskId, result };
}

async function main() {
  const [, , command, ...rest] = process.argv;
  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(usage());
    return;
  }

  const { flags, positional } = parseFlags(rest);

  let output;
  switch (command) {
    case "create":
      output = await handleCreate(positional, flags);
      break;
    case "get":
      output = await handleGet(positional, flags);
      break;
    case "cancel":
      output = await handleCancel(positional, flags);
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
