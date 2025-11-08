#!/usr/bin/env node
/**
 * Manus API MCP Server
 * Manus APIを呼び出すためのMCPサーバー
 * JSON設定ファイルから設定を読み込む
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');

// JSON設定ファイルから設定を読み込む
function loadConfig() {
  const configPath = path.join(__dirname, '../.cursor/manus-config.json');
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    return config.manus_api || {};
  } catch (error) {
    console.error('Failed to load config:', error.message);
    return {};
  }
}

// 環境変数を設定
const config = loadConfig();
if (config.api_key) {
  process.env.MANUS_API_KEY = config.api_key;
}
if (config.base_url) {
  process.env.MANUS_BASE_URL = config.base_url;
}
if (config.progress_webhook_url) {
  process.env.PROGRESS_WEBHOOK_URL = config.progress_webhook_url;
}

const { createManusTask, getManusTask } = require('../scripts/lib/manus-api.js');

class ManusAPIServer {
  constructor() {
    this.server = new Server(
      {
        name: 'manus-api-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'manus_create_task',
          description: 'Create a new Manus task with brief and plan JSON',
          inputSchema: {
            type: 'object',
            properties: {
              briefFile: {
                type: 'string',
                description: 'Path to the brief file',
              },
              planFile: {
                type: 'string',
                description: 'Path to the plan JSON file',
              },
            },
            required: ['briefFile', 'planFile'],
          },
        },
        {
          name: 'manus_get_task',
          description: 'Get task information by task ID',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'Task ID',
              },
            },
            required: ['taskId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'manus_create_task': {
            const fs = require('fs');
            const brief = fs.readFileSync(args.briefFile, 'utf8');
            const plan = JSON.parse(fs.readFileSync(args.planFile, 'utf8'));
            
            const result = await createManusTask({
              brief,
              plan,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'manus_get_task': {
            const result = await getManusTask(args.taskId);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new ManusAPIServer();
server.run().catch(console.error);

