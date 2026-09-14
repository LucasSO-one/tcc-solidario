// ConsumidorSidebar.jsx
import { BadgePercent, ShoppingBasket, PackageCheck } from "lucide-react";
import Sidebar from "../Sidebar/Sidebar";

const items = [
  { to: "/dashboard/consumidor", icon: BadgePercent, label: "Ofertas", end: true },
  { to: "/dashboard/consumidor/marketplace", icon: ShoppingBasket, label: "Marketplace" },
  { to: "/dashboard/consumidor/reservas", icon: PackageCheck, label: "Minhas Reservas" },
];

function ConsumidorSidebar() {
  return <Sidebar items={items} />;
}

export default ConsumidorSidebar;