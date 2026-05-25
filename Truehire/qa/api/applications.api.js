export class ApplicationsApi {
  constructor(apiClient) {
    this.api = apiClient;
  }

  candidateApplications(token) {
    return this.api.get('/jobs/user/applications', { token });
  }

  apply(token, jobId, payload = {}) {
    return this.api.post(`/jobs/${jobId}/apply`, payload, { token });
  }

  recruiterApplications(token) {
    return this.api.get('/recruiters/applications', { token });
  }

  adminApplications(token) {
    return this.api.get('/admin/applications', { token });
  }

  uploadResume(token, filePayload) {
    return this.api.request.post('upload', {
      multipart: {
        file: filePayload
      },
      headers: this.api.authHeaders(token)
    });
  }
}
