import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { validatePlan } from '../../scripts/plan/validate-plan.js';
import { readFileSync } from 'node:fs';

const PLANS = [
  'orchestration/plan/production/current_plan.json',
  'orchestration/plan/production/degraded_plan.json',
];

test('plan validator CLI passes for production plans', () => {
  const result = spawnSync(
    'node',
    ['scripts/plan/validate-plan.js', ...PLANS],
    { encoding: 'utf-8' },
  );
  assert.equal(result.status, 0, `expected validator to succeed: ${result.stderr}`);
});

test('plan JSON contain required metadata fields', () => {
  for (const path of PLANS) {
    const plan = JSON.parse(readFileSync(path, 'utf-8'));
    assert.equal(typeof plan.id, 'string', `${path} must include id`);
    assert.equal(typeof plan.version, 'string', `${path} must include version`);
    assert.ok(plan.metadata && plan.metadata.description, `${path} must include metadata.description`);
    validatePlan(plan, path);
  }
});
