import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useProjectStore = create((set, get) => ({
    projects: [],
    currentProject: null,
    files: [],
    loading: false,
    previewRootPath: '',

    setPreviewRootPath: (path) => set({ previewRootPath: path }),

    fetchProjects: async () => {
        set({ loading: true });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching projects:', error);
        else set({ projects: data || [] });
        set({ loading: false });
    },

    createProject: async (name, description = '') => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('projects')
            .insert({ name, description, user_id: user.id })
            .select()
            .single();

        if (error) throw error;
        set({ projects: [data, ...get().projects] });
        return data;
    },

    fetchFiles: async (projectId) => {
        const { data, error } = await supabase
            .from('files')
            .select('*')
            .eq('project_id', projectId)
            .order('updated_at', { ascending: false });

        if (error) console.error('Error fetching files:', error);
        else set({ files: data || [] });
    },

    createFile: async (projectId, name, content = '', language = 'javascript') => {
        const { data, error } = await supabase
            .from('files')
            .insert({ project_id: projectId, name, content, language })
            .select()
            .single();

        if (error) throw error;
        set({ files: [data, ...get().files] });
        return data;
    },

    updateFile: async (fileId, content) => {
        const { error } = await supabase
            .from('files')
            .update({ content, updated_at: new Date() })
            .eq('id', fileId);

        if (error) throw error;
        set({
            files: get().files.map((f) => (f.id === fileId ? { ...f, content } : f)),
        });
    },

    setStreamingContent: (fileId, content) => {
        set({
            files: get().files.map((f) => (f.id === fileId ? { ...f, content } : f)),
        });
    },

    deleteFile: async (fileId) => {
        const { error } = await supabase.from('files').delete().eq('id', fileId);
        if (error) throw error;
        set({ files: get().files.filter((f) => f.id !== fileId) });
    },

    deleteProject: async (projectId) => {
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if (error) throw error;
        set({
            projects: get().projects.filter((p) => p.id !== projectId),
            currentProject: null,
            files: []
        });
    },

    setCurrentProject: (project) => set({ currentProject: project }),
}));
