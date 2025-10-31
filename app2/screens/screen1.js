import { navigateTo, makeRequest } from "../app.js";

export default function renderScreen1() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="auth-hero">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Welcome to</h2>
          <h1>PinFood</h1>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab auth-tab-active" id="tab-register">Register your shop</button>
          <button class="auth-tab" id="tab-login">Login as shop</button>
        </div>

        <p id="msg" class="auth-msg"></p>

        <form id="register-form" class="auth-form fancy">
          <input type="email" id="reg-email" placeholder="Email" required />
          <input type="password" id="reg-pass" placeholder="Password" required />
          <input type="text" id="reg-name" placeholder="Shop name" required />
          <button type="submit" class="btn-primary wide">Create shop</button>
        </form>

        <form id="login-form" class="auth-form fancy" style="display:none;">
          <input type="email" id="login-email" placeholder="Email" required />
          <input type="password" id="login-pass" placeholder="Password" required />
          <button type="submit" class="btn-primary wide">SignIn</button>
        </form>

        <div class="auth-social">
          <span class="dot">✖️</span>
          <span class="dot">ⓖ</span>
          <span class="dot">ⓕ</span>
          <span class="dot">ⓘ</span>
        </div>
        <div class="auth-footer-link">create account</div>
      </div>
    </div>
  `;
  // Tabs UI
  const tabRegister = document.getElementById("tab-register");
  const tabLogin = document.getElementById("tab-login");
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('auth-tab-active');
    tabLogin.classList.remove('auth-tab-active');
    registerForm.style.display = '';
    loginForm.style.display = 'none';
  });
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('auth-tab-active');
    tabRegister.classList.remove('auth-tab-active');
    registerForm.style.display = 'none';
    loginForm.style.display = '';
  });

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
