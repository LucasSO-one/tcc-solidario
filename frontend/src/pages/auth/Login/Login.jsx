import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ilustracao from '../../../assets/harmony-produce.png';
import { login } from '../../../service/auth';
import { mensagemErro } from '../../../utils/mensagemErro';
import { ROTA_POR_TIPO } from '../../../utils/rotasPorTipo';
import AuthLayout from '../../../components/AuthLayout/AuthLayout';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import CampoSenha from '../../../components/ui/CampoSenha';
import Field from '../../../components/ui/Field';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const mensagemCadastro = location.state?.mensagem;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const { token, usuario } = await login(form);

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      navigate(ROTA_POR_TIPO[usuario.tipo] ?? '/login', { replace: true });
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível entrar. Confira seus dados e tente novamente.'));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <AuthLayout ilustracao={ilustracao}
      titulo={<>Reduza o desperdício.<br />Conecte alimentos a quem precisa.</>}
      frase="Cada refeição resgatada é um gesto de cuidado, com as pessoas e com a terra.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__cabecalho">
          <h2>Bem-vindo de volta</h2>
          <p>Acesse sua conta e continue de onde parou.</p>
        </div>

        {mensagemCadastro && !erro && <Alert variant="success">{mensagemCadastro}</Alert>}
        {erro && <Alert variant="error">{erro}</Alert>}

        <Field label="E-mail">
          <input type="email" placeholder="seu@email.com" autoComplete="email" value={form.email} onChange={handleChange('email')} required />
        </Field>
        <Field label="Senha">
          <CampoSenha autoComplete="current-password" value={form.senha} onChange={handleChange('senha')} required />
        </Field>

        <Button type="submit" variant="primary" block loading={carregando}>Entrar</Button>

        <p className="auth-form__rodape">
          Ainda não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
