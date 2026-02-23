import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import type { DeploymentResult } from '../../types.js';

const inputSchema = z.object({
  apiToken: z.string().min(10),
  renderYamlPath: z.string().min(1),
  dryRun: z.boolean().default(false),
});

interface RenderDeployResponse {
  id?: string;
  dashboardUrl?: string;
  service?: {
    serviceDetails?: {
      url?: string;
    };
  };
}

export async function deployRender(input: unknown): Promise<DeploymentResult> {
  const parsed = inputSchema.parse(input);
  const blueprint = await readFile(parsed.renderYamlPath, 'utf8');

  if (parsed.dryRun) {
    return {
      ok: true,
      platform: 'render',
      message: 'Render deployment dry-run completed. Blueprint read successfully.',
      raw: { blueprintPreviewLength: blueprint.length },
    };
  }

  const response = await fetch('https://api.render.com/v1/blueprints/deploys', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${parsed.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blueprint,
    }),
    signal: AbortSignal.timeout(20000),
  });

  const responseText = await response.text();
  let body: RenderDeployResponse | { raw: string };
  try {
    body = JSON.parse(responseText) as RenderDeployResponse;
  } catch {
    body = { raw: responseText };
  }

  if (!response.ok) {
    return {
      ok: false,
      platform: 'render',
      message: `Render deployment failed with status ${response.status}.`,
      raw: body,
    };
  }

  const renderBody = body as RenderDeployResponse;
  const url =
    renderBody.dashboardUrl ??
    (renderBody.service && renderBody.service.serviceDetails
      ? renderBody.service.serviceDetails.url
      : undefined);

  return {
    ok: true,
    platform: 'render',
    message: 'Render deployment triggered successfully.',
    url,
    raw: body,
  };
}
