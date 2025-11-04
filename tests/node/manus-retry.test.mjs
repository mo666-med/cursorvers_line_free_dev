import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveDecision,
  resolveRetryPayload,
} from '../../scripts/manus/retry-task.mjs';

test('resolveDecision prefers explicit decision', () => {
  assert.equal(resolveDecision({ decision: 'retry' }), 'retry');
  assert.equal(resolveDecision({ plan_delta: { decision: 'amended' } }), 'amended');
  assert.equal(resolveDecision({}), 'proceed');
});

test('resolveRetryPayload captures plan deltas', () => {
  const payload = resolveRetryPayload({
    event_id: 'evt-1',
    plan_delta: {
      retry_after_seconds: 90,
      amended_plan: { id: 'plan-2' },
      reasons: ['temporary error'],
    },
  });

  assert.equal(payload.event_id, 'evt-1');
  assert.equal(payload.retry_after_seconds, 90);
  assert.deepEqual(payload.amended_plan, { id: 'plan-2' });
  assert.deepEqual(payload.notes, ['temporary error']);
});
