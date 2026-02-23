import { platformStep } from './steps/02-platform.js';
import { llmStep } from './steps/03-llm.js';
import { configStep } from './steps/04-config.js';
import { deployStep } from './steps/05-deploy.js';
import { verifyStep } from './steps/06-verify.js';
import { welcomeStep } from './steps/01-welcome.js';
import type { WizardState } from '../types.js';
import { logger } from '../utils/logger.js';

export type WizardStepFn = (state: WizardState) => Promise<WizardState>;

export interface RunWizardOptions {
  steps?: WizardStepFn[];
  initialState?: Partial<WizardState>;
}

export function createDefaultSteps(): WizardStepFn[] {
  return [welcomeStep, platformStep, llmStep, configStep, deployStep, verifyStep];
}

export async function runWizard(options: RunWizardOptions = {}): Promise<WizardState> {
  const steps = options.steps ?? createDefaultSteps();
  let state: WizardState = {
    outputDir: process.cwd(),
    ...options.initialState,
  };

  for (const step of steps) {
    state = await step(state);
  }

  logger.success('\nOpenClaw easy deploy wizard completed.');
  return state;
}
