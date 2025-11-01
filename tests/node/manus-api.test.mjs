import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { createManusTask, getManusTask } = await import(join(__dirname, '../../scripts/lib/manus-api.js'));

function saveEnv() {
  return {
    MANUS_API_KEY: process.env.MANUS_API_KEY,
    MANUS_DRY_RUN: process.env.MANUS_DRY_RUN,
    MANUS_BASE_URL: process.env.MANUS_BASE_URL,
    PROGRESS_WEBHOOK_URL: process.env.PROGRESS_WEBHOOK_URL
  };
}

function restoreEnv(originalEnv) {
  if (originalEnv.MANUS_API_KEY) {
    process.env.MANUS_API_KEY = originalEnv.MANUS_API_KEY;
  } else {
    delete process.env.MANUS_API_KEY;
  }
  if (originalEnv.MANUS_DRY_RUN) {
    process.env.MANUS_DRY_RUN = originalEnv.MANUS_DRY_RUN;
  } else {
    delete process.env.MANUS_DRY_RUN;
  }
  if (originalEnv.MANUS_BASE_URL) {
    process.env.MANUS_BASE_URL = originalEnv.MANUS_BASE_URL;
  } else {
    delete process.env.MANUS_BASE_URL;
  }
  if (originalEnv.PROGRESS_WEBHOOK_URL) {
    process.env.PROGRESS_WEBHOOK_URL = originalEnv.PROGRESS_WEBHOOK_URL;
  } else {
    delete process.env.PROGRESS_WEBHOOK_URL;
  }
}

test('createManusTask returns payload in dry-run mode with metadata and idempotency', async () => {
  const originalEnv = saveEnv();
  try {
    delete process.env.MANUS_API_KEY;
    process.env.MANUS_DRY_RUN = 'true';
    process.env.PROGRESS_WEBHOOK_URL = 'https://hooks.example.com/progress';

    const plan = { title: 'Test Plan', steps: [{ id: 's1', action: 'noop', connector: 'noop', payload: {} }] };
    const result = await createManusTask({
      brief: 'Test Brief',
      plan,
      webhookUrl: 'https://hooks.override.example.com',
      metadata: {
        idempotency_key: 'retry-123',
        retry: { attempt: 2 }
      }
    });

    assert.equal(result.dryRun, true);
    assert.ok(result.payload.prompt.includes('Test Brief'));
    assert.deepEqual(result.payload.plan, plan);
    assert.equal(result.payload.webhook_url, 'https://hooks.override.example.com');
    assert.equal(result.payload.idempotency_key, 'retry-123');
    assert.deepEqual(result.payload.metadata.retry, { attempt: 2 });
  } finally {
    restoreEnv(originalEnv);
  }
});

test('createManusTask makes HTTP request when dry-run is false', async () => {
  const originalEnv = saveEnv();
  const originalRequest = https.request;
  
  try {
    process.env.MANUS_API_KEY = 'test-api-key';
    delete process.env.MANUS_DRY_RUN;

    let capturedOptions = null;
    let capturedPostData = null;
    let resolveCallback = null;
    let rejectCallback = null;

    // https.requestをモック
    https.request = (options, callback) => {
      capturedOptions = options;
      const mockReq = {
        write: (data) => {
          capturedPostData = data;
        },
        end: () => {
          // 成功レスポンスをシミュレート
          const mockRes = {
            statusCode: 200,
            on: (event, handler) => {
              if (event === 'data') {
                handler(Buffer.from(JSON.stringify({ task_id: 'task-123', status: 'created' })));
              } else if (event === 'end') {
                handler();
              }
            }
          };
          callback(mockRes);
        },
        on: (event, handler) => {}
      };
      return mockReq;
    };

    const plan = { title: 'Test Plan', steps: [] };
    const result = await createManusTask({
      brief: 'Test Brief',
      plan,
      webhookUrl: 'https://hooks.test.com',
      dryRun: false
    });

    assert.equal(capturedOptions.method, 'POST');
    assert.equal(capturedOptions.headers['API_KEY'], 'test-api-key');
    assert.equal(capturedOptions.headers['Content-Type'], 'application/json');
    assert.equal(result.task_id, 'task-123');
    
    const payload = JSON.parse(capturedPostData);
    assert.ok(payload.prompt.includes('Test Brief'));
    assert.deepEqual(payload.plan, plan);
    assert.equal(payload.webhook_url, 'https://hooks.test.com');
  } finally {
    https.request = originalRequest;
    restoreEnv(originalEnv);
  }
});

test('createManusTask handles HTTP error responses', async () => {
  const originalEnv = saveEnv();
  const originalRequest = https.request;
  
  try {
    process.env.MANUS_API_KEY = 'test-api-key';
    delete process.env.MANUS_DRY_RUN;

    https.request = (options, callback) => {
      const mockReq = {
        write: () => {},
        end: () => {
          const mockRes = {
            statusCode: 400,
            on: (event, handler) => {
              if (event === 'data') {
                handler(Buffer.from('Bad Request'));
              } else if (event === 'end') {
                handler();
              }
            }
          };
          callback(mockRes);
        },
        on: () => {}
      };
      return mockReq;
    };

    const plan = { title: 'Test Plan', steps: [] };
    await assert.rejects(
      () => createManusTask({
        brief: 'Test Brief',
        plan,
        dryRun: false
      }),
      {
        message: /Manus API error: 400/
      }
    );
  } finally {
    https.request = originalRequest;
    restoreEnv(originalEnv);
  }
});

