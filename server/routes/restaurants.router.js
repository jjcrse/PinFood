import express from "express";
import { registerRestaurant, loginRestaurant, searchRestaurants, getRestaurantPosts, updateRestaurantProfile } from "../controllers/restaurant.controller.js";

const router = express.Router();

// 🔍 GET /api/restaurants/search
router.get("/search", searchRestaurants);

// 📝 GET /api/restaurants/:restaurantId/posts - Obtener posts donde el restaurante está etiquetado
router.get("/:restaurantId/posts", getRestaurantPosts);

// 📝 POST /api/restaurants/register
router.post("/register", registerRestaurant);

// 🔐 POST /api/restaurants/login
router.post("/login", loginRestaurant);

// ✏️ PUT /api/restaurants/:restaurantId - Actualizar perfil del restaurante
router.put("/:restaurantId", updateRestaurantProfile);

export default router;

