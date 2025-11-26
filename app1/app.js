// 📤 Importar utilidades de upload de imágenes
import { showImageSourceModal, uploadImageToSupabase } from './utils/imageUpload.js';

// 🔧 CONFIGURACIÓN DE API - Detecta automáticamente si está en desarrollo o producción
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment 
  ? "http://localhost:3000" 
  : "https://pin-food-95bb.vercel.app";

const API_URL = `${API_BASE_URL}/api/auth`;
const FEED_API_URL = `${API_BASE_URL}/api/feed`;
const PROFILE_API_URL = `${API_BASE_URL}/api/profile`;
const RESTAURANTS_API_URL = `${API_BASE_URL}/api/restaurants`;
const SAVED_POSTS_API_URL = `${API_BASE_URL}/api/saved-posts`;
const msg = document.getElementById("msg");

// 🔑 FUNCIÓN AUXILIAR PARA OBTENER TOKEN DE FORMA SEGURA
function obtenerToken() {
  try {
    const sessionData = localStorage.getItem("session");
    if (!sessionData) {
      console.warn("⚠️ No hay sesión guardada en localStorage");
      return null;
    }
    
    const session = JSON.parse(sessionData);
    console.log("🔍 Estructura de sesión:", Object.keys(session));
    
    // Verificar que la sesión tenga el formato correcto
    if (session && session.access_token) {
      console.log("✅ Token encontrado en session.access_token");
      return session.access_token;
    }
    
    // Si no tiene access_token directamente, puede estar anidado
    if (session && session.session && session.session.access_token) {
      console.log("✅ Token encontrado en session.session.access_token");
      return session.session.access_token;
    }
    
    // Buscar en diferentes ubicaciones posibles
    if (session && typeof session === 'object') {
      // Intentar buscar en todas las propiedades
      for (const key in session) {
        if (key.includes('token') || key.includes('access')) {
          const tokenValue = session[key];
          if (typeof tokenValue === 'string' && tokenValue.length > 50) {
            console.log(`✅ Token encontrado en session.${key}`);
            return tokenValue;
          }
        }
      }
    }
    
    console.error("❌ No se encontró access_token en la sesión");
    console.error("📦 Contenido de la sesión:", JSON.stringify(session, null, 2));
    return null;
  } catch (e) {
    console.error("❌ Error al obtener token:", e);
    return null;
  }
}

// 🔄 FUNCIÓN PARA REFRESCAR EL TOKEN
async function refrescarToken() {
  try {
    const sessionData = localStorage.getItem("session");
    if (!sessionData) {
      return false;
    }
    
    const session = JSON.parse(sessionData);
    const refreshToken = session.refresh_token || (session.session && session.session.refresh_token);
    
    if (!refreshToken) {
      console.warn("⚠️ No hay refresh_token disponible");
      return false;
    }
    
    console.log("🔄 Intentando refrescar token...");
    
    // Intentar refrescar usando el endpoint de Supabase directamente
    // O usando nuestro backend si tiene un endpoint para refrescar
    const res = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.session) {
        localStorage.setItem("session", JSON.stringify(data.session));
        console.log("✅ Token refrescado exitosamente");
        return true;
      }
    }
    
    // Si el backend no tiene endpoint de refresh, intentar directamente con Supabase
    // (esto requiere tener acceso al cliente de Supabase en el frontend)
    return false;
  } catch (err) {
    console.error("❌ Error al refrescar token:", err);
    return false;
  }
}

// 🔑 FUNCIÓN AUXILIAR PARA OBTENER TOKEN CON INTENTO DE REFRESH SI ES NECESARIO
async function obtenerTokenORefrescar() {
  let token = obtenerToken();
  
  // Si no hay token, no podemos hacer nada
  if (!token) {
    return null;
  }
  
  // Intentar verificar si el token está expirado haciendo una petición de prueba
  // Por ahora, simplemente retornamos el token y manejamos el error cuando ocurra
  return token;
}

// 🔑 FUNCIÓN AUXILIAR PARA VERIFICAR Y RENOVAR SESIÓN
function verificarSesion() {
  const token = obtenerToken();
  if (!token) {
    alert("Sesión expirada o no válida. Por favor inicia sesión nuevamente.");
    localStorage.removeItem("session");
    currentUser = null;
    authSection.style.display = "block";
    feedSection.style.display = "none";
    welcomeSection.style.display = "none";
    myProfileSection.style.display = "none";
    userProfileSection.style.display = "none";
    return false;
  }
  return true;
}

// Referencias a secciones
const authSection = document.getElementById("auth-section");
const welcomeSection = document.getElementById("welcome-section");
const feedSection = document.getElementById("feed-section");
const myProfileSection = document.getElementById("my-profile-section");
const userProfileSection = document.getElementById("user-profile-section");
const welcomeMsg = document.getElementById("welcome-msg");
const logoutBtn = document.getElementById("logout");
const goToFeedBtn = document.getElementById("go-to-feed");
const goToProfileBtn = document.getElementById("go-to-profile");
const backToWelcomeBtn = document.getElementById("back-to-welcome");
const backFromMyProfileBtn = document.getElementById("back-from-my-profile");
const backFromUserProfileBtn = document.getElementById("back-from-user-profile");

let currentUser = null;

// Tabs auth (si existen)
const tabRegisterUser = document.getElementById('tab-register-user');
const tabLoginUser = document.getElementById('tab-login-user');
const formRegisterUser = document.getElementById('register-form');
const formLoginUser = document.getElementById('login-form');
if (tabRegisterUser && tabLoginUser && formRegisterUser && formLoginUser) {
  tabRegisterUser.addEventListener('click', () => {
    tabRegisterUser.classList.add('auth-tab-active');
    tabLoginUser.classList.remove('auth-tab-active');
    formRegisterUser.style.display = '';
    formLoginUser.style.display = 'none';
  });
  tabLoginUser.addEventListener('click', () => {
    tabLoginUser.classList.add('auth-tab-active');
    tabRegisterUser.classList.remove('auth-tab-active');
    formRegisterUser.style.display = 'none';
    formLoginUser.style.display = '';
  });
}

// Si ya hay sesión guardada → mostrar bienvenida
if (localStorage.getItem("session")) {
  const session = JSON.parse(localStorage.getItem("session"));
  currentUser = session.user;
  mostrarBienvenida(currentUser);
}

// 🧾 REGISTRO
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const full_name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-pass").value.trim();

  if (!full_name || !email || !password) {
    msg.textContent = "Por favor completa todos los campos.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name, email, password }),
    });

    const data = await res.json();
    msg.textContent = data.message || data.error;

    if (res.ok) {
      console.log("✅ Registro exitoso:", data);
      mostrarBienvenida(data.user);
    } else {
      console.error("❌ Error al registrar:", data);
    }
  } catch (err) {
    console.error("❌ Error en el frontend (registro):", err);
    msg.textContent = "Error al registrar usuario.";
  }
});

// 🔐 LOGIN
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-pass").value.trim();

  if (!email || !password) {
    msg.textContent = "Por favor ingresa tu correo y contraseña.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = `Error: ${data.error}`;
      console.error("❌ Error al iniciar sesión:", data);
      return;
    }

    console.log("✅ Login exitoso:", data);
    console.log("🔑 Session data:", data.session);
    console.log("🔑 Access token:", data.session.access_token?.substring(0, 30) + "...");
    
    // Guardar la sesión COMPLETA
    localStorage.setItem("session", JSON.stringify(data.session));
    
    // Verificar que se guardó correctamente
    const savedSession = localStorage.getItem("session");
    console.log("💾 Sesión guardada:", savedSession ? "✅ Sí" : "❌ No");
    
    currentUser = data.user;
    mostrarBienvenida(data.user);
  } catch (err) {
    console.error("❌ Error en el frontend (login):", err);
    msg.textContent = "Error al iniciar sesión.";
  }
});

// 🚪 LOGOUT
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("session");
  currentUser = null;
  authSection.style.display = "block";
  welcomeSection.style.display = "none";
  feedSection.style.display = "none";
  myProfileSection.style.display = "none";
  userProfileSection.style.display = "none";
  msg.textContent = "";
});

// 📰 IR AL FEED (solo si el botón existe - ya no se usa, funcionalidad en navbar)
if (goToFeedBtn) {
  goToFeedBtn.addEventListener("click", () => {
    welcomeSection.style.display = "none";
    feedSection.style.display = "block";
    cargarFeed();
    // Los restaurantes se cargarán cuando el usuario navegue a crear post
  });
}

// ⬅️ VOLVER A BIENVENIDA (ya no se usa, pantalla eliminada)
// Este botón ya no existe en el HTML, la funcionalidad está en el navbar

