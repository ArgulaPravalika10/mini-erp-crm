import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["Admin", "Sales", "Warehouse", "Accounts"]), getOrders);
router.get("/:id", authorize(["Admin", "Sales", "Warehouse", "Accounts"]), getOrderById);
router.post("/", authorize(["Admin", "Sales"]), createOrder);
router.put("/:id/status", authorize(["Admin", "Sales"]), updateOrderStatus);
router.put("/:id", authorize(["Admin", "Sales"]), updateOrderStatus);
router.delete("/:id", authorize(["Admin"]), deleteOrder);

export default router;
