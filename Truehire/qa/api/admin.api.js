export class AdminApi {
  constructor(apiClient) {
    this.api = apiClient;
  }

  dashboard(token) {
    return this.api.get('/admin/dashboard/stats', { token });
  }

  users(token, query = '?limit=10') {
    return this.api.get(`/admin/users${query}`, { token });
  }

  recruiters(token, query = '?limit=10') {
    return this.api.get(`/admin/recruiters${query}`, { token });
  }

  approvals(token, query = '?limit=10') {
    return this.api.get(`/admin/recruiter-approvals${query}`, { token });
  }

  jobs(token, query = '?limit=10') {
    return this.api.get(`/admin/jobs${query}`, { token });
  }

  applications(token, query = '?limit=10') {
    return this.api.get(`/admin/applications${query}`, { token });
  }
}
