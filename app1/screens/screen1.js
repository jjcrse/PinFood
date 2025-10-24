import { makeRequest } from "../app.js";

export default function renderScreen1() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <h2>Registro</h2>
    <form id="registerForm">
      <input type="text" id="name" placeholder="Nombre" required />
      <input type="email" id="email" placeholder="Correo" required />
      <input type="password" id="password" placeholder="Contraseña" required />
      <button type="submit">Registrarse</button>
    </form>

    <h2>Inicio de Sesión</h2>
    <form id="loginForm">
      <input type="email" id="loginEmail" placeholder="Correo" required />
      <input type="password" id="loginPassword" placeholder="Contraseña" required />
      <button type="submit">Iniciar Sesión</button>
    </form>
  `;

  // Registro
  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await makeRequest("/api/auth/register", "POST", { name, email, password });
    console.log(res);
  });

  // Login
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await makeRequest("/api/auth/login", "POST", { email, password });
    console.log(res);
  });
}
