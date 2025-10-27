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

// 🔍 BUSCAR RESTAURANTES
export async function searchRestaurants(req, res) {
  try {
    const { query } = req.query;

    let restaurantsQuery = supabase
      .from("restaurants")
      .select("id, restaurant_name, email, descripcion, ubicacion, creado_en");

    // Si hay query, filtrar por nombre
    if (query && query.trim() !== "") {
      restaurantsQuery = restaurantsQuery.ilike("restaurant_name", `%${query}%`);
    }

    const { data: restaurants, error } = await restaurantsQuery
      .order("restaurant_name", { ascending: true })
      .limit(20);

    if (error) throw error;

    res.status(200).json({
      restaurants: restaurants || [],
      count: restaurants?.length || 0,
    });
  } catch (err) {
    console.error("❌ Error al buscar restaurantes:", err);
    res.status(500).json({ error: "Error al buscar restaurantes" });
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

// 📝 OBTENER POSTS DONDE UN RESTAURANTE FUE ETIQUETADO
export async function getRestaurantPosts(req, res) {
  try {
    const { restaurantId } = req.params;

    console.log("📝 Obteniendo posts para restaurante:", restaurantId);

    // Obtener posts donde el restaurante está etiquetado
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, content, image_url, created_at, user_id")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("❌ Error al obtener posts:", postsError);
      return res.status(500).json({ error: "Error al obtener posts: " + postsError.message });
    }

    console.log(`✅ Se encontraron ${posts?.length || 0} posts`);

    if (!posts || posts.length === 0) {
      return res.status(200).json({ posts: [], count: 0 });
    }

    // Enriquecer posts con información de usuarios, likes y comentarios
    const postsWithData = await Promise.all(
      posts.map(async (post) => {
        // Obtener info del usuario
        const { data: user } = await supabase
          .from("users")
          .select("id, full_name, email, profile_picture_url")
          .eq("id", post.user_id)
          .single();

        // Contar likes
        const { count: likesCount } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        // Contar comentarios
        const { count: commentsCount } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        return {
          ...post,
          users: user,
          likes: [{ count: likesCount || 0 }],
          comments: [{ count: commentsCount || 0 }],
        };
      })
    );

    res.status(200).json({
      posts: postsWithData,
      count: postsWithData.length,
    });
  } catch (err) {
    console.error("❌ Error al obtener posts del restaurante:", err);
    res.status(500).json({ error: "Error al obtener posts del restaurante" });
  }
}

