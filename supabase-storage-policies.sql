-- ====================================
-- POLÍTICAS DE SUPABASE STORAGE
-- ====================================

-- 1. ELIMINAR POLÍTICAS EXISTENTES (por si acaso)
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir" ON storage.objects;
DROP POLICY IF EXISTS "Acceso público de lectura" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus archivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus archivos" ON storage.objects;

-- 2. POLÍTICA PARA INSERT (Subir archivos)
CREATE POLICY "Usuarios autenticados pueden subir"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- 3. POLÍTICA PARA SELECT (Ver/descargar archivos)
CREATE POLICY "Acceso público de lectura"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- 4. POLÍTICA PARA UPDATE (Actualizar archivos)
CREATE POLICY "Usuarios pueden actualizar sus archivos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads');

-- 5. POLÍTICA PARA DELETE (Eliminar archivos)
CREATE POLICY "Usuarios pueden eliminar sus archivos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');

-- ====================================
-- VERIFICAR POLÍTICAS CREADAS
-- ====================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

