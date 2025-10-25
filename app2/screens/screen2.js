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
          </div>

          <div class="profile-actions">
            <button id="logout-btn" class="btn-secondary">🚪 Cerrar Sesión</button>
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
}
