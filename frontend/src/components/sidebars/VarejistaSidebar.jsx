import { Link } from "react-router-dom";

import {
  LayoutDashboard,
  PackageSearch,
  PackagePlus,
  QrCode,
  HandHeart,
} from "lucide-react";

import Logo from "../../assets/Logo_nome.png";

function VarejistaSidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar__logo">
        <img src={Logo} alt="VittaFlow" />
      </div>

      <nav className="sidebar__nav">

        <Link
          to="/dashboard/varejista"
          className="sidebar__link"
        >
          <LayoutDashboard />
          <span>Dashboard</span>
        </Link>

        <Link
          to="/dashboard/varejista/meus-produtos"
          className="sidebar__link"
        >
          <PackageSearch />
          <span>Meus Produtos</span>
        </Link>

        <Link
          to="/dashboard/varejista/cadastrar-lote"
          className="sidebar__link"
        >
          <PackagePlus />
          <span>Cadastrar Lote</span>
        </Link>

        <Link
          to="/dashboard/varejista/validar-retirada"
          className="sidebar__link"
        >
          <QrCode />
          <span>Validar Retirada</span>
        </Link>

        <Link
          to="/dashboard/varejista/doacoes"
          className="sidebar__link"
        >
          <HandHeart />
          <span>Doações</span>
        </Link>

      </nav>

    </aside>
  );
}

export default VarejistaSidebar;