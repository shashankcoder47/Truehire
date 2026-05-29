const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const getPagination = (query = {}) => {
  const page = toPositiveInteger(query.page, DEFAULT_PAGE);
  const requestedLimit = toPositiveInteger(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;
  const offset = skip;

  return { page, limit, skip, offset, take: limit };
};

export const buildPagination = ({ page, limit, total }) => ({
  page,
  limit,
  total: Number(total || 0),
  pages: Math.ceil(Number(total || 0) / limit),
  totalPages: Math.ceil(Number(total || 0) / limit),
});
