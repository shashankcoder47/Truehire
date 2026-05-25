export function setBearerToken(requestParams, context, ee, next) {
  const token = context.vars.token || context.vars.accessToken;
  if (token) {
    requestParams.headers = {
      ...(requestParams.headers || {}),
      Authorization: `Bearer ${token}`
    };
  }
  return next();
}

export function ensureToken(requestParams, context, ee, next) {
  if (!context.vars.token && context.vars.accessToken) {
    context.vars.token = context.vars.accessToken;
  }
  return next();
}
