import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { logout } from "../../service/auth"; 

const BotaoLogout = () => {
  const navigate = useNavigate();
  const [saindo, setSaindo] = useState(false);

  const handleLogout = async () => {
    if (saindo) return;
    setSaindo(true);
    // Invalida o token na API e remove os dados da sessão no navegador.
    await logout(); 
    
    // Volta pro login sem deixar histórico
    navigate("/login", { replace: true });
  };

  return (
    <button 
      type="button"
      onClick={handleLogout}
      disabled={saindo}
      aria-label="Sair"
      title="Sair" 
      className="btn-logout sidebar__link" 
    >
      <FaSignOutAlt aria-hidden="true" />
      <span className="sidebar__label">{saindo ? "Saindo..." : "Sair"}</span>
    </button>
  );
};

export default BotaoLogout;