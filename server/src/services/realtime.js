/**
 * Minimal Server-Sent-Events broker for pushing live events to a seller's
 * browser (new message arrived, order updated, webhook processed). Keyed by
 * tenant id so multi-tab sellers all receive events; strictly tenant-isolated.
 */
const clientsByTenant = new Map(); // tenantId -> Set<res>

export function addClient(tenantId, res) {
  const key = String(tenantId);
  if (!clientsByTenant.has(key)) clientsByTenant.set(key, new Set());
  clientsByTenant.get(key).add(res);
}

export function removeClient(tenantId, res) {
  const key = String(tenantId);
  const set = clientsByTenant.get(key);
  if (set) {
    set.delete(res);
    if (set.size === 0) clientsByTenant.delete(key);
  }
}

/** Push an event only to the owning tenant's connected clients. */
export function publish(tenantId, event, data) {
  const set = clientsByTenant.get(String(tenantId));
  if (!set || set.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try {
      res.write(payload);
    } catch {
      // Broken pipe — drop silently; the close handler will clean up.
    }
  }
}
