import { isSupabaseConfigured, supabase } from '../lib/supabase';

const assertSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY al archivo .env.');
  }
  return supabase;
};

export const signIn = async (email: string, password: string) => {
  const client = assertSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

export const signOut = async () => {
  const client = assertSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
};
