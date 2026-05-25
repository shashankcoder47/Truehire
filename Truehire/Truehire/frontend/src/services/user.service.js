import apiService from "./api";

export const getProfile = () => apiService.getProfile();

export const updateProfile = (payload) => apiService.updateProfile(payload);

export const getUserById = (userId) => apiService.request(`/users/${userId}`);
