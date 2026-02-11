
-- App config table to track global settings like signup availability
CREATE TABLE public.app_config (
  id text PRIMARY KEY DEFAULT 'main',
  signup_enabled boolean NOT NULL DEFAULT true
);

-- Insert default row
INSERT INTO public.app_config (id, signup_enabled) VALUES ('main', true);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config (needed for anon users on auth page)
CREATE POLICY "Anyone can read app config"
ON public.app_config
FOR SELECT
USING (true);

-- Only authenticated users can update (to disable signup after first registration)
CREATE POLICY "Authenticated users can update app config"
ON public.app_config
FOR UPDATE
USING (auth.uid() IS NOT NULL);
