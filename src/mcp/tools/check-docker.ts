import { spawnSync } from 'node:child_process';

export interface CheckDockerResult {
  ok: boolean;
  installed: boolean;
  running: boolean;
  guidance?: string;
}

export async function checkDocker(): Promise<CheckDockerResult> {
  const versionProbe = spawnSync('docker', ['--version'], { encoding: 'utf8' });

  if (versionProbe.error) {
    return {
      ok: false,
      installed: false,
      running: false,
      guidance:
        'Docker is not installed or not available in PATH. Install Docker Desktop: https://docs.docker.com/get-docker/',
    };
  }

  const runningProbe = spawnSync('docker', ['info'], { encoding: 'utf8' });
  const running = runningProbe.status === 0;

  if (!running) {
    return {
      ok: false,
      installed: true,
      running: false,
      guidance: 'Docker is installed but not running. Start Docker Desktop and rerun the wizard.',
    };
  }

  return {
    ok: true,
    installed: true,
    running: true,
  };
}
