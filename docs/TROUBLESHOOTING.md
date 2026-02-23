# Troubleshooting

## Node version error

Symptom: `Node.js check failed`.

Fix:

```bash
nvm install 22
nvm use 22
node -v
```

## Docker not running

Symptom: `Docker check failed` or compose startup errors.

Fix:

1. Start Docker Desktop.
2. Confirm with `docker info`.
3. Rerun wizard.

## Invalid API key

Symptom: `key validation failed` for OpenAI/Anthropic/Gemini.

Fix:

1. Confirm key is active and has API access.
2. Ensure the key matches selected provider.
3. Retry from wizard step 3.

## Cloud deploy API errors

Symptom: Render or DigitalOcean deploy returns non-2xx status.

Fix:

1. Confirm token scopes and account quotas.
2. Verify request inputs (region, image, plan limits).
3. Rerun deploy step with corrected values.

## Security note

Default/weak configs are risky. Rotate keys, use strong setup passwords, restrict ingress, and never commit real secrets to git.
