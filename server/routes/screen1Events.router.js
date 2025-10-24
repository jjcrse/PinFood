import express from "express";
import { getScreen1Events } from "../controllers/screen1Events.controller.js";

const router = express.Router();

// Ruta GET
router.get("/", getScreen1Events);

export default router;
