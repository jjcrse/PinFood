import { supabase } from "../services/supabaseClient.js";

// 🧾 REGISTRO
export const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    console.log("📩 Datos recibidos:", req.body);

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

    res.status(200).json({ message: "Usuario registrado exitosamente", user });
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

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error("❌ Error general en login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🚪 LOGOUT
export const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.status(200).json({ message: "Sesión cerrada exitosamente" });
  } catch (error) {
    console.error("❌ Error en logout:", error);
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
};
