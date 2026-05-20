import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholders to prevent the "supabaseUrl is required" error 
// if the user hasn't set their secrets yet.
// Ensure the URL is clean (some users copy the REST endpoint instead of the project URL)
let url = (supabaseUrl || '').trim() || 'https://placeholder.supabase.co';

// CRITICAL: Clean up URL from common copy-paste errors (extra spaces, dots at end, etc.)
url = url.replace(/\s/g, ''); // Remove all spaces
url = url.replace(/\.+$/, ''); // Remove trailing dots
if (url.includes('/rest/v1')) {
  url = url.split('/rest/v1')[0];
}
// Remove trailing slash if present
url = url.replace(/\/$/, '');

const key = (supabaseAnonKey || '').trim() || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing! Wishlist feature will stay in 'Mock Mode'. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Settings.");
} else {
  console.log("Supabase client initialized with URL:", url);
  if (!url.startsWith('https://') || url.includes(' ')) {
    console.error("CRITICAL: Your Supabase URL appears invalid. Current value:", url);
  }
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storage: window.sessionStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
