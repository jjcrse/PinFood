import express from "express";
import {
  createPost,
  getFeed,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  getComments,
  deleteComment,
} from "../controllers/feed.controller.js";

const router = express.Router();

// 📰 RUTAS DE POSTS
router.post("/", createPost);              // Crear publicación
router.get("/", getFeed);                  // Obtener feed
router.delete("/:id", deletePost);         // Eliminar publicación

// ❤️ RUTAS DE LIKES
router.post("/:postId/like", likePost);    // Dar like
router.delete("/:postId/like", unlikePost); // Quitar like

// 💬 RUTAS DE COMENTARIOS
router.get("/:postId/comments", getComments);        // Obtener comentarios
router.post("/:postId/comments", addComment);        // Agregar comentario
router.delete("/comments/:commentId", deleteComment); // Eliminar comentario

export default router;