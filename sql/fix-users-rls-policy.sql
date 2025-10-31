-- ====================================
-- CREAR POLÍTICA RLS PARA INSERT EN USERS
-- ====================================
-- 
-- Este script permite que los usuarios puedan insertar
-- su propio registro en la tabla users después de registrarse
--
-- ====================================

-- Permitir a usuarios autenticados crear su propio registro
DROP POLICY IF EXISTS "Usuarios pueden crear su propio registro" ON public.users;
CREATE POLICY "Usuarios pueden crear su propio registro"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ====================================
-- VERIFICAR POLÍTICA CREADA
-- ====================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operacion,
  roles,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND cmd = 'INSERT';

-- ====================================
-- NOTA:
-- ====================================
-- Esta política permite que cuando un usuario se registra
-- en Supabase Auth, pueda insertar su propio registro en
-- la tabla users con el mismo ID que su auth.uid()
-- ====================================

