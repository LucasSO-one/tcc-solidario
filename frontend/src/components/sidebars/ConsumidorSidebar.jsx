import { Link } from "react-router-dom";

import {
  BadgePercent,
  ShoppingBasket,
  PackageCheck,
} from "lucide-react";

import Logo from "../../assets/Logo_nome.png";

function ConsumidorSidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar__logo">
        <img src={Logo} alt="VittaFlow" />
      </div>

      <nav className="sidebar__nav">

        <Link
          to="/dashboard/consumidor"
          className="sidebar__link"
        >
          <BadgePercent />
          <span>Ofertas</span>
        </Link>

        <Link
          to="/dashboard/consumidor/marketplace"
          className="sidebar__link"
        >
          <ShoppingBasket />
          <span>Marketplace</span>
        </Link>

        <Link
          to="/dashboard/consumidor/reservas"
          className="sidebar__link"
        >
          <PackageCheck />
          <span>Minhas Reservas</span>
        </Link>

      </nav>

    </aside>
  );
}

export default ConsumidorSidebar;