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
                if (error.code === 'PGRST116') { // Record not found
                    console.log('Profile missing, creating new one...');
                    const { data: newUser } = await supabase.auth.getUser();
                    const { data: created, error: createError } = await supabase
                        .from('users')
                        .insert({
                            id: userId,
                            full_name: newUser?.user?.user_metadata?.full_name || newUser?.user?.email?.split('@')[0],
                            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(userId)}`,
                        })
                        .select()
                        .single();

                    if (createError) throw createError;
                    set({ profile: created });
                } else {
                    throw error;
                }
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

        if (data.user) {
            // Create profile entry
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    full_name: fullName,
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`,
                });
            if (profileError) console.error('Error creating profile:', profileError);
        }

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
