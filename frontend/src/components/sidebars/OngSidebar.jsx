// OngSidebar.jsx
import { Store, HandHeart, ClipboardList } from "lucide-react";
import Sidebar from "../Sidebar/Sidebar";

const items = [
  { to: "/dashboard/ong", icon: Store, label: "Vitrine ONG", end: true },
  { to: "/dashboard/ong/resgates", icon: HandHeart, label: "Meus Resgates" },
  { to: "/dashboard/ong/solicitacoes", icon: ClipboardList, label: "Solicitações" },
];

function OngSidebar() {
  return <Sidebar items={items} />;
}

export default OngSidebar;