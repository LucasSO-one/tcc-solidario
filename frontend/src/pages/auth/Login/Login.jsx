import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import ilustracao from '../../../assets/harmony-produce.png';
import { login, confirmarMfa } from '../../../service/auth';
import { mensagemErro } from '../../../utils/mensagemErro';
import { ROTA_POR_TIPO } from '../../../utils/rotasPorTipo';
import AuthLayout from '../../../components/AuthLayout/AuthLayout';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import CampoSenha from '../../../components/ui/CampoSenha';
import Field from '../../../components/ui/Field';
import './Login.scss';

export default function Login() {
  const navigate = useNavigate(); const location = useLocation();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState(''); const [carregando, setCarregando] = useState(false);
  const [mfa, setMfa] = useState(null); const [codigo, setCodigo] = useState('');
  const [recuperacao, setRecuperacao] = useState(false); const [codigos, setCodigos] = useState(null);
  const [usuario, setUsuario] = useState(null);
  function concluir(resultado) {
    setCodigo(''); setErro('');
    if (resultado.requerMfa) { setMfa(resultado); setRecuperacao(false); setForm(f => ({ ...f, senha: '' })); return; }
    if (resultado.codigosRecuperacao?.length) { setCodigos(resultado.codigosRecuperacao); setUsuario(resultado.usuario); return; }
    navigate(ROTA_POR_TIPO[resultado.usuario.tipo] ?? '/login', { replace: true });
  }
  async function entrar(e) {
    e.preventDefault(); setErro(''); setCarregando(true);
    try { concluir(await login({ email: form.email.trim(), senha: form.senha })); }
    catch (err) { setErro(mensagemErro(err, 'Não foi possível entrar. Confira seus dados.')); }
    finally { setCarregando(false); }
  }
  async function validarMfa(e) {
    e.preventDefault(); setErro(''); setCarregando(true);
    try { concluir(await confirmarMfa({ desafio: mfa.desafio, codigo: recuperacao ? '' : codigo, codigoRecuperacao: recuperacao ? codigo : null })); }
    catch (err) { setErro(mensagemErro(err, 'Confira o código ou reinicie o login.')); }
    finally { setCarregando(false); }
  }
  return <AuthLayout ilustracao={ilustracao}
    titulo={<>Reduza o desperdício.<br />Conecte alimentos a quem precisa.</>}
    frase="Cada refeição resgatada é um gesto de cuidado, com as pessoas e com a terra.">
    {codigos ? <section className="auth-form">
      <h2>Guarde seus códigos de recuperação</h2>
      <p>Salve-os em um lugar seguro, separado do seu celular. Cada código permite recuperar o autenticador uma única vez, junto com sua senha.</p>
      <ul className="mfa-codigos">{codigos.map(c => <li key={c}><code>{c}</code></li>)}</ul>
      <Button variant="primary" block onClick={() => navigate(ROTA_POR_TIPO[usuario.tipo], { replace: true })}>Guardei os códigos. Continuar</Button>
    </section> : mfa ? <form className="auth-form" onSubmit={validarMfa}>
      <div className="auth-form__cabecalho"><h2>{mfa.configurarMfa ? 'Proteja sua conta administrativa' : 'Verifique sua identidade'}</h2>
        <p>{mfa.configurarMfa ? 'No seu aplicativo autenticador, adicione uma conta e leia o QR Code. Depois informe o código de seis dígitos.' : 'Informe o código atual do seu aplicativo autenticador.'}</p></div>
      {erro && <Alert variant="error">{erro}</Alert>}
      {mfa.configurarMfa && <div className="mfa-setup"><QRCodeSVG value={mfa.uriAutenticador} size={180} /><p>Ou digite esta chave no aplicativo:</p><code>{mfa.segredo}</code></div>}
      <Field label={recuperacao ? 'Código de recuperação' : 'Código do autenticador'}>
        <input value={codigo} onChange={e => setCodigo(recuperacao ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode={recuperacao ? 'text' : 'numeric'} autoComplete="one-time-code" maxLength={recuperacao ? 40 : 6} required />
      </Field>
      <Button type="submit" variant="primary" block loading={carregando} disabled={!codigo}>Verificar e continuar</Button>
      {!mfa.configurarMfa && <Button variant="ghost" onClick={() => { setRecuperacao(v => !v); setCodigo(''); }}>{recuperacao ? 'Usar aplicativo autenticador' : 'Perdi acesso ao autenticador'}</Button>}
      <Button variant="ghost" onClick={() => { setMfa(null); setCodigo(''); setErro(''); }}>Reiniciar login</Button>
    </form> : <form className="auth-form" onSubmit={entrar}>
      <div className="auth-form__cabecalho"><h2>Bem-vindo de volta</h2><p>Acesse sua conta e continue de onde parou.</p></div>
      {location.state?.mensagem && !erro && <Alert variant="success">{location.state.mensagem}</Alert>}
      {erro && <Alert variant="error">{erro}</Alert>}
      <Field label="E-mail"><input type="email" placeholder="seu@email.com" maxLength={254} autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></Field>
      <Field label="Senha"><CampoSenha autoComplete="current-password" value={form.senha} maxLength={256} onChange={e => setForm({ ...form, senha: e.target.value })} required /></Field>
      <Link to="/recuperar-senha">Esqueci minha senha</Link>
      <Button type="submit" variant="primary" block loading={carregando}>Entrar</Button>
      <p className="auth-form__rodape">Ainda não tem conta? <Link to="/register">Criar conta</Link></p>
      <p className="auth-form__rodape"><Link to="/reenviar-confirmacao">Reenviar confirmação de e-mail</Link></p>
    </form>}
  </AuthLayout>;
}
