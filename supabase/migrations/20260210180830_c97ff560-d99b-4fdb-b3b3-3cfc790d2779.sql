
-- Remove overly permissive anon policies on active_tokens
DROP POLICY "Anon can read tokens" ON public.active_tokens;
DROP POLICY "Anon can update tokens" ON public.active_tokens;

-- Remove overly permissive anon insert on labor_records
DROP POLICY "Allow insert via token" ON public.labor_records;

-- Add authenticated-only insert policy for labor_records (owner can also insert)
CREATE POLICY "Authenticated can manage records"
  ON public.labor_records FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
