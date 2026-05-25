const normalizeBackendBaseUrl = () => {
  const rawBaseUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || '')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

  try {
    const parsed = new URL(rawBaseUrl);

    return parsed.toString().replace(/\/+$/, '');
  } catch (_error) {
    if (!rawBaseUrl) {
      throw new Error('NEXT_PUBLIC_API_URL or BACKEND_URL is required');
    }

    return rawBaseUrl;
  }
};

const BACKEND_BASE_URL = normalizeBackendBaseUrl();

const buildBackendUrl = (path, req) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryIndex = String(req?.url || '').indexOf('?');
  const queryString = queryIndex >= 0 ? String(req.url).slice(queryIndex) : '';
  return `${BACKEND_BASE_URL}${normalizedPath}${queryString}`;
};

const shouldSendBody = (method) => !['GET', 'HEAD'].includes(method.toUpperCase());

export async function proxyToBackend(req, res, path) {
  const method = (req.method || 'GET').toUpperCase();
  const url = buildBackendUrl(path, req);

  const headers = {};

  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }

  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }

  const options = {
    method,
    headers,
  };

  if (shouldSendBody(method) && req.body !== undefined) {
    options.body =
      typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? req.body
        : JSON.stringify(req.body);
  }

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    const text = await response.text();
    res.status(response.status);
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    return res.send(text);
  } catch (error) {
    return res.status(502).json({
      message: 'Backend API unavailable',
      details: error.message,
    });
  }
}
