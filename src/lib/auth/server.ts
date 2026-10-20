import { cookies } from 'next/headers';
import { db } from '../db/storage';
import { User } from '../db/types';

export const SESSION_COOKIE_NAME = 'case_hub_user_id';

/**
 * Returns list of authorized admin emails configured in ADMIN_EMAILS
 */
export function getAdminEmails(): string[] {
  const envVal = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';
  return envVal
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns list of administrator notification recipient emails configured in ADMIN_NOTIFICATION_EMAILS
 */
export function getAdminNotificationEmails(): string[] {
  const envVal =
    process.env.ADMIN_NOTIFICATION_EMAILS ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAILS ||
    '';
  const emails = envVal
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length > 0) return emails;
  return ['admin@casehub.internal'];
}

/**
 * Server-controlled check to verify if an email address is authorized for admin privileges.
 * NEVER trusts client-side inputs or arbitrary user modifications!
 */
export function isAuthorizedAdminEmail(email?: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const allowlist = getAdminEmails();

  if (allowlist.length > 0) {
    return allowlist.includes(cleanEmail);
  }

  // Preserve existing legitimate administrator in database if ADMIN_EMAILS is not yet populated
  const existingUser = db.getUserByEmail(cleanEmail);
  return existingUser?.role === 'admin';
}

/**
 * Derives authenticated user server-side from session cookie.
 * Never trust user ID or role passed in HTTP body/headers from frontend!
 */
export async function getCurrentUserServer(): Promise<User | null> {
  const cookieStore = cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!userId) {
    return null;
  }

  const user = db.getUserById(userId);
  return user || null;
}

/**
 * Requires authenticated user. Throws or returns 401 response if unauthenticated.
 */
export async function requireAuthUserServer(): Promise<User> {
  const user = await getCurrentUserServer();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Requires admin user. Throws or returns 403 response if not authorized administrator.
 */
export async function requireAdminUserServer(): Promise<User> {
  const user = await requireAuthUserServer();
  if (user.role !== 'admin' || !isAuthorizedAdminEmail(user.email)) {
    throw new Error('Administrative privileges required');
  }
  return user;
}
