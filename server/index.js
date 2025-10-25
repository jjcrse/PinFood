import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const PORT = 5050;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));