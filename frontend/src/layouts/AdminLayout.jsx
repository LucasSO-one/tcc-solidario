import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/sidebars/AdminSidebar";

function AdminLayout() {
  return (
    <div className="layout">

      <AdminSidebar />

      <main className="content">
        <Outlet />
      </main>

    </div>
  );
}

export default AdminLayout;