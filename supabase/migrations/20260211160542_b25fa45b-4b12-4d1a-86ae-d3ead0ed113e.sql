
-- Add ulb column to site_folders
ALTER TABLE public.site_folders ADD COLUMN ulb text NOT NULL DEFAULT 'KishangarhBas';

-- Add ulb column to labor_records
ALTER TABLE public.labor_records ADD COLUMN ulb text NOT NULL DEFAULT 'KishangarhBas';

-- Add ulb column to active_tokens
ALTER TABLE public.active_tokens ADD COLUMN ulb text NOT NULL DEFAULT 'KishangarhBas';
