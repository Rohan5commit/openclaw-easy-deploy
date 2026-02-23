import type { WizardState } from '../../types.js';
import { logger, spinner } from '../../utils/logger.js';

interface ProbeResult {
  ok: boolean;
  status?: number;
  error?: string;
}

async function probeUrl(url: string): Promise<ProbeResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(7000),
    });

    return {
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message,
    };
  }
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function verifyUrl(url: string, attempts = 8, delayMs = 4000): Promise<ProbeResult> {
  let last: ProbeResult = { ok: false, error: 'No response yet.' };

  for (let index = 0; index < attempts; index += 1) {
    last = await probeUrl(url);
    if (last.ok) {
      return last;
    }

    if (index < attempts - 1) {
      await wait(delayMs);
    }
  }

  return last;
}

export async function verifyStep(state: WizardState): Promise<WizardState> {
  logger.step('Step 6/6: Verify deployment');

  if (!state.deployment) {
    logger.warn('No deployment result was captured. Skipping verification.');
    return state;
  }

  if (!state.deployment.ok) {
    logger.warn('Deployment did not succeed; skipping URL verification.');
    return state;
  }

  if (!state.deployment.url) {
    logger.warn('No URL was returned by deploy step. Verify manually in provider dashboard.');
    return state;
  }

  const verifySpinner = spinner(`Checking ${state.deployment.url} ...`).start();
  const result = await verifyUrl(state.deployment.url);

  if (result.ok) {
    verifySpinner.succeed(`OpenClaw is live at ${state.deployment.url}`);
  } else {
    verifySpinner.warn(
      `URL probe did not succeed (${result.status ?? 'no status'}). You may need to wait longer.`,
    );
  }

  return state;
}
