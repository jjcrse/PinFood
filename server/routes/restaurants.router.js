import express from "express";
import { registerRestaurant, loginRestaurant, searchRestaurants, getRestaurantPosts } from "../controllers/restaurant.controller.js";

const router = express.Router();

// 🔍 GET /api/restaurants/search
router.get("/search", searchRestaurants);

// 📝 GET /api/restaurants/:restaurantId/posts - Obtener posts donde el restaurante está etiquetado
router.get("/:restaurantId/posts", getRestaurantPosts);

// 📝 POST /api/restaurants/register
router.post("/register", registerRestaurant);

// 🔐 POST /api/restaurants/login
router.post("/login", loginRestaurant);

export default router;