// 📝 CREAR NUEVA PUBLICACIÓN (Formulario del feed - ya no se usa)
// Este formulario fue eliminado del feed, solo existe en la página exclusiva
// La funcionalidad está en inicializarFormularioCrearPost()
/*
const postForm = document.getElementById("post-form");
if (postForm) {
  postForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const content = document.getElementById("post-content").value.trim();
  const image_url = document.getElementById("post-image").value.trim();
  const restaurant_id = document.getElementById("post-restaurant").value;

  if (!content) {
    alert("Por favor escribe algo para publicar");
    return;
  }

  if (!verificarSesion()) {
    return;
  }
  
  const token = obtenerToken();
  if (!token) {
    alert("Token no encontrado. Por favor inicia sesión nuevamente.");
    return;
  }
  
  const session = JSON.parse(localStorage.getItem("session")); // Para otros datos si se necesitan

  try {
    const body = { content, image_url };
    // Ubicación opcional
    const locLat = document.getElementById("post-location-lat").value;
    const locLng = document.getElementById("post-location-lng").value;
    const locName = document.getElementById("post-location-name").value;
    if (locLat && locLng) {
      body.location_lat = parseFloat(locLat);
      body.location_lng = parseFloat(locLng);
      if (locName) body.location_name = locName;
    }
    if (restaurant_id) {
      body.restaurant_id = restaurant_id;
    }

    const res = await fetch(FEED_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      console.log("✅ Publicación creada:", data);
      document.getElementById("post-content").value = "";
      document.getElementById("post-image").value = "";
      document.getElementById("post-restaurant").value = "";
      document.getElementById("post-image-preview").style.display = "none";
      document.getElementById("post-image-preview").innerHTML = "";
      document.getElementById("select-post-image-btn").textContent = "📸 Agregar Imagen (opcional)";
      // Limpiar ubicación
      document.getElementById("post-location-lat").value = "";
      document.getElementById("post-location-lng").value = "";
      document.getElementById("post-location-name").value = "";
      const chip = document.getElementById("post-location-chip");
      if (chip) { chip.style.display = "none"; chip.innerHTML = ""; }
      cargarFeed();
    } else {
      console.error("❌ Error al crear publicación:", data);
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error("❌ Error en el frontend (crear post):", err);
    alert("Error al crear publicación.");
  }
  });
}
*/

// 📸 Event listener para seleccionar imagen en posts (ya no se usa en el feed)
// Este botón fue eliminado del feed, solo existe en la página exclusiva
/*
const selectPostImageBtn = document.getElementById("select-post-image-btn");
if (selectPostImageBtn) {
  selectPostImageBtn.addEventListener("click", async () => {
  try {
    // Mostrar modal para elegir cámara o galería
    const base64Image = await showImageSourceModal();
    
    // Mostrar loading en el botón
    const btn = document.getElementById("select-post-image-btn");
    const originalText = btn.textContent;
    btn.textContent = "⏳ Subiendo...";
    btn.disabled = true;

    // Subir imagen a Supabase
    if (!verificarSesion()) {
      return;
    }
    const token = obtenerToken();
    if (!token) {
      alert("Token no encontrado. Por favor inicia sesión nuevamente.");
      return;
    }
    const imageUrl = await uploadImageToSupabase(base64Image, 'post', token);

    // Mostrar preview
    const preview = document.getElementById("post-image-preview");
    preview.innerHTML = `
      <img src="${imageUrl}" alt="Preview" />
      <button type="button" class="btn-remove-image" onclick="removePostImage()">❌ Quitar</button>
    `;
    preview.style.display = "block";
    
    // Guardar URL en el input hidden
    document.getElementById("post-image").value = imageUrl;

    // Restaurar botón
    btn.textContent = "✅ Imagen agregada";
    btn.disabled = false;

    console.log("✅ Imagen de post subida:", imageUrl);
    
  } catch (err) {
    // Restaurar botón
    const btn = document.getElementById("select-post-image-btn");
    btn.textContent = "📸 Agregar Imagen (opcional)";
    btn.disabled = false;

    if (err.message !== 'Cancelled') {
      console.error("❌ Error al seleccionar imagen:", err);
      alert("Error al subir imagen: " + err.message);
    }
  }
  });
}
*/

// Función para quitar imagen del post (ya no se usa en el feed)
// Solo se usa en el formulario exclusivo ahora
/*
window.removePostImage = function() {
  document.getElementById("post-image").value = "";
  document.getElementById("post-image-preview").style.display = "none";
  document.getElementById("post-image-preview").innerHTML = "";
  document.getElementById("select-post-image-btn").textContent = "📸 Agregar Imagen (opcional)";
};
*/

// ============================
// 📍 Selección de ubicación (Leaflet) - YA NO SE USA EN EL FEED
// Esta funcionalidad ahora está en inicializarSelectoresCrearPost() para el formulario exclusivo
// ============================
(function setupLocationPicker() {
  const openBtn = document.getElementById("select-post-location-btn");
  if (!openBtn) return; // Este botón ya no existe en el feed, solo en el formulario exclusivo

  let mapInstance = null;
  let currentMarker = null;
  let selectedLatLng = null;

  async function loadGoogleMapsIfAvailable() {
    if (window.google && window.google.maps) return true;
    const key = localStorage.getItem('gmaps_api_key');
    if (!key) return false;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(false);
      document.head.appendChild(script);
    }).catch(() => false);
  }

  function openMapModal() {
    const modal = document.getElementById("map-modal");
    modal.style.display = "flex";

    // Preferir Google Maps si hay API key; si no, Leaflet
    setTimeout(async () => {
      const canUseGoogle = await loadGoogleMapsIfAvailable();
      if (canUseGoogle) {
        // Google Maps
        if (!mapInstance) {
          mapInstance = new google.maps.Map(document.getElementById('leaflet-map'), {
            center: { lat: 4.711, lng: -74.0721 },
            zoom: 12,
            mapTypeControl: false,
          });
          currentMarker = new google.maps.Marker({ map: mapInstance, draggable: false });
          mapInstance.addListener('click', (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            selectedLatLng = { lat, lng };
            currentMarker.setPosition(e.latLng);
          });

          // Autocomplete de lugares en el input
          const input = document.getElementById('location-search');
          const autocomplete = new google.maps.places.Autocomplete(input);
          autocomplete.bindTo('bounds', mapInstance);
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) return;
            mapInstance.panTo(place.geometry.location);
            mapInstance.setZoom(15);
            currentMarker.setPosition(place.geometry.location);
            selectedLatLng = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
          });

          // Centrar en geolocalización
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
              const center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              mapInstance.setCenter(center);
              mapInstance.setZoom(15);
            });
          }
        }
      } else {
        // Leaflet (fallback)
        if (!mapInstance) {
          mapInstance = L.map('leaflet-map');
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(mapInstance);
          mapInstance.on('click', (e) => {
            const { lat, lng } = e.latlng;
            selectedLatLng = { lat, lng };
            if (currentMarker) currentMarker.remove();
            currentMarker = L.marker([lat, lng]).addTo(mapInstance);
          });
        }
        mapInstance.invalidateSize();
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              mapInstance.setView([latitude, longitude], 15);
            },
            () => mapInstance.setView([4.711, -74.0721], 12),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          mapInstance.setView([4.711, -74.0721], 12);
        }
      }
    }, 50);
  }

  function closeMapModal() {
    const modal = document.getElementById("map-modal");
    modal.style.display = "none";
  }

  if (openBtn) {
    openBtn.addEventListener('click', openMapModal);
  }
  
  const cancelLocationBtn = document.getElementById('cancel-location');
  if (cancelLocationBtn) {
    cancelLocationBtn.addEventListener('click', closeMapModal);
  }

  // 🔍 Búsqueda de direcciones (Geocodificación con Nominatim - OpenStreetMap)
  let locationSearchTimeout;
  const locationSearchInput = document.getElementById('location-search');
  if (locationSearchInput) {
    locationSearchInput.addEventListener('input', async (e) => {
      clearTimeout(locationSearchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 3) return;

      locationSearchTimeout = setTimeout(async () => {
      try {
        // Usar Nominatim (OpenStreetMap) para buscar direcciones
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          {
            headers: {
              'User-Agent': 'PinFood-App/1.0' // Nominatim requiere User-Agent
            }
          }
        );
        const results = await res.json();

        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          
          // Centrar mapa en el resultado
          mapInstance.setView([lat, lng], 15);
          
          // Colocar marcador
          if (currentMarker) currentMarker.remove();
          currentMarker = L.marker([lat, lng]).addTo(mapInstance);
          
          selectedLatLng = { lat, lng };
          
          console.log('📍 Ubicación encontrada:', first.display_name);
        }
      } catch (err) {
        console.error('Error en búsqueda:', err);
      }
    }, 500);
    });
  }

  const confirmLocationBtn = document.getElementById('confirm-location');
  if (confirmLocationBtn) {
    confirmLocationBtn.addEventListener('click', async () => {
      if (!selectedLatLng) {
        alert('Toca en el mapa para elegir una ubicación.');
        return;
      }

    const nameInput = document.getElementById('post-location-name');
    const latInput = document.getElementById('post-location-lat');
    const lngInput = document.getElementById('post-location-lng');

    // Intentar obtener nombre del lugar (Geocodificación inversa)
    let displayName = document.getElementById('location-search').value.trim();
    
    if (!displayName) {
      try {
        // Obtener nombre del lugar desde coordenadas usando Nominatim
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLatLng.lat}&lon=${selectedLatLng.lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'PinFood-App/1.0'
            }
          }
        );
        const data = await res.json();
        
        if (data && data.display_name) {
          // Usar nombre corto del lugar (primeros elementos más relevantes)
          const parts = data.display_name.split(',');
          displayName = parts.slice(0, Math.min(3, parts.length)).join(', ').trim();
        } else {
          displayName = `${selectedLatLng.lat.toFixed(5)}, ${selectedLatLng.lng.toFixed(5)}`;
        }
      } catch (err) {
        console.error('Error en geocodificación inversa:', err);
        displayName = `${selectedLatLng.lat.toFixed(5)}, ${selectedLatLng.lng.toFixed(5)}`;
      }
    }

      nameInput.value = displayName;
      latInput.value = String(selectedLatLng.lat);
      lngInput.value = String(selectedLatLng.lng);

      // Mostrar chip de ubicación
      const chip = document.getElementById('post-location-chip');
      if (chip) {
        chip.innerHTML = `📍 ${displayName} <button type="button" class="remove-loc" id="remove-loc">✖</button>`;
        chip.style.display = 'inline-flex';

        const removeLocBtn = document.getElementById('remove-loc');
        if (removeLocBtn) {
          removeLocBtn.onclick = () => {
            nameInput.value = '';
            latInput.value = '';
            lngInput.value = '';
            chip.style.display = 'none';
            chip.innerHTML = '';
            const locationSearchValue = document.getElementById('location-search');
            if (locationSearchValue) {
              locationSearchValue.value = '';
            }
          };
        }
      }

      closeMapModal();
    });
  }
})();

