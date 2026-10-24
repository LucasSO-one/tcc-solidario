import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HandHeart, Store, UserRound } from "lucide-react";
import ilustracao from "../../../assets/harmony-produce2.png";
import { register } from "../../../service/auth";
import { mensagemErro } from "../../../utils/mensagemErro";
import { mascaraCnpj, mascaraCpf, mascaraTelefone, senhaValida } from "../../../utils/mascaras";
import AuthLayout from "../../../components/AuthLayout/AuthLayout";
import ForcaSenha from "../../../components/conta/ForcaSenha";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import CampoSenha from "../../../components/ui/CampoSenha";
import Field from "../../../components/ui/Field";

const USER_TYPES = [
  { value: "consumidor", label: "Consumidor", icon: UserRound },
  { value: "ong", label: "ONG", icon: HandHeart },
  { value: "varejista", label: "Varejista", icon: Store },
];

const MASCARAS = { cpf: mascaraCpf, cnpj: mascaraCnpj, telefone: mascaraTelefone };

// Campos específicos de cada tipo — controla o que é renderizado E o que é
// obrigatório, então fica fácil adicionar um novo tipo de usuário no futuro
const CAMPOS_POR_TIPO = {
  consumidor: [
    { name: "nome", label: "Nome completo", placeholder: "Seu nome", autoComplete: "name" },
    { name: "cpf", label: "CPF", placeholder: "000.000.000-00", inputMode: "numeric" },
    { name: "telefone", label: "Celular", placeholder: "(11) 91234-5678", inputMode: "tel", autoComplete: "tel" },
  ],
  ong: [
    { name: "nomeFantasia", label: "Nome da ONG", placeholder: "Nome fantasia da instituição" },
    { name: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00", inputMode: "numeric" },
    { name: "telefone", label: "Celular de contato", placeholder: "(11) 91234-5678", inputMode: "tel", autoComplete: "tel" },
  ],
  varejista: [
    { name: "razaoSocial", label: "Razão social", placeholder: "Razão social da empresa" },
    { name: "nomeEstabelecimento", label: "Nome do estabelecimento", placeholder: "Ex.: Mercadinho do Bairro" },
    { name: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00", inputMode: "numeric" },
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
  nomeEstabelecimento: "",
};

const Register = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("consumidor");
  const [formData, setFormData] = useState(CAMPOS_INICIAIS);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: MASCARAS[name] ? MASCARAS[name](value) : value }));
  };

  // Ao trocar de tipo, limpa os campos específicos do tipo anterior
  // (evita mandar, por exemplo, um CPF preenchido junto de um cadastro de ONG)
  const handleUserTypeChange = (novoTipo) => {
    setUserType(novoTipo);
    setFormData((prev) => ({
      ...prev,
      nome: "",
      cpf: "",
      telefone: "",
      cnpj: "",
      razaoSocial: "",
      nomeFantasia: "",
      nomeEstabelecimento: "",
    }));
    setErro("");
  };

  const senhasDiferentes = formData.confirmarSenha && formData.senha !== formData.confirmarSenha;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!senhaValida(formData.senha)) {
      setErro("A senha ainda não atende a todos os requisitos.");
      return;
    }
    if (formData.senha !== formData.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      const resultado = await register(userType, formData);
      const precisaAprovacao = userType !== "consumidor";
      navigate("/login", {
        replace: true,
        state: {
          mensagem: resultado?.mensagem ?? resultado?.Mensagem ?? (precisaAprovacao
            ? "Cadastro enviado! Nossa equipe vai analisar os dados e liberar o acesso em breve."
            : "Conta criada! Agora é só entrar."),
        },
      });
    } catch (err) {
      setErro(mensagemErro(err, "Não foi possível concluir o cadastro. Tente novamente."));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <AuthLayout ilustracao={ilustracao}
      titulo={<>Alimento que sobra em um lugar é cuidado que falta em outro.</>}
      frase="Varejistas, consumidores e ONGs juntos para que nenhum alimento bom vá para o lixo.">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-form__cabecalho">
          <h2>Criar conta</h2>
          <p>Escolha como você vai usar a VittaFlow.</p>
        </div>

        {erro && <Alert variant="error">{erro}</Alert>}

        <fieldset className="seletor-tipo">
          <legend>Tipo de conta</legend>
          {USER_TYPES.map(({ value, label, icon: Icon }) => (
            <span key={value}>
              <input type="radio" id={`tipo-${value}`} name="tipo" value={value}
                checked={userType === value} onChange={() => handleUserTypeChange(value)} />
              <label htmlFor={`tipo-${value}`}><Icon aria-hidden="true" />{label}</label>
            </span>
          ))}
        </fieldset>

        {userType !== "consumidor" && <Alert variant="info">
          Cadastros de {userType === "ong" ? "ONGs" : "varejistas"} passam por uma análise rápida da nossa equipe antes de liberar o acesso.
        </Alert>}

        {CAMPOS_POR_TIPO[userType].map(({ name, label, ...props }) => (
          <Field key={name} label={label} required>
            <input type="text" name={name} value={formData[name]} onChange={handleInputChange} {...props} />
          </Field>
        ))}

        <Field label="E-mail" required help="Você vai usar este e-mail para entrar.">
          <input type="email" name="email" placeholder="seu@email.com" autoComplete="email" value={formData.email} onChange={handleInputChange} />
        </Field>

        <Field label="Senha" required>
          <CampoSenha name="senha" autoComplete="new-password" value={formData.senha} onChange={handleInputChange} />
        </Field>
        <ForcaSenha senha={formData.senha} />

        <Field label="Confirmar senha" required error={senhasDiferentes ? "As senhas não coincidem." : undefined}>
          <CampoSenha name="confirmarSenha" autoComplete="new-password" value={formData.confirmarSenha} onChange={handleInputChange} />
        </Field>

        <Button type="submit" variant="primary" block loading={carregando}>Criar conta</Button>

        <p className="auth-form__rodape">
          Ao criar a conta, você concorda com os <Link to="/termos">Termos de uso</Link> e
          a <Link to="/privacidade">Política de privacidade</Link>.
        </p>
        <p className="auth-form__rodape">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
