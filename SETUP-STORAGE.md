# 📦 Configuración de Supabase Storage para Upload de Imágenes

## ⚠️ IMPORTANTE: Debes hacer esto ANTES de intentar subir imágenes

---

## 🔧 Paso 1: Crear el Bucket

1. **Ve a tu Dashboard de Supabase**
   - URL: https://supabase.com/dashboard
   - Selecciona tu proyecto **PinFood**

2. **Abre Storage**
   - En el menú lateral izquierdo, click en **"Storage"**

3. **Crear nuevo bucket**
   - Click en el botón **"New bucket"** o **"Create a new bucket"**
   
4. **Configurar el bucket:**
   - **Name:** `uploads`
   - **Public bucket:** ✅ **MARCAR ESTA OPCIÓN** (muy importante)
   - Click en **"Save"** o **"Create bucket"**

---

## 🔐 Paso 2: Configurar Políticas de Acceso

1. **Ir a Políticas del Bucket**
   - Click en el bucket `uploads` que acabas de crear
   - Ve a la pestaña **"Policies"**

2. **Crear Política para INSERT (Subir)**
   - Click en **"New Policy"**
   - Selecciona **"For full customization"** o **"Create a policy"**
   
   **Configuración:**
   - **Policy name:** `Usuarios autenticados pueden subir`
   - **Allowed operation:** `INSERT` ✅
   - **Target roles:** `authenticated`
   - **Policy definition (USING expression):**
     ```sql
     bucket_id = 'uploads'
     ```
   - **WITH CHECK expression:**
     ```sql
     bucket_id = 'uploads'
     ```
   - Click en **"Review"** y luego **"Save policy"**

3. **Crear Política para SELECT (Leer)**
   - Click en **"New Policy"** nuevamente
   
   **Configuración:**
   - **Policy name:** `Acceso público de lectura`
   - **Allowed operation:** `SELECT` ✅
   - **Target roles:** `public` (para que cualquiera pueda ver las imágenes)
   - **Policy definition (USING expression):**
     ```sql
     bucket_id = 'uploads'
     ```
   - Click en **"Review"** y luego **"Save policy"**

---

## ✅ Paso 3: Verificar Configuración

1. **En el Dashboard de Supabase:**
   - Ve a Storage
   - Deberías ver el bucket `uploads` con el ícono de 🌐 (público)
   - Click en el bucket
   - Deberías ver 2 políticas activas

2. **Probar desde la App:**
   - Abre `http://localhost:3000/app1`
   - Inicia sesión
   - Intenta subir una imagen
   - **Abre la Consola del Navegador (F12)** para ver los logs detallados

---

## 🐛 Solución de Problemas

### Error: "El bucket 'uploads' no existe"
- ✅ Verifica que creaste el bucket con el nombre exacto: `uploads` (en minúsculas)
- ✅ Verifica que está en el proyecto correcto de Supabase

### Error: "Sin permisos para subir"
- ✅ Verifica que el bucket está marcado como **público**
- ✅ Verifica que creaste las 2 políticas (INSERT y SELECT)
- ✅ Verifica que la política INSERT es para `authenticated` users

### Error: "Token inválido"
- ✅ Cierra sesión y vuelve a iniciar sesión en la app
- ✅ Verifica que las variables SUPABASE_URL y SUPABASE_ANON_KEY están correctas en `.env`

### El servidor se crashea
- ✅ Verifica que instalaste `multer`: `npm install multer`
- ✅ Reinicia el servidor: `npm run dev`
- ✅ Revisa la terminal para ver errores específicos

---

## 📸 Alternativa: SQL Directo (Opcional)

Si prefieres usar SQL, puedes ejecutar esto en el **SQL Editor** de Supabase:

```sql
-- Crear políticas para el bucket 'uploads'

-- Política para INSERT (usuarios autenticados pueden subir)
CREATE POLICY "Usuarios autenticados pueden subir"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Política para SELECT (acceso público para leer)
CREATE POLICY "Acceso público de lectura"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');
```

---

## 📞 ¿Necesitas Ayuda?

1. **Verifica los logs del servidor** en la terminal donde corre `npm run dev`
2. **Verifica los logs del navegador** (F12 → Consola)
3. Los errores ahora son mucho más descriptivos y te dirán exactamente qué falta configurar

---

## ✨ Una vez configurado:

- ✅ Podrás subir imágenes desde la galería
- ✅ Podrás tomar fotos con la cámara (en móvil)
- ✅ Las imágenes se guardarán en: `uploads/profile/[user-id]/` o `uploads/post/[user-id]/`
- ✅ Las URLs serán públicas y accesibles

