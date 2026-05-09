import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import DashboardAdm from "./pages/admin/DashboardAdm/DashboardAdm";
import DashboardVarejista from "./pages/varejista/DashboardVarejista/DashboardVarejista";
import NewProduct from "./pages/varejista/NewProduct/NewProduct";



// instalem o npm install pra rodar o projeto !

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rotas públicas aqui */}

        {/* <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} /> */}

        {/* Rotas privadas */}
        <Route path="/dashboard/varejista" element={<DashboardVarejista />} />
        <Route path="/dashboard/admin" element={<DashboardAdm />} />
        <Route path="/produto/novo" element={<NewProduct />} />

        {/* Página não encontrada */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;