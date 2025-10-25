import express from "express";
import { getUserProfile, updateUserProfile, getUserStats } from "../controllers/profile.controller.js";

const router = express.Router();

// 📊 GET /api/profile/:userId/stats - Obtener estadísticas (debe ir primero)
router.get("/:userId/stats", getUserStats);

// 👤 GET /api/profile/:userId - Obtener perfil de un usuario
router.get("/:userId", getUserProfile);

// ✏️ PUT /api/profile/:userId - Actualizar perfil
router.put("/:userId", updateUserProfile);

export default router;

