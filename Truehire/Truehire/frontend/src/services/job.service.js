import apiService from "./api";

export const getJobs = () => apiService.request("/jobs");

export const getJobById = (jobId) => apiService.request(`/jobs/${jobId}`);

export const createJob = (payload) =>
  apiService.request("/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
