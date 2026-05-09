import { Outlet } from "react-router-dom";
import ConsumidorSidebar from "../components/sidebars/ConsumidorSidebar";
    
function ConsumidorLayout() {
  return (
    <div className="layout">

      <ConsumidorSidebar />

      <main className="content">
        <Outlet />
      </main>

    </div>
  );
}

export default ConsumidorLayout;