// 📰 CARGAR FEED
async function cargarFeed() {
  const feedContainer = document.getElementById("feed-container");
  if (!feedContainer) {
    console.error("❌ feed-container no encontrado");
    return;
  }
  feedContainer.innerHTML = "<p>Cargando publicaciones...</p>";

  try {
    const res = await fetch(FEED_API_URL);
    const data = await res.json();

    if (!res.ok) {
      feedContainer.innerHTML = `<p>Error al cargar el feed: ${data.error}</p>`;
      return;
    }

    const posts = data.posts;

    if (posts.length === 0) {
      feedContainer.innerHTML = "<p>No hay publicaciones aún. ¡Sé el primero en publicar!</p>";
      return;
    }

    feedContainer.innerHTML = posts
      .map(
        (post) => {
          const isOwner = currentUser && post.user_id === currentUser.id;
          const likesCount = post.likes?.[0]?.count || 0;
          const commentsCount = post.comments?.[0]?.count || 0;

          return `
            <div class="post-card" data-post-id="${post.id}">
              <div class="post-header">
                <strong class="user-name-link" onclick="verPerfilUsuario('${post.user_id}', '${post.users?.full_name || post.users?.email || "Usuario"}')">${post.users?.full_name || post.users?.email || "Usuario"}</strong>
                <small>${new Date(post.created_at).toLocaleString()}</small>
              </div>
              <p class="post-content">${post.content}</p>
              ${post.image_url ? `<img src="${post.image_url}" alt="Imagen del post" class="post-image">` : ""}
              ${post.restaurant ? `
                <div class="restaurant-tag">
                  <span class="restaurant-tag-icon">🍽️</span>
                  <span class="restaurant-tag-name">${post.restaurant.restaurant_name}</span>
                  ${post.restaurant.ubicacion ? `<span class="restaurant-tag-location">📍 ${post.restaurant.ubicacion}</span>` : ""}
                </div>
              ` : ""}
              ${post.location_lat && post.location_lng ? `
                <div class="post-location-chip">
                  <span class="location-icon">📍</span>
                  <span class="location-text">${post.location_name || `${post.location_lat.toFixed ? post.location_lat.toFixed(5) : post.location_lat}, ${post.location_lng.toFixed ? post.location_lng.toFixed(5) : post.location_lng}`}</span>
                  <a href="https://www.google.com/maps?q=${post.location_lat},${post.location_lng}" target="_blank" class="location-map-link" title="Ver en Google Maps">🗺️ Ver mapa</a>
                </div>
              ` : ""}
              
              <div class="post-actions">
                <button class="btn-like" onclick="toggleLike('${post.id}')">
                  ❤️ ${likesCount} Me gusta
                </button>
                <button class="btn-comment" onclick="toggleComments('${post.id}')">
                  💬 ${commentsCount} Comentarios
                </button>
                <button class="btn-save" onclick="toggleSavePost('${post.id}')">
                  🔖 Guardar
                </button>
                ${isOwner ? `<button class="btn-delete" onclick="eliminarPost('${post.id}')">🗑️ Eliminar</button>` : ""}
              </div>

              <div class="comments-section" id="comments-${post.id}" style="display: none;">
                <div class="add-comment">
                  <input type="text" id="comment-input-${post.id}" placeholder="Escribe un comentario..." />
                  <button onclick="agregarComentario('${post.id}')">Enviar</button>
                </div>
                <div class="comments-list" id="comments-list-${post.id}">
                  <p>Cargando comentarios...</p>
                </div>
              </div>
            </div>
          `;
        }
      )
      .join("");
  } catch (err) {
    console.error("❌ Error al cargar el feed:", err);
    feedContainer.innerHTML = "<p>Error al cargar las publicaciones.</p>";
  }
}

