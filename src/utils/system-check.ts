import { checkDocker } from '../mcp/tools/check-docker.js';
import { checkNode } from '../mcp/tools/check-node.js';

export async function runPrereqChecks(minNodeMajor = 22): Promise<{
  node: Awaited<ReturnType<typeof checkNode>>;
  docker: Awaited<ReturnType<typeof checkDocker>>;
}> {
  const node = await checkNode({ minimumMajor: minNodeMajor });
  const docker = await checkDocker();

  return { node, docker };
}
