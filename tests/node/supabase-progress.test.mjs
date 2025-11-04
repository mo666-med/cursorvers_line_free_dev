import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProgressRecord } from '../../scripts/supabase/upsert-progress-event.js';

test('buildProgressRecord maps Manus payload to Supabase record structure', () => {
  const event = {
    event_type: 'step_failed',
    task_id: 'task-123',
    step_id: 'generate-summary',
    idempotency_key: 'event-abc123',
    ts: '2025-11-02T00:05:00Z',
    plan_title: '治験サマリープラン',
    plan_version: 'v1.2',
    plan_id: 'plan-xyz',
    plan_delta: {
      decision: 'retry',
      cost_estimate: 12.5,
      evidence: { notes: 'LLM latency' },
    },
    manus_run_id: 'run-001',
    status: 'failed',
  };

  const record = buildProgressRecord(event, {
    dedupeKey: 'dedupe-1',
    correlationId: 'corr-1',
  });

  assert.equal(record.source, 'manus');
  assert.equal(record.user_hash, 'manus::task-123');
  assert.equal(record.plan_id, 'plan-xyz');
  assert.equal(record.plan_version, 'v1.2');
  assert.equal(record.plan_variant, 'production');
  assert.equal(record.event_type, 'step_failed');
  assert.equal(record.decision, 'retry');
  assert.equal(record.cost_estimate, 12.5);
  assert.equal(record.manus_points_consumed, null);
  assert.equal(record.retry_after_seconds, null);
  assert.equal(record.status, 'failed');
  assert.equal(record.dedupe_key, 'dedupe-1');
  assert.equal(record.correlation_id, 'corr-1');
  assert.equal(record.manus_run_id, 'run-001');
  assert.deepEqual(record.evidence, { notes: 'LLM latency' });
  assert.deepEqual(record.payload, event);
});

test('buildProgressRecord captures retry-after and plan variants', () => {
  const event = {
    event_type: 'task_failed',
    task_id: 'task-456',
    ts: '2025-11-02T00:15:00Z',
    plan_id: 'plan-beta',
    plan_version: 'v2',
    plan_variant: 'degraded',
    manus_points_consumed: 7.234,
    retry_after_seconds: 120,
  };

  const record = buildProgressRecord(event, {});
  assert.equal(record.plan_variant, 'degraded');
  assert.equal(record.manus_points_consumed, 7.23);
  assert.equal(record.retry_after_seconds, 120);
  assert.equal(record.recorded_at, '2025-11-02T00:15:00Z');
});

test('buildProgressRecord generates defaults when metadata is missing', () => {
  const now = new Date('2025-11-02T00:10:00Z');
  const event = {
    event_type: 'step_completed',
    task_id: 'task-999',
    ts: now.toISOString(),
  };

  const record = buildProgressRecord(event, {});

  assert.equal(record.source, 'manus');
  assert.equal(record.plan_id, 'unknown-plan');
  assert.equal(record.plan_version, 'v0');
  assert.equal(record.plan_variant, 'production');
  assert.equal(record.decision, 'proceed');
  assert.equal(record.status, 'complete');
  assert.equal(record.user_hash, 'manus::task-999');
  assert.equal(record.dedupe_key.length, 64);
  assert.equal(record.cost_estimate, null);
  assert.equal(record.evidence, null);
  assert.equal(record.manus_points_consumed, null);
  assert.equal(record.retry_after_seconds, null);
});
