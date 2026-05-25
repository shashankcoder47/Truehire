export class JobsApi {
  constructor(apiClient) {
    this.api = apiClient;
  }

  list(query = '') {
    return this.api.get(`/jobs${query}`);
  }

  getById(jobId) {
    return this.api.get(`/jobs/${jobId}`);
  }

  create(token, job) {
    return this.api.post('/jobs', job, { token });
  }

  update(token, jobId, payload) {
    return this.api.patch(`/jobs/${jobId}`, payload, { token });
  }

  remove(token, jobId) {
    return this.api.delete(`/jobs/${jobId}`, { token });
  }

  apply(token, jobId, payload = {}) {
    return this.api.post(`/jobs/${jobId}/apply`, payload, { token });
  }
}
