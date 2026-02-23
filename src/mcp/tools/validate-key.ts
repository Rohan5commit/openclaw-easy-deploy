import { z } from 'zod';
import type { LlmProvider } from '../../types.js';

const inputSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini']),
  apiKey: z.string().min(10),
  timeoutMs: z.number().int().positive().max(30000).default(10000),
});

export interface ValidateKeyResult {
  ok: boolean;
  provider: LlmProvider;
  status?: number;
  message: string;
}

async function callApi(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; text: string }> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

async function validateOpenAi(apiKey: string, timeoutMs: number): Promise<ValidateKeyResult> {
  const result = await callApi(
    'https://api.openai.com/v1/models',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
    timeoutMs,
  );

  return {
    ok: result.ok,
    provider: 'openai',
    status: result.status,
    message: result.ok ? 'OpenAI API key is valid.' : `OpenAI key validation failed (${result.status}).`,
  };
}

async function validateAnthropic(apiKey: string, timeoutMs: number): Promise<ValidateKeyResult> {
  const result = await callApi(
    'https://api.anthropic.com/v1/models',
    {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    },
    timeoutMs,
  );

  return {
    ok: result.ok,
    provider: 'anthropic',
    status: result.status,
    message: result.ok
      ? 'Anthropic API key is valid.'
      : `Anthropic key validation failed (${result.status}).`,
  };
}

async function validateGemini(apiKey: string, timeoutMs: number): Promise<ValidateKeyResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const result = await callApi(
    url,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    timeoutMs,
  );

  return {
    ok: result.ok,
    provider: 'gemini',
    status: result.status,
    message: result.ok
      ? 'Gemini API key is valid.'
      : `Gemini key validation failed (${result.status}).`,
  };
}

export async function validateKey(input: unknown): Promise<ValidateKeyResult> {
  const parsed = inputSchema.parse(input);

  try {
    if (parsed.provider === 'openai') {
      return await validateOpenAi(parsed.apiKey, parsed.timeoutMs);
    }

    if (parsed.provider === 'anthropic') {
      return await validateAnthropic(parsed.apiKey, parsed.timeoutMs);
    }

    return await validateGemini(parsed.apiKey, parsed.timeoutMs);
  } catch (error) {
    return {
      ok: false,
      provider: parsed.provider,
      message: `Key validation request failed: ${(error as Error).message}`,
    };
  }
}
