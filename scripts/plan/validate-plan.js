#!/usr/bin/env node
/**
 * Plan JSON validator
 * Basic schema checks to ensure Plan files satisfy expected structure.
 *
 * Usage:
 *   node scripts/plan/validate-plan.js orchestration/plan/current_plan.json [additional files...]
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

export function validateStep(step, index) {
  const path = `steps[${index}]`;
  if (typeof step !== 'object' || Array.isArray(step) || step === null) {
    return `${path} must be an object`;
  }
  const requiredString = ['id', 'action', 'connector', 'idempotency_key'];
  for (const key of requiredString) {
    if (typeof step[key] !== 'string' || !step[key].trim()) {
      return `${path}.${key} must be a non-empty string`;
    }
  }
  if (typeof step.payload !== 'object' || step.payload === null) {
    return `${path}.payload must be an object`;
  }
  if (step.on_error && !['abort', 'compensate', 'manual_recovery'].includes(step.on_error)) {
    return `${path}.on_error must be one of abort|compensate|manual_recovery when provided`;
  }
  return null;
}

export function validatePlan(plan, filename) {
  if (typeof plan !== 'object' || plan === null) {
    return fail(`${filename}: root must be an object`);
  }

  if (typeof plan.id !== 'string' || !plan.id.trim()) {
    fail(`${filename}: id must be a non-empty string`);
  }

  if (typeof plan.version !== 'string' || !plan.version.trim()) {
    fail(`${filename}: version must be a non-empty string`);
  }

  if (typeof plan.title !== 'string' || !plan.title.trim()) {
    fail(`${filename}: title must be a non-empty string`);
  }

  if (typeof plan.metadata !== 'object' || plan.metadata === null) {
    fail(`${filename}: metadata must be an object`);
  } else {
    if (typeof plan.metadata.description !== 'string' || !plan.metadata.description.trim()) {
      fail(`${filename}: metadata.description must be a non-empty string`);
    }
  }

  if (!Array.isArray(plan.steps) || plan.steps.length === 0) {
    fail(`${filename}: steps must be a non-empty array`);
  } else {
    plan.steps.forEach((step, idx) => {
      const error = validateStep(step, idx);
      if (error) fail(`${filename}: ${error}`);
    });
  }

  if (plan.risk) {
    if (typeof plan.risk.level !== 'string' || !plan.risk.level.trim()) {
      fail(`${filename}: risk.level must be a non-empty string`);
    }
    if (!Array.isArray(plan.risk.reasons) || plan.risk.reasons.length === 0) {
      fail(`${filename}: risk.reasons must be a non-empty array`);
    }
  } else {
    fail(`${filename}: risk section is required`);
  }

  if (plan.observability) {
    if (typeof plan.observability !== 'object' || plan.observability === null) {
      fail(`${filename}: observability must be an object`);
    }
    if (!Array.isArray(plan.observability.success_metrics) || plan.observability.success_metrics.length === 0) {
      fail(`${filename}: observability.success_metrics must be a non-empty array`);
    }
    if (!Array.isArray(plan.observability.logs) || plan.observability.logs.length === 0) {
      fail(`${filename}: observability.logs must be a non-empty array`);
    }
  }

  if (plan.manual_playbook && !Array.isArray(plan.manual_playbook)) {
    fail(`${filename}: manual_playbook must be an array when provided`);
  }

  return true;
}

function runCli(files) {
  files.forEach((file) => {
    try {
      const contents = readFileSync(file, 'utf-8');
      const json = JSON.parse(contents);
      validatePlan(json, file);
    } catch (error) {
      fail(`${file}: ${error.message}`);
    }
  });

  if (process.exitCode) {
    process.exit(process.exitCode);
  } else {
    console.log('✅ Plan validation passed');
  }
}

const isCliExecution = process.argv[1] === fileURLToPath(import.meta.url);
if (isCliExecution) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    files.push('orchestration/plan/current_plan.json');
  }
  runCli(files);
}
