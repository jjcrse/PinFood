import { supabase } from "../services/supabaseClient.js";

// 👤 OBTENER PERFIL DE USUARIO (por ID)
export async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;

    // Obtener datos del usuario
    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, profile_picture_url, description, created_at")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Obtener posts del usuario
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        id,
        content,
        image_url,
        created_at,
        likes:likes(count),
        comments:comments(count)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Error al obtener posts:", postsError);
    }

    res.status(200).json({
      user,
      posts: posts || [],
      postsCount: posts?.length || 0,
    });
  } catch (err) {
    console.error("❌ Error al obtener perfil:", err);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
}

// ✏️ ACTUALIZAR PERFIL DE USUARIO
export async function updateUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const { full_name, description, profile_picture_url } = req.body;

    // Verificar que el usuario autenticado es el mismo que intenta actualizar
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Token inválido" });
    }

    if (user.id !== userId) {
      return res.status(403).json({ error: "No tienes permiso para editar este perfil" });
    }

    // Actualizar el perfil
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (description !== undefined) updateData.description = description;
    if (profile_picture_url !== undefined) updateData.profile_picture_url = profile_picture_url;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select("id, full_name, email, profile_picture_url, description, created_at")
      .single();

    if (error) throw error;

    res.status(200).json({
      message: "✅ Perfil actualizado exitosamente",
      user: data,
    });
  } catch (err) {
    console.error("❌ Error al actualizar perfil:", err);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
}

// 📊 OBTENER ESTADÍSTICAS DEL USUARIO
export async function getUserStats(req, res) {
  try {
    const { userId } = req.params;

    // Contar posts
    const { count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Contar likes recibidos
    const { data: likesData } = await supabase
      .from("likes")
      .select("post_id")
      .in("post_id", 
        supabase
          .from("posts")
          .select("id")
          .eq("user_id", userId)
      );

    res.status(200).json({
      posts: postsCount || 0,
      likesReceived: likesData?.length || 0,
    });
  } catch (err) {
    console.error("❌ Error al obtener estadísticas:", err);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
}

