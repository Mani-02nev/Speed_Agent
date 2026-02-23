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

        if (error) console.error('Error fetching messages:', error);
        else set({ messages: data || [] });
    },

    addMessage: async (projectId, role, content) => {
        const { data, error } = await supabase
            .from('messages')
            .insert({ project_id: projectId, role, content })
            .select()
            .single();

        if (error) throw error;
        set({ messages: [...get().messages, data] });
        return data;
    },

    clearMessages: () => set({ messages: [] }),
    resetAI: () => set({
        messages: [],
        pendingPatches: [],
        loading: false,
        isTyping: false
    }),
}));
