import { supabase } from "../services/supabaseClient.js";

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
    console.log("✅ Usuario creado en Auth:", user.id);

    // 2️⃣ Insertar datos en la tabla pública
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: user.id,
        full_name,
        email,
        role: "user",
      },
    ]);

    if (dbError) {
      console.error("❌ Error insertando en tabla users:", dbError.message);
      return res.status(400).json({ error: dbError.message });
    }

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
