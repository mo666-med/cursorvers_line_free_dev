import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  collectCosts,
  monthBounds,
} from '../../scripts/budget/collect-costs.js';

const makeTempDir = async () => mkdtemp(join(tmpdir(), 'budget-test-'));

test('collectCosts aggregates sample data when requested', async () => {
  const result = await collectCosts({
    sample: true,
    sampleAnthropic: 10,
    sampleFirebase: 5,
    sampleGithubMinutes: 50,
  });
  assert.equal(result.costs.anthropic.usd, 10);
  assert.equal(result.costs.firebase.usd, 5);
  assert.equal(result.costs.github.minutes, 50);
});

test('collectCosts reads from csv/json inputs', async () => {
  const dir = await makeTempDir();
  const { start } = monthBounds(new Date('2024-02-15T00:00:00Z'));
  const monthPrefix = start.toISOString().slice(0, 7);

  const anthropicPath = join(dir, 'anthropic.csv');
  await writeFile(
    anthropicPath,
    `date,usd\n${monthPrefix}-01,12.50\n${monthPrefix}-02,7.30\n`,
    'utf8',
  );

  const firebasePath = join(dir, 'firebase.json');
  await writeFile(
    firebasePath,
    JSON.stringify({
      entries: [
        { date: `${monthPrefix}-01`, cost_usd: 3.2 },
        { date: `${monthPrefix}-02`, cost_usd: 4.8 },
      ],
    }),
    'utf8',
  );

  const githubPath = join(dir, 'github.json');
  await writeFile(
    githubPath,
    JSON.stringify({ minutes: 60, cost_usd: 2.4 }),
    'utf8',
  );

  const result = await collectCosts({
    anthropicCsv: anthropicPath,
    firebaseJson: firebasePath,
    githubJson: githubPath,
    now: new Date(`${monthPrefix}-15T00:00:00Z`),
  });

  assert.equal(result.costs.anthropic.usd, 19.8);
  assert.equal(result.costs.firebase.usd, 8);
  assert.equal(result.costs.github.usd, 2.4);
  assert.equal(result.costs.total_usd, 30.2);
  assert.equal(result.warnings.length, 0);
});
