import express from "express";
import { savePost, unsavePost, getSavedPosts, checkIfSaved } from "../controllers/savedPosts.controller.js";

const router = express.Router();

// 💾 POST /api/saved-posts/:postId - Guardar publicación
router.post("/:postId", savePost);

// 🗑️ DELETE /api/saved-posts/:postId - Quitar guardado
router.delete("/:postId", unsavePost);

// 📚 GET /api/saved-posts/user/:userId - Obtener posts guardados de un usuario
router.get("/user/:userId", getSavedPosts);

// ✅ GET /api/saved-posts/:postId/check - Verificar si está guardado
router.get("/:postId/check", checkIfSaved);

export default router;

