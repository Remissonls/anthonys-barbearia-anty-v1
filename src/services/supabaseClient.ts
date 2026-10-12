import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const forceDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

// Determine if we should use Demo Mode (fallback or explicitly enabled)
export const isDemoMode = forceDemoMode || !supabaseUrl || !supabaseAnonKey;

// Real client (or null if in pure demo mode without credentials)
export const supabase = !isDemoMode
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
