import { useState } from "react";
import { FaUser, FaEnvelope, FaLock, FaStore, FaHandsHelping, FaUserFriends } from "react-icons/fa";
import Logo from "../../../assets/Logo.png";
import "./Register.scss";

const Register = () => {
  const [userType, setUserType] = useState("consumidor");
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de cadastro aqui
    console.log("Dados do cadastro:", { ...formData, userType });
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        {/* Lado esquerdo - Imagem/Informações */}
        <div className="register-left">
          <div className="brand">
            <h1 className="brand-title">
              <img src={Logo} alt="VittaFlow"></img>
            </h1>
            <p className="brand-subtitle">Reduza o desperdício. Conecte alimentos a quem precisa.</p>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className="register-right">
          <div className="register-header">
            <h2>Criar Conta</h2>
            <p>Selecione o tipo e preencha os dados</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Tipo de usuário */}
            <div className="form-group">
              <label>Tipo de usuário</label>
              <div className="user-type-selector">
                <button
                  type="button"
                  className={`type-btn ${userType === "consumidor" ? "active" : ""}`}
                  onClick={() => setUserType("consumidor")}
                >
                  <FaUserFriends />
                  <span>Consumidor</span>
                </button>
                <button
                  type="button"
                  className={`type-btn ${userType === "ong" ? "active" : ""}`}
                  onClick={() => setUserType("ong")}
                >
                  <FaHandsHelping />
                  <span>ONG</span>
                </button>
                <button
                  type="button"
                  className={`type-btn ${userType === "varejista" ? "active" : ""}`}
                  onClick={() => setUserType("varejista")}
                >
                  <FaStore />
                  <span>Varejista</span>
                </button>
              </div>
            </div>

            {/* Nome Completo */}
            <div className="form-group">
              <label htmlFor="nome">Nome Completo</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  placeholder="Seu nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="form-group">
              <label htmlFor="senha">Senha</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  id="senha"
                  name="senha"
                  placeholder="Pelo menos 6 caracteres"
                  value={formData.senha}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                />
              </div>
              <small className="password-hint">Mínimo 6 caracteres</small>
            </div>

            {/* Confirmar Senha */}
            <div className="form-group">
              <label htmlFor="confirmarSenha">Confirmar Senha</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  placeholder="Confirme sua senha"
                  value={formData.confirmarSenha}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Criar Conta
            </button>
          </form>

          <div className="register-footer">
            <p>
              Já tem conta? <a href="/login">Entrar</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;