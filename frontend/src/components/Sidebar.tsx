import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import type { Role } from "../types";

interface NavItem {
  label: string;
  to: string;
  marker: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/",
    marker: "D",
    roles: ["Admin", "Sales", "Warehouse", "Accounts"],
  },
  {
    label: "Customers",
    to: "/customers",
    marker: "C",
    roles: ["Admin", "Sales", "Accounts"],
  },
  {
    label: "Products",
    to: "/products",
    marker: "P",
    roles: ["Admin", "Sales", "Warehouse", "Accounts"],
  },
  {
    label: "Challans",
    to: "/orders",
    marker: "S",
    roles: ["Admin", "Sales", "Warehouse", "Accounts"],
  },
  {
    label: "Reports",
    to: "/reports",
    marker: "R",
    roles: ["Admin", "Accounts"],
  },
];

function Sidebar() {
  const { user } = useAuth();
  const visibleItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">ME</div>
        <div>
          <strong>Mini ERP</strong>
          <span>Operations CRM</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="Primary navigation">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-marker">{item.marker}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
