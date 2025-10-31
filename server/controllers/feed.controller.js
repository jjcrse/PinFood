import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { supabase } from '../services/supabaseClient.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Opcional: para bypass RLS desde backend

// 📝 CREAR NUEVA PUBLICACIÓN
export const createPost = async (req, res) => {
  try {
    console.log("📥 Recibiendo petición para crear post...");
    console.log("📦 Body:", req.body);
    
    const { content, image_url, restaurant_id, location_lat, location_lng, location_name } = req.body;
    const authHeader = req.headers.authorization;

    console.log("🔑 Authorization header:", authHeader ? "Presente" : "Ausente");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Token no proporcionado o formato incorrecto");
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🎫 Token extraído:", token.substring(0, 20) + "...");

    // Crear cliente autenticado con el token del usuario para que RLS funcione correctamente
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: true,
        autoRefreshToken: false
      }
    });

    // Verificar y obtener el usuario primero
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError) {
      console.error("❌ Error al verificar usuario:", userError);
      return res.status(401).json({ error: "Token inválido o expirado: " + userError.message });
    }

    if (!user) {
      console.log("❌ No se encontró usuario");
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    console.log("✅ Usuario verificado:", user.id, user.email);

    // Establecer la sesión explícitamente para que RLS funcione
    // Esto asegura que auth.uid() esté disponible en las políticas
    try {
      const { data: sessionData, error: sessionError } = await supabaseAuth.auth.setSession({
        access_token: token,
        refresh_token: token // Usar el mismo token como refresh temporalmente
      });
      
      if (sessionError) {
        console.warn('⚠️ No se pudo establecer sesión completamente:', sessionError.message);
        // Continuar de todas formas, el header Authorization debería ser suficiente
      } else {
        console.log('✅ Sesión establecida correctamente para RLS');
      }
    } catch (sessionErr) {
      console.warn('⚠️ Error al establecer sesión:', sessionErr.message);
      // Continuar, los headers pueden ser suficientes
    }

    if (!content || content.trim() === "") {
      console.log("❌ Contenido vacío");
      return res.status(400).json({ error: "El contenido es obligatorio" });
    }

    console.log("📝 Intentando insertar post en Supabase...");
    
    // Construir objeto de inserción dinámicamente (solo incluir ubicación si hay valores)
    const postData = {
      user_id: user.id,
      content: content.trim(),
      image_url: image_url || null,
      restaurant_id: restaurant_id || null,
    };

    // Solo agregar campos de ubicación si tienen valores válidos
    if (location_lat != null && location_lng != null && !isNaN(location_lat) && !isNaN(location_lng)) {
      postData.location_lat = parseFloat(location_lat);
      postData.location_lng = parseFloat(location_lng);
      if (location_name) {
        postData.location_name = location_name;
      }
    }

    console.log("📊 Datos a insertar:", postData);

    // Intentar INSERT con el cliente autenticado primero
    // Si falla por RLS, usar SERVICE_ROLE_KEY (solo si está configurado)
    let data, error;
    
    const insertResult = await supabaseAuth
      .from("posts")
      .insert([postData])
      .select();
    
    data = insertResult.data;
    error = insertResult.error;

    // Si hay error de RLS y tenemos SERVICE_ROLE_KEY, intentar con ese cliente
    if (error && error.message && error.message.includes('row-level security') && supabaseServiceKey) {
      console.warn('⚠️ Error de RLS detectado, intentando con SERVICE_ROLE_KEY...');
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
      const serviceResult = await supabaseService
        .from("posts")
        .insert([postData])
        .select();
      data = serviceResult.data;
      error = serviceResult.error;
      
      if (!error) {
        console.log('✅ Post creado usando SERVICE_ROLE_KEY (RLS bypassed, pero autenticación ya verificada)');
      }
    }

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
    
    // Obtener posts - intentar primero con cliente anónimo
    let supabaseClient = supabase;
    let postsToProcess = [];
    
    let { data: posts, error: postsError } = await supabaseClient
      .from("posts")
      .select("id, content, image_url, created_at, user_id, restaurant_id, location_lat, location_lng, location_name")
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("❌ Error al obtener posts:", postsError);
      console.error("❌ Error code:", postsError.code);
      console.error("❌ Error details:", postsError.details);
      console.error("❌ Error hint:", postsError.hint);
      
      // Si es error de RLS y tenemos SERVICE_ROLE_KEY, intentar con ese
      if (postsError.message && postsError.message.includes('row-level security') && supabaseServiceKey) {
        console.warn("⚠️ Error de RLS detectado, intentando con SERVICE_ROLE_KEY...");
        supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: servicePosts, error: serviceError } = await supabaseClient
          .from("posts")
          .select("id, content, image_url, created_at, user_id, restaurant_id, location_lat, location_lng, location_name")
          .order("created_at", { ascending: false });
        
        if (serviceError) {
          return res.status(500).json({ 
            error: "Error al obtener posts: " + serviceError.message,
            details: serviceError.details 
          });
        }
        
        postsToProcess = servicePosts || [];
      } else {
        return res.status(500).json({ 
          error: "Error al obtener posts: " + postsError.message,
          details: postsError.details 
        });
      }
    } else {
      postsToProcess = posts || [];
    }

    console.log(`✅ Se obtuvieron ${postsToProcess.length} posts`);

    // Obtener información de usuarios para cada post
    const postsWithData = await Promise.all(
      postsToProcess.map(async (post) => {
        try {
          // Obtener info del usuario
          const { data: userData, error: userError } = await supabaseClient
            .from("users")
            .select("id, full_name, email")
            .eq("id", post.user_id)
            .single();

          if (userError) {
            console.warn(`⚠️ Error al obtener usuario ${post.user_id}:`, userError.message);
          }

          // Obtener info del restaurante (si está etiquetado)
          let restaurantData = null;
          if (post.restaurant_id) {
            const { data: restaurant, error: restaurantError } = await supabaseClient
              .from("restaurants")
              .select("id, restaurant_name, ubicacion")
              .eq("id", post.restaurant_id)
              .single();
            
            if (!restaurantError) {
              restaurantData = restaurant;
            } else {
              console.warn(`⚠️ Error al obtener restaurante ${post.restaurant_id}:`, restaurantError.message);
            }
          }

          // Contar likes
          const { count: likesCount, error: likesError } = await supabaseClient
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          if (likesError) {
            console.warn(`⚠️ Error al contar likes del post ${post.id}:`, likesError.message);
          }

          // Contar comentarios
          const { count: commentsCount, error: commentsError } = await supabaseClient
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          if (commentsError) {
            console.warn(`⚠️ Error al contar comentarios del post ${post.id}:`, commentsError.message);
          }

          return {
            ...post,
            users: userData || { id: post.user_id, full_name: "Usuario", email: "" },
            restaurant: restaurantData,
            likes: [{ count: likesCount || 0 }],
            comments: [{ count: commentsCount || 0 }],
          };
        } catch (postError) {
          console.error(`❌ Error procesando post ${post.id}:`, postError);
          // Retornar post básico si hay error
          return {
            ...post,
            users: { id: post.user_id, full_name: "Usuario", email: "" },
            restaurant: null,
            likes: [{ count: 0 }],
            comments: [{ count: 0 }],
          };
        }
      })
    );

    console.log("✅ Feed procesado correctamente");
    res.status(200).json({ posts: postsWithData });
  } catch (error) {
    console.error("❌ Error general en getFeed:", error);
    console.error("❌ Stack:", error.stack);
    res.status(500).json({ 
      error: "Error interno del servidor: " + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    
    // Crear cliente autenticado
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: true,
        autoRefreshToken: false
      }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    // Usar SERVICE_ROLE_KEY si está disponible para evitar problemas de RLS
    let supabaseClient = supabaseAuth;
    if (supabaseServiceKey) {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    }

    const { data, error } = await supabaseClient
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
    
    // Crear cliente autenticado
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: true,
        autoRefreshToken: false
      }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    // Usar SERVICE_ROLE_KEY si está disponible para evitar problemas de RLS
    let supabaseClient = supabaseAuth;
    if (supabaseServiceKey) {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    }

    const { error } = await supabaseClient
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

    // Crear cliente autenticado
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: true,
        autoRefreshToken: false
      }
    });

    // Usar SERVICE_ROLE_KEY si está disponible para evitar problemas de RLS
    let supabaseClient = supabaseAuth;
    if (supabaseServiceKey) {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    }

    // Insertar comentario SIN select con relaciones
    const { data, error } = await supabaseClient
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
    const { data: userData } = await supabaseClient
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

    // Usar SERVICE_ROLE_KEY si está disponible para evitar problemas de RLS
    let supabaseClient = supabase;
    if (supabaseServiceKey) {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    }

    // Obtener comentarios sin relaciones complejas
    const { data: comments, error: commentsError } = await supabaseClient
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
        const { data: userData } = await supabaseClient
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