import { Router } from "express";
import {
  addCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController";
const router = Router();

// Add Customer
router.post("/", addCustomer);
router.get("/", getCustomers);
router.put("/:id", updateCustomer);
router.delete(
  "/:id",
  (req, res, next) => {
    console.log("DELETE route reached");
    next();
  },
  deleteCustomer,
);
export default router;