// ❤️ DAR/QUITAR LIKE
window.toggleLike = async function (postId) {
  if (!verificarSesion()) {
    return;
  }

  const token = obtenerToken();
  if (!token) {
    alert("Token no encontrado. Por favor inicia sesión nuevamente.");
    return;
  }

  console.log("🔑 Enviando like con token:", token.substring(0, 20) + "...");

  try {
    const res = await fetch(`${FEED_API_URL}/${postId}/like`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Respuesta like:", res.status);

    if (res.status === 401) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      localStorage.removeItem("session");
      location.reload();
      return;
    }

    if (res.ok) {
      console.log("✅ Like agregado");
      cargarFeed();
    } else {
      const data = await res.json();
      console.log("📊 Datos respuesta:", data);
      
      if (data.error && data.error.includes("Ya diste like")) {
        // Si ya dio like, quitarlo
        const deleteRes = await fetch(`${FEED_API_URL}/${postId}/like`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (deleteRes.ok) {
          console.log("✅ Like removido");
          cargarFeed();
        }
      } else {
        alert(`Error: ${data.error || "No se pudo dar like"}`);
      }
    }
  } catch (err) {
    console.error("❌ Error al dar like:", err);
    alert("Error de conexión al dar like");
  }
};

// 💬 MOSTRAR/OCULTAR COMENTARIOS
window.toggleComments = async function (postId) {
  const commentsSection = document.getElementById(`comments-${postId}`);
  if (commentsSection.style.display === "none") {
    commentsSection.style.display = "block";
    await cargarComentarios(postId);
  } else {
    commentsSection.style.display = "none";
  }
};

// 📖 CARGAR COMENTARIOS
async function cargarComentarios(postId) {
  const commentsList = document.getElementById(`comments-list-${postId}`);
  commentsList.innerHTML = "<p>Cargando comentarios...</p>";

  try {
    const res = await fetch(`${FEED_API_URL}/${postId}/comments`);
    const data = await res.json();

    if (!res.ok) {
      commentsList.innerHTML = `<p>Error al cargar comentarios</p>`;
      return;
    }

    const comments = data.comments;

    if (comments.length === 0) {
      commentsList.innerHTML = "<p class='no-comments'>No hay comentarios aún</p>";
      return;
    }

    commentsList.innerHTML = comments
      .map(
        (comment) => `
        <div class="comment">
          <strong>${comment.users?.full_name || comment.users?.email || "Usuario"}</strong>
          <p>${comment.content}</p>
          <small>${new Date(comment.created_at).toLocaleString()}</small>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("❌ Error al cargar comentarios:", err);
    commentsList.innerHTML = "<p>Error al cargar comentarios</p>";
  }
}

// ➕ AGREGAR COMENTARIO
window.agregarComentario = async function (postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();

  if (!content) {
    alert("Escribe un comentario");
    return;
  }

  if (!verificarSesion()) {
    return;
  }

  const token = obtenerToken();
  if (!token) {
    alert("Token no encontrado. Por favor inicia sesión nuevamente.");
    return;
  }

  console.log("💬 Enviando comentario con token:", token.substring(0, 20) + "...");

  try {
    const res = await fetch(`${FEED_API_URL}/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    console.log("📡 Respuesta comentario:", res.status);

    if (res.status === 401) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      localStorage.removeItem("session");
      location.reload();
      return;
    }

    if (res.ok) {
      console.log("✅ Comentario agregado");
      input.value = "";
      await cargarComentarios(postId);
      cargarFeed(); // Actualizar contador
    } else {
      const data = await res.json();
      console.error("❌ Error al comentar:", data);
      alert(`Error: ${data.error || "No se pudo agregar el comentario"}`);
    }
  } catch (err) {
    console.error("❌ Error al agregar comentario:", err);
    alert("Error de conexión al agregar comentario");
  }
};

// 🗑️ ELIMINAR POST
window.eliminarPost = async function (postId) {
  if (!confirm("¿Seguro que quieres eliminar esta publicación?")) {
    return;
  }

  if (!verificarSesion()) {
    return;
  }

  const token = obtenerToken();
  if (!token) {
    alert("Token no encontrado. Por favor inicia sesión nuevamente.");
    return;
  }

  console.log("🗑️ Eliminando post con token:", token.substring(0, 20) + "...");

  try {
    const res = await fetch(`${FEED_API_URL}/${postId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Respuesta eliminar:", res.status);

    if (res.status === 401) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      localStorage.removeItem("session");
      location.reload();
      return;
    }

    if (res.ok) {
      console.log("✅ Post eliminado");
      cargarFeed();
    } else {
      const data = await res.json();
      console.error("❌ Error al eliminar:", data);
      alert(`Error: ${data.error || "No se pudo eliminar la publicación"}`);
    }
  } catch (err) {
    console.error("❌ Error al eliminar post:", err);
    alert("Error de conexión al eliminar publicación");
  }
};

// 🔹 Función para mostrar la vista de bienvenida
function mostrarBienvenida(user) {
  authSection.style.display = "none";
  welcomeSection.style.display = "none"; // Ya no mostramos la pantalla de bienvenida
  feedSection.style.display = "block"; // Ir directamente al feed
  
  const createPostSection = document.getElementById("create-post-section");
  if (createPostSection) createPostSection.style.display = "none";
  
  myProfileSection.style.display = "none";
  userProfileSection.style.display = "none";
  // Inicializar navbar y filtros
  setTimeout(() => {
    inicializarNavbar();
    inicializarFiltros();
    inicializarBusquedaEnter(); // Inicializar búsqueda con Enter
    // Asegurarse de que el feed-container esté visible
    const feedContainer = document.getElementById('feed-container');
    if (feedContainer) {
      feedContainer.style.display = 'block';
      // Activar filtro "posts" por defecto
      activarFiltro('posts');
      actualizarNavbarActivo('home');
    } else {
      console.error('❌ No se encontró feed-container');
    }
  }, 100);
  // Los restaurantes se cargarán cuando el usuario navegue a la sección de crear post
  // Ya no se cargan aquí porque el formulario fue movido a una sección exclusiva
}

// 👤 IR A MI PERFIL (solo si el botón existe - ya no se usa, funcionalidad en navbar)
if (goToProfileBtn) {
  goToProfileBtn.addEventListener("click", () => {
    welcomeSection.style.display = "none";
    myProfileSection.style.display = "block";
    cargarMiPerfil();
  });
}

// ⬅️ VOLVER DESDE MI PERFIL (solo si el botón existe)
if (backFromMyProfileBtn) {
  backFromMyProfileBtn.addEventListener("click", () => {
    myProfileSection.style.display = "none";
    welcomeSection.style.display = "flex";
  });
}

// ⬅️ VOLVER DESDE PERFIL DE USUARIO (solo si el botón existe)
if (backFromUserProfileBtn) {
  backFromUserProfileBtn.addEventListener("click", () => {
    userProfileSection.style.display = "none";
    feedSection.style.display = "block";
  });
}

// 📱 CARGAR MI PERFIL
async function cargarMiPerfil() {
  const profileContent = document.getElementById("my-profile-content");
  profileContent.innerHTML = "<p>Cargando perfil...</p>";

  if (!currentUser) {
    profileContent.innerHTML = "<p>Error: No hay usuario logueado</p>";
    return;
  }

  console.log("👤 currentUser completo:", currentUser);
  console.log("🆔 currentUser.id:", currentUser.id);

  try {
    const res = await fetch(`${PROFILE_API_URL}/${currentUser.id}`);
    const data = await res.json();

    if (!res.ok) {
      profileContent.innerHTML = `<p>Error al cargar perfil: ${data.error}</p>`;
      return;
    }

    const { user, posts } = data;

    profileContent.innerHTML = `
      <div class="profile-container">
        <div class="profile-header-card">
          <div class="profile-picture">
            ${user.profile_picture_url 
              ? `<img src="${user.profile_picture_url}" alt="Foto de perfil" />` 
              : `<div class="profile-placeholder">👤</div>`
            }
          </div>
          <div class="profile-info">
            <h3>${user.full_name || "Usuario"}</h3>
            <p class="profile-email">📧 ${user.email}</p>
            <p class="profile-description">${user.description || "Sin descripción"}</p>
            <p class="profile-stats">📊 ${posts.length} publicaciones</p>
          </div>
        </div>

        <button id="edit-profile-btn" class="btn-primary">✏️ Editar Perfil</button>

        <div id="edit-profile-form" style="display: none;" class="edit-profile-form">
          <h3>Editar Perfil</h3>
          <input type="text" id="edit-name" placeholder="Nombre completo" value="${user.full_name || ""}" />
          <textarea id="edit-description" placeholder="Descripción" rows="3">${user.description || ""}</textarea>
          
          <!-- Selector de foto de perfil -->
          <div class="profile-picture-selector">
            <label>Foto de Perfil:</label>
            <div id="profile-preview" class="image-preview">
              ${user.profile_picture_url 
                ? `<img src="${user.profile_picture_url}" alt="Preview" />` 
                : '<div class="no-image">Sin imagen</div>'
              }
            </div>
            <button type="button" id="select-profile-picture-btn" class="btn-select-image">
              📸 Seleccionar Imagen
            </button>
            <input type="hidden" id="edit-picture-url" value="${user.profile_picture_url || ""}" />
          </div>

          <div style="display: flex; gap: 10px;">
            <button id="save-profile-btn" class="btn-primary">💾 Guardar</button>
            <button id="cancel-edit-btn" class="btn-secondary">❌ Cancelar</button>
          </div>
        </div>

               <h3 style="margin-top: 30px;">Mis Publicaciones</h3>
               <div class="feed-container">
                 ${posts.length === 0 
                   ? "<p>No has publicado nada aún</p>" 
                   : posts.map(post => `
                     <div class="post-card">
                       <div class="post-header">
                         <strong>${user.full_name || user.email}</strong>
                         <small>${new Date(post.created_at).toLocaleString()}</small>
                       </div>
                       <p class="post-content">${post.content}</p>
                       ${post.image_url ? `<img src="${post.image_url}" alt="Imagen del post" class="post-image">` : ""}
                       ${post.restaurant ? `
                         <div class="restaurant-tag">
                           <span class="restaurant-tag-icon">🍽️</span>
                           <span class="restaurant-tag-name">${post.restaurant.restaurant_name}</span>
                           ${post.restaurant.ubicacion ? `<span class="restaurant-tag-location">📍 ${post.restaurant.ubicacion}</span>` : ""}
                         </div>
                       ` : ""}
                       <div class="post-actions">
                         <span>❤️ ${post.likes?.[0]?.count || 0} Me gusta</span>
                         <span>💬 ${post.comments?.[0]?.count || 0} Comentarios</span>
                       </div>
                     </div>
                   `).join("")
                 }
               </div>

        <h3 style="margin-top: 30px;">🔖 Publicaciones Guardadas</h3>
        <div id="saved-posts-container" class="feed-container">
          <p>Cargando publicaciones guardadas...</p>
        </div>
      </div>
    `;

    // Event listeners para editar perfil
    document.getElementById("edit-profile-btn").addEventListener("click", () => {
      document.getElementById("edit-profile-form").style.display = "block";
    });

    document.getElementById("cancel-edit-btn").addEventListener("click", () => {
      document.getElementById("edit-profile-form").style.display = "none";
    });

    document.getElementById("save-profile-btn").addEventListener("click", async () => {
      await guardarPerfil(user.id);
    });

    // 📸 Event listener para seleccionar foto de perfil
    document.getElementById("select-profile-picture-btn").addEventListener("click", async () => {
      try {
        // Mostrar modal para elegir cámara o galería
        const base64Image = await showImageSourceModal();
        
        // Mostrar loading
        const preview = document.getElementById("profile-preview");
        preview.innerHTML = '<div class="loading">Subiendo imagen...</div>';

        // Subir imagen a Supabase
        if (!verificarSesion()) {
          return;
        }
        const token = obtenerToken();
        if (!token) {
          alert("Token no encontrado. Por favor inicia sesión nuevamente.");
          return;
        }
        const imageUrl = await uploadImageToSupabase(base64Image, 'profile', token);

        // Actualizar preview
        preview.innerHTML = `<img src="${imageUrl}" alt="Preview" />`;
        
        // Guardar URL en el input hidden
        document.getElementById("edit-picture-url").value = imageUrl;

        console.log("✅ Imagen subida exitosamente:", imageUrl);
        
      } catch (err) {
        if (err.message !== 'Cancelled') {
          console.error("❌ Error al seleccionar imagen:", err);
          alert("Error al subir imagen: " + err.message);
        }
      }
    });

    // Cargar posts guardados
    cargarPostsGuardados(user.id);

  } catch (err) {
    console.error("❌ Error al cargar perfil:", err);
    profileContent.innerHTML = "<p>Error al cargar perfil</p>";
  }
}

// 📚 CARGAR POSTS GUARDADOS
async function cargarPostsGuardados(userId) {
  const container = document.getElementById("saved-posts-container");
  if (!container) {
    console.error("❌ No se encontró el contenedor saved-posts-container");
    return;
  }

  container.innerHTML = "<p>Cargando publicaciones guardadas...</p>";

  try {
    console.log("📚 Obteniendo posts guardados para usuario:", userId);
    const res = await fetch(`${SAVED_POSTS_API_URL}/user/${userId}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || "Error desconocido" };
      }
      console.error("❌ Error al obtener posts guardados:", errorData);
      container.innerHTML = `<p>Error al cargar: ${errorData.error || "Error desconocido"}</p>`;
      return;
    }

    const data = await res.json();
    console.log("📦 Datos recibidos:", data);

    const { posts } = data;

    if (!posts || posts.length === 0) {
      container.innerHTML = "<p>No has guardado ninguna publicación aún</p>";
      return;
    }

    console.log("✅ Mostrando", posts.length, "posts guardados");
    container.innerHTML = posts.map(post => `
            <div class="post-card">
              <div class="post-header">
                <strong class="user-name-link" onclick="verPerfilUsuario('${post.user_id}', '${post.users?.full_name || post.users?.email}')">${post.users?.full_name || post.users?.email || "Usuario"}</strong>
                <small>${new Date(post.created_at).toLocaleString()}</small>
              </div>
              <p class="post-content">${post.content}</p>
              ${post.image_url ? `<img src="${post.image_url}" alt="Imagen del post" class="post-image">` : ""}
              ${post.restaurant ? `
                <div class="restaurant-tag">
                  <span class="restaurant-tag-icon">🍽️</span>
                  <span class="restaurant-tag-name">${post.restaurant.restaurant_name}</span>
                  ${post.restaurant.ubicacion ? `<span class="restaurant-tag-location">📍 ${post.restaurant.ubicacion}</span>` : ""}
                </div>
              ` : ""}
              <div class="post-actions">
                <span>❤️ ${post.likes?.[0]?.count || 0} Me gusta</span>
                <span>💬 ${post.comments?.[0]?.count || 0} Comentarios</span>
                <button class="btn-save" onclick="toggleSavePost('${post.id}')">🗑️ Quitar</button>
              </div>
            </div>
          `).join("");
  } catch (err) {
    console.error("❌ Error al cargar posts guardados:", err);
    container.innerHTML = "<p>Error al cargar publicaciones guardadas</p>";
  }
}

