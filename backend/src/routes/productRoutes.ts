import { Router } from "express";
// import {
//   addProduct,
//   getProducts,
//   updateProduct,
// } from "../controllers/productController";
import {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
const router = Router();

router.post("/", addProduct);
router.get("/", getProducts);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
