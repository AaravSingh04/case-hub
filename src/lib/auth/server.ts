import { cookies } from 'next/headers';
import { db } from '../db/storage';
import { User } from '../db/types';

export const SESSION_COOKIE_NAME = 'case_hub_user_id';

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
 * Requires admin user. Throws or returns 403 response if not admin.
 */
export async function requireAdminUserServer(): Promise<User> {
  const user = await requireAuthUserServer();
  if (user.role !== 'admin') {
    throw new Error('Administrative privileges required');
  }
  return user;
}
