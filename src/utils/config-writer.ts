import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = resolve(__dirname, '../../templates');

export async function renderTemplate(templateName: string, context: object): Promise<string> {
  const templatePath = resolve(templatesDir, templateName);
  const templateBody = await readFile(templatePath, 'utf8');
  const compiler = Handlebars.compile(templateBody, { noEscape: true });
  return compiler(context);
}

export async function writeTextFile(filePath: string, data: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, data, 'utf8');
}

export function maskSecret(secret: string): string {
  if (secret.length <= 8) {
    return '*'.repeat(secret.length);
  }

  return `${secret.slice(0, 4)}${'*'.repeat(secret.length - 8)}${secret.slice(-4)}`;
}
