/**
 * Plantilla para crear funciones RPC de filtros dinámicos con soporte para filtros aplicados
 *
 * CARACTERÍSTICAS:
 * - Filtros dinámicos que se actualizan basándose en filtros ya aplicados
 * - Soporte para búsqueda contextual
 * - Cache inteligente que considera filtros aplicados
 * - Escalable para múltiples campos de filtro
 *
 * Para crear una nueva función RPC para otra entidad:
 *
 * 1. Crea la migración SQL:
 *
 * CREATE OR REPLACE FUNCTION get_[ENTIDAD]_filters(
 *   search_query TEXT DEFAULT NULL
 * )
 * RETURNS JSON
 * LANGUAGE plpgsql
 * AS $$
 * DECLARE
 *   result JSON;
 *   estados_array JSON;
 * BEGIN
 *   WITH filtered_data AS (
 *     SELECT DISTINCT estado
 *     FROM [TABLA]
 *     WHERE fecha_eliminacion IS NULL
 *       AND (
 *         search_query IS NULL
 *         OR [CAMPO_BUSQUEDA] ILIKE '%' || search_query || '%'
 *       )
 *   ),
 *   estados_with_labels AS (
 *     SELECT
 *       estado as value,
 *       CASE
 *         WHEN estado = '[VALOR1]' THEN '[LABEL1]'
 *         WHEN estado = '[VALOR2]' THEN '[LABEL2]'
 *         ELSE estado
 *       END as label
 *     FROM filtered_data
 *     ORDER BY estado
 *   )
 *   SELECT json_agg(
 *     json_build_object(
 *       'value', value,
 *       'label', label
 *     )
 *   ) INTO estados_array
 *   FROM estados_with_labels;
 *
 *   SELECT json_build_object(
 *     'estado', json_build_object(
 *       'title', 'Estado',
 *       'options', COALESCE(estados_array, '[]'::json),
 *       'pagination', false
 *     )
 *   ) INTO result;
 *
 *   RETURN result;
 * END;
 * $$;
 *
 * 2. Crea el servicio TypeScript:
 *
 * export const get[Entidad]Filters = async (
 *   args: { query?: string } = {}
 * ): Promise<ApiResponse<Filters>> => {
 *   const cacheKey = `[entidad]-filters-${args.query || 'all'}`
 *
 *   return unstable_cache(
 *     async (): Promise<ApiResponse<Filters>> => {
 *       const supabase = await createClient()
 *
 *       const { data, error } = await supabase.rpc('get_[entidad]_filters', {
 *         search_query: args.query || null
 *       })
 *
 *       if (error) {
 *         return {
 *           data: null,
 *           error: translateDBError(error.message)
 *         }
 *       }
 *
 *       return {
 *         data: data as Filters,
 *         error: null
 *       }
 *     },
 *     [cacheKey],
 *     {
 *       tags: [CACHE_TAGS.[ENTIDAD], cacheKey],
 *       revalidate: CACHE_TIMES.[ENTIDAD]
 *     }
 *   )()
 * }
 *
 * 3. Úsalo en tu servicio principal:
 *
 * if (includeFilters) {
 *   const filtersResponse = await get[Entidad]Filters({ query })
 *   filters = filtersResponse.data || undefined
 * }
 */

export const RPC_FILTER_TEMPLATE = `
-- Función RPC para obtener filtros dinámicos de [ENTIDAD] con soporte para filtros aplicados
CREATE OR REPLACE FUNCTION get_[ENTIDAD]_filters(
  search_query TEXT DEFAULT NULL,
  applied_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  estados_array JSON;
  base_query TEXT;
  where_conditions TEXT[];
  final_where TEXT;
BEGIN
  -- Construir condiciones WHERE dinámicamente basadas en filtros aplicados
  where_conditions := ARRAY['fecha_eliminacion IS NULL'];
  
  -- Agregar condición de búsqueda si existe
  IF search_query IS NOT NULL AND search_query != '' THEN
    where_conditions := array_append(where_conditions, 
      format('([CAMPO_BUSQUEDA] ILIKE %L)', 
        '%' || search_query || '%'
      )
    );
  END IF;
  
  -- Agregar filtros aplicados (ejemplo para estado)
  IF applied_filters ? 'estado' AND jsonb_array_length(applied_filters->'estado') > 0 THEN
    where_conditions := array_append(where_conditions,
      format('estado = ANY(ARRAY[%s]::[ENUM_TYPE][])',
        (
          SELECT string_agg(quote_literal(value::text), ',')
          FROM jsonb_array_elements_text(applied_filters->'estado') AS value
        )
      )
    );
  END IF;
  
  -- Agregar más filtros según sea necesario
  -- IF applied_filters ? 'otro_campo' THEN ... END IF;
  
  -- Construir la consulta final
  final_where := array_to_string(where_conditions, ' AND ');
  
  -- Obtener estados únicos basados en los filtros aplicados
  EXECUTE format('
    WITH filtered_data AS (
      SELECT DISTINCT estado
      FROM [TABLA] 
      WHERE %s
    ),
    estados_with_labels AS (
      SELECT 
        estado::text as value,
        CASE 
          WHEN estado = ''[VALOR1]'' THEN ''[LABEL1]''
          WHEN estado = ''[VALOR2]'' THEN ''[LABEL2]''
          ELSE estado::text
        END as label
      FROM filtered_data
      ORDER BY estado
    )
    SELECT COALESCE(json_agg(
      json_build_object(
        ''value'', value,
        ''label'', label
      )
    ), ''[]''::json)
    FROM estados_with_labels
  ', final_where) INTO estados_array;

  -- Construir el objeto de filtros final
  SELECT json_build_object(
    'estado', json_build_object(
      'title', 'Estado',
      'options', estados_array,
      'pagination', false
    )
    -- Agregar más filtros aquí si es necesario
    -- , 'otro_campo', json_build_object(...)
  ) INTO result;

  RETURN result;
END;
$$;
`
