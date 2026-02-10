
-- Labor records table
CREATE TABLE public.labor_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  labor_count INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.labor_records ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (owner) can read
CREATE POLICY "Owner can view all labor records"
  ON public.labor_records FOR SELECT
  TO authenticated
  USING (true);

-- Anyone can insert (mate via edge function will handle token validation)
CREATE POLICY "Allow insert via token"
  ON public.labor_records FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Active tokens table
CREATE TABLE public.active_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.active_tokens ENABLE ROW LEVEL SECURITY;

-- Only authenticated users (owner) can manage tokens
CREATE POLICY "Owner can manage tokens"
  ON public.active_tokens FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon users can read tokens (to validate) and update (to burn)
CREATE POLICY "Anon can read tokens"
  ON public.active_tokens FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update tokens"
  ON public.active_tokens FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
