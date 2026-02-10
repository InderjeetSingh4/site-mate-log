
-- Add user_id to labor_records to scope data per owner
ALTER TABLE public.labor_records ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add created_by to active_tokens so we know who created each token
ALTER TABLE public.active_tokens ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Drop old overpermissive policies
DROP POLICY IF EXISTS "Owner can view all labor records" ON public.labor_records;
DROP POLICY IF EXISTS "Authenticated can manage records" ON public.labor_records;
DROP POLICY IF EXISTS "Owner can manage tokens" ON public.active_tokens;

-- Labor records: owner can only see/manage their own
CREATE POLICY "Users can view own labor records"
  ON public.labor_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labor records"
  ON public.labor_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labor records"
  ON public.labor_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labor records"
  ON public.labor_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Active tokens: owner can only manage their own
CREATE POLICY "Users can manage own tokens"
  ON public.active_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
