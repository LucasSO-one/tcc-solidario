import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

import Logo from "../../assets/Logo_nome.png";

function AdminSidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar__logo">
        <img src={Logo} alt="VittaFlow" />
      </div>

      <nav className="sidebar__nav">

        <Link
          to="/dashboard/admin"
          className="sidebar__link"
        >
          <LayoutDashboard />
          <span>Dashboard</span>
        </Link>

        <Link
          to="/dashboard/admin/approvals"
          className="sidebar__link"
        >
          <ShieldCheck />
          <span>Aprovações</span>
        </Link>

        <Link
          to="/dashboard/admin/users"
          className="sidebar__link"
        >
          <Users />
          <span>Usuários</span>
        </Link>

      </nav>

    </aside>
  );
}

export default AdminSidebar;