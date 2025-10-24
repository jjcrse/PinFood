import { supabase } from "../services/supabase.service.js";

/**
 * Registro de usuario (normal o administrador)
 */
export const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Validar campos obligatorios
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // Guardar información adicional en la tabla pública
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: userId,
        full_name,
        email,
        role: role === "admin" ? "admin" : "user", // solo dos roles permitidos
      },
    ]);

    if (dbError) throw dbError;

    return res.status(201).json({
      message: "✅ Usuario registrado correctamente",
      user: { id: userId, full_name, email, role },
    });
  } catch (err) {
    console.error("❌ Error en registerUser:", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Inicio de sesión
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña requeridos" });
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) throw loginError;

    const { user, session } = loginData;

    // Obtener datos extra desde la tabla users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("full_name, role")
      .eq("id", user.id)
      .single();

    if (userError) throw userError;

    return res.json({
      message: "✅ Inicio de sesión exitoso",
      user: {
        id: user.id,
        email: user.email,
        full_name: userData.full_name,
        role: userData.role,
      },
      access_token: session.access_token,
    });
  } catch (err) {
    console.error("❌ Error en loginUser:", err.message);
    res.status(500).json({ error: err.message });
  }
};
