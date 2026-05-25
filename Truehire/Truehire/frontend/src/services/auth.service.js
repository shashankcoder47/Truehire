import apiService from "./api";

export const loginUser = (payload) =>
  apiService.request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const registerUser = (payload) =>
  apiService.request("/auth/register/user", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const requestPasswordReset = (payload) =>
  apiService.request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const resetPassword = (payload) =>
  apiService.request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const verifyOtp = (payload) =>
  apiService.request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
