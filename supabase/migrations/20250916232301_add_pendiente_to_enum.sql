DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PENDIENTE' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'playero_playa_estado'
        )
    ) THEN
        ALTER TYPE playero_playa_estado ADD VALUE 'PENDIENTE';
    END IF;
END $$;

