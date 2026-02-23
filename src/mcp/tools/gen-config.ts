import { resolve } from 'node:path';
import { z } from 'zod';
import type { DeploymentPlatform, GeneratedConfig, LlmProvider } from '../../types.js';
import { maskSecret, renderTemplate, writeTextFile } from '../../utils/config-writer.js';

const inputSchema = z.object({
  outputDir: z.string().min(1).default(process.cwd()),
  platform: z.enum(['render', 'digitalocean', 'vps', 'local']),
  provider: z.enum(['openai', 'anthropic', 'gemini']),
  apiKey: z.string().min(10),
  setupPassword: z.string().min(8),
  appPort: z.coerce.number().int().min(1).max(65535).default(3000),
  openclawImage: z.string().min(1).default('openclaw/openclaw:latest'),
  serviceName: z.string().min(1).default('openclaw-easy'),
});

interface TemplateContext {
  appPort: number;
  setupPassword: string;
  provider: LlmProvider;
  openclawImage: string;
  serviceName: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  geminiApiKey: string;
}

function toTemplateContext(
  provider: LlmProvider,
  apiKey: string,
  setupPassword: string,
  appPort: number,
  openclawImage: string,
  serviceName: string,
): TemplateContext {
  return {
    appPort,
    setupPassword,
    provider,
    openclawImage,
    serviceName,
    openaiApiKey: provider === 'openai' ? apiKey : '',
    anthropicApiKey: provider === 'anthropic' ? apiKey : '',
    geminiApiKey: provider === 'gemini' ? apiKey : '',
  };
}

export async function genConfig(input: unknown): Promise<GeneratedConfig> {
  const parsed = inputSchema.parse(input);
  const context = toTemplateContext(
    parsed.provider,
    parsed.apiKey,
    parsed.setupPassword,
    parsed.appPort,
    parsed.openclawImage,
    parsed.serviceName,
  );

  const envPath = resolve(parsed.outputDir, '.env');
  const composePath = resolve(parsed.outputDir, 'docker-compose.yml');
  const renderPath = resolve(parsed.outputDir, 'render.yaml');

  const envBody = await renderTemplate('.env.template', context);
  const composeBody = await renderTemplate('docker-compose.yml.hbs', context);

  await writeTextFile(envPath, envBody);
  await writeTextFile(composePath, composeBody);

  let writtenRenderPath: string | undefined;
  if (parsed.platform === 'render') {
    const renderBody = await renderTemplate('render.yaml.hbs', context);
    await writeTextFile(renderPath, renderBody);
    writtenRenderPath = renderPath;
  }

  const envPreview = [
    `SETUP_PASSWORD=${maskSecret(parsed.setupPassword)}`,
    `OPENCLAW_PORT=${parsed.appPort}`,
    `OPENCLAW_LLM_PROVIDER=${parsed.provider}`,
    parsed.provider === 'openai'
      ? `OPENAI_API_KEY=${maskSecret(parsed.apiKey)}`
      : 'OPENAI_API_KEY=(not set)',
    parsed.provider === 'anthropic'
      ? `ANTHROPIC_API_KEY=${maskSecret(parsed.apiKey)}`
      : 'ANTHROPIC_API_KEY=(not set)',
    parsed.provider === 'gemini'
      ? `GEMINI_API_KEY=${maskSecret(parsed.apiKey)}`
      : 'GEMINI_API_KEY=(not set)',
  ].join('\n');

  return {
    envPath,
    composePath,
    renderPath: writtenRenderPath,
    envPreview,
  };
}

export function supportsRenderBlueprint(platform: DeploymentPlatform): boolean {
  return platform === 'render';
}
