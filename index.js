import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Importar routers
import screen1Router from "./server/routes/screen1Events.router.js";
import usersRouter from "./server/routes/users.router.js";

// Servicio de Supabase
import { supabase } from "./server/services/supabase.service.js";

dotenv.config();

// ============================
// CONFIGURACIÓN PRINCIPAL
// ============================
const app = express();
const PORT = process.env.PORT || 3000;

// Necesario para usar __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================
// MIDDLEWARES
// ============================
app.use(cors());
app.use(express.json());

// ============================
// ARCHIVOS ESTÁTICOS
// ============================
app.use("/app1", express.static(path.join(__dirname, "app1")));
app.use("/app2", express.static(path.join(__dirname, "app2")));

// ============================
// RUTAS API
// ============================
app.use("/api/screen1", screen1Router);
app.use("/api/users", usersRouter);

// ============================
// AUTENTICACIÓN SUPABASE
// ============================

// Registrar nuevo usuario
app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error al registrar usuario:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Usuario registrado con éxito", data });
  } catch (err) {
    console.error("Error en /api/register:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Iniciar sesión de usuario
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error al iniciar sesión:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Inicio de sesión exitoso", data });
  } catch (err) {
    console.error("Error en /api/login:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ============================
// PRUEBA DE CONEXIÓN A SUPABASE
// ============================
app.get("/api/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*").limit(1);
    if (error) throw error;
    res.json({ message: "✅ Conexión con Supabase exitosa", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================
// RUTA BASE
// ============================
app.get("/", (req, res) => {
  res.send("🚀 Servidor funcionando correctamente");
});

// ============================
// INICIAR SERVIDOR
// ============================
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

import authRouter from "./server/routes/authRoutes.js";

// ...
app.use("/api/auth", authRouter);

