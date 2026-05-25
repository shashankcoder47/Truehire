import { ZodError } from 'zod';

export const validateRequest =
  ({ body, params, query }) =>
  (req, _res, next) => {
    try {
      if (body) {
        req.validatedBody = body.parse(req.body);
      }

      if (params) {
        req.validatedParams = params.parse(req.params);
      }

      if (query) {
        req.validatedQuery = query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next({
          statusCode: 400,
          message: 'Validation failed',
          details: error.flatten(),
        });
      }

      next(error);
    }
  };
