-- ====================================
-- ARREGLAR POLÍTICA RLS PARA POSTS
-- ====================================
-- 
-- Este script corrige la política de INSERT para posts
-- asegurando que funcione correctamente con RLS
--
-- ====================================

-- 1. Eliminar la política existente si hay algún problema
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear posts" ON public.posts;

-- 2. Crear la política correcta para INSERT
-- La política debe verificar que auth.uid() = user_id
CREATE POLICY "Usuarios autenticados pueden crear posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Verificar que la política está creada
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operacion,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'posts'
  AND cmd = 'INSERT';

-- ====================================
-- NOTAS:
-- ====================================
-- 1. Asegúrate de que el cliente de Supabase esté autenticado
--    cuando haces el INSERT desde el backend
-- 2. El backend debe crear un cliente con el token del usuario:
--    const supabaseAuth = createClient(url, key, {
--      global: { headers: { Authorization: `Bearer ${token}` } }
--    });
-- 3. Luego usar ese cliente para hacer el INSERT
-- ====================================

