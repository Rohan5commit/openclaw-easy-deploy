import { spawn } from 'node:child_process';
import inquirer from 'inquirer';
import type { DeploymentResult, WizardState } from '../../types.js';
import { deployDigitalOcean } from '../../mcp/tools/deploy-do.js';
import { deployRender } from '../../mcp/tools/deploy-render.js';
import { deployVps } from '../../mcp/tools/deploy-vps.js';
import { logger, spinner } from '../../utils/logger.js';

interface LocalCommandResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

function runDockerComposeUp(cwd: string): Promise<LocalCommandResult> {
  return new Promise((resolve) => {
    const child = spawn('docker', ['compose', 'up', '-d'], {
      cwd,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      stderr += error.message;
      resolve({ code: 1, stdout, stderr });
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function deployLocal(state: WizardState): Promise<DeploymentResult> {
  const result = await runDockerComposeUp(state.outputDir);

  if (result.code !== 0) {
    return {
      ok: false,
      platform: 'local',
      message: 'Local Docker deployment failed.',
      raw: result,
    };
  }

  return {
    ok: true,
    platform: 'local',
    message: 'Local Docker deployment started.',
    url: `http://localhost:${state.appPort ?? 3000}`,
    raw: result,
  };
}

async function deployRenderFlow(state: WizardState): Promise<DeploymentResult> {
  if (!state.generatedConfig?.renderPath) {
    throw new Error('render.yaml is missing. Regenerate config with Render platform selected.');
  }

  const answers = await inquirer.prompt<{ apiToken: string; triggerLiveDeploy: boolean }>([
    {
      type: 'password',
      name: 'apiToken',
      message: 'Render API token:',
      mask: '*',
      validate(input: string): boolean | string {
        return input.trim().length >= 10 || 'Render token is required.';
      },
    },
    {
      type: 'confirm',
      name: 'triggerLiveDeploy',
      message: 'Trigger a live Render deployment now?',
      default: false,
    },
  ]);

  return await deployRender({
    apiToken: answers.apiToken.trim(),
    renderYamlPath: state.generatedConfig.renderPath,
    dryRun: !answers.triggerLiveDeploy,
  });
}

async function deployDigitalOceanFlow(): Promise<DeploymentResult> {
  const answers = await inquirer.prompt<{
    apiToken: string;
    dropletName: string;
    region: string;
    size: string;
    image: string;
    triggerLiveDeploy: boolean;
  }>([
    {
      type: 'password',
      name: 'apiToken',
      message: 'DigitalOcean API token:',
      mask: '*',
      validate(input: string): boolean | string {
        return input.trim().length >= 10 || 'DigitalOcean API token is required.';
      },
    },
    {
      type: 'input',
      name: 'dropletName',
      message: 'Droplet name:',
      default: `openclaw-${Date.now()}`,
    },
    {
      type: 'input',
      name: 'region',
      message: 'Region slug:',
      default: 'nyc3',
    },
    {
      type: 'input',
      name: 'size',
      message: 'Size slug:',
      default: 's-1vcpu-1gb',
    },
    {
      type: 'input',
      name: 'image',
      message: 'Image slug:',
      default: 'ubuntu-24-04-x64',
    },
    {
      type: 'confirm',
      name: 'triggerLiveDeploy',
      message: 'Create the Droplet now?',
      default: false,
    },
  ]);

  if (!answers.triggerLiveDeploy) {
    return {
      ok: true,
      platform: 'digitalocean',
      message: 'Skipped live DigitalOcean deploy (dry run).',
    };
  }

  return await deployDigitalOcean({
    apiToken: answers.apiToken.trim(),
    dropletName: answers.dropletName,
    region: answers.region,
    size: answers.size,
    image: answers.image,
  });
}

async function deployVpsFlow(state: WizardState): Promise<DeploymentResult> {
  const base = await inquirer.prompt<{
    host: string;
    port: number;
    username: string;
    authMethod: 'password' | 'privateKey';
  }>([
    {
      type: 'input',
      name: 'host',
      message: 'VPS host/IP:',
      validate(input: string): boolean | string {
        return input.trim().length > 0 || 'Host is required.';
      },
    },
    {
      type: 'input',
      name: 'port',
      message: 'SSH port:',
      default: '22',
      filter(input: string): number {
        return Number.parseInt(input, 10);
      },
      validate(input: number): boolean | string {
        return Number.isInteger(input) && input > 0 && input <= 65535 ? true : 'Invalid port.';
      },
    },
    {
      type: 'input',
      name: 'username',
      message: 'SSH username:',
      default: 'root',
      validate(input: string): boolean | string {
        return input.trim().length > 0 || 'Username is required.';
      },
    },
    {
      type: 'list',
      name: 'authMethod',
      message: 'SSH authentication method:',
      choices: [
        { name: 'Password', value: 'password' },
        { name: 'Private key path', value: 'privateKey' },
      ],
    },
  ]);

  if (base.authMethod === 'password') {
    const secret = await inquirer.prompt<{ password: string }>([
      {
        type: 'password',
        name: 'password',
        message: 'SSH password:',
        mask: '*',
        validate(input: string): boolean | string {
          return input.trim().length > 0 || 'Password is required.';
        },
      },
    ]);

    return await deployVps({
      host: base.host,
      port: base.port,
      username: base.username,
      password: secret.password,
      appPort: state.appPort ?? 3000,
    });
  }

  const keyAnswer = await inquirer.prompt<{ privateKeyPath: string }>([
    {
      type: 'input',
      name: 'privateKeyPath',
      message: 'Path to private key file:',
      default: '~/.ssh/id_rsa',
      validate(input: string): boolean | string {
        return input.trim().length > 0 || 'Private key path is required.';
      },
    },
  ]);

  return await deployVps({
    host: base.host,
    port: base.port,
    username: base.username,
    privateKeyPath: keyAnswer.privateKeyPath,
    appPort: state.appPort ?? 3000,
  });
}

export async function deployStep(state: WizardState): Promise<WizardState> {
  logger.step('Step 5/6: Deploy');

  if (!state.platform) {
    throw new Error('Platform must be selected before deployment.');
  }

  const deploySpinner = spinner('Deploying OpenClaw...').start();
  let deployment: DeploymentResult;

  try {
    if (state.platform === 'local') {
      deployment = await deployLocal(state);
    } else if (state.platform === 'render') {
      deployment = await deployRenderFlow(state);
    } else if (state.platform === 'digitalocean') {
      deployment = await deployDigitalOceanFlow();
    } else {
      deployment = await deployVpsFlow(state);
    }
  } catch (error) {
    deploySpinner.fail('Deployment failed.');
    throw error;
  }

  if (deployment.ok) {
    deploySpinner.succeed(deployment.message);
  } else {
    deploySpinner.fail(deployment.message);
  }

  if (deployment.url) {
    logger.info(`Deployment URL hint: ${deployment.url}`);
  }

  return {
    ...state,
    deployment,
  };
}
