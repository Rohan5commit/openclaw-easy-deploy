# openclaw-easy-deploy

Interactive TypeScript CLI + MCP server that reduces OpenClaw deployment friction across Render, DigitalOcean, VPS, and local Docker.

## Quickstart

```bash
npx openclaw-easy-deploy
```

## Demo

- Wizard walkthrough GIF: `docs/assets/wizard-demo.gif` (add your capture before publishing package screenshots)

## What it does

- Runs prerequisite checks (Node.js 22+, Docker)
- Prompts for platform and LLM provider
- Validates API key (OpenAI, Anthropic, Gemini)
- Generates `.env`, `docker-compose.yml`, and optional `render.yaml`
- Triggers deployment via provider APIs or local Docker
- Verifies live URL availability

## CLI usage

```bash
# interactive wizard
npx openclaw-easy-deploy

# MCP server mode (stdio)
npx openclaw-easy-deploy --mcp
```

## Development

```bash
npm install
npm run lint
npm run test
npm run build
```

## Folder layout

```text
src/
  index.ts
  wizard/
  mcp/
  utils/
templates/
docs/
tests/
```

## Security

Do not ship default passwords or unscoped API keys to production. Review `docs/TROUBLESHOOTING.md` security guidance before public deployment.

## License

MIT
