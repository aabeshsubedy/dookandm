import { ActivityLog } from '../models/ActivityLog.js';
import { logger } from '../config/logger.js';

/**
 * Append an audit-log entry for a sensitive action. Best-effort: logging must
 * never break the primary operation, so failures are swallowed + logged.
 */
export async function recordActivity({ seller, actor, action, entityType, entityId, meta, ip }) {
  try {
    await ActivityLog.create({
      seller,
      actor: actor || seller,
      action,
      entityType,
      entityId,
      meta,
      ip,
    });
  } catch (err) {
    logger.error({ err, action }, 'Failed to write activity log');
  }
}
