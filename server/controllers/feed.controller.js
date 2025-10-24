import { supabase } from "../services/supabaseClient.js";

// 📝 CREAR NUEVA PUBLICACIÓN
export const createPost = async (req, res) => {
  try {
    console.log("📥 Recibiendo petición para crear post...");
    console.log("📦 Body:", req.body);
    
    const { content, image_url } = req.body;
    const authHeader = req.headers.authorization;

    console.log("🔑 Authorization header:", authHeader ? "Presente" : "Ausente");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Token no proporcionado o formato incorrecto");
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🎫 Token extraído:", token.substring(0, 20) + "...");

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error("❌ Error al verificar usuario:", userError);
      return res.status(401).json({ error: "Token inválido o expirado: " + userError.message });
    }

    if (!user) {
      console.log("❌ No se encontró usuario");
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    console.log("✅ Usuario verificado:", user.id, user.email);

    if (!content || content.trim() === "") {
      console.log("❌ Contenido vacío");
      return res.status(400).json({ error: "El contenido es obligatorio" });
    }

    console.log("📝 Intentando insertar post en Supabase...");
    console.log("📊 Datos a insertar:", {
      user_id: user.id,
      content: content.trim(),
      image_url: image_url || null,
    });

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          user_id: user.id,
          content: content.trim(),
          image_url: image_url || null,
        },
      ])
      .select();

    if (error) {
      console.error("❌ Error de Supabase al crear post:", error);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error details:", error.details);
      console.error("❌ Error hint:", error.hint);
      return res.status(400).json({ 
        error: error.message,
        details: error.details,
        hint: error.hint 
      });
    }

    console.log("✅ Post creado exitosamente:", data[0]);

    res.status(201).json({
      message: "Publicación creada exitosamente",
      post: data[0],
    });
  } catch (error) {
    console.error("❌ Error general en createPost:", error);
    res.status(500).json({ error: "Error interno del servidor: " + error.message });
  }
};

// 📰 OBTENER TODOS LOS POSTS (FEED) con likes y comentarios
export const getFeed = async (req, res) => {
  try {
    console.log("📰 Obteniendo feed...");
    
    // Obtener posts SIN relaciones complejas
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("❌ Error al obtener posts:", postsError);
      return res.status(400).json({ error: postsError.message });
    }

    console.log(`✅ Se obtuvieron ${posts.length} posts`);

    // Obtener información de usuarios para cada post
    const postsWithData = await Promise.all(
      posts.map(async (post) => {
        // Obtener info del usuario
        const { data: userData } = await supabase
          .from("users")
          .select("id, full_name, email")
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
          users: userData || { id: post.user_id, full_name: "Usuario", email: "" },
          likes: [{ count: likesCount || 0 }],
          comments: [{ count: commentsCount || 0 }],
        };
      })
    );

    console.log("✅ Feed procesado correctamente");
    res.status(200).json({ posts: postsWithData });
  } catch (error) {
    console.error("❌ Error general en getFeed:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🗑️ ELIMINAR POST
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Error al eliminar post:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Publicación eliminada exitosamente" });
  } catch (error) {
    console.error("❌ Error general en deletePost:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ❤️ DAR LIKE A UN POST
export const likePost = async (req, res) => {
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

    const { data, error } = await supabase
      .from("likes")
      .insert([{ user_id: user.id, post_id: postId }])
      .select();

    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "Ya diste like a esta publicación" });
      }
      console.error("❌ Error al dar like:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: "Like agregado", like: data[0] });
  } catch (error) {
    console.error("❌ Error general en likePost:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 💔 QUITAR LIKE DE UN POST
export const unlikePost = async (req, res) => {
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

    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);

    if (error) {
      console.error("❌ Error al quitar like:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Like eliminado" });
  } catch (error) {
    console.error("❌ Error general en unlikePost:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 💬 AGREGAR COMENTARIO
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const authHeader = req.headers.authorization;

    console.log("💬 Recibiendo comentario para post:", postId);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Token no proporcionado");
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ Error al verificar usuario:", userError);
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    console.log("✅ Usuario verificado:", user.id);

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "El comentario no puede estar vacío" });
    }

    console.log("📝 Insertando comentario...");

    // Insertar comentario SIN select con relaciones
    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          user_id: user.id,
          post_id: postId,
          content: content.trim(),
        },
      ])
      .select();

    if (error) {
      console.error("❌ Error al agregar comentario:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("✅ Comentario insertado:", data[0]);

    // Obtener info del usuario por separado
    const { data: userData } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("id", user.id)
      .single();

    // Combinar comentario con info del usuario
    const commentWithUser = {
      ...data[0],
      users: userData || { id: user.id, full_name: "Usuario", email: "" },
    };

    console.log("✅ Comentario completo:", commentWithUser);

    res.status(201).json({ message: "Comentario agregado", comment: commentWithUser });
  } catch (error) {
    console.error("❌ Error general en addComment:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 📖 OBTENER COMENTARIOS DE UN POST
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    console.log("📖 Obteniendo comentarios del post:", postId);

    // Obtener comentarios sin relaciones complejas
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("❌ Error al obtener comentarios:", commentsError);
      return res.status(400).json({ error: commentsError.message });
    }

    // Obtener información del usuario para cada comentario
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const { data: userData } = await supabase
          .from("users")
          .select("id, full_name, email")
          .eq("id", comment.user_id)
          .single();

        return {
          ...comment,
          users: userData || { id: comment.user_id, full_name: "Usuario", email: "" },
        };
      })
    );

    console.log(`✅ Se obtuvieron ${commentsWithUsers.length} comentarios`);
    res.status(200).json({ comments: commentsWithUsers });
  } catch (error) {
    console.error("❌ Error general en getComments:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 🗑️ ELIMINAR COMENTARIO
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Error al eliminar comentario:", error.message);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Comentario eliminado" });
  } catch (error) {
    console.error("❌ Error general en deleteComment:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};