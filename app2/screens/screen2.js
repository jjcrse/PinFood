import { navigateTo } from "../app.js";

export default function renderScreen2(data) {
  const app = document.getElementById("app");
  
  const restaurant = data?.restaurant || { restaurant_name: "Restaurante", email: "No disponible" };

  app.innerHTML = `
    <div class="container">
      <div id="profile-section">
        <h1>🍕 Perfil del Restaurante</h1>
        
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-icon">🍽️</div>
            <h2>${restaurant.restaurant_name}</h2>
          </div>
          
          <div class="profile-info">
            <div class="info-item">
              <span class="info-label">📧 Email:</span>
              <span class="info-value">${restaurant.email}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">🆔 ID:</span>
              <span class="info-value">${restaurant.id || "N/A"}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">📅 Registro:</span>
              <span class="info-value">${restaurant.created_at ? new Date(restaurant.created_at).toLocaleDateString() : "N/A"}</span>
            </div>

            ${restaurant.ubicacion ? `
            <div class="info-item">
              <span class="info-label">📍 Ubicación:</span>
              <span class="info-value">${restaurant.ubicacion}</span>
            </div>
            ` : ""}

            ${restaurant.descripcion ? `
            <div class="info-item">
              <span class="info-label">📝 Descripción:</span>
              <span class="info-value">${restaurant.descripcion}</span>
            </div>
            ` : ""}
          </div>

          <div class="profile-actions">
            <button id="logout-btn" class="btn-secondary">🚪 Cerrar Sesión</button>
          </div>
        </div>

        <!-- SECCIÓN DE PUBLICACIONES DONDE ESTÁN ETIQUETADOS -->
        <div class="posts-section">
          <h2>📰 Publicaciones donde te etiquetaron</h2>
          <p class="posts-subtitle">Aquí puedes ver todas las publicaciones donde los usuarios han mencionado tu restaurante</p>
          <div id="posts-container" class="posts-container">
            <p class="loading">Cargando publicaciones...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // 🚪 LOGOUT
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("restaurant_session");
    navigateTo("/");
  });

  // 📝 CARGAR POSTS
  if (restaurant.id) {
    loadRestaurantPosts(restaurant.id);
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
