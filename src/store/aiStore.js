import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useAIStore = create((set, get) => ({
    messages: [],
    isWorking: false,
    pendingPatches: [],
    /** User clicked Approve plan — enables build mode (not auto from disk) */
    planApproved: false,
    lastPlanMarkdown: null,

    setIsWorking: (isWorking) => set({ isWorking }),
    setIsTyping: (isWorking) => set({ isWorking }),

    setPendingPatches: (patches) => set({ pendingPatches: patches }),
    clearPendingPatches: () => set({ pendingPatches: [] }),

    setPlanApproved: (planApproved) => set({ planApproved }),
    setLastPlanMarkdown: (lastPlanMarkdown) => set({ lastPlanMarkdown }),

    getAgentMode: () => (get().planApproved ? 'build' : 'plan'),

    fetchMessages: async (projectId) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) {
            if (error.status !== 403 && error.code !== '42501') {
                console.error('Error fetching messages:', error);
            }
        } else {
            set({ messages: data || [] });
        }
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

    deleteMessages: async (projectId) => {
        const { error } = await supabase.from('messages').delete().eq('project_id', projectId);
        if (error) console.error('Error deleting messages:', error);
        else set({ messages: [], pendingPatches: [], planApproved: false, lastPlanMarkdown: null });
    },

    resetAI: () =>
        set({
            messages: [],
            pendingPatches: [],
            isWorking: false,
            planApproved: false,
            lastPlanMarkdown: null,
        }),
}));
