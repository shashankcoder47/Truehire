import apiService from "./api";

const normalizeCompanyId = (companyId) => {
  const parsed = Number.parseInt(companyId, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const saveCompany = async (companyId) => {
  const normalizedId = normalizeCompanyId(companyId);
  if (!normalizedId) {
    return { error: "Invalid company id." };
  }
  return apiService.request(`/saved-companies/${normalizedId}`, {
    method: "POST",
    returnErrorObject: true
  });
};

export const unsaveCompany = async (companyId) => {
  const normalizedId = normalizeCompanyId(companyId);
  if (!normalizedId) {
    return { error: "Invalid company id." };
  }
  return apiService.request(`/saved-companies/${normalizedId}`, {
    method: "DELETE",
    returnErrorObject: true
  });
};

export const getSavedCompanies = async () =>
  apiService.request("/saved-companies", {
    returnErrorObject: true
  });

export const checkCompanySaved = async (companyId) => {
  const normalizedId = normalizeCompanyId(companyId);
  if (!normalizedId) {
    return { error: "Invalid company id." };
  }
  return apiService.request(`/saved-companies/check/${normalizedId}`, {
    returnErrorObject: true
  });
};

