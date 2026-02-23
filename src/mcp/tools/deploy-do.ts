import { z } from 'zod';
import type { DeploymentResult } from '../../types.js';

const inputSchema = z.object({
  apiToken: z.string().min(10),
  dropletName: z.string().min(1),
  region: z.string().min(1).default('nyc3'),
  size: z.string().min(1).default('s-1vcpu-1gb'),
  image: z.string().min(1).default('ubuntu-24-04-x64'),
  sshKeys: z.array(z.union([z.string(), z.number()])).default([]),
  userData: z.string().optional(),
});

interface DoDropletResponse {
  droplet?: {
    id?: number;
    name?: string;
    status?: string;
  };
}

export async function deployDigitalOcean(input: unknown): Promise<DeploymentResult> {
  const parsed = inputSchema.parse(input);

  const response = await fetch('https://api.digitalocean.com/v2/droplets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${parsed.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: parsed.dropletName,
      region: parsed.region,
      size: parsed.size,
      image: parsed.image,
      ssh_keys: parsed.sshKeys,
      user_data: parsed.userData,
      tags: ['openclaw-easy-deploy'],
    }),
    signal: AbortSignal.timeout(20000),
  });

  const responseText = await response.text();
  let body: DoDropletResponse | { raw: string };
  try {
    body = JSON.parse(responseText) as DoDropletResponse;
  } catch {
    body = { raw: responseText };
  }

  if (!response.ok) {
    return {
      ok: false,
      platform: 'digitalocean',
      message: `DigitalOcean deployment failed with status ${response.status}.`,
      raw: body,
    };
  }

  const doBody = body as DoDropletResponse;
  return {
    ok: true,
    platform: 'digitalocean',
    message: `Droplet ${doBody.droplet?.name ?? parsed.dropletName} creation requested.`,
    raw: body,
  };
}
