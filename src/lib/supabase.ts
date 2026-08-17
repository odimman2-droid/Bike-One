import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://betbzfxesnczypzvrqnd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eh2UrqKGTFAyPkurf9_sog_Eb3isO7A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabaseSyncStatus {
  status: 'connected' | 'table_missing' | 'error' | 'disconnected';
  errorMessage?: string;
}

/**
 * Checks if the bikeone_store table exists by running a light query.
 */
export async function checkSupabaseConnection(): Promise<SupabaseSyncStatus> {
  try {
    const { data, error } = await supabase
      .from('bikeone_store')
      .select('key')
      .limit(1);

    if (error) {
      // If table doesn't exist, Supabase returns error code 'PGRST116' or similar, or message 'relation "public.bikeone_store" does not exist'
      if (error.message?.includes('does not exist') || error.code === 'PGRST116' || error.code === '42P01') {
        return { status: 'table_missing' };
      }
      return { status: 'error', errorMessage: error.message };
    }

    return { status: 'connected' };
  } catch (err: any) {
    return { status: 'error', errorMessage: err?.message || 'Erro de rede desconhecido.' };
  }
}

/**
 * Save a single key-value pair to Supabase
 */
export async function saveToSupabase(key: string, value: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bikeone_store')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error(`Error saving ${key} to Supabase:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Exception saving ${key} to Supabase:`, err);
    return false;
  }
}

/**
 * Load a single key-value pair from Supabase
 */
export async function loadFromSupabase(key: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('bikeone_store')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error(`Error loading ${key} from Supabase:`, error);
      return null;
    }
    return data ? data.value : null;
  } catch (err) {
    console.error(`Exception loading ${key} from Supabase:`, err);
    return null;
  }
}

/**
 * Save all application states in a single bulk operation or sequentially
 */
export async function saveAllToSupabase(dataMap: Record<string, any>): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  const promises = Object.entries(dataMap).map(async ([key, value]) => {
    const success = await saveToSupabase(key, value);
    results[key] = success;
  });
  await Promise.all(promises);
  return results;
}

/**
 * Load all application states from Supabase
 */
export async function loadAllFromSupabase(keys: string[]): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  const promises = keys.map(async (key) => {
    const val = await loadFromSupabase(key);
    if (val !== null) {
      results[key] = val;
    }
  });
  await Promise.all(promises);
  return results;
}

/**
 * SQL script for creating the necessary table in Supabase.
 */
export const SUPABASE_SETUP_SQL = `-- Criação da tabela de persistência unificada para a Bike One Luanda
CREATE TABLE IF NOT EXISTS public.bikeone_store (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativa o Row Level Security (RLS)
ALTER TABLE public.bikeone_store ENABLE ROW LEVEL SECURITY;

-- Cria uma política para permitir acesso de leitura público (anon)
CREATE POLICY "Permitir leitura pública" ON public.bikeone_store
    FOR SELECT TO anon USING (true);

-- Cria uma política para permitir inserção/atualização pública (anon)
CREATE POLICY "Permitir gravação pública" ON public.bikeone_store
    FOR ALL TO anon USING (true) WITH CHECK (true);
`;
