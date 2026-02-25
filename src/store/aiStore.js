import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useAIStore = create((set, get) => ({
    messages: [],
    provider: 'openai',
    model: 'gpt-4o',
    loading: false,
    isTyping: false,
    pendingPatches: [], // List of { fileId, fileName, newContent, added, removed }

    setIsTyping: (isTyping) => set({ isTyping }),

    setPendingPatches: (patches) => set({ pendingPatches: patches }),
    clearPendingPatches: () => set({ pendingPatches: [] }),

    agentMode: 'plan', // 'plan' or 'execute'
    setAgentMode: (mode) => set({ agentMode: mode }),

    autoExecute: false,
    setAutoExecute: (auto) => set({ autoExecute: auto }),

    setProvider: (provider) => {
        const defaultModels = {
            openai: 'gpt-4o',
            groq: 'llama-3.1-8b-instant',
            openrouter: 'meta-llama/llama-3-70b-instruct',
            gemini: 'gemini-1.5-pro',
        };
        set({ provider, model: defaultModels[provider] || 'gpt-4o' });
    },
    setModel: (model) => set({ model }),

    fetchMessages: async (projectId) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) {
            if (error.status === 403 || error.code === '42501') {
                console.warn('[SUPABASE RLS] Message Fetch Denied: Ensure you are the owner of project node ' + projectId);
                const { data: user } = await supabase.auth.getUser();
                console.log('[DIAGNOSTIC] Current Auth UID:', user?.user?.id || 'NULL');
            } else {
                console.error('Error fetching messages:', error);
            }
        } else {
            set({ messages: data || [] });
        }
    },

    addMessage: async (projectId, role, content) => {
        const { data: { user } } = await supabase.auth.getUser();
        console.log(`[DEBUG] Adding message to node: ${projectId} | As: ${user?.id || 'ANON'}`);

        const { data, error } = await supabase
            .from('messages')
            .insert({ project_id: projectId, role, content })
            .select()
            .single();

        if (error) {
            console.error(`[CRITICAL] Message insertion failed for node ${projectId}:`, error);
            throw error;
        }
        set({ messages: [...get().messages, data] });
        return data;
    },

    clearMessages: () => set({ messages: [] }),
    deleteMessages: async (projectId) => {
        const { error } = await supabase.from('messages').delete().eq('project_id', projectId);
        if (error) console.error('Error deleting messages:', error);
        else set({ messages: [] });
    },
    resetAI: () => set({
        messages: [],
        pendingPatches: [],
        loading: false,
        isTyping: false,
        agentMode: 'plan',
        autoExecute: false
    }),
}));
