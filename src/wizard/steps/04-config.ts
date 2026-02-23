import { randomBytes } from 'node:crypto';
import inquirer from 'inquirer';
import type { WizardState } from '../../types.js';
import { genConfig } from '../../mcp/tools/gen-config.js';
import { logger, spinner } from '../../utils/logger.js';

function defaultPassword(): string {
  return randomBytes(12).toString('base64url');
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
      filter(input: string): number {
        return Number.parseInt(input, 10);
      },
      validate(input: number): boolean | string {
        return Number.isInteger(input) && input >= 1 && input <= 65535
          ? true
          : 'Enter a valid port between 1 and 65535.';
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
