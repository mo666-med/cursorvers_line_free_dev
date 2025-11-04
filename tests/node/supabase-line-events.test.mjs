import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLineMemberRecord,
  buildProgressRecords,
  createLineDedupeKey,
  extractPlanMetadata,
} from '../../scripts/supabase/upsert-line-event.js';

test('extractPlanMetadata falls back to defaults', () => {
  assert.deepEqual(extractPlanMetadata(), {
    planId: 'line_plan',
    planVersion: 'v0',
  });
});

test('extractPlanMetadata prefers explicit properties', () => {
  const metadata = extractPlanMetadata({
    id: 'plan-x',
    version: 'v2',
  });
  assert.equal(metadata.planId, 'plan-x');
  assert.equal(metadata.planVersion, 'v2');
});

test('buildProgressRecords maps LINE events to Supabase structure', () => {
  const payload = {
    events: [
      {
        type: 'follow',
        timestamp: '1700000000000',
        source: { userId: 'hashed-user' },
        replyToken: 'reply-1',
        message: {
          id: 'msg-1',
          type: 'text',
          text: 'hello',
        },
      },
    ],
  };

  const records = buildProgressRecords(payload, {
    planId: 'plan-alpha',
    planVersion: 'v1.0.0',
    correlationId: 'run-1',
    planVariant: 'degraded',
  });

  assert.equal(records.length, 1);
  const record = records[0];
  assert.equal(record.source, 'line');
  assert.equal(record.user_hash, 'hashed-user');
  assert.equal(record.plan_id, 'plan-alpha');
  assert.equal(record.plan_version, 'v1.0.0');
  assert.equal(record.plan_variant, 'degraded');
  assert.equal(record.event_type, 'follow');
  assert.equal(record.decision, 'proceed');
  assert.equal(record.status, 'complete');
  assert.equal(record.retry_after_seconds, null);
  assert.equal(record.manus_points_consumed, null);
  assert.equal(record.evidence.channel, 'line');
  assert.equal(record.evidence.message_type, 'text');
  assert.equal(record.correlation_id, 'run-1');
  assert.ok(record.dedupe_key);
  assert.ok(record.recorded_at);
});

test('createLineDedupeKey is deterministic for identical inputs', () => {
  const options = {
    userHash: 'user-a',
    eventType: 'message',
    timestamp: '2024-01-01T00:00:00Z',
    messageId: 'mid-1',
    replyToken: 'reply-1',
  };
  const first = createLineDedupeKey(options);
  const second = createLineDedupeKey(options);
  assert.equal(first, second);
  assert.equal(first.length, 64);
});

test('buildLineMemberRecord captures latest metadata', () => {
  const event = {
    type: 'message',
    timestamp: '1700000000000',
    source: { userId: 'hashed-user' },
    message: { text: 'hi there' },
    replyToken: 'reply-2',
    tags: ['campaign-a', 'note-123'],
  };

  const record = buildLineMemberRecord(event);
  assert.equal(record.user_hash, 'hashed-user');
  assert.equal(record.status, 'engaged');
  assert.deepEqual(record.cta_tags, ['campaign-a', 'note-123']);
  assert.ok(record.first_opt_in_at);
  assert.ok(record.last_opt_in_at);
  assert.equal(record.guardrail_sent_at, record.last_opt_in_at);
  assert.equal(record.metadata.last_message, 'hi there');
  assert.equal(record.metadata.last_event_type, 'message');
  assert.equal(record.metadata.reply_token, 'reply-2');
  assert.equal(record.consent_guardrail, true);
  assert.ok(record.updated_at);
});
