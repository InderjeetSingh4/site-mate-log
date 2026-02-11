
-- Create site_folders table
CREATE TABLE public.site_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for site_folders
CREATE POLICY "Users can view own folders"
ON public.site_folders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
ON public.site_folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
ON public.site_folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
ON public.site_folders FOR DELETE
USING (auth.uid() = user_id);

-- Add folder_id to active_tokens
ALTER TABLE public.active_tokens
ADD COLUMN folder_id UUID REFERENCES public.site_folders(id) ON DELETE SET NULL;

-- Add folder_id to labor_records
ALTER TABLE public.labor_records
ADD COLUMN folder_id UUID REFERENCES public.site_folders(id) ON DELETE SET NULL;
