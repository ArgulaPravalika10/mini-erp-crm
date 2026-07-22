import { Router } from "express";
// import { addOrder } from "../controllers/orderController";
// import { addOrder, getOrders } from "../controllers/orderController";
import {
  addOrder,
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController";
const router = Router();

router.post("/", addOrder);
router.get("/", getOrders);
router.put("/:id", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;
