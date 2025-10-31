-- ====================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- EN TODAS LAS TABLAS
-- ====================================
-- 
-- ⚠️ IMPORTANTE: Este script resuelve los errores del Security Advisor
-- Ejecuta este script en el SQL Editor de Supabase
--
-- ====================================

-- 1. HABILITAR RLS EN TABLA POSTS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 2. HABILITAR RLS EN TABLA USERS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. HABILITAR RLS EN TABLA SAVED_POSTS
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- 4. HABILITAR RLS EN TABLA RESTAURANTS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 5. HABILITAR RLS EN TABLA RESTAURANT_CATEGORIES
ALTER TABLE public.restaurant_categories ENABLE ROW LEVEL SECURITY;

-- 6. HABILITAR RLS EN TABLA CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ====================================
-- VERIFICAR QUE RLS ESTÁ HABILITADO
-- ====================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('posts', 'users', 'saved_posts', 'restaurants', 'restaurant_categories', 'categories')
ORDER BY tablename;

-- ====================================
-- NOTA IMPORTANTE:
-- ====================================
-- Después de habilitar RLS, asegúrate de que tienes políticas
-- para permitir las operaciones que necesitas. Si no tienes
-- políticas, las tablas serán inaccesibles.
--
-- Las políticas básicas deberían permitir:
-- - SELECT: para que los usuarios autenticados puedan leer
-- - INSERT: para que los usuarios autenticados puedan crear
-- - UPDATE: para que los usuarios puedan actualizar sus propios datos
-- - DELETE: para que los usuarios puedan eliminar sus propios datos
-- ====================================

