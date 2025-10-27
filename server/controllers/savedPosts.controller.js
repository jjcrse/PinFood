import { supabase } from "../services/supabaseClient.js";

// 💾 GUARDAR PUBLICACIÓN
export async function savePost(req, res) {
  try {
    const { postId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    // Verificar si ya está guardado
    const { data: existing } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Ya has guardado esta publicación" });
    }

    // Guardar el post
    const { error } = await supabase
      .from("saved_posts")
      .insert([{ user_id: user.id, post_id: postId }]);

    if (error) throw error;

    res.status(201).json({ message: "✅ Publicación guardada exitosamente" });
  } catch (err) {
    console.error("❌ Error al guardar publicación:", err);
    res.status(500).json({ error: "Error al guardar publicación" });
  }
}

// 🗑️ QUITAR PUBLICACIÓN GUARDADA
export async function unsavePost(req, res) {
  try {
    const { postId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    // Eliminar el guardado
    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);

    if (error) throw error;

    res.status(200).json({ message: "✅ Publicación removida de guardados" });
  } catch (err) {
    console.error("❌ Error al quitar guardado:", err);
    res.status(500).json({ error: "Error al quitar guardado" });
  }
}

// 📚 OBTENER PUBLICACIONES GUARDADAS
export async function getSavedPosts(req, res) {
  try {
    const { userId } = req.params;

    console.log("📚 Obteniendo posts guardados para usuario:", userId);

    // Primero obtener los IDs de posts guardados
    const { data: savedPosts, error: savedError } = await supabase
      .from("saved_posts")
      .select("post_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (savedError) {
      console.error("❌ Error al obtener saved_posts:", savedError);
      return res.status(500).json({ error: "Error al obtener saved_posts: " + savedError.message });
    }

    console.log("📊 Posts guardados encontrados:", savedPosts?.length || 0);

    if (!savedPosts || savedPosts.length === 0) {
      return res.status(200).json({ posts: [], count: 0 });
    }

    // Obtener los posts completos
    const postIds = savedPosts.map(sp => sp.post_id);
    console.log("📝 IDs de posts a buscar:", postIds);

    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, content, image_url, created_at, user_id, restaurant_id")
      .in("id", postIds);

    if (postsError) {
      console.error("❌ Error al obtener posts:", postsError);
      return res.status(500).json({ error: "Error al obtener posts: " + postsError.message });
    }

    console.log("📝 Posts obtenidos:", posts?.length || 0);

    // Obtener información de usuarios y restaurantes
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const { data: user } = await supabase
          .from("users")
          .select("id, full_name, email, profile_picture_url")
          .eq("id", post.user_id)
          .single();

        // Obtener info del restaurante (si está etiquetado)
        let restaurantData = null;
        if (post.restaurant_id) {
          const { data: restaurant } = await supabase
            .from("restaurants")
            .select("id, restaurant_name, ubicacion")
            .eq("id", post.restaurant_id)
            .single();
          restaurantData = restaurant;
        }

        const { count: likesCount } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { count: commentsCount } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        return {
          ...post,
          users: user,
          restaurant: restaurantData,
          likes: [{ count: likesCount || 0 }],
          comments: [{ count: commentsCount || 0 }],
        };
      })
    );

    console.log("✅ Posts con toda la información:", postsWithUsers.length);

    res.status(200).json({
      posts: postsWithUsers || [],
      count: postsWithUsers?.length || 0,
    });
  } catch (err) {
    console.error("❌ Error general:", err);
    console.error("❌ Stack:", err.stack);
    res.status(500).json({ error: "Error al obtener publicaciones guardadas: " + err.message });
  }
}

// ✅ VERIFICAR SI UN POST ESTÁ GUARDADO
export async function checkIfSaved(req, res) {
  try {
    const { postId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    const { data } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single();

    res.status(200).json({ isSaved: !!data });
  } catch (err) {
    console.error("❌ Error al verificar guardado:", err);
    res.status(500).json({ error: "Error al verificar guardado" });
  }
}

