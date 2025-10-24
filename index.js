import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Importar routers
import screen1Router from "./server/routes/screen1Events.router.js";
import usersRouter from "./server/routes/users.router.js";
import authRouter from "./server/routes/authRoutes.js";
import feedRouter from "./server/routes/feed.router.js"; // 🆕 NUEVO

// Servicio de Supabase
import { supabase } from "./server/services/supabaseClient.js";

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
app.use("/api/auth", authRouter);
app.use("/api/feed", feedRouter); // 🆕 NUEVO

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