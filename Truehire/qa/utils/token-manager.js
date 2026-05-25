import crypto from 'crypto';
import { env } from '../config/env.js';

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function decodeJwt(token) {
  const [, payload] = String(token).split('.');
  if (!payload) return null;
  return JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
}

export function signJwt(payload, secret = env.jwtSecret) {
  if (!secret) {
    return 'expired.jwt.token';
  }

  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${header}.${body}.${signature}`;
}

export function buildExpiredToken(role = 'USER') {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({
    sub: '1',
    userId: '1',
    email: `expired.${role.toLowerCase()}@truehire.com`,
    role,
    iat: now - 7200,
    exp: now - 3600
  });
}

export function tamperJwt(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return `${token}.tampered`;
  return `${parts[0]}.${parts[1]}.tampered-signature`;
}
