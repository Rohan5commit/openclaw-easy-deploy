import { describe, expect, it } from 'vitest';
import { runWizard, type WizardStepFn } from '../src/wizard/index.js';

describe('wizard orchestrator', () => {
  it('runs steps in order and carries state forward', async () => {
    const visited: string[] = [];

    const stepA: WizardStepFn = async (state) => {
      visited.push('a');
      return { ...state, platform: 'local' };
    };

    const stepB: WizardStepFn = async (state) => {
      visited.push('b');
      return { ...state, provider: 'openai' };
    };

    const result = await runWizard({
      steps: [stepA, stepB],
      initialState: { outputDir: '/tmp/openclaw-test' },
    });

    expect(visited).toEqual(['a', 'b']);
    expect(result.platform).toBe('local');
    expect(result.provider).toBe('openai');
    expect(result.outputDir).toBe('/tmp/openclaw-test');
  });
});
