import { z } from 'zod';

const inputSchema = z.object({
  minimumMajor: z.number().int().min(1).default(22),
});

export interface CheckNodeResult {
  ok: boolean;
  foundVersion: string;
  foundMajor: number;
  minimumMajor: number;
  guidance?: string;
}

export function parseNodeMajor(version: string): number {
  const clean = version.replace(/^v/, '');
  const [major] = clean.split('.');
  return Number.parseInt(major ?? '0', 10);
}

export async function checkNode(input: unknown = {}): Promise<CheckNodeResult> {
  const parsed = inputSchema.parse(input);
  const foundVersion = process.version;
  const foundMajor = parseNodeMajor(foundVersion);
  const ok = Number.isFinite(foundMajor) && foundMajor >= parsed.minimumMajor;

  if (ok) {
    return {
      ok,
      foundVersion,
      foundMajor,
      minimumMajor: parsed.minimumMajor,
    };
  }

  return {
    ok,
    foundVersion,
    foundMajor,
    minimumMajor: parsed.minimumMajor,
    guidance: `Node.js ${parsed.minimumMajor}+ is required. Install with nvm: nvm install ${parsed.minimumMajor} && nvm use ${parsed.minimumMajor}`,
  };
}
