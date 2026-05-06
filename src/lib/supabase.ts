import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://giqbwlwkdycpsngdhzam.supabase.co';
const fallbackSupabaseAnonKey = 'sb_publishable_UJ8N5ZGmiHI1DXTv-WE-9Q_os5blh_s';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || fallbackSupabaseUrl;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || fallbackSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
