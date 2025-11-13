DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'rol_usuario_usuario_id_fkey'
        AND conrelid = 'public.rol_usuario'::regclass
    ) THEN
        ALTER TABLE public.rol_usuario 
        DROP CONSTRAINT rol_usuario_usuario_id_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'rol_usuario_usuario_id_fkey'
        AND conrelid = 'public.rol_usuario'::regclass
    ) THEN
        ALTER TABLE public.rol_usuario
        ADD CONSTRAINT rol_usuario_usuario_id_fkey 
        FOREIGN KEY (usuario_id) 
        REFERENCES public.usuario(usuario_id) 
        ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'playa_playa_dueno_id_fkey'
        AND conrelid = 'public.playa'::regclass
    ) THEN
        ALTER TABLE public.playa 
        DROP CONSTRAINT playa_playa_dueno_id_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'playa_playa_dueno_id_fkey'
        AND conrelid = 'public.playa'::regclass
    ) THEN
        ALTER TABLE public.playa
        ADD CONSTRAINT playa_playa_dueno_id_fkey 
        FOREIGN KEY (playa_dueno_id) 
        REFERENCES public.usuario(usuario_id) 
        ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'playero_playa_playero_id_fkey'
        AND conrelid = 'public.playero_playa'::regclass
    ) THEN
        ALTER TABLE public.playero_playa 
        DROP CONSTRAINT playero_playa_playero_id_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'playero_playa_playero_id_fkey'
        AND conrelid = 'public.playero_playa'::regclass
    ) THEN
        ALTER TABLE public.playero_playa
        ADD CONSTRAINT playero_playa_playero_id_fkey 
        FOREIGN KEY (playero_id) 
        REFERENCES public.usuario(usuario_id) 
        ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'playero_playa_dueno_invitador_id_fkey'
        AND conrelid = 'public.playero_playa'::regclass
    ) THEN
        ALTER TABLE public.playero_playa 
        DROP CONSTRAINT playero_playa_dueno_invitador_id_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'playero_playa_dueno_invitador_id_fkey'
        AND conrelid = 'public.playero_playa'::regclass
    ) THEN
        ALTER TABLE public.playero_playa
        ADD CONSTRAINT playero_playa_dueno_invitador_id_fkey 
        FOREIGN KEY (dueno_invitador_id) 
        REFERENCES public.usuario(usuario_id) 
        ON DELETE RESTRICT;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ocupacion_playero_id_fkey'
        AND conrelid = 'public.ocupacion'::regclass
    ) THEN
        ALTER TABLE public.ocupacion 
        DROP CONSTRAINT ocupacion_playero_id_fkey;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ocupacion_playero_id_fkey'
        AND conrelid = 'public.ocupacion'::regclass
    ) THEN
        ALTER TABLE public.ocupacion
        ADD CONSTRAINT ocupacion_playero_id_fkey 
        FOREIGN KEY (playero_id) 
        REFERENCES public.usuario(usuario_id) 
        ON DELETE RESTRICT;
    END IF;
END $$;

