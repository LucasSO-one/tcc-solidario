import { Link } from "react-router-dom";

import {
  Store,
  HandHeart,
  ClipboardList,
} from "lucide-react";

import Logo from "../../assets/Logo_nome.png";

function OngSidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar__logo">
        <img src={Logo} alt="VittaFlow" />
      </div>

      <nav className="sidebar__nav">

        <Link
          to="/dashboard/ong"
          className="sidebar__link"
        >
          <Store />
          <span>Vitrine ONG</span>
        </Link>

        <Link
          to="/dashboard/ong/resgates"
          className="sidebar__link"
        >
          <HandHeart />
          <span>Meus Resgates</span>
        </Link>

        <Link
          to="/dashboard/ong/solicitacoes"
          className="sidebar__link"
        >
          <ClipboardList />
          <span>Solicitações</span>
        </Link>

      </nav>

    </aside>
  );
}

export default OngSidebar;