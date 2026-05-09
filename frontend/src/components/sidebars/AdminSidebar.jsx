import { Link } from "react-router-dom";

function AdminSidebar() {
  return (
    <aside>

      <Link to="/admin">
        Dashboard
      </Link>

      <Link to="/admin/users">
        Usuários
      </Link>

    </aside>
  );
}

export default AdminSidebar;