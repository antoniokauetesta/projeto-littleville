import { Router } from "express";
import {
  listSightings,
  getSighting,
  createSighting,
  updateSighting,
  deleteSighting,
  getStats,
  createComment,
} from "../controllers/sightingController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

// Rota pública — estatísticas do dashboard
router.get("/stats", authMiddleware, getStats);

// Rotas protegidas — CRUD de avistamentos
router.get("/", authMiddleware, listSightings);
router.get("/:id", authMiddleware, getSighting);
router.post("/", authMiddleware, createSighting);
router.post("/:id/comments", authMiddleware, createComment);
router.put("/:id", authMiddleware, updateSighting);
router.delete("/:id", authMiddleware, deleteSighting);

export default router;
