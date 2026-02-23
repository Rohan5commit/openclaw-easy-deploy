#!/usr/bin/env node
import dotenv from 'dotenv';
import { startMcpServer } from './mcp/server.js';
import { logger } from './utils/logger.js';
import { runWizard } from './wizard/index.js';

dotenv.config();

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));

  if (args.has('--mcp')) {
    await startMcpServer();
    return;
  }

  if (args.has('--help') || args.has('-h')) {
    console.log('openclaw-easy-deploy');
    console.log('');
    console.log('Usage:');
    console.log('  npx openclaw-easy-deploy      Start interactive deployment wizard');
    console.log('  npx openclaw-easy-deploy --mcp  Start MCP server over stdio');
    return;
  }

  await runWizard();
}

main().catch((error) => {
  logger.error(`Deployment helper failed: ${(error as Error).message}`);
  process.exitCode = 1;
});
