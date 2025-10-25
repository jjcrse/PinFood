const API_URL = "http://localhost:3000/api/auth";
const FEED_API_URL = "http://localhost:3000/api/feed";
const msg = document.getElementById("msg");

// Referencias a secciones
const authSection = document.getElementById("auth-section");
const welcomeSection = document.getElementById("welcome-section");
const feedSection = document.getElementById("feed-section");
const myProfileSection = document.getElementById("my-profile-section");
const userProfileSection = document.getElementById("user-profile-section");
const welcomeMsg = document.getElementById("welcome-msg");
const logoutBtn = document.getElementById("logout");
const goToFeedBtn = document.getElementById("go-to-feed");
const goToProfileBtn = document.getElementById("go-to-profile");
const backToWelcomeBtn = document.getElementById("back-to-welcome");
const backFromMyProfileBtn = document.getElementById("back-from-my-profile");
const backFromUserProfileBtn = document.getElementById("back-from-user-profile");

let currentUser = null;

// Si ya hay sesión guardada → mostrar bienvenida
if (localStorage.getItem("session")) {
  const session = JSON.parse(localStorage.getItem("session"));
  currentUser = session.user;
  mostrarBienvenida(currentUser);
}

// 🧾 REGISTRO
document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const full_name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-pass").value.trim();

  if (!full_name || !email || !password) {
    msg.textContent = "Por favor completa todos los campos.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name, email, password }),
    });

    const data = await res.json();
    msg.textContent = data.message || data.error;

    if (res.ok) {
      console.log("✅ Registro exitoso:", data);
      mostrarBienvenida(data.user);
    } else {
      console.error("❌ Error al registrar:", data);
    }
  } catch (err) {
    console.error("❌ Error en el frontend (registro):", err);
    msg.textContent = "Error al registrar usuario.";
  }
});

// 🔐 LOGIN
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-pass").value.trim();

  if (!email || !password) {
    msg.textContent = "Por favor ingresa tu correo y contraseña.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = `Error: ${data.error}`;
      console.error("❌ Error al iniciar sesión:", data);
      return;
    }

    console.log("✅ Login exitoso:", data);
    console.log("🔑 Session data:", data.session);
    console.log("🔑 Access token:", data.session.access_token?.substring(0, 30) + "...");
    
    // Guardar la sesión COMPLETA
    localStorage.setItem("session", JSON.stringify(data.session));
    
    // Verificar que se guardó correctamente
    const savedSession = localStorage.getItem("session");
    console.log("💾 Sesión guardada:", savedSession ? "✅ Sí" : "❌ No");
    
    currentUser = data.user;
    mostrarBienvenida(data.user);
  } catch (err) {
    console.error("❌ Error en el frontend (login):", err);
    msg.textContent = "Error al iniciar sesión.";
  }
});

// 🚪 LOGOUT
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("session");
  currentUser = null;
  authSection.style.display = "block";
  welcomeSection.style.display = "none";
  feedSection.style.display = "none";
  myProfileSection.style.display = "none";
  userProfileSection.style.display = "none";
  msg.textContent = "";
});

// 📰 IR AL FEED
goToFeedBtn.addEventListener("click", () => {
  welcomeSection.style.display = "none";
  feedSection.style.display = "block";
  cargarFeed();
});

// ⬅️ VOLVER A BIENVENIDA
backToWelcomeBtn.addEventListener("click", () => {
  feedSection.style.display = "none";
  welcomeSection.style.display = "flex";
});

// 📝 CREAR NUEVA PUBLICACIÓN
document.getElementById("post-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const content = document.getElementById("post-content").value.trim();
  const image_url = document.getElementById("post-image").value.trim();

  if (!content) {
    alert("Por favor escribe algo para publicar");
    return;
  }

  const session = JSON.parse(localStorage.getItem("session"));
  if (!session || !session.access_token) {
    alert("Sesión expirada. Por favor inicia sesión nuevamente.");
    return;
  }

  try {
    const res = await fetch(FEED_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ content, image_url }),
    });

    const data = await res.json();

    if (res.ok) {
      console.log("✅ Publicación creada:", data);
      document.getElementById("post-content").value = "";
      document.getElementById("post-image").value = "";
      cargarFeed();
    } else {
      console.error("❌ Error al crear publicación:", data);
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error("❌ Error en el frontend (crear post):", err);
    alert("Error al crear publicación.");
  }
});

