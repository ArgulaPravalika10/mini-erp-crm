import { Router } from "express";
import {
  adjustStock,
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getStockMovements,
  updateProduct,
} from "../controllers/productController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["Admin", "Sales", "Warehouse", "Accounts"]), getProducts);
router.get(
  "/:id",
  authorize(["Admin", "Sales", "Warehouse", "Accounts"]),
  getProductById,
);
router.get(
  "/:id/movements",
  authorize(["Admin", "Warehouse", "Accounts"]),
  getStockMovements,
);
router.post("/", authorize(["Admin", "Warehouse"]), createProduct);
router.put("/:id", authorize(["Admin", "Warehouse"]), updateProduct);
router.post("/:id/stock", authorize(["Admin", "Warehouse"]), adjustStock);
router.delete("/:id", authorize(["Admin"]), deleteProduct);

export default router;
