ALTER TABLE public.playa DROP CONSTRAINT IF EXISTS playa_ciudad_id_fkey;

ALTER TABLE public.playa DROP CONSTRAINT IF EXISTS playa_playa_dueno_id_fkey;

ALTER TABLE public.playa ADD CONSTRAINT playa_ciudad_id_fkey 
    FOREIGN KEY (ciudad_id) REFERENCES ciudad(ciudad_id) ON DELETE RESTRICT;

ALTER TABLE public.playa ADD CONSTRAINT playa_playa_dueno_id_fkey 
    FOREIGN KEY (playa_dueno_id) REFERENCES auth.users(id) ON DELETE CASCADE;
