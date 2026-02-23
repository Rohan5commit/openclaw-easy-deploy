import { randomBytes } from 'node:crypto';
import inquirer from 'inquirer';
import type { WizardState } from '../../types.js';
import { genConfig } from '../../mcp/tools/gen-config.js';
import { logger, spinner } from '../../utils/logger.js';

function defaultPassword(): string {
  return randomBytes(12).toString('base64url');
}

function isValidPort(input: string | number): boolean {
  const parsed = typeof input === 'number' ? input : Number.parseInt(input, 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535;
}

export async function configStep(state: WizardState): Promise<WizardState> {
  logger.step('Step 4/6: Generate configuration files');

  if (!state.platform || !state.provider || !state.apiKey) {
    throw new Error('Platform/provider/apiKey must be set before generating config.');
  }

  const answers = await inquirer.prompt<{ setupPassword: string; appPort: number; serviceName: string }>([
    {
      type: 'password',
      name: 'setupPassword',
      message: 'Set an OpenClaw setup/admin password:',
      default: defaultPassword,
      mask: '*',
      validate(input: string): boolean | string {
        return input.length >= 8 || 'Use at least 8 characters.';
      },
    },
    {
      type: 'input',
      name: 'appPort',
      message: 'Public port for OpenClaw:',
      default: '3000',
      validate(input: string): boolean | string {
        return isValidPort(input) ? true : 'Enter a valid port between 1 and 65535.';
      },
      filter(input: string): number {
        return Number.parseInt(input, 10);
      },
    },
    {
      type: 'input',
      name: 'serviceName',
      message: 'Service name for cloud deploy templates:',
      default: 'openclaw-easy',
      validate(input: string): boolean | string {
        return input.trim().length > 0 || 'Service name is required.';
      },
    },
  ]);

  const configSpinner = spinner('Generating .env and deployment templates...').start();
  const generated = await genConfig({
    outputDir: state.outputDir,
    platform: state.platform,
    provider: state.provider,
    apiKey: state.apiKey,
    setupPassword: answers.setupPassword,
    appPort: answers.appPort,
    serviceName: answers.serviceName,
  });
  configSpinner.succeed('Configuration files generated.');

  logger.info('\nGenerated .env preview:');
  logger.info(generated.envPreview);

  return {
    ...state,
    setupPassword: answers.setupPassword,
    appPort: answers.appPort,
    generatedConfig: generated,
  };
}
