import "./Sidebar.css";
import {
  FaStore,
  FaClipboardList,
  FaHandHoldingHeart,
  FaLeaf
} from "react-icons/fa";

function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="logo">

        <div className="logo-icon">
          <FaLeaf />
        </div>

        <div>
          <h2>VittaFlow</h2>
          <p>ONG</p>
        </div>

      </div>

      <nav>

        <button className="menu">
          <FaStore />
          <span>Vitrine ONG</span>
        </button>

        <button className="menu active">
          <FaHandHoldingHeart />
          <span>Meus Resgates</span>
        </button>

        <button className="menu">
          <FaClipboardList />
          <span>Solicitações</span>
        </button>

      </nav>

    </aside>
  );
}

export default Sidebar;