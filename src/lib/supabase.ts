import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const storedUrl =
  typeof window !== 'undefined'
    ? window.localStorage.getItem('ct_supabase_url') || undefined
    : undefined;
const storedAnonKey =
  typeof window !== 'undefined'
    ? window.localStorage.getItem('ct_supabase_anon_key') || undefined
    : undefined;

const supabaseUrl = envUrl || storedUrl;
const supabaseAnonKey = envAnonKey || storedAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
