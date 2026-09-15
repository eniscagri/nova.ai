import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && publishableKey);

// The publishable key is intentionally client-side. Row Level Security protects data.
// No privileged Supabase key is included in the web bundle or Android application.
export const supabase = createClient(
  url || 'https://local.invalid',
  publishableKey || 'missing-public-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' } }
);
