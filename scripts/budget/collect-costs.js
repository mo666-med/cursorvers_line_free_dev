#!/usr/bin/env node
/**
 * Collect vendor cost data for the economic circuit breaker.
 * Supports CSV/JSON inputs for Anthropic, Firebase, GitHub.
 * Falls back to zero-valued costs when no data is available.
 */

import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

const USD_PER_GITHUB_MINUTE = Number(process.env.GITHUB_MINUTE_RATE_USD || 0);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

async function fileExists(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function monthBounds(referenceDate = new Date()) {
  const start = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start, end };
}

function clampToPeriod(date, period) {
  return date >= period.start && date < period.end;
}

async function parseAnthropicCsv(path, period) {
  const warnings = [];
  if (!path || !(await fileExists(path))) {
    return { usd: 0, source: 'missing', warnings: [`anthropic csv not found (${path ?? 'not provided'})`] };
  }
  const content = await readFile(path, 'utf8');
  let total = 0;
  for (const line of content.split(/\r?\n/).filter(Boolean)) {
    if (line.trim().toLowerCase().startsWith('date')) continue;
    const [dateStr, usdStr] = line.split(',').map((part) => part.trim());
    if (!dateStr || !usdStr) continue;
    const date = new Date(dateStr);
    if (Number.isNaN(date.valueOf())) {
      warnings.push(`Invalid date in Anthropic CSV: ${dateStr}`);
      continue;
    }
    if (!clampToPeriod(date, period)) continue;
    const usd = Number.parseFloat(usdStr);
    if (Number.isFinite(usd)) {
      total += usd;
    } else {
      warnings.push(`Invalid USD value in Anthropic CSV: ${usdStr}`);
    }
  }
  return { usd: Number(total.toFixed(2)), source: resolve(path), warnings };
}

async function parseFirebaseJson(path, period) {
  if (!path || !(await fileExists(path))) {
    return { usd: 0, source: 'missing', warnings: [`firebase billing json not found (${path ?? 'not provided'})`] };
  }
  const content = await readFile(path, 'utf8');
  let json;
  try {
    json = JSON.parse(content);
  } catch (error) {
    return { usd: 0, source: resolve(path), warnings: [`firebase json parse error: ${error.message}`] };
  }
  const entries = Array.isArray(json.entries) ? json.entries : [];
  let total = 0;
  for (const entry of entries) {
    const date = entry?.date ? new Date(entry.date) : null;
    if (!date || Number.isNaN(date.valueOf()) || !clampToPeriod(date, period)) continue;
    const usd = Number.parseFloat(entry.cost_usd ?? entry.usd ?? 0);
    if (Number.isFinite(usd)) {
      total += usd;
    }
  }
  return { usd: Number(total.toFixed(2)), source: resolve(path), warnings: [] };
}

async function parseGithubJson(path, period) {
  if (!path || !(await fileExists(path))) {
    return {
      usd: 0,
      minutes: 0,
      source: 'missing',
      warnings: [`github billing json not found (${path ?? 'not provided'})`],
    };
  }
  const content = await readFile(path, 'utf8');
  let json;
  try {
    json = JSON.parse(content);
  } catch (error) {
    return {
      usd: 0,
      minutes: 0,
      source: resolve(path),
      warnings: [`github json parse error: ${error.message}`],
    };
  }
  const minutes = Number.parseFloat(json.minutes ?? json.total_minutes ?? 0);
  const usd = Number.parseFloat(json.cost_usd ?? json.usd ?? (minutes * USD_PER_GITHUB_MINUTE));
  return {
    usd: Number((usd || 0).toFixed(2)),
    minutes: Number.isFinite(minutes) ? Math.round(minutes) : 0,
    source: resolve(path),
    warnings: [],
  };
}

async function collectCosts(options) {
  const now = options.now ?? new Date();
  const period = monthBounds(now);

  if (options.sample) {
    const sampleAnthropic = options.sampleAnthropic ?? 42.5;
    const sampleFirebase = options.sampleFirebase ?? 9.75;
    const sampleGithubMinutes = options.sampleGithubMinutes ?? 120;
    const sampleGithubUsd = sampleGithubMinutes * USD_PER_GITHUB_MINUTE;
    const total = sampleAnthropic + sampleFirebase + sampleGithubUsd;
    return {
      period: {
        start: period.start.toISOString(),
        end: period.end.toISOString(),
      },
      warnings: [],
      costs: {
        anthropic: { usd: Number(sampleAnthropic.toFixed(2)), source: 'sample' },
        firebase: { usd: Number(sampleFirebase.toFixed(2)), source: 'sample' },
        github: {
          usd: Number(sampleGithubUsd.toFixed(2)),
          minutes: sampleGithubMinutes,
          source: 'sample',
        },
        total_usd: Number(total.toFixed(2)),
      },
    };
  }

  const warnings = [];
  const anthropic = await parseAnthropicCsv(options.anthropicCsv, period);
  warnings.push(...anthropic.warnings);

  const firebase = await parseFirebaseJson(options.firebaseJson, period);
  warnings.push(...firebase.warnings);

  const github = await parseGithubJson(options.githubJson, period);
  warnings.push(...github.warnings);

  const total = anthropic.usd + firebase.usd + (github.usd ?? 0);

  return {
    period: {
      start: period.start.toISOString(),
      end: period.end.toISOString(),
    },
    warnings,
    costs: {
      anthropic: { usd: anthropic.usd, source: anthropic.source },
      firebase: { usd: firebase.usd, source: firebase.source },
      github: {
        usd: github.usd,
        minutes: github.minutes,
        source: github.source,
      },
      total_usd: Number(total.toFixed(2)),
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const options = {
    anthropicCsv: args['anthropic-csv'] || process.env.ANTHROPIC_BILLING_CSV_PATH,
    firebaseJson: args['firebase-json'] || process.env.FIREBASE_BILLING_JSON_PATH,
    githubJson: args['github-json'] || process.env.GITHUB_ACTIONS_BILLING_JSON_PATH,
    sample: Boolean(args.sample || process.env.FORCE_SAMPLE_COSTS === 'true'),
  };

  const result = await collectCosts(options);
  console.log(JSON.stringify({ status: 'ok', ...result }));
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error(JSON.stringify({ status: 'error', message: error.message }));
    process.exit(1);
  });
}

export {
  collectCosts,
  monthBounds,
  parseAnthropicCsv,
  parseFirebaseJson,
  parseGithubJson,
};
