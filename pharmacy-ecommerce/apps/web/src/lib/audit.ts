import { getDb } from './db';

export async function logAudit(
  userEmail: string,
  action: 'create' | 'update' | 'delete',
  entity: string,
  entityId: string | null,
  entityName?: string,
  changes?: Record<string, { old: unknown; new: unknown }>,
  ipAddress?: string
) {
  try {
    const db = await getDb();
    await db.audit_log.create({
      data: {
        user_email: userEmail,
        action,
        entity,
        entity_id: entityId,
        entity_name: entityName || null,
        changes: changes ? (changes as object) : undefined,
        ip_address: ipAddress || null,
      },
    });
  } catch {
    // Audit failures must never break the main operation
  }
}