test('createManusTask handles network errors', async () => {
  const originalEnv = saveEnv();
  const originalRequest = https.request;
  
  try {
    process.env.MANUS_API_KEY = 'test-api-key';
    delete process.env.MANUS_DRY_RUN;

    https.request = () => {
      const mockReq = {
        write: () => {},
        end: () => {},
        on: (event, handler) => {
          if (event === 'error') {
            handler(new Error('Network error'));
          }
        }
      };
      return mockReq;
    };

    const plan = { title: 'Test Plan', steps: [] };
    await assert.rejects(
      () => createManusTask({
        brief: 'Test Brief',
        plan,
        dryRun: false
      }),
      {
        message: /Network error/
      }
    );
  } finally {
    https.request = originalRequest;
    restoreEnv(originalEnv);
  }
});

test('createManusTask throws error when API key is missing in non-dry-run mode', async () => {
  const originalEnv = saveEnv();
  try {
    delete process.env.MANUS_API_KEY;
    delete process.env.MANUS_DRY_RUN;

    const plan = { title: 'Test Plan', steps: [] };
    await assert.rejects(
      () => createManusTask({
        brief: 'Test Brief',
        plan,
        dryRun: false
      }),
      {
        message: /MANUS_API_KEY environment variable is required/
      }
    );
  } finally {
    restoreEnv(originalEnv);
  }
});

test('createManusTask validates plan parameter', async () => {
  const originalEnv = saveEnv();
  try {
    delete process.env.MANUS_API_KEY;
    process.env.MANUS_DRY_RUN = 'true';

    await assert.rejects(
      () => createManusTask({
        brief: 'Test Brief',
        plan: null
      }),
      {
        message: /plan must be provided as an object/
      }
    );

    await assert.rejects(
      () => createManusTask({
        brief: 'Test Brief',
        plan: 'not an object'
      }),
      {
        message: /plan must be provided as an object/
      }
    );
  } finally {
    restoreEnv(originalEnv);
  }
});

test('createManusTask uses default webhook URL from environment', async () => {
  const originalEnv = saveEnv();
  try {
    delete process.env.MANUS_API_KEY;
    process.env.MANUS_DRY_RUN = 'true';
    process.env.PROGRESS_WEBHOOK_URL = 'https://default-webhook.example.com';

    const plan = { title: 'Test Plan', steps: [] };
    const result = await createManusTask({
      brief: 'Test Brief',
      plan
    });

    assert.equal(result.payload.webhook_url, 'https://default-webhook.example.com');
  } finally {
    restoreEnv(originalEnv);
  }
});

test('getManusTask makes HTTP GET request', async () => {
  const originalEnv = saveEnv();
  const originalRequest = https.request;
  
  try {
    process.env.MANUS_API_KEY = 'test-api-key';

    let capturedOptions = null;

    https.request = (options, callback) => {
      capturedOptions = options;
      const mockReq = {
        end: () => {
          const mockRes = {
            statusCode: 200,
            on: (event, handler) => {
              if (event === 'data') {
                handler(Buffer.from(JSON.stringify({ task_id: 'task-456', status: 'running' })));
              } else if (event === 'end') {
                handler();
              }
            }
          };
          callback(mockRes);
        },
        on: () => {}
      };
      return mockReq;
    };

    const result = await getManusTask('task-456');

    assert.equal(capturedOptions.method, 'GET');
    assert.equal(capturedOptions.headers['API_KEY'], 'test-api-key');
    assert.equal(capturedOptions.path, '/v1/tasks/task-456');
    assert.equal(result.task_id, 'task-456');
    assert.equal(result.status, 'running');
  } finally {
    https.request = originalRequest;
    restoreEnv(originalEnv);
  }
});

test('getManusTask throws error when API key is missing', async () => {
  const originalEnv = saveEnv();
  try {
    delete process.env.MANUS_API_KEY;

    await assert.rejects(
      () => getManusTask('task-123'),
      {
        message: /MANUS_API_KEY environment variable is required/
      }
    );
  } finally {
    restoreEnv(originalEnv);
  }
});

test('getManusTask handles HTTP error responses', async () => {
  const originalEnv = saveEnv();
  const originalRequest = https.request;
  
  try {
    process.env.MANUS_API_KEY = 'test-api-key';

    https.request = (options, callback) => {
      const mockReq = {
        end: () => {
          const mockRes = {
            statusCode: 404,
            on: (event, handler) => {
              if (event === 'data') {
                handler(Buffer.from('Not Found'));
              } else if (event === 'end') {
                handler();
              }
            }
          };
          callback(mockRes);
        },
        on: () => {}
      };
      return mockReq;
    };

    await assert.rejects(
      () => getManusTask('task-123'),
      {
        message: /Manus API error: 404/
      }
    );
  } finally {
    https.request = originalRequest;
    restoreEnv(originalEnv);
  }
});

test('createManusTask respects custom MANUS_BASE_URL', async () => {
  const originalEnv = saveEnv();
  const originalRequest = https.request;
  
  try {
    process.env.MANUS_API_KEY = 'test-api-key';
    process.env.MANUS_BASE_URL = 'https://custom-api.example.com';
    delete process.env.MANUS_DRY_RUN;

    let capturedOptions = null;

    https.request = (options, callback) => {
      capturedOptions = options;
      const mockReq = {
        write: () => {},
        end: () => {
          const mockRes = {
            statusCode: 200,
            on: (event, handler) => {
              if (event === 'data') {
                handler(Buffer.from(JSON.stringify({ task_id: 'task-123' })));
              } else if (event === 'end') {
                handler();
              }
            }
          };
          callback(mockRes);
        },
        on: () => {}
      };
      return mockReq;
    };

    const plan = { title: 'Test Plan', steps: [] };
    await createManusTask({
      brief: 'Test Brief',
      plan,
      dryRun: false
    });

    assert.equal(capturedOptions.hostname, 'custom-api.example.com');
  } finally {
    https.request = originalRequest;
    restoreEnv(originalEnv);
  }
});
