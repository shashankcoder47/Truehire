import { proxyToBackend } from '../_lib/backendProxy';

export default function handler(req, res) {
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  return proxyToBackend(req, res, `/api/user/${path || ''}`);
}
