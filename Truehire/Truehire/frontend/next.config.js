import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendBaseUrl = (process.env.NEXT_PUBLIC_API_URL || '')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

export default {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    if (!backendBaseUrl) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendBaseUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendBaseUrl}/uploads/:path*`,
      },
    ];
  },
}
