import { Router } from "express";
import {
  getDashboardStats,
  getSalesReport,
} from "../controllers/dashboardController";

const router = Router();

router.get("/", getDashboardStats);
router.get("/sales", getSalesReport);

export default router;
