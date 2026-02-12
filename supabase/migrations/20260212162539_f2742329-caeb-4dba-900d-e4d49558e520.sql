
-- Add dimension columns to labor_records
ALTER TABLE public.labor_records
ADD COLUMN l numeric DEFAULT NULL,
ADD COLUMN w numeric DEFAULT NULL,
ADD COLUMN d numeric DEFAULT NULL,
ADD COLUMN quantity numeric DEFAULT NULL;
