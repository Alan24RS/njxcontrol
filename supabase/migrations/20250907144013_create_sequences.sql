-- =====================================================
-- MIGRACIÓN: SECUENCIAS
-- =====================================================
-- Crea las secuencias necesarias para generar IDs únicos

-- Secuencia para IDs de características
CREATE SEQUENCE IF NOT EXISTS caracteristica_caracteristica_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Secuencia para IDs de tipos de plaza
CREATE SEQUENCE IF NOT EXISTS tipo_plaza_tipo_plaza_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
