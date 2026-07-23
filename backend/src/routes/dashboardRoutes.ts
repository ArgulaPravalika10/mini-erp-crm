import { Router } from "express";
import {
  getDashboardStats,
  getSalesReport,
} from "../controllers/dashboardController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["Admin", "Sales", "Warehouse", "Accounts"]), getDashboardStats);
router.get("/sales", authorize(["Admin", "Accounts"]), getSalesReport);

export default router;
