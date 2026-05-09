import { Outlet } from "react-router-dom";
import OngSidebar from "../components/sidebars/OngSidebar";

function OngLayout() {
  return (
    <div className="layout">

      <OngSidebar />

      <main className="content">
        <Outlet />
      </main>

    </div>
  );
}

export default OngLayout;