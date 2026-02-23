import inquirer from 'inquirer';
import type { DeploymentPlatform, WizardState } from '../../types.js';
import { logger } from '../../utils/logger.js';

export async function platformStep(state: WizardState): Promise<WizardState> {
  logger.step('Step 2/6: Choose deployment target');

  const answers = await inquirer.prompt<{ platform: DeploymentPlatform }>([
    {
      type: 'list',
      name: 'platform',
      message: 'Where do you want to deploy OpenClaw?',
      choices: [
        { name: 'Render', value: 'render' },
        { name: 'DigitalOcean', value: 'digitalocean' },
        { name: 'Custom VPS (SSH)', value: 'vps' },
        { name: 'Local (Docker on this machine)', value: 'local' },
      ],
    },
  ]);

  logger.success(`Selected platform: ${answers.platform}`);
  return {
    ...state,
    platform: answers.platform,
  };
}
