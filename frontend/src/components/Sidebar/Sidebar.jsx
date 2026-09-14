import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";

import Logo from "../../assets/Logo_nome.png";

import "./Sidebar.scss";

function Sidebar({ items }) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true"
  );

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>

      <button
        type="button"
        className="sidebar__toggle"
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <Menu />
      </button>

      <div className="sidebar__content">

        <div className="sidebar__logo">
          <img src={Logo} alt="VittaFlow" />
        </div>

        <nav className="sidebar__nav">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon />
              <span className="sidebar__label">{label}</span>
            </NavLink>
          ))}
        </nav>

      </div>

    </aside>
  );
}

export default Sidebar;