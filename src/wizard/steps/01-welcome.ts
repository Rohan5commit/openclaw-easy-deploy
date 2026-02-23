import inquirer from 'inquirer';
import type { WizardState } from '../../types.js';
import { logger } from '../../utils/logger.js';
import { runPrereqChecks } from '../../utils/system-check.js';

export async function welcomeStep(state: WizardState): Promise<WizardState> {
  logger.step('Step 1/6: Environment checks');
  logger.info('Checking Node.js and Docker prerequisites...');

  const checks = await runPrereqChecks(22);

  if (checks.node.ok) {
    logger.success(`Node.js check passed (${checks.node.foundVersion}).`);
  } else {
    logger.error(
      `Node.js check failed. Found ${checks.node.foundVersion}, need >= ${checks.node.minimumMajor}.`,
    );
    if (checks.node.guidance) {
      logger.warn(checks.node.guidance);
    }
  }

  if (checks.docker.ok) {
    logger.success('Docker check passed.');
  } else {
    logger.error('Docker check failed.');
    if (checks.docker.guidance) {
      logger.warn(checks.docker.guidance);
    }
  }

  if (!checks.node.ok || !checks.docker.ok) {
    const answer = await inquirer.prompt<{ continueAnyway: boolean }>([
      {
        type: 'confirm',
        name: 'continueAnyway',
        default: false,
        message: 'One or more prerequisites failed. Continue anyway?',
      },
    ]);

    if (!answer.continueAnyway) {
      throw new Error('Deployment aborted due to failed prerequisite checks.');
    }
  }

  return state;
}
