import { proxyToBackend } from '../../../_lib/backendProxy';

export default async function handler(req, res) {
  const { id } = req.query;
  return proxyToBackend(req, res, `/api/recruiters/companies/${id}/ratings`);
}
