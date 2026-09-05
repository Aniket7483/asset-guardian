ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;
ALTER TABLE public.assignments ADD CONSTRAINT assignments_quantity_positive CHECK (quantity > 0);
CREATE INDEX IF NOT EXISTS assignments_asset_active_idx ON public.assignments (asset_id) WHERE returned_date IS NULL;