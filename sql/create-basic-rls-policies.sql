-- ====================================
-- CREAR POLÍTICAS RLS BÁSICAS
-- PARA TODAS LAS TABLAS
-- ====================================
-- 
-- ⚠️ IMPORTANTE: Ejecuta esto DESPUÉS de habilitar RLS
-- Esto crea políticas básicas que permiten a usuarios
-- autenticados interactuar con los datos
--
-- ====================================

-- ====================================
-- TABLA: POSTS
-- ====================================

-- Permitir a usuarios autenticados leer todos los posts
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer posts" ON public.posts;
CREATE POLICY "Usuarios autenticados pueden leer posts"
ON public.posts
FOR SELECT
TO authenticated
USING (true);

-- Permitir a usuarios autenticados crear posts
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear posts" ON public.posts;
CREATE POLICY "Usuarios autenticados pueden crear posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir a usuarios actualizar sus propios posts
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus posts" ON public.posts;
CREATE POLICY "Usuarios pueden actualizar sus posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir a usuarios eliminar sus propios posts
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus posts" ON public.posts;
CREATE POLICY "Usuarios pueden eliminar sus posts"
ON public.posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ====================================
-- TABLA: USERS
-- ====================================

-- Permitir a usuarios autenticados leer todos los perfiles
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer perfiles" ON public.users;
CREATE POLICY "Usuarios autenticados pueden leer perfiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Permitir a usuarios actualizar su propio perfil
DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil" ON public.users;
CREATE POLICY "Usuarios pueden actualizar su perfil"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ====================================
-- TABLA: SAVED_POSTS
-- ====================================

-- Permitir a usuarios leer sus posts guardados
DROP POLICY IF EXISTS "Usuarios pueden leer sus posts guardados" ON public.saved_posts;
CREATE POLICY "Usuarios pueden leer sus posts guardados"
ON public.saved_posts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir a usuarios guardar posts
DROP POLICY IF EXISTS "Usuarios pueden guardar posts" ON public.saved_posts;
CREATE POLICY "Usuarios pueden guardar posts"
ON public.saved_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir a usuarios quitar posts guardados
DROP POLICY IF EXISTS "Usuarios pueden quitar posts guardados" ON public.saved_posts;
CREATE POLICY "Usuarios pueden quitar posts guardados"
ON public.saved_posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ====================================
-- TABLA: RESTAURANTS
-- ====================================

-- Permitir lectura pública de restaurantes
DROP POLICY IF EXISTS "Lectura pública de restaurantes" ON public.restaurants;
CREATE POLICY "Lectura pública de restaurantes"
ON public.restaurants
FOR SELECT
TO public
USING (true);

-- Permitir a restaurantes actualizar su propia información
DROP POLICY IF EXISTS "Restaurantes pueden actualizar su información" ON public.restaurants;
CREATE POLICY "Restaurantes pueden actualizar su información"
ON public.restaurants
FOR UPDATE
TO authenticated
USING (true) -- Ajustar según tu lógica de autenticación de restaurantes
WITH CHECK (true);

-- ====================================
-- TABLA: RESTAURANT_CATEGORIES
-- ====================================

-- Permitir lectura pública
DROP POLICY IF EXISTS "Lectura pública de categorías de restaurantes" ON public.restaurant_categories;
CREATE POLICY "Lectura pública de categorías de restaurantes"
ON public.restaurant_categories
FOR SELECT
TO public
USING (true);

-- ====================================
-- TABLA: CATEGORIES
-- ====================================

-- Permitir lectura pública
DROP POLICY IF EXISTS "Lectura pública de categorías" ON public.categories;
CREATE POLICY "Lectura pública de categorías"
ON public.categories
FOR SELECT
TO public
USING (true);

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
  AND tablename IN ('posts', 'users', 'saved_posts', 'restaurants', 'restaurant_categories', 'categories')
ORDER BY tablename, cmd;

-- ====================================
-- NOTA:
-- ====================================
-- Si tu aplicación usa tablas adicionales (likes, comments, follows, etc.),
-- deberás crear políticas similares para esas tablas también.
-- ====================================

