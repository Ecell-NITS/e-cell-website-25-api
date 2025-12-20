import { Router } from "express";
import { getDashboard } from "../controllers/userController";
import { verifyToken } from "../middlewares/verifyToken";

const router = Router();

router.get("/dashboard", verifyToken, getDashboard);

export default router;