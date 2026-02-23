-- Create tables for Speed Agent

-- 1. Users table (extending auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'javascript',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Messages table (AI Chat History)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) Policies

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Files policies
CREATE POLICY "Users can view files of their projects" ON public.files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can create files in their projects" ON public.files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can update files in their projects" ON public.files FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can delete files from their projects" ON public.files FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = files.project_id AND projects.user_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view messages of their projects" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = messages.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can create messages in their projects" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = messages.project_id AND projects.user_id = auth.uid())
);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call high-level user creation on auth.users insert
-- Storage Policies (Run these if storage bucket 'project-assets' exists)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-assets', 'project-assets', true);

CREATE POLICY "Project assets are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'project-assets');
CREATE POLICY "Users can upload assets to their projects" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'project-assets' AND (auth.uid() IS NOT NULL)
);
CREATE POLICY "Users can delete their own assets" ON storage.objects FOR DELETE USING (
  bucket_id = 'project-assets' AND (auth.uid() IS NOT NULL)
);

-- Note: In a real app, you'd want to restrict storage paths to /projects/:projectId/ to match user ownership.
