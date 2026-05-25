import apiService from "./api";

const normalizeCompanyId = (companyId) => {
  const parsed = Number.parseInt(companyId, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const favouriteCompany = async (companyId) => {
  const normalizedId = normalizeCompanyId(companyId);
  if (!normalizedId) {
    return { error: "Invalid company id." };
  }

  return apiService.request(`/favourite-companies/${normalizedId}`, {
    method: "POST",
    returnErrorObject: true
  });
};

export const unfavouriteCompany = async (companyId) => {
  const normalizedId = normalizeCompanyId(companyId);
  if (!normalizedId) {
    return { error: "Invalid company id." };
  }

  return apiService.request(`/favourite-companies/${normalizedId}`, {
    method: "DELETE",
    returnErrorObject: true
  });
};

export const checkCompanyFavourited = async (companyId) => {
  const normalizedId = normalizeCompanyId(companyId);
  if (!normalizedId) {
    return { error: "Invalid company id." };
  }

  return apiService.request(`/favourite-companies/check/${normalizedId}`, {
    returnErrorObject: true
  });
};

export const getFavouriteCompanies = async () =>
  apiService.request("/favourite-companies", {
    returnErrorObject: true
  });

