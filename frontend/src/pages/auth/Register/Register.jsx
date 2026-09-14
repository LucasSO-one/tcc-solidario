import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { register } from "../../../service/auth";

const USER_TYPES = [
  { value: "consumidor", label: "Consumidor", icon: FaUserFriends },
  { value: "ong", label: "ONG", icon: FaHandsHelping },
  { value: "varejista", label: "Varejista", icon: FaStore },
];

// Campos específicos de cada tipo — controla o que é renderizado E o que é
// obrigatório, então fica fácil adicionar um novo tipo de usuário no futuro
const CAMPOS_POR_TIPO = {
  consumidor: [
    { name: "cpf", label: "CPF", placeholder: "000.000.000-00", maxLength: 14 },
    { name: "telefone", label: "Telefone", placeholder: "(11) 91234-5678" },
  ],
  ong: [
    { name: "nomeFantasia", label: "Nome da ONG", placeholder: "Nome fantasia da instituição" },
    { name: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00", maxLength: 18 },
    { name: "telefone", label: "Telefone", placeholder: "(11) 91234-5678" },
  ],
  varejista: [
    { name: "razaoSocial", label: "Razão Social", placeholder: "Razão social da empresa" },
    { name: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00", maxLength: 18 },
  ],
};

const CAMPOS_INICIAIS = {
  nome: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  cpf: "",
  telefone: "",
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
};

const Register = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("consumidor");
  const [formData, setFormData] = useState(CAMPOS_INICIAIS);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Ao trocar de tipo, limpa os campos específicos do tipo anterior
  // (evita mandar, por exemplo, um CPF preenchido junto de um cadastro de ONG)
  const handleUserTypeChange = (novoTipo) => {
    setUserType(novoTipo);
    setFormData((prev) => ({
      ...prev,
      cpf: "",
      telefone: "",
      cnpj: "",
      razaoSocial: "",
      nomeFantasia: "",
    }));
    setErro("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (formData.senha !== formData.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const resultado = await register(userType, formData);
      navigate("/login", {
        replace: true,
        state: { mensagem: resultado.Mensagem },
      });
    } catch (err) {
      setErro(err.response?.data?.Erro ?? "Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const campoIdentificacao =
    userType === "consumidor" ? "nome" : userType === "ong" ? "nomeFantasia" : "razaoSocial";
  const camposExtras = CAMPOS_POR_TIPO[userType].filter((c) => c.name !== campoIdentificacao);

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

          {erro && <p className="register-card__error">{erro}</p>}

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
                  onClick={() => handleUserTypeChange(value)}
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nome / Razão Social / Nome Fantasia — muda o label conforme o tipo,
              mas é sempre o mesmo campo visual pro usuário */}
          <div className="register-card__field">
            <label htmlFor={campoIdentificacao} className="register-card__label">
              {userType === "consumidor" && "Nome completo"}
              {userType === "ong" && "Nome da ONG"}
              {userType === "varejista" && "Razão Social"}
            </label>
            <input
              type="text"
              id={campoIdentificacao}
              name={campoIdentificacao}
              placeholder={userType === "consumidor" ? "Seu nome" : "Nome oficial da instituição"}
              value={formData[campoIdentificacao]}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Campos extras específicos do tipo (CPF/CNPJ/Telefone) */}
          {camposExtras.map(({ name, label, placeholder, maxLength }) => (
            <div className="register-card__field" key={name}>
              <label htmlFor={name} className="register-card__label">
                {label}
              </label>
              <input
                type="text"
                id={name}
                name={name}
                placeholder={placeholder}
                maxLength={maxLength}
                value={formData[name]}
                onChange={handleInputChange}
                required
              />
            </div>
          ))}

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
                placeholder="Pelo menos 8 caracteres"
                value={formData.senha}
                onChange={handleInputChange}
                required
                minLength={8}
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
            <small className="register-card__hint">
              Mínimo de 8 caracteres, com maiúscula, número e caractere especial.
            </small>
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

          <button type="submit" className="register-card__submit" disabled={carregando}>
            {carregando ? "Criando conta..." : "Criar conta"}
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