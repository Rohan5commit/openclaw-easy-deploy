import inquirer from 'inquirer';
import type { LlmProvider, WizardState } from '../../types.js';
import { logger, spinner } from '../../utils/logger.js';
import { validateKey } from '../../mcp/tools/validate-key.js';

export async function llmStep(state: WizardState): Promise<WizardState> {
  logger.step('Step 3/6: Configure LLM provider');

  const providerAnswer = await inquirer.prompt<{ provider: LlmProvider }>([
    {
      type: 'list',
      name: 'provider',
      message: 'Select your LLM provider:',
      choices: [
        { name: 'OpenAI', value: 'openai' },
        { name: 'Anthropic', value: 'anthropic' },
        { name: 'Gemini', value: 'gemini' },
      ],
    },
  ]);

  while (true) {
    const keyAnswer = await inquirer.prompt<{ apiKey: string }>([
      {
        type: 'password',
        name: 'apiKey',
        message: `Enter your ${providerAnswer.provider} API key:`,
        mask: '*',
        validate(input: string): boolean | string {
          return input.trim().length >= 10 || 'API key looks too short.';
        },
      },
    ]);

    const keySpinner = spinner('Validating API key...').start();
    const result = await validateKey({
      provider: providerAnswer.provider,
      apiKey: keyAnswer.apiKey.trim(),
      timeoutMs: 10000,
    });

    if (result.ok) {
      keySpinner.succeed(result.message);
      return {
        ...state,
        provider: providerAnswer.provider,
        apiKey: keyAnswer.apiKey.trim(),
      };
    }

    keySpinner.fail(result.message);

    const retryAnswer = await inquirer.prompt<{ retry: boolean }>([
      {
        type: 'confirm',
        name: 'retry',
        message: 'API key validation failed. Try again?',
        default: true,
      },
    ]);

    if (!retryAnswer.retry) {
      logger.warn('Continuing with unverified API key.');
      return {
        ...state,
        provider: providerAnswer.provider,
        apiKey: keyAnswer.apiKey.trim(),
      };
    }
  }
}
