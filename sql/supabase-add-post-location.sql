-- Agregar columnas de ubicación a la tabla posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS location_lat double precision,
ADD COLUMN IF NOT EXISTS location_lng double precision,
ADD COLUMN IF NOT EXISTS location_name text;

-- Opcional: índices para consultas por cercanía
CREATE INDEX IF NOT EXISTS idx_posts_location_lat ON public.posts (location_lat);
CREATE INDEX IF NOT EXISTS idx_posts_location_lng ON public.posts (location_lng);

-- Si usas RLS, no suelen requerirse cambios para INSERT/SELECT si ya permites columnas adicionales.
-- Asegúrate de que tu política de INSERT permite insertar cualquier columna del propio usuario (owner write).
