import { ApiError } from '../lib/ApiError.js';

/**
 * Build a middleware that validates a request part against a Zod schema and
 * replaces it with the parsed (coerced, stripped) value. Never trust the client.
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    // For query, mutate keys in place (req.query is a getter-only object in Express 5-ready setups).
    if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    next();
  };
}
