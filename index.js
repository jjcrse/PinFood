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
// Este middleware DEBE ejecutarse antes que cualquier otro
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Determinar si el origen está permitido - ser muy permisivo con Vercel
  let allowedOrigin = null;
  
  if (!origin) {
    // Requests sin origin (server-side, Postman, etc.)
    allowedOrigin = '*';
  } else if (allowedOrigins.indexOf(origin) !== -1) {
    // Origen en la lista permitida
    allowedOrigin = origin;
  } else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    // Cualquier localhost
    allowedOrigin = origin;
  } else if (origin.includes('vercel.app')) {
    // Cualquier dominio de Vercel
    allowedOrigin = origin;
  } else {
    // Por seguridad, en producción solo permitir Vercel
    if (process.env.NODE_ENV === 'production') {
      console.warn(`⚠️ CORS: Origen no permitido en producción: ${origin}`);
    }
    allowedOrigin = origin; // Permitir por ahora para debugging
  }
  
  // Establecer headers CORS en TODAS las respuestas
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Manejar solicitudes OPTIONS (preflight) - CRÍTICO para CORS
  if (req.method === 'OPTIONS') {
    console.log(`✅ OPTIONS preflight desde: ${origin}`);
    return res.status(204).end();
  }
  
  next();
};

// Aplicar middleware de CORS personalizado PRIMERO, antes de cualquier otra cosa
// Esto es CRÍTICO - debe estar antes de express.json() y cualquier ruta
app.use(corsMiddleware);

// Handler específico para OPTIONS en todas las rutas API (doble protección)
app.options('/api/*', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
});

// También aplicar cors de la librería como respaldo adicional
const corsOptions = {
  origin: function (origin, callback) {
    // Ser muy permisivo - permitir todo lo que sea Vercel o localhost
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    if (origin.includes('vercel.app')) return callback(null, true);
    // En producción, solo permitir Vercel
    if (process.env.NODE_ENV === 'production' && !origin.includes('vercel.app')) {
      return callback(new Error('Not allowed by CORS'));
    }
    callback(null, true);
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