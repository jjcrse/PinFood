const API_URL = "http://localhost:5050/api/auth";
const msg = document.getElementById("msg");

// Referencias a secciones
const authSection = document.getElementById("auth-section");
const welcomeSection = document.getElementById("welcome-section");
const welcomeMsg = document.getElementById("welcome-msg");
const logoutBtn = document.getElementById("logout");

// Si ya hay sesión guardada → mostrar bienvenida
if (localStorage.getItem("session")) {
  mostrarBienvenida(JSON.parse(localStorage.getItem("session")));
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
    localStorage.setItem("session", JSON.stringify(data.session));
    mostrarBienvenida(data.user);
  } catch (err) {
    console.error("❌ Error en el frontend (login):", err);
    msg.textContent = "Error al iniciar sesión.";
  }
});

// 🚪 LOGOUT
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("session");
  authSection.style.display = "block";
  welcomeSection.style.display = "none";
  msg.textContent = "";
});

// 🔹 Función para mostrar la vista de bienvenida
function mostrarBienvenida(user) {
  authSection.style.display = "none";
  welcomeSection.style.display = "flex";
  welcomeMsg.textContent = `Bienvenido, ${user?.email || user?.full_name || "Usuario"} 👋`;
}
