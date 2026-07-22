import { PAGINATION } from '@dokaandm/shared';

/** Wrap an async route handler so thrown/rejected errors reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Success envelope. */
export function ok(res, data, status = 200, extra = {}) {
  return res.status(status).json({ data, ...extra });
}

/** Paginated success envelope. */
export function paginated(res, data, { page, limit, total }) {
  return res.status(200).json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
    },
  });
}

/** Parse & clamp pagination query params. */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
  const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit };
}
