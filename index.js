import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // ✅ fuerza a cargar .env antes que nada

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Importar routers
import screen1Router from "./server/routes/screen1Events.router.js";
import usersRouter from "./server/routes/users.router.js";
import authRouter from "./server/routes/authRoutes.js";
import feedRouter from "./server/routes/feed.router.js";
import restaurantsRouter from "./server/routes/restaurants.router.js"; // 🍕 Restaurantes
import profileRouter from "./server/routes/profile.router.js"; // 👤 Perfiles
import savedPostsRouter from "./server/routes/savedPosts.router.js"; // 💾 Posts guardados
import uploadsRouter from "./server/routes/uploads.router.js"; // 📤 Uploads

// Servicio de Supabase
import { supabase } from "./server/services/supabaseClient.js";

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
// Configurar CORS para permitir todos los dominios de Vercel
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5050',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5050',
  'https://pin-food-95bb.vercel.app',
  'https://pin-food-26he.vercel.app',
  'https://pinfoodapp1.vercel.app',
  'https://pin-food-z41s.vercel.app',
];

// Middleware personalizado de CORS para Vercel serverless
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Determinar si el origen está permitido
  let isAllowed = false;
  if (!origin) {
    isAllowed = true; // Permitir requests sin origin
  } else if (allowedOrigins.indexOf(origin) !== -1) {
    isAllowed = true;
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    isAllowed = true;
  } else if (origin.includes('vercel.app')) {
    isAllowed = true;
  }
  
  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Manejar solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

// Aplicar middleware de CORS personalizado ANTES de cualquier otra cosa
app.use(corsMiddleware);

// También aplicar cors de la librería como respaldo
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    if (origin.includes('vercel.app')) return callback(null, true);
    callback(null, true); // Permitir todos por ahora
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Aumentar límite para imágenes base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================
// ARCHIVOS ESTÁTICOS
// ============================
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/app1", express.static(path.join(__dirname, "app1")));
app.use("/app2", express.static(path.join(__dirname, "app2")));

// ============================
// RUTAS API
// ============================
app.use("/api/screen1", screen1Router);
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/feed", feedRouter);
app.use("/api/restaurants", restaurantsRouter); // 🍕 Restaurantes
app.use("/api/profile", profileRouter); // 👤 Perfiles
app.use("/api/saved-posts", savedPostsRouter); // 💾 Posts guardados
app.use("/api/uploads", uploadsRouter); // 📤 Uploads

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
// RUTA BASE - Landing Page
// ============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================
// INICIAR SERVIDOR
// ============================
// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Para Vercel (serverless)
export default app;