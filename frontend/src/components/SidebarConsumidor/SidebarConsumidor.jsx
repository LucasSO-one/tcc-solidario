import "./SidebarConsumidor.css";
import { NavLink } from "react-router-dom";

import {
  FaStore,
  FaShoppingBasket,
  FaClipboardCheck,
  FaLeaf
} from "react-icons/fa";

function SidebarConsumidor() {
  return (
    <aside className="sidebar-consumidor">

      <div className="logo">
        <div className="logo-icon">
          <FaLeaf />
        </div>

        <div>
          <h2>VittaFlow</h2>
          <p>Consumidor</p>
        </div>
      </div>

      <nav>

        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "menu active" : "menu"
          }
        >
          <FaStore />
          <span>Ofertas</span>
        </NavLink>

        <NavLink
          to="/marketplace"
          className={({ isActive }) =>
            isActive ? "menu active" : "menu"
          }
        >
          <FaShoppingBasket />
          <span>Marketplace</span>
        </NavLink>

        <NavLink
          to="/minhas-reservas"
          className={({ isActive }) =>
            isActive ? "menu active" : "menu"
          }
        >
          <FaClipboardCheck />
          <span>Minhas Reservas</span>
        </NavLink>

      </nav>
    </aside>
  );
}

export default SidebarConsumidor;