// 📰 CARGAR FEED
async function cargarFeed() {
  const feedContainer = document.getElementById("feed-container");
  feedContainer.innerHTML = "<p>Cargando publicaciones...</p>";

  try {
    const res = await fetch(FEED_API_URL);
    const data = await res.json();

    if (!res.ok) {
      feedContainer.innerHTML = `<p>Error al cargar el feed: ${data.error}</p>`;
      return;
    }

    const posts = data.posts;

    if (posts.length === 0) {
      feedContainer.innerHTML = "<p>No hay publicaciones aún. ¡Sé el primero en publicar!</p>";
      return;
    }

    feedContainer.innerHTML = posts
      .map(
        (post) => {
          const isOwner = currentUser && post.user_id === currentUser.id;
          const likesCount = post.likes?.[0]?.count || 0;
          const commentsCount = post.comments?.[0]?.count || 0;

          return `
            <div class="post-card" data-post-id="${post.id}">
              <div class="post-header">
                <strong class="user-name-link" onclick="verPerfilUsuario('${post.user_id}', '${post.users?.full_name || post.users?.email || "Usuario"}')">${post.users?.full_name || post.users?.email || "Usuario"}</strong>
                <small>${new Date(post.created_at).toLocaleString()}</small>
              </div>
              <p class="post-content">${post.content}</p>
              ${post.image_url ? `<img src="${post.image_url}" alt="Imagen del post" class="post-image">` : ""}
              
              <div class="post-actions">
                <button class="btn-like" onclick="toggleLike('${post.id}')">
                  ❤️ ${likesCount} Me gusta
                </button>
                <button class="btn-comment" onclick="toggleComments('${post.id}')">
                  💬 ${commentsCount} Comentarios
                </button>
                ${isOwner ? `<button class="btn-delete" onclick="eliminarPost('${post.id}')">🗑️ Eliminar</button>` : ""}
              </div>

              <div class="comments-section" id="comments-${post.id}" style="display: none;">
                <div class="add-comment">
                  <input type="text" id="comment-input-${post.id}" placeholder="Escribe un comentario..." />
                  <button onclick="agregarComentario('${post.id}')">Enviar</button>
                </div>
                <div class="comments-list" id="comments-list-${post.id}">
                  <p>Cargando comentarios...</p>
                </div>
              </div>
            </div>
          `;
        }
      )
      .join("");
  } catch (err) {
    console.error("❌ Error al cargar el feed:", err);
    feedContainer.innerHTML = "<p>Error al cargar las publicaciones.</p>";
  }
}

