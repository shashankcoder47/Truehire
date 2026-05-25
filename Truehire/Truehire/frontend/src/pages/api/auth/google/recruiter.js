const resolveBackendBase = () => {
  const configured =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  const normalized = String(configured || '').trim().replace(/\/+$/, '');
  if (!normalized) {
    throw new Error('NEXT_PUBLIC_API_URL or BACKEND_URL is required');
  }
  return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const backendBase = resolveBackendBase();
    const backendResponse = await fetch(`${backendBase}/api/auth/google/recruiter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body || {})
    });

    const contentType = backendResponse.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await backendResponse.json()
      : { message: await backendResponse.text() };

    return res.status(backendResponse.status).json(payload);
  } catch (error) {
    console.error('Google recruiter auth proxy error:', error);
    const causeCode = error?.cause?.code || error?.code || '';
    const isBackendUnavailable =
      causeCode === 'ECONNREFUSED' ||
      causeCode === 'ENOTFOUND' ||
      causeCode === 'EHOSTUNREACH';

    if (isBackendUnavailable) {
      return res.status(503).json({
        message: 'Backend API unavailable',
        details: `Unable to reach backend at ${resolveBackendBase()}. Start backend server and retry.`
      });
    }

    return res.status(500).json({
      message: 'Server error',
      details: error?.message || 'Unknown proxy error'
    });
  }
}
