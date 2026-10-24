import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logout } from "../../service/auth";

const BotaoLogout = ({ tooltip = false }) => {
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
      data-tooltip={tooltip ? "Sair" : undefined}
      className="btn-logout sidebar__link"
    >
      <LogOut aria-hidden="true" />
      <span className="sidebar__label">{saindo ? "Saindo..." : "Sair"}</span>
    </button>
  );
};

export default BotaoLogout;
