// 📸 Utilidades para seleccionar y subir imágenes

/**
 * Abrir selector de archivos (galería)
 * @returns {Promise<string>} Base64 de la imagen seleccionada
 */
export function selectImageFromGallery() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        reject(new Error('El archivo seleccionado no es una imagen válida'));
        return;
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        reject(new Error('La imagen es muy grande. Máximo 5MB'));
        return;
      }

      // Convertir a base64
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };

    input.click();
  });
}

/**
 * Abrir cámara y capturar foto usando getUserMedia
 * @returns {Promise<string>} Base64 de la foto capturada
 */
export function capturePhotoFromCamera() {
  return new Promise((resolve, reject) => {
    // Crear modal para la cámara
    const modal = document.createElement('div');
    modal.className = 'camera-modal';
    modal.innerHTML = `
      <div class="camera-modal-content">
        <h3>📸 Tomar Foto</h3>
        <video id="camera-preview" autoplay playsinline></video>
        <canvas id="camera-canvas" style="display: none;"></canvas>
        <div class="camera-controls">
          <button class="btn-capture" id="btn-capture">
            📷 Capturar
          </button>
          <button class="btn-cancel-camera" id="btn-cancel-camera">
            ❌ Cancelar
          </button>
        </div>
        <p class="camera-hint">Asegúrate de permitir el acceso a la cámara</p>
      </div>
    `;

    document.body.appendChild(modal);

    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('camera-canvas');
    let stream = null;

    // Intentar acceder a la cámara
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'user', // 'user' para cámara frontal, 'environment' para trasera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
    .then(mediaStream => {
      stream = mediaStream;
      video.srcObject = stream;
    })
    .catch(err => {
      console.error('❌ Error al acceder a la cámara:', err);
      document.body.removeChild(modal);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        reject(new Error('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.'));
      } else if (err.name === 'NotFoundError') {
        reject(new Error('No se encontró ninguna cámara en este dispositivo.'));
      } else {
        reject(new Error('No se pudo acceder a la cámara: ' + err.message));
      }
    });

    // Capturar foto
    document.getElementById('btn-capture').onclick = () => {
      // Configurar canvas con las dimensiones del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dibujar el frame actual del video en el canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convertir a base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      // Detener el stream de la cámara
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Remover modal
      document.body.removeChild(modal);
      
      resolve(base64Image);
    };

    // Cancelar
    document.getElementById('btn-cancel-camera').onclick = () => {
      // Detener el stream de la cámara
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      document.body.removeChild(modal);
      reject(new Error('Cancelled'));
    };
  });
}

/**
 * Subir imagen a Supabase Storage
 * @param {string} base64Image - Imagen en formato base64
 * @param {string} type - Tipo de imagen ('profile', 'post', 'general')
 * @param {string} token - Token de autenticación
 * @returns {Promise<string>} URL pública de la imagen subida
 */
export async function uploadImageToSupabase(base64Image, type, token) {
  try {
    console.log('📤 Iniciando upload de imagen...');
    console.log('📍 URL:', 'http://localhost:3000/api/uploads/base64');
    console.log('🔑 Token presente:', !!token);
    console.log('📦 Tipo:', type);
    console.log('📊 Tamaño base64:', Math.round(base64Image.length / 1024), 'KB');

    const res = await fetch('http://localhost:3000/api/uploads/base64', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        image: base64Image,
        type: type,
      }),
    });

    console.log('📡 Respuesta del servidor - Status:', res.status);
    console.log('📡 Content-Type:', res.headers.get('content-type'));

    // Verificar si la respuesta es JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('❌ Respuesta no es JSON:', text.substring(0, 200));
      throw new Error('El servidor no respondió correctamente. Verifica que esté corriendo.');
    }

    const data = await res.json();
    console.log('📦 Datos recibidos:', data);

    if (!res.ok) {
      throw new Error(data.error || 'Error al subir imagen');
    }

    console.log('✅ Imagen subida correctamente:', data.url);
    return data.url;
  } catch (err) {
    console.error('❌ Error al subir imagen:', err);
    throw err;
  }
}

/**
 * Mostrar modal para elegir entre cámara o galería
 * @returns {Promise<string>} Base64 de la imagen seleccionada
 */
export function showImageSourceModal() {
  return new Promise((resolve, reject) => {
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'image-source-modal';
    modal.innerHTML = `
      <div class="image-source-modal-content">
        <h3>📸 Seleccionar imagen</h3>
        <button class="btn-camera" id="btn-camera">
          📷 Tomar Foto
        </button>
        <button class="btn-gallery" id="btn-gallery">
          🖼️ Elegir de Galería
        </button>
        <button class="btn-cancel" id="btn-cancel">
          ❌ Cancelar
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('btn-camera').onclick = async () => {
      try {
        const image = await capturePhotoFromCamera();
        document.body.removeChild(modal);
        resolve(image);
      } catch (err) {
        document.body.removeChild(modal);
        reject(err);
      }
    };

    document.getElementById('btn-gallery').onclick = async () => {
      try {
        const image = await selectImageFromGallery();
        document.body.removeChild(modal);
        resolve(image);
      } catch (err) {
        document.body.removeChild(modal);
        reject(err);
      }
    };

    document.getElementById('btn-cancel').onclick = () => {
      document.body.removeChild(modal);
      reject(new Error('Cancelled'));
    };

    // Cerrar al hacer click fuera
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        reject(new Error('Cancelled'));
      }
    };
  });
}

