// VarejistaSidebar.jsx
import {
  LayoutDashboard,
  PackageSearch,
  PackagePlus,
  QrCode,
  HandHeart,
} from "lucide-react";
import Sidebar from "../Sidebar/Sidebar";

const items = [
  { to: "/dashboard/varejista", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/dashboard/varejista/meus-produtos", icon: PackageSearch, label: "Meus Produtos" },
  { to: "/dashboard/varejista/cadastrar-lote", icon: PackagePlus, label: "Cadastrar Lote" },
  { to: "/dashboard/varejista/validar-retirada", icon: QrCode, label: "Validar Retirada" },
  { to: "/dashboard/varejista/doacoes", icon: HandHeart, label: "Doações" },
];

function VarejistaSidebar() {
  return <Sidebar items={items} />;
}

export default VarejistaSidebar;