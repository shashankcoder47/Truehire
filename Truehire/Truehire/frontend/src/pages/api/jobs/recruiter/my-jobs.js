import { proxyToBackend } from '../../_lib/backendProxy';

export default async function handler(req, res) {
  return proxyToBackend(req, res, '/api/jobs/recruiter/my-jobs');
}
