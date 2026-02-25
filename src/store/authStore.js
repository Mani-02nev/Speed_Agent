import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useAuthStore = create((set, get) => ({
    user: null,
    profile: null,
    loading: true,

    setUser: (user) => set({ user }),

    fetchProfile: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // PGRST116 means record not found. We don't manually insert anymore,
                // we assume the DB trigger handle_new_user() did its job.
                // If it's still missing, it's likely a sync issue.
                if (error.code !== 'PGRST116') throw error;
            } else {
                set({ profile: data });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    },

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    signUp: async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;

        if (error) throw error;
        // User profile is handled via DB trigger on_auth_user_created
        return data;
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
    },

    initialized: false,

    init: async () => {
        if (get().initialized) return;
        set({ initialized: true, loading: true });

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                set({ user: session.user });
                await get().fetchProfile(session.user.id);
            }

            // Singleton listener
            supabase.auth.onAuthStateChange(async (_event, session) => {
                const currentUser = get().user;
                if (session?.user?.id !== currentUser?.id) {
                    set({ user: session?.user || null });
                    if (session?.user) {
                        await get().fetchProfile(session.user.id);
                    } else {
                        set({ profile: null });
                    }
                }
            });
        } catch (error) {
            console.error('Auth Init Error:', error);
        } finally {
            set({ loading: false });
        }
    },
}));
