-- ====================================
-- CONFIGURACIÓN COMPLETA DE POLÍTICAS
-- PARA SUPABASE STORAGE
-- ====================================
-- 
-- ⚠️ IMPORTANTE: Ejecuta este script en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New Query > Pega este código > Run
--
-- ====================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES DEL BUCKET 'uploads'
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir" ON storage.objects;
DROP POLICY IF EXISTS "Acceso público de lectura" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus archivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus archivos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_insert" ON storage.objects;
DROP POLICY IF EXISTS "public_read" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_delete" ON storage.objects;

-- 2. POLÍTICA PARA INSERT (Subir archivos)
-- Permite a usuarios autenticados subir archivos al bucket 'uploads'
CREATE POLICY "Usuarios autenticados pueden subir"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
);

-- 3. POLÍTICA PARA SELECT (Ver/descargar archivos)
-- Permite acceso público para leer/ver las imágenes
CREATE POLICY "Acceso público de lectura"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'uploads'
);

-- 4. POLÍTICA PARA UPDATE (Actualizar archivos)
-- Permite a usuarios autenticados actualizar sus archivos
CREATE POLICY "Usuarios pueden actualizar sus archivos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
)
WITH CHECK (
  bucket_id = 'uploads'
);

-- 5. POLÍTICA PARA DELETE (Eliminar archivos)
-- Permite a usuarios autenticados eliminar archivos
CREATE POLICY "Usuarios pueden eliminar sus archivos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
);

-- ====================================
-- VERIFICAR QUE LAS POLÍTICAS SE CREARON
-- ====================================
SELECT 
  policyname,
  cmd as operacion,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%uploads%' OR policyname LIKE '%usuario%' OR policyname LIKE '%público%'
ORDER BY cmd;

-- ====================================
-- NOTAS IMPORTANTES:
-- ====================================
-- 1. Asegúrate de que el bucket 'uploads' existe y está marcado como PÚBLICO
-- 2. Si el bucket no existe, créalo desde Storage > New bucket
-- 3. Marca la opción "Public bucket" al crear el bucket
-- 4. Después de ejecutar este script, recarga la app y vuelve a intentar subir una imagen
-- ====================================
