import { z } from 'zod';
import { checkDocker } from './tools/check-docker.js';
import { checkNode } from './tools/check-node.js';
import { deployDigitalOcean } from './tools/deploy-do.js';
import { deployRender } from './tools/deploy-render.js';
import { deployVps } from './tools/deploy-vps.js';
import { genConfig } from './tools/gen-config.js';
import { validateKey } from './tools/validate-key.js';

const PLATFORM_METADATA = {
  render: {
    pricing: 'Free tier available, paid plans for production workloads.',
    limits: 'Blueprint/API quotas apply per account.',
    docs: 'https://render.com/docs',
  },
  digitalocean: {
    pricing: 'Starts around $6/month for basic Droplets.',
    limits: 'Droplet quotas vary by account region and history.',
    docs: 'https://docs.digitalocean.com/products/droplets/',
  },
  vps: {
    pricing: 'Depends on provider (Hetzner, Vultr, AWS, etc.).',
    limits: 'No platform abstraction, full infra responsibility.',
    docs: 'https://www.digitalocean.com/community/tutorials/how-to-run-openclaw',
  },
  local: {
    pricing: 'No cloud cost; local machine resources only.',
    limits: 'Requires always-on local host and open ports.',
    docs: 'https://docs.docker.com/engine/install/',
  },
} as const;

function textResponse(payload: unknown): { content: Array<{ type: string; text: string }> } {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export async function startMcpServer(): Promise<void> {
  const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');

  const server: any = new McpServer({
    name: 'openclaw-easy-deploy',
    version: '0.1.0',
  });

  server.tool(
    'check-node',
    'Verify local Node.js runtime version.',
    {
      minimumMajor: z.number().int().min(1).optional(),
    },
    async (input: { minimumMajor?: number }) => {
      const result = await checkNode({ minimumMajor: input.minimumMajor ?? 22 });
      return textResponse(result);
    },
  );

  server.tool('check-docker', 'Check Docker installation and runtime.', async () => {
    const result = await checkDocker();
    return textResponse(result);
  });

  server.tool(
    'validate-key',
    'Validate LLM provider API key by making a minimal provider request.',
    {
      provider: z.enum(['openai', 'anthropic', 'gemini']),
      apiKey: z.string().min(10),
      timeoutMs: z.number().int().positive().max(30000).optional(),
    },
    async (input: { provider: 'openai' | 'anthropic' | 'gemini'; apiKey: string; timeoutMs?: number }) => {
      const result = await validateKey(input);
      return textResponse(result);
    },
  );

  server.tool(
    'gen-config',
    'Generate .env and docker-compose.yml from templates.',
    {
      outputDir: z.string().optional(),
      platform: z.enum(['render', 'digitalocean', 'vps', 'local']),
      provider: z.enum(['openai', 'anthropic', 'gemini']),
      apiKey: z.string().min(10),
      setupPassword: z.string().min(8),
      appPort: z.number().int().min(1).max(65535).optional(),
      openclawImage: z.string().optional(),
      serviceName: z.string().optional(),
    },
    async (input: {
      outputDir?: string;
      platform: 'render' | 'digitalocean' | 'vps' | 'local';
      provider: 'openai' | 'anthropic' | 'gemini';
      apiKey: string;
      setupPassword: string;
      appPort?: number;
      openclawImage?: string;
      serviceName?: string;
    }) => {
      const result = await genConfig(input);
      return textResponse(result);
    },
  );

  server.tool(
    'deploy-render',
    'Deploy OpenClaw through Render API using render.yaml blueprint.',
    {
      apiToken: z.string().min(10),
      renderYamlPath: z.string().min(1),
      dryRun: z.boolean().optional(),
    },
    async (input: { apiToken: string; renderYamlPath: string; dryRun?: boolean }) => {
      const result = await deployRender(input);
      return textResponse(result);
    },
  );

  server.tool(
    'deploy-do',
    'Create a DigitalOcean Droplet for OpenClaw.',
    {
      apiToken: z.string().min(10),
      dropletName: z.string().min(1),
      region: z.string().optional(),
      size: z.string().optional(),
      image: z.string().optional(),
      sshKeys: z.array(z.union([z.string(), z.number()])).optional(),
      userData: z.string().optional(),
    },
    async (input: {
      apiToken: string;
      dropletName: string;
      region?: string;
      size?: string;
      image?: string;
      sshKeys?: Array<string | number>;
      userData?: string;
    }) => {
      const result = await deployDigitalOcean(input);
      return textResponse(result);
    },
  );

  server.tool(
    'deploy-vps',
    'Deploy OpenClaw to a custom VPS over SSH.',
    {
      host: z.string().min(1),
      port: z.number().int().min(1).max(65535).optional(),
      username: z.string().min(1),
      password: z.string().optional(),
      privateKeyPath: z.string().optional(),
      setupScript: z.string().optional(),
      appPort: z.number().int().min(1).max(65535).optional(),
    },
    async (input: {
      host: string;
      port?: number;
      username: string;
      password?: string;
      privateKeyPath?: string;
      setupScript?: string;
      appPort?: number;
    }) => {
      const result = await deployVps(input);
      return textResponse(result);
    },
  );

  if (typeof server.resource === 'function') {
    server.resource('platform-metadata', 'openclaw://platforms', async () => {
      return {
        contents: [
          {
            uri: 'openclaw://platforms',
            mimeType: 'application/json',
            text: JSON.stringify(PLATFORM_METADATA, null, 2),
          },
        ],
      };
    });
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
