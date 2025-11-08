#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import process from 'node:process';

const SUPPORTED_DECISIONS = new Set(['retry', 'amended']);

function fail(message) {
  console.error(JSON.stringify({ status: 'error', message }));
  process.exit(1);
}

function resolveDecision(event) {
  const explicit = event?.decision || event?.plan_delta?.decision;
  return typeof explicit === 'string' ? explicit.toLowerCase() : 'proceed';
}

function resolveRetryPayload(event) {
  const planDelta = event?.plan_delta || {};
  return {
    event_id: event?.event_id ?? event?.idempotency_key ?? null,
    retry_after_seconds: planDelta.retry_after_seconds ?? event?.retry_after_seconds ?? null,
    amended_plan: planDelta.amended_plan ?? null,
    notes: planDelta.reasons ?? [],
  };
}

async function callManusRetry({ manusBaseUrl, manusApiKey, taskId, payload }) {
  const endpoint = `${manusBaseUrl.replace(/\/$/, '')}/v1/tasks/${taskId}/retry`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${manusApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Manus retry failed (${response.status}): ${text.slice(0, 256)}`);
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return { status: response.status, body: text };
  }
}

async function main() {
  const [, , eventPath] = process.argv;
  if (!eventPath) {
    fail('Usage: node scripts/manus/retry-task.mjs <progress-event-json>');
  }

  const manusApiKey = process.env.MANUS_API_KEY;
  const manusBaseUrl = process.env.MANUS_BASE_URL || 'https://api.manus.ai';

  if (!manusApiKey) {
    console.log(JSON.stringify({ status: 'skipped', reason: 'missing_api_key' }));
    return;
  }

  const raw = await readFile(eventPath, 'utf8');
  const event = JSON.parse(raw);

  const decision = resolveDecision(event);
  if (!SUPPORTED_DECISIONS.has(decision)) {
    console.log(JSON.stringify({ status: 'skipped', decision }));
    return;
  }

  const taskId = event?.task_id || event?.progress_id;
  if (!taskId) {
    fail('Missing Manus task identifier');
  }

  const payload = resolveRetryPayload(event);
  const response = await callManusRetry({ manusBaseUrl, manusApiKey, taskId, payload });
  console.log(JSON.stringify({ status: 'ok', decision, manus_response: response }));
}

const executedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (executedDirectly) {
  main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
}

export {
  resolveDecision,
  resolveRetryPayload,
};
