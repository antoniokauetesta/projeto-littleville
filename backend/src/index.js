import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import sightingRoutes from "./routes/sightings.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas
app.use("/auth", authRoutes);
app.use("/sightings", sightingRoutes);
app.use("/admin", adminRoutes);

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API Little Ville - Avistamentos 👣" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
