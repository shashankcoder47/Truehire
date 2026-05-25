import fs from 'fs';
import path from 'path';

const envFiles = [path.resolve('.env'), path.resolve('Truehire/backend/.env')];

for (const envFile of envFiles) {
  if (!fs.existsSync(envFile)) continue;

  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

function normalizeApiBaseURL(value) {
  const rawValue = value || 'http://127.0.0.1:5000/api';
  const trimmed = rawValue.trim().replace(/\/+$/, '');
  const withApi = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  return `${withApi}/`;
}

export const env = {
  frontendURL: process.env.FRONTEND_URL || 'http://127.0.0.1:3000',
  apiBaseURL: normalizeApiBaseURL(process.env.API_BASE_URL),
  jwtSecret: process.env.JWT_SECRET || '',
  credentials: {
    admin: {
      email: process.env.ADMIN_EMAIL || 'admin@truehire.com',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    },
    recruiter: {
      email: process.env.RECRUITER_EMAIL || 'qa.recruiter@truehire.com',
      password: process.env.RECRUITER_PASSWORD || 'ChangeMe123!'
    },
    candidate: {
      email: process.env.CANDIDATE_EMAIL || 'qa.candidate@truehire.com',
      password: process.env.CANDIDATE_PASSWORD || 'ChangeMe123!'
    }
  }
};
