import renderScreen1 from "./screens/screen1.js";
import renderScreen2 from "./screens/screen2.js";

// 🔧 CONFIGURACIÓN DE API - Detecta automáticamente si está en desarrollo o producción
const isDevelopment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const API_BASE_URL = isDevelopment 
  ? "http://localhost:3000" 
  : "https://pin-food-95bb.vercel.app";

// Socket.io (deshabilitado - no se usa tiempo real en app2)
let socket = null;
// Si necesitas tiempo real en el futuro, descomenta esto:
// try {
//   if (typeof io !== 'undefined') {
//     socket = io("/", { path: "/real-time", timeout: 5000 });
//     socket.on("connect_error", (err) => {
//       console.log("Socket.io no disponible:", err.message);
//     });
//   }
// } catch (err) {
//   console.log("Socket.io no está disponible");
// }

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

// Función helper para hacer peticiones
async function makeRequest(url, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const res = await fetch(url, options);
    const data = await res.json();
    
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error("Error en petición:", error);
    return { ok: false, error: error.message };
  }
}

export { navigateTo, socket, makeRequest };
