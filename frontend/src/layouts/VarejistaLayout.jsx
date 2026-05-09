import { Outlet } from "react-router-dom";
import VarejistaSidebar from "../components/sidebars/VarejistaSidebar";

function VarejistaLayout() {
  return (
    <div className="layout">

      <VarejistaSidebar />

      <main className="content">
        <Outlet />
      </main>

    </div>
  );
}

export default VarejistaLayout;