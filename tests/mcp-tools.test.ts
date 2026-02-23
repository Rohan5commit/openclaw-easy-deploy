import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseNodeMajor } from '../src/mcp/tools/check-node.js';
import { genConfig } from '../src/mcp/tools/gen-config.js';

describe('mcp tools', () => {
  it('parses Node major versions', () => {
    expect(parseNodeMajor('v22.5.1')).toBe(22);
    expect(parseNodeMajor('20.12.0')).toBe(20);
  });

  it('generates .env and docker-compose files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'openclaw-easy-'));

    const generated = await genConfig({
      outputDir: dir,
      platform: 'local',
      provider: 'openai',
      apiKey: 'sk-test-1234567890',
      setupPassword: 'supersecretpassword',
      appPort: 3000,
      serviceName: 'openclaw-test',
    });

    const env = await readFile(generated.envPath, 'utf8');
    const compose = await readFile(generated.composePath, 'utf8');

    expect(env).toContain('OPENCLAW_LLM_PROVIDER=openai');
    expect(compose).toContain('openclaw');
    expect(generated.envPreview).toContain('OPENAI_API_KEY=');
  });
});
