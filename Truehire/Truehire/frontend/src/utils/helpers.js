export const cn = (...values) => values.filter(Boolean).join(" ");

export const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
};
