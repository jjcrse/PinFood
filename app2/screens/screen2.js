import { navigateTo } from "../app.js";

// Importar utilidades de imagen (si las necesitamos, crearlas después)
// import { showImageSourceModal, uploadImageToSupabase } from '../utils/imageUpload.js';

export default function renderScreen2(data) {
  const app = document.getElementById("app");
  
  const restaurant = data?.restaurant || { restaurant_name: "Restaurante", email: "No disponible" };

  app.innerHTML = `
    <div class="restaurant-profile-container">
      <div id="restaurant-profile-content">
        <div class="profile-header-card">
          <div class="profile-picture">
            ${restaurant.profile_picture_url 
              ? `<img src="${restaurant.profile_picture_url}" alt="Foto del restaurante" />` 
              : `<div class="profile-placeholder">🍽️</div>`
            }
          </div>
          <div class="profile-info">
            <h3>${restaurant.restaurant_name || "Restaurante"}</h3>
            <p class="profile-email">📧 ${restaurant.email}</p>
            <p class="profile-description">${restaurant.descripcion || "Sin descripción"}</p>
            ${restaurant.ubicacion ? `<p class="profile-location">📍 ${restaurant.ubicacion}</p>` : ""}
            <p class="profile-stats">📊 ${restaurant.posts_count || 0} menciones en posts</p>
          </div>
        </div>

        <div style="display: flex; gap: 15px; max-width: 600px; margin: 0 auto;">
          <button id="edit-restaurant-profile-btn" class="btn-primary" style="flex: 1;">✏️ Editar Perfil</button>
          <button id="logout-btn" class="btn-secondary">🚪 Salir</button>
        </div>

        <div id="edit-restaurant-profile-form" style="display: none;" class="edit-profile-form">
          <h3>Editar Perfil del Restaurante</h3>
          <input type="text" id="edit-restaurant-name" placeholder="Nombre del restaurante" value="${restaurant.restaurant_name || ""}" />
          <textarea id="edit-restaurant-description" placeholder="Descripción" rows="3">${restaurant.descripcion || ""}</textarea>
          <input type="text" id="edit-restaurant-ubicacion" placeholder="Ubicación" value="${restaurant.ubicacion || ""}" />
          
          <!-- Selector de foto de perfil -->
          <div class="profile-picture-selector">
            <label>Foto del Restaurante:</label>
            <div id="restaurant-profile-preview" class="image-preview">
              ${restaurant.profile_picture_url 
                ? `<img src="${restaurant.profile_picture_url}" alt="Preview" />` 
                : '<div class="no-image">Sin imagen</div>'
              }
            </div>
            <button type="button" id="select-restaurant-picture-btn" class="btn-select-image">
              📸 Seleccionar Imagen
            </button>
            <input type="hidden" id="edit-restaurant-picture-url" value="${restaurant.profile_picture_url || ""}" />
          </div>

          <div style="display: flex; gap: 10px;">
            <button id="save-restaurant-profile-btn" class="btn-primary">💾 Guardar</button>
            <button id="cancel-edit-restaurant-btn" class="btn-secondary">❌ Cancelar</button>
          </div>
        </div>

        <h3 style="margin-top: 30px; text-align: center;">📰 Publicaciones donde te etiquetaron</h3>
        <div id="posts-container" class="feed-container">
          <p>Cargando publicaciones...</p>
        </div>
      </div>
    </div>
  `;

  // 🚪 LOGOUT
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("restaurant_session");
      navigateTo("/");
    });
  }

  // Event listeners para editar perfil
  const editBtn = document.getElementById("edit-restaurant-profile-btn");
  const cancelBtn = document.getElementById("cancel-edit-restaurant-btn");
  const saveBtn = document.getElementById("save-restaurant-profile-btn");
  const selectImageBtn = document.getElementById("select-restaurant-picture-btn");

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      document.getElementById("edit-restaurant-profile-form").style.display = "block";
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      document.getElementById("edit-restaurant-profile-form").style.display = "none";
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      await guardarPerfilRestaurante(restaurant.id);
    });
  }

  // 📸 Event listener para seleccionar foto de perfil
  if (selectImageBtn) {
    selectImageBtn.addEventListener("click", async () => {
      try {
        // Por ahora mostrar un input file simple, luego podemos agregar el modal
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          // Convertir a base64
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Image = reader.result;
            const preview = document.getElementById("restaurant-profile-preview");
            preview.innerHTML = '<div class="loading">Subiendo imagen...</div>';
            
            // Subir imagen (necesitamos crear este endpoint o usar el mismo de users)
            try {
              const uploadRes = await fetch('http://localhost:3000/api/uploads/base64', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  image: base64Image,
                  type: 'restaurant'
                }),
              });

              const uploadData = await uploadRes.json();

              if (uploadRes.ok) {
                preview.innerHTML = `<img src="${uploadData.url}" alt="Preview" />`;
                document.getElementById("edit-restaurant-picture-url").value = uploadData.url;
                console.log("✅ Imagen subida exitosamente:", uploadData.url);
              } else {
                throw new Error(uploadData.error || 'Error al subir imagen');
              }
            } catch (err) {
              console.error("❌ Error al subir imagen:", err);
              alert("Error al subir imagen: " + err.message);
              preview.innerHTML = '<div class="no-image">Sin imagen</div>';
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
      } catch (err) {
        console.error("❌ Error al seleccionar imagen:", err);
      }
    });
  }

  // 📝 CARGAR POSTS
  if (restaurant.id) {
    loadRestaurantPosts(restaurant.id);
  }
}

