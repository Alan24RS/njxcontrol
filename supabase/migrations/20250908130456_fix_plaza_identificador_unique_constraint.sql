-- Fix plaza identificador unique constraint
-- The current constraint prevents the same identificador across all playas
-- But business logic should allow same identificador in different playas

-- Drop the current unique constraint on identificador only
ALTER TABLE plaza DROP CONSTRAINT IF EXISTS plaza_identificador_key;

-- Add a new unique constraint on (identificador, playa_id)
-- This allows the same identificador in different playas but prevents duplicates within the same playa
ALTER TABLE plaza ADD CONSTRAINT plaza_identificador_playa_unique 
    UNIQUE (identificador, playa_id);
