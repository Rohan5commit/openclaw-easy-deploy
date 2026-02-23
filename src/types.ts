export type DeploymentPlatform = 'render' | 'digitalocean' | 'vps' | 'local';
export type LlmProvider = 'openai' | 'anthropic' | 'gemini';

export interface GeneratedConfig {
  envPath: string;
  composePath: string;
  renderPath?: string;
  envPreview: string;
}

export interface DeploymentResult {
  ok: boolean;
  platform: DeploymentPlatform;
  message: string;
  url?: string;
  raw?: unknown;
}

export interface WizardState {
  outputDir: string;
  platform?: DeploymentPlatform;
  provider?: LlmProvider;
  apiKey?: string;
  setupPassword?: string;
  appPort?: number;
  generatedConfig?: GeneratedConfig;
  deployment?: DeploymentResult;
}
