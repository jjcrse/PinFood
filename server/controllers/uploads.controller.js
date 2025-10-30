import { uploadPhoto, uploadPhotoBase64 } from '../services/photoUpload.service.js';
import { supabase } from '../services/supabaseClient.js';

// Upload con multer (FormData)
export async function uploadImage(req, res) {
  try {
    if (!req.file) throw new Error('No image uploaded');
    const imageUrl = await uploadPhoto(req.file);
    res.json({ url: imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Upload con base64 (desde cámara o galería)
export async function uploadImageBase64(req, res) {
  console.log('📥 Petición de upload recibida');
  console.log('📦 Headers:', req.headers);
  
  try {
    const { image, type } = req.body;
    console.log('🖼️ Imagen recibida:', image ? `${Math.round(image.length / 1024)} KB` : 'NO');
    console.log('📁 Tipo:', type);
    
    if (!image) {
      console.error('❌ No se proporcionó imagen');
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    // Obtener usuario autenticado
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('❌ No hay header de autorización');
      return res.status(401).json({ error: 'No autorizado - falta token' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token recibido (primeros 20 chars):', token.substring(0, 20) + '...');

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error('❌ Error al verificar usuario:', userError);
      return res.status(401).json({ error: 'Token inválido: ' + userError.message });
    }

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario autenticado:', user.id);

    // Subir imagen
    console.log('📤 Iniciando subida a Supabase Storage...');
    const imageUrl = await uploadPhotoBase64(image, user.id, type || 'general');
    
    console.log('✅ Imagen subida exitosamente:', imageUrl);
    
    // Asegurarse de enviar JSON válido
    return res.status(200).json({ 
      success: true,
      url: imageUrl,
      message: 'Imagen subida exitosamente'
    });
    
  } catch (err) {
    console.error('❌ Error en uploadImageBase64:', err);
    console.error('Stack:', err.stack);
    
    // Asegurarse de enviar JSON válido incluso en error
    return res.status(500).json({ 
      success: false,
      error: err.message || 'Error desconocido al subir imagen',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
