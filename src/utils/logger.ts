import chalk from 'chalk';
import ora, { type Ora } from 'ora';

export const logger = {
  info(message: string): void {
    console.log(chalk.cyan(message));
  },
  success(message: string): void {
    console.log(chalk.green(message));
  },
  warn(message: string): void {
    console.log(chalk.yellow(message));
  },
  error(message: string): void {
    console.error(chalk.red(message));
  },
  step(message: string): void {
    console.log(chalk.bold(`\n${message}`));
  },
};

export function spinner(text: string): Ora {
  return ora({ text, color: 'cyan' });
}
