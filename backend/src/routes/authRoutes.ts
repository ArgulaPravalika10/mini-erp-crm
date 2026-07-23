import { Router } from "express";
import { getMe, loginUser, registerUser } from "../controllers/authController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.post("/login", loginUser);
router.get("/me", authenticate, getMe);
router.post("/register", authenticate, authorize(["Admin"]), registerUser);

export default router;
