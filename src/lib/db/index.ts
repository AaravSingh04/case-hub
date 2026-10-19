import { createClient } from '@supabase/supabase-js';
import { db } from './storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export const supabaseAdmin = Boolean(supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl!, supabaseServiceRoleKey!)
  : null;

// Export default database interface (resilient persistence)
export { db };
