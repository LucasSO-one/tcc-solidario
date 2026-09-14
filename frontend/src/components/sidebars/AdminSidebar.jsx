// AdminSidebar.jsx
import { LayoutDashboard, ShieldCheck, Users, UserCog } from "lucide-react";
import Sidebar from "../Sidebar/Sidebar";

const items = [
  { to: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/dashboard/admin/approvals", icon: ShieldCheck, label: "Aprovações" },
  { to: "/dashboard/admin/users", icon: Users, label: "Usuários" },
  { to: "/dashboard/admin/perfil", icon: UserCog, label: "Perfil" },
];

function AdminSidebar() {
  return <Sidebar items={items} />;
}

export default AdminSidebar;