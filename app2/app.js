import renderScreen1 from "./screens/screen1.js";
import renderScreen2 from "./screens/screen2.js";

// ================================
// 🔧 BACKEND BASE URL EN VERCEL
// ================================
const API_BASE = "https://pin-food.vercel.app";

let socket = null;

function clearScripts() {
  document.getElementById("app").innerHTML = "";
}

let route = { path: "/", data: {} };

// Verificar si hay sesión guardada
if (localStorage.getItem("restaurant_session")) {
  const session = JSON.parse(localStorage.getItem("restaurant_session"));
  route = { path: "/profile", data: { restaurant: session.restaurant } };
}

renderRoute(route);

function renderRoute(currentRoute) {
  switch (currentRoute?.path) {
    case "/":
      clearScripts();
      renderScreen1(currentRoute?.data);
      break;
    case "/profile":
      clearScripts();
      renderScreen2(currentRoute?.data);
      break;
    default:
      const app = document.getElementById("app");
      app.innerHTML = `<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>`;
  }
}

function navigateTo(path, data) {
  route = { path, data };
  renderRoute(route);
}

// ==================================================
// 🔧 Función helper corregida para usar Vercel siempre
// ==================================================
async function makeRequest(url, method = "GET", body = null) {
  try {
    // Si la URL NO empieza por http, agregar el backend de Vercel
    const finalUrl = url.startsWith("http")
      ? url
      : `${API_BASE}${url}`;

    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(finalUrl, options);
    const data = await res.json();

    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error("Error en petición:", error);
    return { ok: false, error: error.message };
  }
}

export { navigateTo, socket, makeRequest };
