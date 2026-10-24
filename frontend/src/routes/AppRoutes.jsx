import { Route, Navigate, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

// layouts
import AdminLayout from "../layouts/AdminLayout";
import ConsumidorLayout from "../layouts/ConsumidorLayout";
import OngLayout from "../layouts/OngLayout";
import VarejistaLayout from "../layouts/VarejistaLayout";

// Admin
import DashboardAdm from "../pages/admin/DashboardAdm/DashboardAdm";
import Approvals from "../pages/admin/Approvals/Approvals";
import Users from "../pages/admin/Users/Users";

// Varejista
import DashboardVarejista from "../pages/varejista/DashboardVarejista/DashboardVarejista";
import CadastrarLote from "../pages/varejista/CadastrarLote/CadastrarLote";
import MeusProdutos from "../pages/varejista/MeusProdutos/MeusProdutos";
import ValidarRetirada from "../pages/varejista/ValidarRetirada/ValidarRetirada";
import Doacoes from "../pages/varejista/Doacoes/Doacoes";
import Impacto from "../pages/varejista/Impacto/Impacto";

// Consumidor
import Ofertas from "../pages/consumidor/Ofertas/Ofertas";
import Marketplace from "../pages/consumidor/Marketplace/Marketplace";
import MinhasReservas from "../pages/consumidor/MinhasReservas/MinhasReservas";

// ONG
import VisaoGeralOng from "../pages/ong/VisaoGeral/VisaoGeral";
import VitrineONG from "../pages/ong/VitrineONG/VitrineONG";
import MeusResgates from "../pages/ong/MeusResgates/MeusResgates";
import Solicitacoes from "../pages/ong/Solicitacoes/Solicitacoes";

// Comum
import Configuracoes from "../pages/conta/Configuracoes/Configuracoes";
import Termos from "../pages/publicas/Termos";
import Privacidade from "../pages/publicas/Privacidade";

// Auth
import Register from "../pages/auth/Register/Register";
import Login from "../pages/auth/Login/Login";

// Roteador de dados (createBrowserRouter): necessário para avisar sobre alterações não salvas (useBlocker).
const router = createBrowserRouter(createRoutesFromElements(
  <>
    {/* Rota raiz -> redireciona para login */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* Rotas públicas */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/termos" element={<Termos />} />
    <Route path="/privacidade" element={<Privacidade />} />

    {/* Rotas privadas */}
    <Route path="/dashboard/admin" element={<AdminLayout />}>
      <Route index element={<DashboardAdm />} />
      <Route path="approvals" element={<Approvals />} />
      <Route path="users" element={<Users />} />
      <Route path="configuracoes" element={<Configuracoes />} />
      <Route path="perfil" element={<Navigate to="../configuracoes" replace />} />
    </Route>

    <Route path="/dashboard/consumidor" element={<ConsumidorLayout />}>
      <Route index element={<Ofertas />} />
      <Route path="marketplace" element={<Marketplace />} />
      <Route path="reservas" element={<MinhasReservas />} />
      <Route path="configuracoes" element={<Configuracoes />} />
    </Route>

    <Route path="/dashboard/ong" element={<OngLayout />}>
      <Route index element={<VisaoGeralOng />} />
      <Route path="vitrine" element={<VitrineONG />} />
      <Route path="resgates" element={<MeusResgates />} />
      <Route path="solicitacoes" element={<Solicitacoes />} />
      <Route path="configuracoes" element={<Configuracoes />} />
    </Route>

    <Route path="/dashboard/varejista" element={<VarejistaLayout />}>
      <Route index element={<DashboardVarejista />} />
      <Route path="cadastrar-lote" element={<CadastrarLote />} />
      <Route path="meus-produtos" element={<MeusProdutos />} />
      <Route path="validar-retirada" element={<ValidarRetirada />} />
      <Route path="doacoes" element={<Doacoes />} />
      <Route path="impacto" element={<Impacto />} />
      <Route path="configuracoes" element={<Configuracoes />} />
    </Route>

    {/* Qualquer rota inexistente cai no login em vez de tela em branco */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </>
));

export default router;
