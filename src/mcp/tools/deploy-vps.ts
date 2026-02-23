import { readFile } from 'node:fs/promises';
import { Client } from 'ssh2';
import { z } from 'zod';
import type { DeploymentResult } from '../../types.js';

const inputSchema = z
  .object({
    host: z.string().min(1),
    port: z.number().int().min(1).max(65535).default(22),
    username: z.string().min(1),
    password: z.string().optional(),
    privateKeyPath: z.string().optional(),
    setupScript: z
      .string()
      .default(
        [
          'set -euo pipefail',
          'if ! command -v docker >/dev/null 2>&1; then echo "Docker is required"; exit 1; fi',
          'docker compose pull',
          'docker compose up -d',
        ].join('\n'),
      ),
    appPort: z.number().int().min(1).max(65535).default(3000),
  })
  .superRefine((value, ctx) => {
    if (!value.password && !value.privateKeyPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Either password or privateKeyPath is required for SSH auth.',
      });
    }
  });

interface SshExecutionResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

function execCommand(client: Client, command: string): Promise<SshExecutionResult> {
  return new Promise((resolve, reject) => {
    client.exec(command, (error, stream) => {
      if (error) {
        reject(error);
        return;
      }

      let stdout = '';
      let stderr = '';

      stream
        .on('close', (code: number | null) => {
          resolve({ stdout, stderr, code });
        })
        .on('data', (chunk: Buffer) => {
          stdout += chunk.toString();
        });

      stream.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
    });
  });
}

export async function deployVps(input: unknown): Promise<DeploymentResult> {
  const parsed = inputSchema.parse(input);
  const privateKey = parsed.privateKeyPath ? await readFile(parsed.privateKeyPath, 'utf8') : undefined;

  return await new Promise<DeploymentResult>((resolve) => {
    const client = new Client();

    client
      .on('ready', async () => {
        try {
          const result = await execCommand(client, parsed.setupScript);
          client.end();

          if (result.code !== 0) {
            resolve({
              ok: false,
              platform: 'vps',
              message: 'VPS deployment script failed.',
              raw: result,
            });
            return;
          }

          resolve({
            ok: true,
            platform: 'vps',
            message: 'VPS deployment script completed successfully.',
            url: `http://${parsed.host}:${parsed.appPort}`,
            raw: result,
          });
        } catch (error) {
          client.end();
          resolve({
            ok: false,
            platform: 'vps',
            message: `SSH command execution failed: ${(error as Error).message}`,
          });
        }
      })
      .on('error', (error) => {
        resolve({
          ok: false,
          platform: 'vps',
          message: `SSH connection failed: ${error.message}`,
        });
      })
      .connect({
        host: parsed.host,
        port: parsed.port,
        username: parsed.username,
        password: parsed.password,
        privateKey,
        readyTimeout: 20000,
      });
  });
}
