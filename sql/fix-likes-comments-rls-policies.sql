-- ====================================
-- CREAR POLÍTICAS RLS PARA LIKES Y COMMENTS
-- ====================================
-- 
-- Este script crea las políticas necesarias para que los usuarios
-- puedan dar likes, quitar likes, comentar y leer comentarios
--
-- ====================================

-- ====================================
-- TABLA: LIKES
-- ====================================

-- Permitir a usuarios autenticados leer todos los likes (para contar)
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer likes" ON public.likes;
CREATE POLICY "Usuarios autenticados pueden leer likes"
ON public.likes
FOR SELECT
TO authenticated
USING (true);

-- Permitir a usuarios autenticados crear likes
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear likes" ON public.likes;
CREATE POLICY "Usuarios autenticados pueden crear likes"
ON public.likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir a usuarios eliminar sus propios likes
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus likes" ON public.likes;
CREATE POLICY "Usuarios pueden eliminar sus likes"
ON public.likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ====================================
-- TABLA: COMMENTS
-- ====================================

-- Permitir a usuarios autenticados leer todos los comentarios
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer comentarios" ON public.comments;
CREATE POLICY "Usuarios autenticados pueden leer comentarios"
ON public.comments
FOR SELECT
TO authenticated
USING (true);

-- Permitir a usuarios autenticados crear comentarios
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear comentarios" ON public.comments;
CREATE POLICY "Usuarios autenticados pueden crear comentarios"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir a usuarios actualizar sus propios comentarios
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus comentarios" ON public.comments;
CREATE POLICY "Usuarios pueden actualizar sus comentarios"
ON public.comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir a usuarios eliminar sus propios comentarios
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus comentarios" ON public.comments;
CREATE POLICY "Usuarios pueden eliminar sus comentarios"
ON public.comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ====================================
-- VERIFICAR POLÍTICAS CREADAS
-- ====================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operacion,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('likes', 'comments')
ORDER BY tablename, cmd;

-- ====================================

