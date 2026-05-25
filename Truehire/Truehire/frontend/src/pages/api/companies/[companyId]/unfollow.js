import { proxyToBackend } from '../../_lib/backendProxy';

export default async function handler(req, res) {
  const { companyId } = req.query;
  return proxyToBackend(req, res, `/api/companies/${companyId}/unfollow`);
}
