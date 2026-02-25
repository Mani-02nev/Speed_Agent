import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing. Please check your .env file.');
}

// v6 Singleton Pattern for consistent auth state across modules
if (!window.__supabaseClient) {
    window.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'agent-speed-auth',
            lock: false // Fixes NavigatorLockAcquireTimeoutError
        }
    });

    // v6 Auth Diagnostic Listener
    window.__supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log(`%c[SUPABASE AUTH] Event: ${event} | User: ${session?.user?.id || 'ANON'}`, 'color: #00E0B8; font-weight: bold;');
        if (event === 'SIGNED_OUT') {
            localStorage.removeItem('agent-speed-auth');
        }
    });
}

export const supabase = window.__supabaseClient;
