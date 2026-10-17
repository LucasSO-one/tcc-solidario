import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { logout } from "../../service/auth"; 

const BotaoLogout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Chama o back-end para invalidar o token e limpa o localStorage
    await logout(); 
    
    // Volta pro login sem deixar histórico
    navigate("/login", { replace: true });
  };

  return (
    <button 
      onClick={handleLogout} 
      className="btn-logout" 
      style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
    >
      <FaSignOutAlt />
      <span>Sair</span>
    </button>
  );
};

export default BotaoLogout;