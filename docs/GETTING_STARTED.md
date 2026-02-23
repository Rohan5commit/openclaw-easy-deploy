# Getting Started

## Prerequisites

- Node.js 22+
- Docker installed and running
- One LLM API key: OpenAI, Anthropic, or Gemini
- Optional cloud token depending on platform:
  - Render API key
  - DigitalOcean API token
  - SSH access for custom VPS

## Quickstart

```bash
npx openclaw-easy-deploy
```

The wizard will:

1. Check Node and Docker.
2. Ask you to choose a platform.
3. Validate your LLM key.
4. Generate `.env` and deployment files.
5. Trigger deployment.
6. Verify the resulting URL.

## MCP Mode

Run as an MCP server over stdio:

```bash
npx openclaw-easy-deploy --mcp
```
