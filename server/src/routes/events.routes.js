import { Router } from 'express';
import { verifyAccessToken } from '../services/tokenService.js';
import { addClient, removeClient } from '../services/realtime.js';

const router = Router();

/**
 * @openapi
 * /events:
 *   get:
 *     tags: [System]
 *     summary: Server-Sent Events stream for live updates (new messages, order changes)
 *     description: >
 *       EventSource cannot send Authorization headers, so the access token is
 *       passed as a query param and verified here. Events are strictly scoped to
 *       the authenticated seller's tenant.
 *     parameters:
 *       - { in: query, name: token, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: SSE stream }
 *       401: { description: Invalid token }
 */
router.get('/', (req, res) => {
  let payload;
  try {
    payload = verifyAccessToken(String(req.query.token || ''));
  } catch {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Invalid token' } });
  }
  const tenantId = payload.tenant;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  addClient(tenantId, res);

  // Heartbeat to keep intermediaries from closing the idle connection.
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      /* ignore */
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(tenantId, res);
  });
});

export default router;
