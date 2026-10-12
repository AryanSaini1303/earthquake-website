import { createClient } from '@supabase/supabase-js';

// Public, browser-safe settings (the anon key is meant to be exposed; Row Level Security
// in supabase/spikes.sql decides what it may do). Set them in .env.local.
// The variables must be written out in full so Next.js can inline them at build time.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// One shared client per page, or null when Supabase isn't configured.
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;
