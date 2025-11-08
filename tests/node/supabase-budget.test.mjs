import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBudgetSnapshot } from '../../scripts/supabase/upsert-budget-snapshot.js';

test('buildBudgetSnapshot maps aggregated costs', () => {
  const record = buildBudgetSnapshot(
    {
      period: {
        start: '2024-02-01T00:00:00.000Z',
        end: '2024-03-01T00:00:00.000Z',
      },
      costs: {
        total_usd: 82.6,
        anthropic: { usd: 50.1 },
        firebase: { usd: 12.5 },
        github: { usd: 20 },
      },
    },
    { thresholdState: 'warning', notes: 'threshold exceeded' },
  );

  assert.equal(record.period_start, '2024-02-01T00:00:00.000Z');
  assert.equal(record.threshold_state, 'warning');
  assert.equal(record.vendor_costs.anthropic, 50.1);
  assert.equal(record.total_cost, 82.6);
  assert.equal(record.notes, 'threshold exceeded');
});
