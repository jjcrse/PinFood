import { supabase } from "../services/supabaseClient.js";
import bcrypt from "bcrypt";

// 📝 REGISTRAR RESTAURANTE
export async function registerRestaurant(req, res) {
  try {
    const { restaurant_name, email, password } = req.body;

    if (!restaurant_name || !email || !password) {
      return res.status(400).json({
        error: "Por favor completa todos los campos (nombre del restaurante, email y contraseña)",
      });
    }

    // Verificar si el email ya existe
    const { data: existingRestaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("email", email)
      .single();

    if (existingRestaurant) {
      return res.status(400).json({ error: "Este email ya está registrado" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo restaurante
    const { data, error } = await supabase
      .from("restaurants")
      .insert([
        {
          restaurant_name,
          email,
          password: hashedPassword,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // No devolver la contraseña hasheada
    const { password: _, ...restaurantData } = data;

    res.status(201).json({
      message: "✅ Restaurante registrado exitosamente",
      restaurant: restaurantData,
    });
  } catch (err) {
    console.error("❌ Error al registrar restaurante:", err);
    res.status(500).json({ error: "Error al registrar restaurante" });
  }
}

// 🔐 LOGIN DE RESTAURANTE
export async function loginRestaurant(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Por favor completa todos los campos" });
    }

    // Buscar el restaurante por email
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !restaurant) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, restaurant.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // No devolver la contraseña
    const { password: _, ...restaurantData } = restaurant;

    res.status(200).json({
      message: "✅ Inicio de sesión exitoso",
      restaurant: restaurantData,
    });
  } catch (err) {
    console.error("❌ Error al iniciar sesión:", err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
}

