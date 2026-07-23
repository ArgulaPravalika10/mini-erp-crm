import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Sidebar from "./Sidebar";

const pageTitles: Record<string, string> = {
  "/": "Command Center",
  "/customers": "Customers",
  "/customers/new": "Add Customer",
  "/products": "Products",
  "/products/new": "Add Product",
  "/orders": "Sales Challans",
  "/orders/new": "Create Challan",
  "/reports": "Sales Report",
};

export function AppLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const title =
    pageTitles[location.pathname] ||
    (location.pathname.includes("/customers") ? "Customer Workspace" : "") ||
    (location.pathname.includes("/products") ? "Inventory Workspace" : "") ||
    (location.pathname.includes("/orders") ? "Challan Workspace" : "") ||
    "Mini ERP";

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Wholesale operations portal</p>
            <h1>{title}</h1>
          </div>
          <div className="user-menu">
            <div className="user-chip">
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
            <button className="btn btn-secondary" type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
