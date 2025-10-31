-- ====================================
-- CORREGIR POLÍTICA RLS PARA RESTAURANTES
-- ====================================
-- 
-- ⚠️ Este script asegura que CUALQUIERA pueda leer restaurantes
-- Ejecuta esto en el SQL Editor de Supabase si los restaurantes
-- no aparecen en el select
--
-- ====================================

-- 1. Eliminar política existente si hay alguna conflictiva
DROP POLICY IF EXISTS "Lectura pública de restaurantes" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurantes lectura pública" ON public.restaurants;
DROP POLICY IF EXISTS "Todos pueden leer restaurantes" ON public.restaurants;

-- 2. Crear política de lectura pública (SIN restricciones)
CREATE POLICY "Lectura pública de restaurantes"
ON public.restaurants
FOR SELECT
TO public
USING (true);

-- 3. Verificar que RLS está habilitado
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- ====================================
-- VERIFICAR POLÍTICAS
-- ====================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operacion,
  roles,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'restaurants';

-- ====================================
-- VERIFICAR QUE RLS ESTÁ HABILITADO
-- ====================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'restaurants';

-- ====================================
-- NOTA:
-- ====================================
-- Esta política permite que CUALQUIERA (incluso usuarios no autenticados)
-- pueda leer los restaurantes. Esto es necesario para que aparezcan
-- en el select cuando creas un post.
-- ====================================

