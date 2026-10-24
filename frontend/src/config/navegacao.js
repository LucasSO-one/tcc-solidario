import {
  BadgePercent, ChartColumn, ClipboardList, HandHeart, History, LayoutDashboard, PackagePlus, PackageSearch,
  PackageCheck, QrCode, ShieldCheck, ShoppingBasket, Store, Users,
} from 'lucide-react';

// Menu lateral por perfil, agrupado em seções. Ordem = ordem de exibição.
export const NAVEGACAO = {
  Varejista: [
    { titulo: 'Operação', itens: [
      { to: '/dashboard/varejista', icon: LayoutDashboard, label: 'Visão geral', end: true },
      { to: '/dashboard/varejista/meus-produtos', icon: PackageSearch, label: 'Meus alimentos' },
      { to: '/dashboard/varejista/cadastrar-lote', icon: PackagePlus, label: 'Cadastrar alimento' },
      { to: '/dashboard/varejista/validar-retirada', icon: QrCode, label: 'Validar retirada' },
      { to: '/dashboard/varejista/doacoes', icon: HandHeart, label: 'Doações' },
    ] },
    { titulo: 'Impacto', itens: [
      { to: '/dashboard/varejista/impacto', icon: ChartColumn, label: 'Relatórios de impacto' },
    ] },
  ],
  ONG: [
    { titulo: 'Doações', itens: [
      { to: '/dashboard/ong', icon: LayoutDashboard, label: 'Visão geral', end: true },
      { to: '/dashboard/ong/vitrine', icon: Store, label: 'Alimentos disponíveis' },
      { to: '/dashboard/ong/solicitacoes', icon: ClipboardList, label: 'Minhas solicitações' },
      { to: '/dashboard/ong/resgates', icon: History, label: 'Histórico de doações' },
    ] },
  ],
  Consumidor: [
    { titulo: 'Compras', itens: [
      { to: '/dashboard/consumidor', icon: BadgePercent, label: 'Ofertas', end: true },
      { to: '/dashboard/consumidor/marketplace', icon: ShoppingBasket, label: 'Vitrine' },
      { to: '/dashboard/consumidor/reservas', icon: PackageCheck, label: 'Minhas reservas' },
    ] },
  ],
  Admin: [
    { titulo: 'Administração', itens: [
      { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Visão geral', end: true },
      { to: '/dashboard/admin/approvals', icon: ShieldCheck, label: 'Aprovações' },
      { to: '/dashboard/admin/users', icon: Users, label: 'Usuários' },
    ] },
  ],
};

export const NOME_TIPO = { Varejista: 'Varejista', ONG: 'ONG', Consumidor: 'Consumidor', Admin: 'Administrador' };
