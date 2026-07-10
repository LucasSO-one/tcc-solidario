import { Routes, Route } from "react-router-dom";

import SidebarConsumidor from "./components/SidebarConsumidor/SidebarConsumidor";
import Ofertas from "./pages/Consumidor/Ofertas/Ofertas";
import Marketplace from "./pages/Consumidor/Marketplace/Marketplace";
import MinhasReservas from "./pages/Consumidor/MinhasReservas/MinhasReservas";

function App() {
  return (
    <div className="app">
      <SidebarConsumidor />

      <Routes>
        <Route path="/" element={<Ofertas />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/minhas-reservas" element={<MinhasReservas />} />
      </Routes>
    </div>
  );
}

export default App;