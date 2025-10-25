import express from "express";
import { registerRestaurant, loginRestaurant } from "../controllers/restaurant.controller.js";

const router = express.Router();

// 📝 POST /api/restaurants/register
router.post("/register", registerRestaurant);

// 🔐 POST /api/restaurants/login
router.post("/login", loginRestaurant);

export default router;

