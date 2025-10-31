import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { supabase } from "../services/supabaseClient.js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 🔧 MODO DESARROLLO - Simular autenticación sin Supabase real
const isDevelopmentMode = false; // Cambiar a false para usar Supabase real

// 🧾 REGISTRO
export const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    console.log("📩 Datos recibidos:", req.body);

    // 🔧 MODO DESARROLLO - Simular registro exitoso
    if (isDevelopmentMode) {
      console.log("🔧 Modo desarrollo: Simulando registro exitoso");
      const mockUser = {
        id: `demo_${Date.now()}`,
        email,
        full_name,
        role: "user"
      };
      
      return res.status(200).json({ 
        message: "Usuario registrado exitosamente (modo demo)", 
        user: mockUser 
      });
    }

    // 1️⃣ Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error("❌ Error en Supabase Auth:", authError.message);
      return res.status(400).json({ error: authError.message });
    }

    const user = authData.user;
    const session = authData.session; // Puede ser null si requiere confirmación de email
    console.log("✅ Usuario creado en Auth:", user.id);
    console.log("📧 Session:", session ? "Disponible" : "No disponible (puede requerir confirmación de email)");

    // 2️⃣ Insertar datos en la tabla pública
    // Priorizar SERVICE_ROLE_KEY para evitar problemas de RLS
    let supabaseClient;
    if (supabaseServiceKey) {
      console.log("🔑 Usando SERVICE_ROLE_KEY para insertar en users (bypass RLS)");
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    } else if (session && session.access_token) {
      // Si tenemos sesión del nuevo usuario, usar su token
      console.log("🔑 Usando token del usuario recién creado");
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } else {
      console.warn("⚠️ No hay SERVICE_ROLE_KEY ni sesión disponible, intentando con cliente anónimo (puede fallar por RLS)");
      supabaseClient = supabase;
    }

    const { error: dbError } = await supabaseClient.from("users").insert([
      {
        id: user.id,
        full_name,
        email,
        role: "user",
      },
    ]);

    if (dbError) {
      console.error("❌ Error insertando en tabla users:", dbError.message);
      console.error("❌ Error details:", dbError.details);
      console.error("❌ Error hint:", dbError.hint);
      
      // Si falló por RLS y no tenemos SERVICE_ROLE_KEY, sugerir al usuario
      if (dbError.message.includes('row-level security') && !supabaseServiceKey) {
        return res.status(500).json({ 
          error: "Error al crear perfil. Configura SUPABASE_SERVICE_ROLE_KEY en .env o ejecuta el script fix-users-rls-policy.sql en Supabase." 
        });
      }
      
      return res.status(400).json({ error: dbError.message });
    }

    console.log("✅ Usuario insertado en tabla users exitosamente");

    res.status(200).json({ 
      message: "Usuario registrado exitosamente", 
      user: {
        id: user.id,
        email: user.email,
        full_name: full_name,
        role: "user",
        profile_picture_url: null,
        description: null,
      }
    });
  } catch (error) {
    console.error("❌ Error general en register:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔐 LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña requeridos" });
    }

    // 🔧 MODO DESARROLLO - Simular login exitoso
    if (isDevelopmentMode) {
      console.log("🔧 Modo desarrollo: Simulando login exitoso");
      console.log("📧 Email recibido:", email);
      console.log("🔑 Password recibido:", password);
      
      const mockUser = {
        id: `demo_${Date.now()}`,
        email,
        full_name: "Usuario Demo",
        role: "user"
      };
      
      const mockSession = {
        access_token: `demo_token_${Date.now()}`,
        refresh_token: `demo_refresh_${Date.now()}`,
        expires_at: Date.now() + 3600000, // 1 hora
        user: mockUser
      };
      
      console.log("✅ Respuesta mock enviada:", { message: "Inicio de sesión exitoso (modo demo)" });
      
      return res.status(200).json({
        message: "Inicio de sesión exitoso (modo demo)",
        session: mockSession,
        user: mockUser,
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log("🧠 Datos del login:", data);
    console.log("⚠️ Error del login:", error);

    if (error) {
      console.error("❌ Error en login:", error.message);
      return res.status(400).json({ error: error.message });
    }

    const { user, session } = data;

    // Obtener datos extra desde la tabla users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("full_name, role, profile_picture_url, description")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("❌ Error al obtener datos del usuario:", userError);
    }

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      session: session,
      user: {
        id: user.id,
        email: user.email,
        full_name: userData?.full_name || user.user_metadata?.full_name || email,
        role: userData?.role || "user",
        profile_picture_url: userData?.profile_picture_url || null,
        description: userData?.description || null,
      },
    });
  } catch (error) {
    console.error("❌ Error general en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🔄 REFRESCAR TOKEN
export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: "refresh_token requerido" });
    }

    // 🔧 MODO DESARROLLO - Simular refresh exitoso
    if (isDevelopmentMode) {
      console.log("🔧 Modo desarrollo: Simulando refresh exitoso");
      const mockSession = {
        access_token: `demo_token_${Date.now()}`,
        refresh_token: `demo_refresh_${Date.now()}`,
        expires_at: Date.now() + 3600000, // 1 hora
      };
      return res.status(200).json({ session: mockSession });
    }

    // Usar Supabase para refrescar el token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refresh_token,
    });

    if (error) {
      console.error("❌ Error al refrescar token:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error("❌ Error general en refreshToken:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🚪 LOGOUT
export const logout = async (req, res) => {
  try {
    // 🔧 MODO DESARROLLO - Simular logout exitoso
    if (isDevelopmentMode) {
      console.log("🔧 Modo desarrollo: Simulando logout exitoso");
      return res.status(200).json({ message: "Sesión cerrada exitosamente (modo demo)" });
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.status(200).json({ message: "Sesión cerrada exitosamente" });
  } catch (error) {
    console.error("❌ Error en logout:", error);
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
};
