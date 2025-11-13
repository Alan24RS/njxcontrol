-- Migration Template: [Describe the purpose]
-- Date: [YYYY-MM-DD]
-- Description: [Detailed description of changes]

-- ============================================================================
-- 1. Create Tables (IDEMPOTENT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. Add Columns (IDEMPOTENT)
-- ============================================================================

DO $$ 
BEGIN
  ALTER TABLE existing_table 
    ADD COLUMN new_column TEXT NOT NULL DEFAULT 'value';
EXCEPTION 
  WHEN duplicate_column THEN 
    NULL;
END $$;

-- ============================================================================
-- 3. Create Indexes (IDEMPOTENT)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_table_unique 
  ON table_name(unique_column);

-- Partial index example
CREATE INDEX IF NOT EXISTS idx_table_partial 
  ON table_name(column_name) 
  WHERE condition IS TRUE;

-- ============================================================================
-- 4. Create/Update Views (IDEMPOTENT)
-- ============================================================================

-- ⚠️ CRÍTICO: Las vistas NO heredan automáticamente las políticas RLS
-- de las tablas base. DEBES usar security_invoker = true.

-- If adding columns (safe):
CREATE OR REPLACE VIEW view_name AS
  SELECT column1, column2, new_column3
  FROM table_name;

-- If removing/changing columns (must drop first):
-- DROP VIEW IF EXISTS view_name;
-- 
-- CREATE VIEW view_name AS
--   SELECT column1, column2
--   FROM table_name;

-- ⚠️ CRÍTICO: Configurar security_invoker en la vista
-- Esto hace que la vista respete las políticas RLS de las tablas base
ALTER VIEW view_name SET (security_invoker = true);

COMMENT ON VIEW view_name IS 'Description of what this view represents. Usa security_invoker=true para respetar las políticas RLS de las tablas base.';

-- ============================================================================
-- 5. Create ENUMs (IDEMPOTENT)
-- ============================================================================

DO $$ 
BEGIN
  CREATE TYPE enum_name AS ENUM ('VALUE1', 'VALUE2', 'VALUE3');
EXCEPTION 
  WHEN duplicate_object THEN 
    NULL;
END $$;

-- ============================================================================
-- 6. Enable RLS (MANDATORY for new tables)
-- ============================================================================

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. Create RLS Policies (IDEMPOTENT)
-- ============================================================================

-- Owner-based access
DO $$ 
BEGIN
  CREATE POLICY "users_own_data" ON table_name
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION 
  WHEN duplicate_object THEN 
    NULL;
END $$;

-- Admin full access
DO $$ 
BEGIN
  CREATE POLICY "admin_full_access" ON table_name
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM rol_usuario
        WHERE usuario_id = auth.uid()
        AND rol = 'ADMIN'
      )
    );
EXCEPTION 
  WHEN duplicate_object THEN 
    NULL;
END $$;

-- ============================================================================
-- 8. Create Functions (IDEMPOTENT)
-- ============================================================================

-- ⚠️ CRÍTICO: Si la función ya existe y cambias:
--    - Tipo de retorno (RETURNS uuid → RETURNS json)
--    - Tipos de parámetros (text → uuid)
--    - Firma de la función (agregar/eliminar parámetros)
-- 
-- DEBES eliminar la función primero con DROP FUNCTION IF EXISTS

-- Para funciones NUEVAS (no existe aún):
CREATE OR REPLACE FUNCTION function_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Para funciones EXISTENTES que cambian tipo de retorno o firma:
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.function_name(text, uuid);
END $$;

CREATE OR REPLACE FUNCTION public.function_name(param1 text, param2 uuid)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  -- Function logic here
  v_result := json_build_object('success', true);
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Para funciones que solo cambian la lógica (misma firma):
-- CREATE OR REPLACE es seguro aquí
CREATE OR REPLACE FUNCTION function_name(param1 text)
RETURNS uuid AS $$
BEGIN
  -- Updated logic, same signature
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. Create Triggers (IDEMPOTENT)
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_name ON table_name;

CREATE TRIGGER trigger_name
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION function_name();

-- ============================================================================
-- 10. Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE table_name IS 'Description of what this table stores';
COMMENT ON COLUMN table_name.column_name IS 'Description of this column';
COMMENT ON VIEW view_name IS 'Description of what this view represents';
COMMENT ON INDEX idx_table_column IS 'Index to optimize queries on column_name';

-- ============================================================================
-- 11. Grants (Permissions)
-- ============================================================================

GRANT SELECT ON table_name TO authenticated;
GRANT SELECT ON view_name TO authenticated;

