import express from "express";
import { registerRestaurant, loginRestaurant, searchRestaurants } from "../controllers/restaurant.controller.js";

const router = express.Router();

// 🔍 GET /api/restaurants/search
router.get("/search", searchRestaurants);

// 📝 POST /api/restaurants/register
router.post("/register", registerRestaurant);

// 🔐 POST /api/restaurants/login
router.post("/login", loginRestaurant);

export default router;