// ❤️ DAR/QUITAR LIKE
window.toggleLike = async function (postId) {
  const sessionData = localStorage.getItem("session");
  if (!sessionData) {
    alert("Debes iniciar sesión para dar like");
    return;
  }

  let session;
  try {
    session = JSON.parse(sessionData);
  } catch (e) {
    console.error("Error al parsear sesión:", e);
    alert("Sesión inválida. Por favor inicia sesión nuevamente.");
    return;
  }

  const token = session.access_token;
  if (!token) {
    alert("Token no encontrado. Por favor inicia sesión nuevamente.");
    return;
  }

  console.log("🔑 Enviando like con token:", token.substring(0, 20) + "...");

  try {
    const res = await fetch(`${FEED_API_URL}/${postId}/like`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Respuesta like:", res.status);

    if (res.status === 401) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      localStorage.removeItem("session");
      location.reload();
      return;
    }

    if (res.ok) {
      console.log("✅ Like agregado");
      cargarFeed();
    } else {
      const data = await res.json();
      console.log("📊 Datos respuesta:", data);
      
      if (data.error && data.error.includes("Ya diste like")) {
        // Si ya dio like, quitarlo
        const deleteRes = await fetch(`${FEED_API_URL}/${postId}/like`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (deleteRes.ok) {
          console.log("✅ Like removido");
          cargarFeed();
        }
      } else {
        alert(`Error: ${data.error || "No se pudo dar like"}`);
      }
    }
  } catch (err) {
    console.error("❌ Error al dar like:", err);
    alert("Error de conexión al dar like");
  }
};

// 💬 MOSTRAR/OCULTAR COMENTARIOS
window.toggleComments = async function (postId) {
  const commentsSection = document.getElementById(`comments-${postId}`);
  if (commentsSection.style.display === "none") {
    commentsSection.style.display = "block";
    await cargarComentarios(postId);
  } else {
    commentsSection.style.display = "none";
  }
};

// 📖 CARGAR COMENTARIOS
async function cargarComentarios(postId) {
  const commentsList = document.getElementById(`comments-list-${postId}`);
  commentsList.innerHTML = "<p>Cargando comentarios...</p>";

  try {
    const res = await fetch(`${FEED_API_URL}/${postId}/comments`);
    const data = await res.json();

    if (!res.ok) {
      commentsList.innerHTML = `<p>Error al cargar comentarios</p>`;
      return;
    }

    const comments = data.comments;

    if (comments.length === 0) {
      commentsList.innerHTML = "<p class='no-comments'>No hay comentarios aún</p>";
      return;
    }

    commentsList.innerHTML = comments
      .map(
        (comment) => `
        <div class="comment">
          <strong>${comment.users?.full_name || comment.users?.email || "Usuario"}</strong>
          <p>${comment.content}</p>
          <small>${new Date(comment.created_at).toLocaleString()}</small>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("❌ Error al cargar comentarios:", err);
    commentsList.innerHTML = "<p>Error al cargar comentarios</p>";
  }
}

// ➕ AGREGAR COMENTARIO
window.agregarComentario = async function (postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();

  if (!content) {
    alert("Escribe un comentario");
    return;
  }

  const sessionData = localStorage.getItem("session");
  if (!sessionData) {
    alert("Debes iniciar sesión para comentar");
    return;
  }

  let session;
  try {
    session = JSON.parse(sessionData);
  } catch (e) {
    console.error("Error al parsear sesión:", e);
    alert("Sesión inválida. Por favor inicia sesión nuevamente.");
    return;
  }

  const token = session.access_token;
  if (!token) {
    alert("Token no encontrado. Por favor inicia sesión nuevamente.");
    return;
  }

  console.log("💬 Enviando comentario con token:", token.substring(0, 20) + "...");

  try {
    const res = await fetch(`${FEED_API_URL}/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    console.log("📡 Respuesta comentario:", res.status);

    if (res.status === 401) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      localStorage.removeItem("session");
      location.reload();
      return;
    }

    if (res.ok) {
      console.log("✅ Comentario agregado");
      input.value = "";
      await cargarComentarios(postId);
      cargarFeed(); // Actualizar contador
    } else {
      const data = await res.json();
      console.error("❌ Error al comentar:", data);
      alert(`Error: ${data.error || "No se pudo agregar el comentario"}`);
    }
  } catch (err) {
    console.error("❌ Error al agregar comentario:", err);
    alert("Error de conexión al agregar comentario");
  }
};

// 🗑️ ELIMINAR POST
window.eliminarPost = async function (postId) {
  if (!confirm("¿Seguro que quieres eliminar esta publicación?")) {
    return;
  }

  const sessionData = localStorage.getItem("session");
  if (!sessionData) {
    alert("Sesión expirada");
    return;
  }

  let session;
  try {
    session = JSON.parse(sessionData);
  } catch (e) {
    console.error("Error al parsear sesión:", e);
    alert("Sesión inválida. Por favor inicia sesión nuevamente.");
    return;
  }

  const token = session.access_token;
  if (!token) {
    alert("Token no encontrado. Por favor inicia sesión nuevamente.");
    return;
  }

  console.log("🗑️ Eliminando post con token:", token.substring(0, 20) + "...");

  try {
    const res = await fetch(`${FEED_API_URL}/${postId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Respuesta eliminar:", res.status);

    if (res.status === 401) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      localStorage.removeItem("session");
      location.reload();
      return;
    }

    if (res.ok) {
      console.log("✅ Post eliminado");
      cargarFeed();
    } else {
      const data = await res.json();
      console.error("❌ Error al eliminar:", data);
      alert(`Error: ${data.error || "No se pudo eliminar la publicación"}`);
    }
  } catch (err) {
    console.error("❌ Error al eliminar post:", err);
    alert("Error de conexión al eliminar publicación");
  }
};

// 🔹 Función para mostrar la vista de bienvenida
function mostrarBienvenida(user) {
  authSection.style.display = "none";
  welcomeSection.style.display = "flex";
  feedSection.style.display = "none";
  myProfileSection.style.display = "none";
  userProfileSection.style.display = "none";
  welcomeMsg.textContent = `Bienvenido, ${user?.email || user?.full_name || "Usuario"} 👋`;
}

// 👤 IR A MI PERFIL
goToProfileBtn.addEventListener("click", () => {
  welcomeSection.style.display = "none";
  myProfileSection.style.display = "block";
  cargarMiPerfil();
});

// ⬅️ VOLVER DESDE MI PERFIL
backFromMyProfileBtn.addEventListener("click", () => {
  myProfileSection.style.display = "none";
  welcomeSection.style.display = "flex";
});

// ⬅️ VOLVER DESDE PERFIL DE USUARIO
backFromUserProfileBtn.addEventListener("click", () => {
  userProfileSection.style.display = "none";
  feedSection.style.display = "block";
});

// 📱 CARGAR MI PERFIL
async function cargarMiPerfil() {
  const profileContent = document.getElementById("my-profile-content");
  profileContent.innerHTML = "<p>Cargando perfil...</p>";

  if (!currentUser) {
    profileContent.innerHTML = "<p>Error: No hay usuario logueado</p>";
    return;
  }

  console.log("👤 currentUser completo:", currentUser);
  console.log("🆔 currentUser.id:", currentUser.id);

  try {
    const res = await fetch(`http://localhost:3000/api/profile/${currentUser.id}`);
    const data = await res.json();

    if (!res.ok) {
      profileContent.innerHTML = `<p>Error al cargar perfil: ${data.error}</p>`;
      return;
    }

    const { user, posts } = data;

    profileContent.innerHTML = `
      <div class="profile-container">
        <div class="profile-header-card">
          <div class="profile-picture">
            ${user.profile_picture_url 
              ? `<img src="${user.profile_picture_url}" alt="Foto de perfil" />` 
              : `<div class="profile-placeholder">👤</div>`
            }
          </div>
          <div class="profile-info">
            <h3>${user.full_name || "Usuario"}</h3>
            <p class="profile-email">📧 ${user.email}</p>
            <p class="profile-description">${user.description || "Sin descripción"}</p>
            <p class="profile-stats">📊 ${posts.length} publicaciones</p>
          </div>
        </div>

        <button id="edit-profile-btn" class="btn-primary">✏️ Editar Perfil</button>

        <div id="edit-profile-form" style="display: none;" class="edit-profile-form">
          <h3>Editar Perfil</h3>
          <input type="text" id="edit-name" placeholder="Nombre completo" value="${user.full_name || ""}" />
          <textarea id="edit-description" placeholder="Descripción" rows="3">${user.description || ""}</textarea>
          <input type="url" id="edit-picture-url" placeholder="URL de foto de perfil" value="${user.profile_picture_url || ""}" />
          <div style="display: flex; gap: 10px;">
            <button id="save-profile-btn" class="btn-primary">💾 Guardar</button>
            <button id="cancel-edit-btn" class="btn-secondary">❌ Cancelar</button>
          </div>
        </div>

        <h3 style="margin-top: 30px;">Mis Publicaciones</h3>
        <div class="feed-container">
          ${posts.length === 0 
            ? "<p>No has publicado nada aún</p>" 
            : posts.map(post => `
              <div class="post-card">
                <div class="post-header">
                  <strong>${user.full_name || user.email}</strong>
                  <small>${new Date(post.created_at).toLocaleString()}</small>
                </div>
                <p class="post-content">${post.content}</p>
                ${post.image_url ? `<img src="${post.image_url}" alt="Imagen del post" class="post-image">` : ""}
                <div class="post-actions">
                  <span>❤️ ${post.likes?.[0]?.count || 0} Me gusta</span>
                  <span>💬 ${post.comments?.[0]?.count || 0} Comentarios</span>
                </div>
              </div>
            `).join("")
          }
        </div>
      </div>
    `;

    // Event listeners para editar perfil
    document.getElementById("edit-profile-btn").addEventListener("click", () => {
      document.getElementById("edit-profile-form").style.display = "block";
    });

    document.getElementById("cancel-edit-btn").addEventListener("click", () => {
      document.getElementById("edit-profile-form").style.display = "none";
    });

    document.getElementById("save-profile-btn").addEventListener("click", async () => {
      await guardarPerfil(user.id);
    });

  } catch (err) {
    console.error("❌ Error al cargar perfil:", err);
    profileContent.innerHTML = "<p>Error al cargar perfil</p>";
  }
}

// 💾 GUARDAR PERFIL
async function guardarPerfil(userId) {
  const full_name = document.getElementById("edit-name").value.trim();
  const description = document.getElementById("edit-description").value.trim();
  const profile_picture_url = document.getElementById("edit-picture-url").value.trim();

  const sessionData = localStorage.getItem("session");
  if (!sessionData) {
    alert("Sesión expirada");
    return;
  }

  const session = JSON.parse(sessionData);
  const token = session.access_token;

  try {
    const res = await fetch(`http://localhost:3000/api/profile/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ full_name, description, profile_picture_url }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Perfil actualizado exitosamente");
      document.getElementById("edit-profile-form").style.display = "none";
      cargarMiPerfil();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    console.error("❌ Error al guardar perfil:", err);
    alert("Error al guardar perfil");
  }
}

// 👥 VER PERFIL DE OTRO USUARIO
window.verPerfilUsuario = async function(userId, userName) {
  feedSection.style.display = "none";
  userProfileSection.style.display = "block";

  const profileContent = document.getElementById("user-profile-content");
  profileContent.innerHTML = "<p>Cargando perfil...</p>";

  try {
    const res = await fetch(`http://localhost:3000/api/profile/${userId}`);
    const data = await res.json();

    if (!res.ok) {
      profileContent.innerHTML = `<p>Error al cargar perfil: ${data.error}</p>`;
      return;
    }

    const { user, posts } = data;

    profileContent.innerHTML = `
      <div class="profile-container">
        <div class="profile-header-card">
          <div class="profile-picture">
            ${user.profile_picture_url 
              ? `<img src="${user.profile_picture_url}" alt="Foto de perfil" />` 
              : `<div class="profile-placeholder">👤</div>`
            }
          </div>
          <div class="profile-info">
            <h3>${user.full_name || "Usuario"}</h3>
            <p class="profile-description">${user.description || "Sin descripción"}</p>
            <p class="profile-stats">📊 ${posts.length} publicaciones</p>
          </div>
        </div>

        <h3 style="margin-top: 30px;">Publicaciones</h3>
        <div class="feed-container">
          ${posts.length === 0 
            ? "<p>No hay publicaciones</p>" 
            : posts.map(post => `
              <div class="post-card">
                <div class="post-header">
                  <strong>${user.full_name || user.email}</strong>
                  <small>${new Date(post.created_at).toLocaleString()}</small>
                </div>
                <p class="post-content">${post.content}</p>
                ${post.image_url ? `<img src="${post.image_url}" alt="Imagen del post" class="post-image">` : ""}
                <div class="post-actions">
                  <span>❤️ ${post.likes?.[0]?.count || 0} Me gusta</span>
                  <span>💬 ${post.comments?.[0]?.count || 0} Comentarios</span>
                </div>
              </div>
            `).join("")
          }
        </div>
      </div>
    `;

  } catch (err) {
    console.error("❌ Error al cargar perfil:", err);
    profileContent.innerHTML = "<p>Error al cargar perfil</p>";
  }
};