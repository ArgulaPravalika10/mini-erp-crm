import { Router } from "express";
import {
  addCustomerFollowUp,
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "../controllers/customerController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["Admin", "Sales", "Accounts"]), getCustomers);
router.get("/:id", authorize(["Admin", "Sales", "Accounts"]), getCustomerById);
router.post("/", authorize(["Admin", "Sales"]), createCustomer);
router.put("/:id", authorize(["Admin", "Sales"]), updateCustomer);
router.delete("/:id", authorize(["Admin"]), deleteCustomer);
router.post(
  "/:id/follow-ups",
  authorize(["Admin", "Sales"]),
  addCustomerFollowUp,
);

export default router;
