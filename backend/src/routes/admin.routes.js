import { Router } from "express";
import {
  listUsers,
  updateUser,
  deleteUser,
  deleteSightingAsAdmin,
} from "../controllers/adminController.js";
import { authMiddleware, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware, requireAdmin);
router.get("/users", listUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.delete("/sightings/:id", deleteSightingAsAdmin);

export default router;
