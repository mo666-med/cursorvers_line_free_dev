import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'os';
import { writeFileSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI_PATH = join(__dirname, '../../scripts/manus-api.js');

// CLIの出力をキャプチャするヘルパー関数
function runCLI(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', reject);
  });
}

test('CLI shows usage when no command provided', async () => {
  const result = await runCLI([]);
  assert.notEqual(result.code, 0);
  assert.ok(result.stderr.includes('Usage'));
});

test('CLI shows usage for invalid command', async () => {
  const result = await runCLI(['invalid']);
  assert.notEqual(result.code, 0);
  assert.ok(result.stderr.includes('Usage'));
});

test('CLI create command requires brief and plan files', async () => {
  const result = await runCLI(['create']);
  assert.notEqual(result.code, 0);
  assert.ok(result.stderr.includes('Usage'));
});

test('CLI create command parses --dry-run option', async () => {
  const tmpDir = tmpdir();
  const briefFile = join(tmpDir, 'test-brief.txt');
  const planFile = join(tmpDir, 'test-plan.json');

  try {
    writeFileSync(briefFile, 'Test Brief');
    writeFileSync(planFile, JSON.stringify({ title: 'Test Plan', steps: [] }));

    const result = await runCLI([
      'create',
      '--dry-run',
      briefFile,
      planFile
    ], {
      MANUS_DRY_RUN: 'true'
    });

    // dry-runモードなのでAPIキーがなくても成功するはず
    assert.ok(result.stdout.includes('Task created') || result.stdout.includes('dryRun'));
  } finally {
    try {
      unlinkSync(briefFile);
      unlinkSync(planFile);
    } catch (e) {
      // ignore
    }
  }
});

test('CLI create command parses --idempotency option', async () => {
  const tmpDir = tmpdir();
  const briefFile = join(tmpDir, 'test-brief.txt');
  const planFile = join(tmpDir, 'test-plan.json');

  try {
    writeFileSync(briefFile, 'Test Brief');
    writeFileSync(planFile, JSON.stringify({ title: 'Test Plan', steps: [] }));

    const result = await runCLI([
      'create',
      '--dry-run',
      '--idempotency',
      'test-key-123',
      briefFile,
      planFile
    ], {
      MANUS_DRY_RUN: 'true'
    });

    const output = JSON.parse(result.stdout.match(/\{[\s\S]*\}/)?.[0] || '{}');
    assert.ok(output.payload?.idempotency_key === 'test-key-123' || output.payload?.metadata?.idempotency_key === 'test-key-123');
  } finally {
    try {
      unlinkSync(briefFile);
      unlinkSync(planFile);
    } catch (e) {
      // ignore
    }
  }
});

test('CLI create command parses --metadata-file option', async () => {
  const tmpDir = tmpdir();
  const briefFile = join(tmpDir, 'test-brief.txt');
  const planFile = join(tmpDir, 'test-plan.json');
  const metadataFile = join(tmpDir, 'metadata.json');

  try {
    writeFileSync(briefFile, 'Test Brief');
    writeFileSync(planFile, JSON.stringify({ title: 'Test Plan', steps: [] }));
    writeFileSync(metadataFile, JSON.stringify({ retry: { attempt: 2 } }));

    const result = await runCLI([
      'create',
      '--dry-run',
      '--metadata-file',
      metadataFile,
      briefFile,
      planFile
    ], {
      MANUS_DRY_RUN: 'true'
    });

    const output = JSON.parse(result.stdout.match(/\{[\s\S]*\}/)?.[0] || '{}');
    assert.ok(output.payload?.metadata?.retry?.attempt === 2);
  } finally {
    try {
      unlinkSync(briefFile);
      unlinkSync(planFile);
      unlinkSync(metadataFile);
    } catch (e) {
      // ignore
    }
  }
});

test('CLI create command handles missing files gracefully', async () => {
  const result = await runCLI([
    'create',
    'nonexistent-brief.txt',
    'nonexistent-plan.json'
  ]);

  assert.notEqual(result.code, 0);
  assert.ok(result.stderr.includes('ENOENT') || result.stderr.includes('Error'));
});

test('CLI create command handles invalid JSON in plan file', async () => {
  const tmpDir = tmpdir();
  const briefFile = join(tmpDir, 'test-brief.txt');
  const planFile = join(tmpDir, 'invalid-plan.json');

  try {
    writeFileSync(briefFile, 'Test Brief');
    writeFileSync(planFile, 'invalid json');

    const result = await runCLI([
      'create',
      '--dry-run',
      briefFile,
      planFile
    ], {
      MANUS_DRY_RUN: 'true'
    });

    assert.notEqual(result.code, 0);
    assert.ok(result.stderr.includes('JSON') || result.stderr.includes('Error'));
  } finally {
    try {
      unlinkSync(briefFile);
      unlinkSync(planFile);
    } catch (e) {
      // ignore
    }
  }
});

test('CLI get command requires task ID', async () => {
  const result = await runCLI(['get']);
  assert.notEqual(result.code, 0);
  assert.ok(result.stderr.includes('Usage'));
});

test('CLI handles unknown options gracefully', async () => {
  const tmpDir = tmpdir();
  const briefFile = join(tmpDir, 'test-brief.txt');
  const planFile = join(tmpDir, 'test-plan.json');

  try {
    writeFileSync(briefFile, 'Test Brief');
    writeFileSync(planFile, JSON.stringify({ title: 'Test Plan', steps: [] }));

    const result = await runCLI([
      'create',
      '--unknown-option',
      briefFile,
      planFile
    ]);

    assert.notEqual(result.code, 0);
    assert.ok(result.stderr.includes('Unknown option'));
  } finally {
    try {
      unlinkSync(briefFile);
      unlinkSync(planFile);
    } catch (e) {
      // ignore
    }
  }
});

test('CLI handles --idempotency without value', async () => {
  const tmpDir = tmpdir();
  const briefFile = join(tmpDir, 'test-brief.txt');
  const planFile = join(tmpDir, 'test-plan.json');

  try {
    writeFileSync(briefFile, 'Test Brief');
    writeFileSync(planFile, JSON.stringify({ title: 'Test Plan', steps: [] }));

    const result = await runCLI([
      'create',
      '--idempotency',
      briefFile,
      planFile
    ]);

    // --idempotencyの後に値がない場合、briefFileが値として解釈される可能性がある
    // その場合、planFileが不足してUsageエラーになる
    assert.notEqual(result.code, 0);
    assert.ok(
      result.stderr.includes('requires a value') ||
      result.stderr.includes('Usage') ||
      result.stderr.includes('Error')
    );
  } finally {
    try {
      unlinkSync(briefFile);
      unlinkSync(planFile);
    } catch (e) {
      // ignore
    }
  }
});