// 💾 GUARDAR PERFIL DEL RESTAURANTE
async function guardarPerfilRestaurante(restaurantId) {
  const restaurant_name = document.getElementById("edit-restaurant-name").value.trim();
  const descripcion = document.getElementById("edit-restaurant-description").value.trim();
  const ubicacion = document.getElementById("edit-restaurant-ubicacion").value.trim();
  const profile_picture_url = document.getElementById("edit-restaurant-picture-url").value.trim();

  try {
    const res = await fetch(`http://localhost:3000/api/restaurants/${restaurantId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        restaurant_name: restaurant_name || undefined,
        descripcion: descripcion || undefined,
        ubicacion: ubicacion || undefined,
        profile_picture_url: profile_picture_url || undefined,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Perfil actualizado exitosamente");
      
      // Actualizar sesión con nuevos datos
      const session = JSON.parse(localStorage.getItem("restaurant_session"));
      if (session) {
        session.restaurant = { ...session.restaurant, ...data.restaurant };
        localStorage.setItem("restaurant_session", JSON.stringify(session));
      }
      
      // Recargar pantalla
      navigateTo("/profile", { restaurant: data.restaurant });
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error("❌ Error al guardar perfil:", err);
    alert("Error al guardar perfil");
  }
}

// 📝 FUNCIÓN PARA CARGAR POSTS DEL RESTAURANTE
async function loadRestaurantPosts(restaurantId) {
  const container = document.getElementById("posts-container");
  
  try {
    console.log("📝 Cargando posts para restaurante:", restaurantId);
    
    const res = await fetch(`http://localhost:3000/api/restaurants/${restaurantId}/posts`);
    const data = await res.json();

    if (!res.ok) {
      container.innerHTML = `<p class="error">❌ Error al cargar publicaciones: ${data.error}</p>`;
      return;
    }

    const { posts, count } = data;

    if (count === 0) {
      container.innerHTML = `
        <div class="no-posts">
          <p>📭 Aún no hay publicaciones donde te hayan etiquetado</p>
          <p class="hint">Cuando los usuarios te mencionen en sus posts, aparecerán aquí</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <p class="posts-count">✨ ${count} publicación(es) encontrada(s)</p>
      ${posts.map(post => `
        <div class="post-card">
          <div class="post-header">
            <div class="post-user">
              ${post.users?.profile_picture_url 
                ? `<img src="${post.users.profile_picture_url}" alt="${post.users.full_name}" class="user-avatar" />` 
                : '<div class="user-avatar-placeholder">👤</div>'
              }
              <div class="post-user-info">
                <strong>${post.users?.full_name || post.users?.email || "Usuario"}</strong>
                <small>${new Date(post.created_at).toLocaleString()}</small>
              </div>
            </div>
          </div>
          
          <p class="post-content">${post.content}</p>
          
          ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image" />` : ""}
          
          <div class="post-stats">
            <span class="stat">❤️ ${post.likes?.[0]?.count || 0} Me gusta</span>
            <span class="stat">💬 ${post.comments?.[0]?.count || 0} Comentarios</span>
          </div>
        </div>
      `).join("")}
    `;

  } catch (err) {
    console.error("❌ Error al cargar posts:", err);
    container.innerHTML = `<p class="error">❌ Error de conexión al cargar publicaciones</p>`;
  }
}
