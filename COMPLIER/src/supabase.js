import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://jgvgqgbhzadxvcolgvly.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_5ToLoZzsP_B3FQoYBzTnEA_re1QwPPv";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
