import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  for (const dir of [
    'qa/.auth',
    'qa/reports/allure-results',
    'qa/reports/artillery',
    'qa/reports/junit',
    'qa/reports/playwright-html',
    'qa/reports/playwright-json',
    'qa/reports/test-results',
    'qa/reports/logs'
  ]) {
    fs.mkdirSync(path.resolve(dir), { recursive: true });
  }
}
