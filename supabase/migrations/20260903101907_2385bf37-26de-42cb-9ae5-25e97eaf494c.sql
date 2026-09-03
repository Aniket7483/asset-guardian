CREATE TABLE IF NOT EXISTS public.centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.centers TO authenticated;
GRANT ALL ON public.centers TO service_role;

ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read all authenticated" ON public.centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert authenticated" ON public.centers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update authenticated" ON public.centers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete admins only" ON public.centers FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_centers_updated BEFORE UPDATE ON public.centers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS center_id uuid REFERENCES public.centers(id) ON DELETE RESTRICT;

INSERT INTO public.centers (name, code, address)
SELECT 'Head Office', 'HO', null
WHERE NOT EXISTS (SELECT 1 FROM public.centers);

UPDATE public.buildings
SET center_id = (SELECT id FROM public.centers ORDER BY created_at LIMIT 1)
WHERE center_id IS NULL;

ALTER TABLE public.buildings ALTER COLUMN center_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_buildings_center ON public.buildings(center_id);
CREATE INDEX IF NOT EXISTS idx_floors_building ON public.floors(building_id);
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON public.rooms(floor_id);
CREATE INDEX IF NOT EXISTS idx_assets_building ON public.assets(building_id);
CREATE INDEX IF NOT EXISTS idx_assets_floor ON public.assets(floor_id);
CREATE INDEX IF NOT EXISTS idx_assets_room ON public.assets(room_id);

CREATE OR REPLACE FUNCTION public.validate_location_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
declare
  room_floor uuid;
  floor_building uuid;
begin
  if new.room_id is not null then
    select floor_id into room_floor from public.rooms where id = new.room_id;
    if room_floor is null then
      raise exception 'Room does not exist';
    end if;
    if new.floor_id is null then
      new.floor_id := room_floor;
    elsif new.floor_id <> room_floor then
      raise exception 'Selected room does not belong to the selected floor';
    end if;
  end if;

  if new.floor_id is not null then
    select building_id into floor_building from public.floors where id = new.floor_id;
    if floor_building is null then
      raise exception 'Floor does not exist';
    end if;
    if new.building_id is null then
      new.building_id := floor_building;
    elsif new.building_id <> floor_building then
      raise exception 'Selected floor does not belong to the selected building';
    end if;
  end if;

  return new;
end; $$;

DROP TRIGGER IF EXISTS trg_assets_location ON public.assets;
CREATE TRIGGER trg_assets_location BEFORE INSERT OR UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.validate_location_hierarchy();

DROP TRIGGER IF EXISTS trg_verifications_location ON public.verifications;
CREATE TRIGGER trg_verifications_location BEFORE INSERT OR UPDATE ON public.verifications
FOR EACH ROW EXECUTE FUNCTION public.validate_location_hierarchy();