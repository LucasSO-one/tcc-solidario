import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUserFriends,
  FaHandsHelping,
  FaStore,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import Logo from "../../../assets/Logo.png";
import "./Register.scss";

import ilustracao from "../../../assets/harmony-produce2.png";

const USER_TYPES = [
  { value: "consumidor", label: "Consumidor", icon: FaUserFriends },
  { value: "ong", label: "ONG", icon: FaHandsHelping },
  { value: "varejista", label: "Varejista", icon: FaStore },
];

const Register = () => {
  const [userType, setUserType] = useState("consumidor");
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dados do cadastro:", { ...formData, userType });
  };

  return (
    <div className="register-layout">
      <aside
        className="register-layout__brand"
        style={{ backgroundImage: `url(${ilustracao})` }}
      >
        <div className="register-layout__overlay" />

        <div className="register-layout__header">
          <img className="register-layout__logo" src={Logo} alt="VittaFlow" />
        </div>

        <div className="register-layout__copy">
          <h1 className="register-layout__tagline">
            Alimento que sobra<br />
            em um lugar é cuidado<br />
            que falta em outro.
          </h1>

          <span className="register-layout__divider" />

          <p className="register-layout__quote">
            Cada refeição resgatada é um gesto de cuidado — com as pessoas e
            com a terra.
          </p>
        </div>
      </aside>

      <main className="register-layout__content">
        <form onSubmit={handleSubmit} className="register-card">
          <h2 className="register-card__title">Criar conta</h2>
          <p className="register-card__subtitle">
            Selecione o tipo e preencha os dados
          </p>

          <div className="register-card__field">
            <label className="register-card__label">Tipo de usuário</label>
            <div className="register-card__type-selector">
              {USER_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`register-card__type-btn${
                    userType === value ? " register-card__type-btn--active" : ""
                  }`}
                  onClick={() => setUserType(value)}
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="register-card__field">
            <label htmlFor="nome" className="register-card__label">
              Nome completo
            </label>
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

          <div className="register-card__field">
            <label htmlFor="email" className="register-card__label">
              Email
            </label>
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

          <div className="register-card__field">
            <label htmlFor="senha" className="register-card__label">
              Senha
            </label>
            <div className="register-card__input-wrapper">
              <input
                type={showSenha ? "text" : "password"}
                id="senha"
                name="senha"
                placeholder="Pelo menos 6 caracteres"
                value={formData.senha}
                onChange={handleInputChange}
                required
                minLength={6}
              />
              <button
                type="button"
                className="register-card__toggle-visibility"
                onClick={() => setShowSenha((prev) => !prev)}
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                {showSenha ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <small className="register-card__hint">Mínimo de 6 caracteres.</small>
          </div>

          <div className="register-card__field">
            <label htmlFor="confirmarSenha" className="register-card__label">
              Confirmar senha
            </label>
            <div className="register-card__input-wrapper">
              <input
                type={showConfirmarSenha ? "text" : "password"}
                id="confirmarSenha"
                name="confirmarSenha"
                placeholder="Repita sua senha"
                value={formData.confirmarSenha}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="register-card__toggle-visibility"
                onClick={() => setShowConfirmarSenha((prev) => !prev)}
                aria-label={
                  showConfirmarSenha ? "Ocultar senha" : "Mostrar senha"
                }
                tabIndex={-1}
              >
                {showConfirmarSenha ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="register-card__submit">
            Criar conta
          </button>

          <p className="register-card__footer">
            Já tem conta?{" "}
            <Link to="/login" className="register-card__footer-link">
              Entrar
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
};

export default Register;