// 💾 GUARDAR PERFIL
async function guardarPerfil(userId) {
  if (!verificarSesion()) {
    return;
  }

  const full_name = document.getElementById("edit-name").value.trim();
  const description = document.getElementById("edit-description").value.trim();
  const profile_picture_url = document.getElementById("edit-picture-url").value.trim();

  const token = obtenerToken();
  if (!token) {
    alert("Token no encontrado. Por favor inicia sesión nuevamente.");
    return;
  }

  try {
    const res = await fetch(`${PROFILE_API_URL}/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ full_name, description, profile_picture_url }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Perfil actualizado exitosamente");
      document.getElementById("edit-profile-form").style.display = "none";
      cargarMiPerfil();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error("❌ Error al guardar perfil:", err);
    alert("Error al guardar perfil");
  }
}

// 👥 VER PERFIL DE OTRO USUARIO
window.verPerfilUsuario = async function(userId, userName) {
  feedSection.style.display = "none";
  userProfileSection.style.display = "block";

  const profileContent = document.getElementById("user-profile-content");
  profileContent.innerHTML = "<p>Cargando perfil...</p>";

  try {
    const res = await fetch(`${PROFILE_API_URL}/${userId}`);
    const data = await res.json();

    if (!res.ok) {
      profileContent.innerHTML = `<p>Error al cargar perfil: ${data.error}</p>`;
      return;
    }

    const { user, posts } = data;

    profileContent.innerHTML = `
      <div class="profile-container">
        <div class="profile-header-card">
          <div class="profile-picture">
            ${user.profile_picture_url 
              ? `<img src="${user.profile_picture_url}" alt="Foto de perfil" />` 
              : `<div class="profile-placeholder">👤</div>`
            }
          </div>
          <div class="profile-info">
            <h3>${user.full_name || "Usuario"}</h3>
            <p class="profile-description">${user.description || "Sin descripción"}</p>
            <p class="profile-stats">📊 ${posts.length} publicaciones</p>
          </div>
        </div>

        <h3 style="margin-top: 30px;">Publicaciones</h3>
        <div class="feed-container">
          ${posts.length === 0 
            ? "<p>No hay publicaciones</p>" 
            : posts.map(post => `
              <div class="post-card">
                <div class="post-header">
                  <strong>${user.full_name || user.email}</strong>
                  <small>${new Date(post.created_at).toLocaleString()}</small>
                </div>
                <p class="post-content">${post.content}</p>
                ${post.image_url ? `<img src="${post.image_url}" alt="Imagen del post" class="post-image">` : ""}
                ${post.restaurant ? `
                  <div class="restaurant-tag">
                    <span class="restaurant-tag-icon">🍽️</span>
                    <span class="restaurant-tag-name">${post.restaurant.restaurant_name}</span>
                    ${post.restaurant.ubicacion ? `<span class="restaurant-tag-location">📍 ${post.restaurant.ubicacion}</span>` : ""}
                  </div>
                ` : ""}
                <div class="post-actions">
                  <span>❤️ ${post.likes?.[0]?.count || 0} Me gusta</span>
                  <span>💬 ${post.comments?.[0]?.count || 0} Comentarios</span>
                </div>
              </div>
            `).join("")
          }
        </div>
      </div>
    `;

  } catch (err) {
    console.error("❌ Error al cargar perfil:", err);
    profileContent.innerHTML = "<p>Error al cargar perfil</p>";
  }
};

// 🔽 TOGGLE SECCIÓN DE RESTAURANTES (solo si el botón existe)
const toggleRestaurantsBtn = document.getElementById("toggle-restaurants-btn");
if (toggleRestaurantsBtn) {
  toggleRestaurantsBtn.addEventListener("click", () => {
    const section = document.getElementById("search-restaurants-section");
    const icon = document.getElementById("toggle-icon");
    
    if (section && icon) {
      if (section.classList.contains("collapsed")) {
        section.classList.remove("collapsed");
        section.classList.add("expanded");
        icon.textContent = "▲";
      } else {
        section.classList.remove("expanded");
        section.classList.add("collapsed");
        icon.textContent = "▼";
      }
    }
  });
}

// 🔍 BUSCAR RESTAURANTES EN TIEMPO REAL
let searchTimeout;

// Función auxiliar para ejecutar la búsqueda
function ejecutarBusqueda(query) {
  if (query.length > 0) {
    // El timeout ya se cancela en el listener de Enter antes de llamar esta función
    cargarRestaurantes(query);
  } else {
    // Si está vacío, mostrar mensaje
    const resultsContainer = document.getElementById("restaurants-results");
    if (resultsContainer) {
      resultsContainer.innerHTML = '<p class="search-hint">✍️ Escribe para buscar restaurantes...</p>';
    }
  }
}

const searchInput = document.getElementById("search-restaurant-input");
if (searchInput) {
  // Listener para búsqueda mientras escribes
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    // Esperar 500ms después de que el usuario deje de escribir
    searchTimeout = setTimeout(() => {
      if (query.length > 0) {
        cargarRestaurantes(query);
      } else {
        // Si el campo está vacío, mostrar mensaje
        const resultsContainer = document.getElementById("restaurants-results");
        if (resultsContainer) {
          resultsContainer.innerHTML = '<p class="search-hint">✍️ Escribe para buscar restaurantes...</p>';
        }
      }
    }, 500);
  });
  
  // Listener para Enter (directo, como respaldo)
  if (!searchInput._enterListenerAdded) {
    searchInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        const query = this.value.trim();
        console.log("🔍 Enter presionado (respaldo), buscando:", query);
        
        // Cancelar timeout del input
        if (searchTimeout) clearTimeout(searchTimeout);
        
        // Activar filtro "food" si no está activo
        const foodFilter = document.querySelector('.filter-chip[data-filter="food"]');
        if (foodFilter && !foodFilter.classList.contains('active')) {
          activarFiltro('food');
          setTimeout(() => {
            ejecutarBusqueda(query);
          }, 100);
        } else {
          ejecutarBusqueda(query);
        }
      }
    });
    searchInput._enterListenerAdded = true;
  }
}

// Inicializar event listener para Enter cuando el feed se muestra
function inicializarBusquedaEnter() {
  const searchInput = document.getElementById("search-restaurant-input");
  if (!searchInput) {
    console.error("❌ No se encontró search-restaurant-input");
    return;
  }
  
  // Verificar si ya tiene el listener (usando una propiedad personalizada)
  if (searchInput._enterListenerAdded) {
    return; // Ya tiene el listener
  }
  
  // Agregar listener para Enter
  searchInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      const query = this.value.trim();
      console.log("🔍 Enter presionado, buscando:", query);
      
      // Cancelar timeout si existe
      try {
        if (typeof searchTimeout !== 'undefined' && searchTimeout !== null) {
          clearTimeout(searchTimeout);
        }
      } catch (err) {
        // Ignorar error
      }
      
      // Activar filtro "food" si no está activo
      const foodFilter = document.querySelector('.filter-chip[data-filter="food"]');
      if (foodFilter && !foodFilter.classList.contains('active')) {
        activarFiltro('food');
        // Esperar un poco para que la sección se muestre
        setTimeout(() => {
          ejecutarBusqueda(query);
        }, 100);
      } else {
        ejecutarBusqueda(query);
      }
    }
  });
  
  // Marcar que ya tiene el listener
  searchInput._enterListenerAdded = true;
}

// 🍴 CARGAR RESTAURANTES
async function cargarRestaurantes(query = "") {
  const resultsContainer = document.getElementById("restaurants-results");
  
  if (!resultsContainer) {
    console.error("❌ No se encontró el contenedor de resultados de restaurantes");
    return;
  }
  
  resultsContainer.innerHTML = "<p>🔍 Buscando restaurantes...</p>";

  try {
    const url = query 
      ? `${RESTAURANTS_API_URL}/search?query=${encodeURIComponent(query)}`
      : `${RESTAURANTS_API_URL}/search`;

    console.log("🔍 Buscando restaurantes:", query || "todos");
    
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Error en respuesta:", data);
      resultsContainer.innerHTML = `<p style="color: #c62828;">❌ Error al buscar: ${data.error || "Error desconocido"}</p>`;
      return;
    }

    const { restaurants } = data;
    
    console.log("✅ Restaurantes encontrados:", restaurants?.length || 0);

    if (!restaurants || restaurants.length === 0) {
      resultsContainer.innerHTML = query
        ? `<p style="text-align: center; padding: 20px; color: #666;">😔 No se encontraron restaurantes con "${query}"</p>`
        : `<p style="text-align: center; padding: 20px; color: #666;">🍽️ No hay restaurantes registrados aún</p>`;
      return;
    }

    resultsContainer.innerHTML = `
      <p class="results-count">📍 ${restaurants.length} restaurante(s) encontrado(s)</p>
      <div class="restaurants-list">
        ${restaurants.map(restaurant => `
          <div class="restaurant-item">
            <span class="restaurant-emoji">🍽️</span>
            <div class="restaurant-details">
              <strong class="restaurant-title">${restaurant.restaurant_name || "Sin nombre"}</strong>
              ${restaurant.ubicacion ? `<span class="restaurant-loc">📍 ${restaurant.ubicacion}</span>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    `;

  } catch (err) {
    console.error("❌ Error al buscar restaurantes:", err);
    resultsContainer.innerHTML = `<p style="color: #c62828;">❌ Error de conexión al buscar restaurantes. Verifica que el servidor esté corriendo.</p>`;
  }
}

// 🍴 CARGAR RESTAURANTES PARA ETIQUETAR EN POSTS
// Esta función ya no se usa porque el formulario fue movido a una sección exclusiva
// Se carga directamente en irACrearPost()
async function cargarRestaurantesParaEtiquetar() {
  // El select 'post-restaurant' ya no existe, se usa 'create-post-restaurant' ahora
  // Solo intentar cargar si el elemento existe (para compatibilidad)
  const oldSelect = document.getElementById('post-restaurant');
  if (oldSelect) {
    return cargarRestaurantesParaSelect('post-restaurant');
  }
  // Si no existe, intentar cargar en el select exclusivo (por si acaso ya está visible)
  const newSelect = document.getElementById('create-post-restaurant');
  if (newSelect) {
    return cargarRestaurantesParaSelect('create-post-restaurant');
  }
  // Si ninguno existe, no hacer nada (la sección aún no se ha cargado)
  return;
}

async function cargarRestaurantesParaSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) {
    console.warn(`⚠️ No se encontró el select con ID: ${selectId}`);
    return;
  }

  try {
    console.log(`📋 Cargando restaurantes para select: ${selectId}`);
    const res = await fetch(`${RESTAURANTS_API_URL}/search`);
    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Error al cargar restaurantes:", data);
      select.innerHTML = '<option value="">❌ Error al cargar restaurantes</option>';
      return;
    }

    const { restaurants } = data;
    console.log(`✅ Restaurantes encontrados: ${restaurants?.length || 0}`);

    if (!restaurants || restaurants.length === 0) {
      select.innerHTML = '<option value="">🍽️ No hay restaurantes disponibles</option>';
      return;
    }

    // Limpiar options existentes (excepto el primero)
    select.innerHTML = '<option value="">🍽️ Etiquetar un restaurante (opcional)</option>';

    // Agregar cada restaurante como opción
    restaurants.forEach(restaurant => {
      const option = document.createElement("option");
      option.value = restaurant.id;
      option.textContent = `${restaurant.restaurant_name || "Sin nombre"}${restaurant.ubicacion ? ` - ${restaurant.ubicacion}` : ""}`;
      select.appendChild(option);
    });

    console.log(`✅ ${restaurants.length} restaurante(s) agregado(s) al select`);

  } catch (err) {
    console.error("❌ Error al cargar restaurantes para etiquetas:", err);
    if (select) {
      select.innerHTML = '<option value="">❌ Error al cargar restaurantes</option>';
    }
  }
}

// 🔖 GUARDAR/QUITAR GUARDADO DE POST
window.toggleSavePost = async function(postId) {
  if (!verificarSesion()) {
    return;
  }

  const token = obtenerToken();
  if (!token) {
    alert("Token no encontrado. Por favor inicia sesión nuevamente.");
    return;
  }

  try {
    // Primero verificar si ya está guardado
    const checkRes = await fetch(`${SAVED_POSTS_API_URL}/${postId}/check`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const checkData = await checkRes.json();

    if (checkData.isSaved) {
      // Si ya está guardado, quitarlo
      const res = await fetch(`${SAVED_POSTS_API_URL}/${postId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("✅ Publicación removida de guardados");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "No se pudo quitar el guardado"}`);
      }
    } else {
      // Si no está guardado, guardarlo
      const res = await fetch(`${SAVED_POSTS_API_URL}/${postId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("✅ Publicación guardada exitosamente");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "No se pudo guardar la publicación"}`);
      }
    }
  } catch (err) {
    console.error("❌ Error al guardar/quitar guardado:", err);
    alert("Error de conexión");
  }
};

// 🎯 FILTROS Y NAVEGACIÓN DEL FEED
function activarFiltro(filtro) {
  // Actualizar chips activos
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.remove('active');
    if (chip.dataset.filter === filtro) {
      chip.classList.add('active');
    }
  });

  const feedContainer = document.getElementById('feed-container');
  const mapSection = document.getElementById('map-view-section');
  const restaurantsSection = document.getElementById('restaurants-explore-section');

  // Ocultar todo primero
  if (feedContainer) feedContainer.style.display = 'none';
  if (mapSection) mapSection.style.display = 'none';
  if (restaurantsSection) restaurantsSection.style.display = 'none';

  switch(filtro) {
    case 'posts':
      if (feedContainer) feedContainer.style.display = 'block';
      cargarFeed();
      break;
    case 'maps':
      if (mapSection) {
        mapSection.style.display = 'block';
        crearMapaFeed(); // Función para inicializar el mapa
      }
      break;
    case 'food':
      if (restaurantsSection) {
        restaurantsSection.style.display = 'block';
        // Mostrar mensaje inicial, no cargar todos
        const resultsContainer = document.getElementById("restaurants-results");
        if (resultsContainer) {
          resultsContainer.innerHTML = '<p class="search-hint">✍️ Escribe para buscar restaurantes...</p>';
        }
      }
      break;
  }
}

// Inicializar filtros cuando se muestra el feed
function inicializarFiltros() {
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    // Remover listeners anteriores si existen
    const newChip = chip.cloneNode(true);
    chip.parentNode.replaceChild(newChip, chip);
    // Agregar nuevo listener
    newChip.addEventListener('click', () => {
      activarFiltro(newChip.dataset.filter);
    });
  });
}

// Función para buscar restaurantes (cuando se activa filtro "food")
function buscarRestaurantes() {
  const input = document.getElementById('search-restaurant-input');
  const query = input ? input.value.trim() : '';
  
  // Solo buscar si hay query
  if (query.length > 0 && typeof cargarRestaurantes === 'function') {
    cargarRestaurantes(query);
  } else {
    // Si no hay query, mostrar mensaje
    const resultsContainer = document.getElementById("restaurants-results");
    if (resultsContainer) {
      resultsContainer.innerHTML = '<p class="search-hint">✍️ Escribe para buscar restaurantes...</p>';
    }
  }
}

// Función para crear mapa del feed
function crearMapaFeed() {
  const mapContainer = document.getElementById('feed-map');
  if (!mapContainer || mapContainer.hasChildNodes()) return; // Ya está inicializado

  // Inicializar mapa con Leaflet
  if (typeof L !== 'undefined') {
    const map = L.map('feed-map').setView([4.711, -74.0721], 12); // Bogotá
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Cargar posts y agregar marcadores
    fetch(FEED_API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          data.posts.forEach(post => {
            if (post.location_lat && post.location_lng) {
              L.marker([post.location_lat, post.location_lng])
                .addTo(map)
                .bindPopup(`<strong>${post.users?.full_name || 'Usuario'}</strong><br>${post.content?.substring(0, 50)}...`);
            }
          });
        }
      })
      .catch(err => console.error('Error al cargar posts para mapa:', err));
  }
}

// 🧭 NAVEGACIÓN CON NAVBAR INFERIOR
function inicializarNavbar() {
  // Navbar en feed section
  const navCreatePost = document.getElementById('nav-create-post');
  const navHome = document.getElementById('nav-home');
  const navProfile = document.getElementById('nav-profile');
  
  // Navbar en create post section
  const navCreatePost2 = document.getElementById('nav-create-post-2');
  const navHome2 = document.getElementById('nav-home-2');
  const navProfile2 = document.getElementById('nav-profile-2');
  
  // Navbar en profile section
  const navCreatePost3 = document.getElementById('nav-create-post-3');
  const navHome3 = document.getElementById('nav-home-3');
  const navProfile3 = document.getElementById('nav-profile-3');
  
  const backFromCreatePost = document.getElementById('back-from-create-post');
  const logoutBtnNavbar = document.getElementById('logout-btn-navbar');
  const feedSection = document.getElementById('feed-section');
  const createPostSection = document.getElementById('create-post-section');
  const myProfileSection = document.getElementById('my-profile-section');

  // Función para ir a crear post
  function irACrearPost() {
    feedSection.style.display = 'none';
    createPostSection.style.display = 'block';
    myProfileSection.style.display = 'none';
    actualizarNavbarActivo('create');
    
    // Esperar a que el DOM esté listo y cargar restaurantes
    setTimeout(() => {
      // Resetear la marca de inicialización para permitir reinicializar
      window._selectoresCrearPostInicializados = false;
      
      // Cargar restaurantes en el select exclusivo
      cargarRestaurantesParaSelect('create-post-restaurant');
      // Asegurar que los selectores estén inicializados
      inicializarSelectoresCrearPost();
    }, 200);
  }

  // Función para ir a home
  function irAHome() {
    feedSection.style.display = 'block';
    createPostSection.style.display = 'none';
    myProfileSection.style.display = 'none';
    actualizarNavbarActivo('home');
    cargarFeed();
  }

  // Función para ir a perfil
  function irAPerfil() {
    feedSection.style.display = 'none';
    createPostSection.style.display = 'none';
    myProfileSection.style.display = 'block';
    actualizarNavbarActivo('profile');
    cargarMiPerfil();
  }

  // Event listeners navbar feed
  if (navCreatePost) navCreatePost.addEventListener('click', irACrearPost);
  if (navHome) navHome.addEventListener('click', irAHome);
  if (navProfile) navProfile.addEventListener('click', irAPerfil);

  // Event listeners navbar create post
  if (navCreatePost2) navCreatePost2.addEventListener('click', irACrearPost);
  if (navHome2) navHome2.addEventListener('click', irAHome);
  if (navProfile2) navProfile2.addEventListener('click', irAPerfil);

  // Event listeners navbar profile
  if (navCreatePost3) navCreatePost3.addEventListener('click', irACrearPost);
  if (navHome3) navHome3.addEventListener('click', irAHome);
  if (navProfile3) navProfile3.addEventListener('click', irAPerfil);

  // Botón volver de crear post
  if (backFromCreatePost) {
    backFromCreatePost.addEventListener('click', irAHome);
  }

  // Botón cerrar sesión en navbar
  if (logoutBtnNavbar) {
    logoutBtnNavbar.addEventListener('click', () => {
      localStorage.removeItem('session');
      currentUser = null;
      authSection.style.display = 'block';
      welcomeSection.style.display = 'none';
      feedSection.style.display = 'none';
      createPostSection.style.display = 'none';
      myProfileSection.style.display = 'none';
      userProfileSection.style.display = 'none';
    });
  }
}

// Actualizar navbar activo
function actualizarNavbarActivo(seccion) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  const items = document.querySelectorAll(`.nav-item[id*="${seccion === 'create' ? 'create-post' : seccion === 'home' ? 'home' : 'profile'}"]`);
  items.forEach(item => item.classList.add('active'));
}

// Conectar formulario exclusivo de crear post
function inicializarFormularioCrearPost() {
  const form = document.getElementById('create-post-form-exclusive');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const content = document.getElementById('create-post-content').value.trim();
    const image_url = document.getElementById('create-post-image').value.trim();
    const restaurant_id = document.getElementById('create-post-restaurant').value;
    const location_lat = document.getElementById('create-post-location-lat').value;
    const location_lng = document.getElementById('create-post-location-lng').value;
    const location_name = document.getElementById('create-post-location-name').value;

    if (!content) {
      alert('Por favor escribe algo para publicar');
      return;
    }

    if (!verificarSesion()) {
      return;
    }
    
    const token = obtenerToken();
    if (!token) {
      alert("Token no encontrado. Por favor inicia sesión nuevamente.");
      return;
    }

    try {
      const body = { content };
      
      // Solo incluir image_url si tiene valor
      if (image_url && image_url.trim() !== '') {
        body.image_url = image_url;
      }
      
      // Solo incluir restaurant_id si tiene valor
      if (restaurant_id && restaurant_id !== '') {
        body.restaurant_id = restaurant_id;
      }
      
      // Solo incluir ubicación si tiene valores válidos
      if (location_lat && location_lng && location_lat !== '' && location_lng !== '') {
        const lat = parseFloat(location_lat);
        const lng = parseFloat(location_lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          body.location_lat = lat;
          body.location_lng = lng;
          if (location_name && location_name.trim() !== '') {
            body.location_name = location_name;
          }
        }
      }

      console.log('📤 Enviando post con datos:', {
        content: content,
        image_url: image_url || '(vacío)',
        restaurant_id: restaurant_id || '(vacío)',
        location_lat: location_lat || '(vacío)',
        location_lng: location_lng || '(vacío)',
        location_name: location_name || '(vacío)'
      });

      const res = await fetch(FEED_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      console.log('📥 Respuesta del servidor:', {
        status: res.status,
        ok: res.ok,
        data: data
      });

      if (res.ok) {
        alert('✅ Publicación creada exitosamente');
        // Limpiar formulario
        form.reset();
        document.getElementById('create-post-image-preview').style.display = 'none';
        document.getElementById('create-post-image-preview').innerHTML = '';
        document.getElementById('create-post-image').value = '';
        document.getElementById('create-post-location-chip').style.display = 'none';
        document.getElementById('create-post-location-chip').innerHTML = '';
        document.getElementById('create-post-location-lat').value = '';
        document.getElementById('create-post-location-lng').value = '';
        document.getElementById('create-post-location-name').value = '';
        // Volver al home
        const feedSection = document.getElementById('feed-section');
        const createPostSection = document.getElementById('create-post-section');
        feedSection.style.display = 'block';
        createPostSection.style.display = 'none';
        actualizarNavbarActivo('home');
        cargarFeed();
      } else {
        console.error('❌ Error al crear post:', data);
        const errorMsg = data.error || data.details || 'No se pudo crear la publicación';
        const hint = data.hint ? `\n\nHint: ${data.hint}` : '';
        alert(`Error: ${errorMsg}${hint}`);
      }
    } catch (err) {
      console.error('❌ Error al crear publicación:', err);
      alert('Error de conexión');
    }
  });
}

// Conectar selectores de imagen y ubicación del formulario exclusivo
function inicializarSelectoresCrearPost() {
  // Verificar que la función ya no se haya ejecutado para evitar duplicados
  if (window._selectoresCrearPostInicializados) {
    console.log('⚠️ Selectores ya inicializados, omitiendo...');
    return;
  }

  // Selector de imagen
  const btnImage = document.getElementById('create-select-post-image-btn');
  if (btnImage) {
    // Remover listener anterior si existe
    const newBtnImage = btnImage.cloneNode(true);
    btnImage.parentNode.replaceChild(newBtnImage, btnImage);
    
    newBtnImage.addEventListener('click', async () => {
      console.log('📸 Botón de imagen clickeado');
      try {
        console.log('📸 Llamando a showImageSourceModal...');
        const base64Image = await showImageSourceModal();
        console.log('📸 Imagen seleccionada:', base64Image ? 'Sí (base64 recibido)' : 'No');
        const btn = document.getElementById('create-select-post-image-btn');
        btn.textContent = '⏳ Subiendo...';
        btn.disabled = true;
        if (!verificarSesion()) {
          return;
        }
        const token = obtenerToken();
        if (!token) {
          alert("Token no encontrado. Por favor inicia sesión nuevamente.");
          return;
        }
        const imageUrl = await uploadImageToSupabase(base64Image, 'post', token);
        const preview = document.getElementById('create-post-image-preview');
        preview.innerHTML = `
          <img src="${imageUrl}" alt="Preview" />
          <button type="button" class="btn-remove-image" onclick="removeCreatePostImage()">❌ Quitar</button>
        `;
        preview.style.display = 'block';
        document.getElementById('create-post-image').value = imageUrl;
        btn.textContent = '✅ Imagen agregada';
        btn.disabled = false;
      } catch (err) {
        const btn = document.getElementById('create-select-post-image-btn');
        btn.textContent = '📸 Agregar Imagen (opcional)';
        btn.disabled = false;
        if (err.message !== 'Cancelled') {
          alert('Error al subir imagen: ' + err.message);
        }
      }
    });
  } else {
    console.warn('⚠️ No se encontró el botón create-select-post-image-btn');
  }

  // Selector de ubicación - reutilizar el setupLocationPicker existente
  const btnLocation = document.getElementById('create-select-post-location-btn');
  if (btnLocation) {
    // Remover listener anterior si existe
    const newBtnLocation = btnLocation.cloneNode(true);
    btnLocation.parentNode.replaceChild(newBtnLocation, btnLocation);
    
    newBtnLocation.addEventListener('click', () => {
      // Reutilizar el botón del setupLocationPicker original
      const originalBtn = document.getElementById('select-post-location-btn');
      if (originalBtn) {
        originalBtn.click();
      } else {
        // Si no existe, crear uno temporal y usar la misma lógica
        openMapModalForCreatePost();
      }
    });
  } else {
    console.warn('⚠️ No se encontró el botón create-select-post-location-btn');
  }

  // Marcar como inicializado
  window._selectoresCrearPostInicializados = true;
  console.log('✅ Selectores de crear post inicializados');
}

// Función auxiliar para abrir el modal del mapa desde el formulario de crear post
function openMapModalForCreatePost() {
  const modal = document.getElementById('map-modal');
  if (!modal) {
    console.error('❌ Modal del mapa no encontrado');
    return;
  }
  
  modal.style.display = 'flex';
  
  // Variables para el mapa (scope compartido)
  let mapInstance = null;
  let currentMarker = null;
  let selectedLatLng = null;
  
  // Función para cerrar el modal
  const closeModal = () => {
    modal.style.display = 'none';
  };
  
  // Botón cancelar
  const cancelBtn = document.getElementById('cancel-location');
  if (cancelBtn) {
    // Remover listeners anteriores
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', closeModal);
  }
  
  // Botón confirmar - crear nuevo handler cada vez
  const confirmBtn = document.getElementById('confirm-location');
  if (confirmBtn) {
    // Remover listeners anteriores
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', async () => {
      if (!selectedLatLng) {
        alert('Toca en el mapa para elegir una ubicación.');
        return;
      }

      const nameInput = document.getElementById('create-post-location-name');
      const latInput = document.getElementById('create-post-location-lat');
      const lngInput = document.getElementById('create-post-location-lng');

      let displayName = document.getElementById('location-search')?.value.trim() || '';
      
      if (!displayName) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLatLng.lat}&lon=${selectedLatLng.lng}&zoom=18&addressdetails=1`,
            {
              headers: { 'User-Agent': 'PinFood-App/1.0' }
            }
          );
          const data = await res.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            displayName = parts.slice(0, Math.min(3, parts.length)).join(', ').trim();
          } else {
            displayName = `${selectedLatLng.lat.toFixed(5)}, ${selectedLatLng.lng.toFixed(5)}`;
          }
        } catch (err) {
          displayName = `${selectedLatLng.lat.toFixed(5)}, ${selectedLatLng.lng.toFixed(5)}`;
        }
      }

      if (nameInput) nameInput.value = displayName;
      if (latInput) latInput.value = String(selectedLatLng.lat);
      if (lngInput) lngInput.value = String(selectedLatLng.lng);

      const chip = document.getElementById('create-post-location-chip');
      if (chip) {
        chip.innerHTML = `📍 ${displayName} <button type="button" class="remove-loc" id="remove-create-loc">✖</button>`;
        chip.style.display = 'inline-flex';

        // Botón para quitar ubicación
        setTimeout(() => {
          const removeBtn = document.getElementById('remove-create-loc');
          if (removeBtn) {
            removeBtn.addEventListener('click', () => {
              if (nameInput) nameInput.value = '';
              if (latInput) latInput.value = '';
              if (lngInput) lngInput.value = '';
              chip.style.display = 'none';
              chip.innerHTML = '';
              const locationSearch = document.getElementById('location-search');
              if (locationSearch) locationSearch.value = '';
              selectedLatLng = null;
            });
          }
        }, 100);
      }

      closeModal();
    });
  }
  
  // Inicializar mapa
  setTimeout(async () => {
    const mapEl = document.getElementById('leaflet-map');
    if (!mapEl) {
      console.error('❌ Elemento del mapa no encontrado');
      return;
    }
    
    // Limpiar mapa anterior si existe
    if (mapEl._leaflet_id) {
      mapEl.innerHTML = '';
    }
    
    // Verificar si hay Google Maps disponible
    let canUseGoogle = false;
    if (window.google && window.google.maps) {
      canUseGoogle = true;
    } else {
      const key = localStorage.getItem('gmaps_api_key');
      if (key) {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => reject(false);
            document.head.appendChild(script);
          });
          canUseGoogle = true;
        } catch {
          canUseGoogle = false;
        }
      }
    }

    if (canUseGoogle && window.google && window.google.maps) {
      mapInstance = new google.maps.Map(mapEl, {
        center: { lat: 4.711, lng: -74.0721 },
        zoom: 12,
      });
      
      currentMarker = new google.maps.Marker({ 
        map: mapInstance, 
        draggable: false,
        position: { lat: 4.711, lng: -74.0721 }
      });
      
      mapInstance.addListener('click', (e) => {
        selectedLatLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        currentMarker.setPosition(e.latLng);
      });
      
      const input = document.getElementById('location-search');
      if (input) {
        const autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', mapInstance);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            mapInstance.panTo(place.geometry.location);
            currentMarker.setPosition(place.geometry.location);
            selectedLatLng = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
            input.value = place.formatted_address || place.name || '';
          }
        });
      }
    } else {
      // Usar Leaflet
      mapInstance = L.map('leaflet-map');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance);
      
      mapInstance.on('click', (e) => {
        selectedLatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
        if (currentMarker) currentMarker.remove();
        currentMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(mapInstance);
      });
      
      mapInstance.setView([4.711, -74.0721], 12);
      
      // Búsqueda con Nominatim
      const locationSearchInput = document.getElementById('location-search');
      if (locationSearchInput) {
        let searchTimeout;
        locationSearchInput.addEventListener('input', async (e) => {
          clearTimeout(searchTimeout);
          const query = e.target.value.trim();
          if (query.length < 3) return;
          
          searchTimeout = setTimeout(async () => {
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
                { headers: { 'User-Agent': 'PinFood-App/1.0' } }
              );
              const results = await res.json();
              if (results && results.length > 0) {
                const first = results[0];
                const lat = parseFloat(first.lat);
                const lng = parseFloat(first.lon);
                mapInstance.setView([lat, lng], 15);
                if (currentMarker) currentMarker.remove();
                currentMarker = L.marker([lat, lng]).addTo(mapInstance);
                selectedLatLng = { lat, lng };
              }
            } catch (err) {
              console.error('Error en búsqueda:', err);
            }
          }, 500);
        });
      }
    }
    
    // Geolocalización
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (canUseGoogle && mapInstance.setCenter) {
          mapInstance.setCenter(center);
          mapInstance.setZoom(15);
          if (currentMarker) currentMarker.setPosition(center);
          selectedLatLng = center;
        } else if (mapInstance.setView) {
          mapInstance.setView([center.lat, center.lng], 15);
          if (currentMarker) currentMarker.remove();
          currentMarker = L.marker([center.lat, center.lng]).addTo(mapInstance);
          selectedLatLng = center;
        }
      }, () => {
        // Error de geolocalización, usar Bogotá por defecto
        if (!canUseGoogle && mapInstance.setView) {
          mapInstance.setView([4.711, -74.0721], 12);
        }
      });
    }
  }, 100);
}

window.removeCreatePostImage = function() {
  document.getElementById('create-post-image').value = '';
  document.getElementById('create-post-image-preview').style.display = 'none';
  document.getElementById('create-post-image-preview').innerHTML = '';
  document.getElementById('create-select-post-image-btn').textContent = '📸 Agregar Imagen (opcional)';
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  inicializarNavbar();
  inicializarFormularioCrearPost();
  // NO inicializar selectores aquí porque la sección está oculta
  // Se inicializarán cuando se navegue a crear post
});