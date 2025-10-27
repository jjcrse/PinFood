import { navigateTo, makeRequest } from "../app.js";

export default function renderScreen1() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      <h1>🍕 Portal de Restaurantes</h1>
      <p id="msg"></p>

      <!-- SECCIÓN DE AUTENTICACIÓN -->
      <div id="auth-section">
        <div class="auth-form">
          <h2>Registrar Restaurante</h2>
          <form id="register-form">
            <input type="text" id="reg-name" placeholder="Nombre del restaurante" required />
            <input type="email" id="reg-email" placeholder="Correo electrónico" required />
            <input type="password" id="reg-pass" placeholder="Contraseña" required />
            <button type="submit">Registrar Restaurante</button>
          </form>
        </div>

        <div class="auth-form">
          <h2>Iniciar Sesión</h2>
          <form id="login-form">
            <input type="email" id="login-email" placeholder="Correo electrónico" required />
            <input type="password" id="login-pass" placeholder="Contraseña" required />
            <button type="submit">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  `;

  const msg = document.getElementById("msg");

  // 📝 REGISTRO DE RESTAURANTE
  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const restaurant_name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-pass").value.trim();

    if (!restaurant_name || !email || !password) {
      showMessage(msg, "Por favor completa todos los campos.", "error");
      return;
    }

    const result = await makeRequest(
      "http://localhost:3000/api/restaurants/register",
      "POST",
      { restaurant_name, email, password }
    );

    console.log("📊 Resultado completo:", result);
    console.log("📊 result.ok:", result.ok);
    console.log("📊 result.data:", result.data);
    console.log("📊 result.error:", result.error);

    if (result.ok) {
      console.log("✅ Registro exitoso:", result.data);
      showMessage(msg, result.data.message, "success");

      // Guardar sesión
      localStorage.setItem("restaurant_session", JSON.stringify({ restaurant: result.data.restaurant }));

      // Navegar al perfil
      setTimeout(() => {
        navigateTo("/profile", { restaurant: result.data.restaurant });
      }, 1000);
    } else {
      console.error("❌ Error al registrar:", result);
      console.error("❌ result.data completo:", JSON.stringify(result.data));
      const errorMsg = result.data?.error || result.error || "Error al registrar restaurante";
      showMessage(msg, errorMsg, "error");
    }
  });

  // 🔐 LOGIN DE RESTAURANTE
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-pass").value.trim();

    if (!email || !password) {
      showMessage(msg, "Por favor ingresa tu correo y contraseña.", "error");
      return;
    }

    const result = await makeRequest(
      "http://localhost:3000/api/restaurants/login",
      "POST",
      { email, password }
    );

    if (result.ok) {
      console.log("✅ Login exitoso:", result.data);
      showMessage(msg, result.data.message, "success");

      // Guardar sesión
      localStorage.setItem("restaurant_session", JSON.stringify({ restaurant: result.data.restaurant }));

      // Navegar al perfil
      setTimeout(() => {
        navigateTo("/profile", { restaurant: result.data.restaurant });
      }, 1000);
    } else {
      console.error("❌ Error al iniciar sesión:", result);
      const errorMsg = result.data?.error || result.error || "Error al iniciar sesión";
      showMessage(msg, errorMsg, "error");
    }
  });
}

// Helper para mostrar mensajes
function showMessage(msgElement, text, type) {
  msgElement.textContent = text;
  
  if (type === "success") {
    msgElement.style.background = "#e8f5e9";
    msgElement.style.color = "#2e7d32";
  } else if (type === "error") {
    msgElement.style.background = "#ffebee";
    msgElement.style.color = "#c62828";
  } else {
    msgElement.style.background = "#e3f2fd";
    msgElement.style.color = "#1565c0";
  }
}
