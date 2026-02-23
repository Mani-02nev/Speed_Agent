import { supabase } from './supabase';

export const uploadFile = async (file, path) => {
    const { data, error } = await supabase.storage
        .from('project-assets')
        .upload(path, file, {
            upsert: true,
        });

    if (error) throw error;
    return data;
};

export const getFileUrl = (path) => {
    const { data } = supabase.storage
        .from('project-assets')
        .getPublicUrl(path);

    return data.publicUrl;
};

export const deleteStorageFile = async (path) => {
    const { error } = await supabase.storage
        .from('project-assets')
        .remove([path]);

    if (error) throw error;
};
