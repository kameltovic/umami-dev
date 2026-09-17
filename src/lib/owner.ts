import prisma from '@/lib/prisma';

// ponytail: IPs learned from logged-in dashboard requests live in process memory,
// so after a restart they come back the next time you open the dashboard.
// OWNER_IPS=1.2.3.4,5.6.7.8 gives a fixed list; move to a table if multi-instance matters.
const g = globalThis as typeof globalThis & { __ownerIps?: Set<string> };
g.__ownerIps = g.__ownerIps || new Set<string>();
const learned = g.__ownerIps;

export function rememberOwnerIp(ip?: string) {
  if (ip) learned.add(ip);
}

export function isOwnerIp(ip?: string) {
  if (!ip) return false;
  const fixed = (process.env.OWNER_IPS || '').split(',').map(n => n.trim());
  return learned.has(ip) || fixed.includes(ip);
}

export async function markOwnerSession(websiteId: string, sessionId: string) {
  await prisma.writeRawQuery(
    `update session set is_owner = true
    where website_id = {{websiteId}} and session_id = {{sessionId}} and is_owner = false`,
    { websiteId, sessionId },
    'markOwnerSession',
  );
}
