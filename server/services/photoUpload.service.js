import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Upload desde multer (buffer)
export async function uploadPhoto(file, bucket = 'uploads') {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const fileName = `${Date.now()}-${file.originalname}`;
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file.buffer);

  if (error) throw new Error(error.message);

  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrl.publicUrl;
}

// Upload desde base64 (frontend) - CON AUTENTICACIÓN
export async function uploadPhotoBase64(base64String, userId, type = 'general', userToken = null) {
  try {
    console.log('📸 Iniciando uploadPhotoBase64...');
    console.log('👤 User ID:', userId);
    console.log('📁 Type:', type);
    
    // Extraer el tipo de imagen y los datos
    const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      console.error('❌ Base64 string inválido');
      throw new Error('Formato de imagen inválido');
    }

    const imageType = matches[1]; // jpg, png, etc.
    const base64Data = matches[2];
    
    console.log('🎨 Tipo de imagen:', imageType);
    console.log('📊 Tamaño de datos:', Math.round(base64Data.length / 1024), 'KB');
    
    // Convertir base64 a buffer
    const buffer = Buffer.from(base64Data, 'base64');
    console.log('💾 Buffer creado:', buffer.length, 'bytes');
    
    // Generar nombre único
    const fileName = `${type}/${userId}/${Date.now()}.${imageType}`;
    console.log('📝 Nombre del archivo:', fileName);
    
    // Crear cliente de Supabase autenticado con el token del usuario
    // Esto es necesario para que las políticas RLS funcionen correctamente
    let supabaseClient;
    if (userToken) {
      // Crear cliente autenticado con el token del usuario en los headers
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${userToken}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      
      // Establecer la sesión usando el token directamente
      const { data: sessionData } = await supabaseClient.auth.getSession();
      if (!sessionData?.session) {
        // Si no hay sesión, establecerla manualmente
        await supabaseClient.auth.setSession({
          access_token: userToken,
          refresh_token: '' // No necesitamos refresh token para esto
        }).catch(err => {
          console.warn('⚠️ No se pudo establecer sesión, continuando con headers:', err.message);
        });
      }
    } else {
      // Fallback: usar cliente sin autenticación (solo para lectura pública)
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }

    console.log('☁️ Intentando subir a Supabase Storage...');
    console.log('🔑 Usando token de autenticación:', userToken ? 'Sí' : 'No');
    
    // Subir a Supabase Storage con el cliente autenticado
    const { data, error } = await supabaseClient.storage
      .from('uploads')
      .upload(fileName, buffer, {
        contentType: `image/${imageType}`,
        upsert: false
      });

    if (error) {
      console.error('❌ Error de Supabase Storage:', JSON.stringify(error, null, 2));
      
      // Mensajes de error más claros
      if (error.message.includes('bucket') || error.statusCode === '404') {
        throw new Error('El bucket "uploads" no existe en Supabase Storage. Por favor créalo primero.');
      } else if (error.message.includes('policy') || error.message.includes('permission')) {
        throw new Error('Sin permisos para subir. Configura las políticas del bucket en Supabase.');
      } else {
        throw new Error(`Error de Supabase: ${error.message}`);
      }
    }

    console.log('✅ Imagen subida a Supabase:', data?.path);

    // Obtener URL pública (puede usar cualquier cliente para esto)
    const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
    const { data: publicUrlData } = supabasePublic.storage
      .from('uploads')
      .getPublicUrl(fileName);

    const finalUrl = publicUrlData.publicUrl;
    console.log('🔗 URL pública generada:', finalUrl);

    return finalUrl;
  } catch (err) {
    console.error('❌ Error en uploadPhotoBase64:', err.message);
    console.error('Stack:', err.stack);
    throw err;
  }
}
