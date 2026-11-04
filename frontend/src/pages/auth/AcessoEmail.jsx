import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import Alert from '../../components/ui/Alert';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import CampoSenha from '../../components/ui/CampoSenha';
import ForcaSenha from '../../components/conta/ForcaSenha';
import api from '../../config/api';
import { mensagemErro } from '../../utils/mensagemErro';
import { senhaValida } from '../../utils/mascaras';
import ilustracao from '../../assets/harmony-produce.png';

const TITULOS = { 'recuperar-senha': 'Recupere seu acesso', 'reenviar-confirmacao': 'Confirme seu e-mail', 'confirmar-email': 'Confirme seu e-mail', 'redefinir-senha': 'Crie uma nova senha' };
export default function AcessoEmail({ acao }) {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState(''); const [confirmacao, setConfirmacao] = useState('');
  const [mensagem, setMensagem] = useState(''); const [erro, setErro] = useState(''); const [ocupado, setOcupado] = useState(false);
  const precisaToken = acao === 'confirmar-email' || acao === 'redefinir-senha';
  useEffect(() => { if (window.location.hash) window.history.replaceState(null, '', window.location.pathname); }, []);
  async function enviar(e) {
    e.preventDefault(); setErro('');
    if (acao === 'redefinir-senha' && (!senhaValida(senha) || senha !== confirmacao)) { setErro('Confira a política de senha e a confirmação.'); return; }
    setOcupado(true);
    try {
      const { data } = await api.post('/auth/' + acao, precisaToken ? { token, ...(acao === 'redefinir-senha' ? { novaSenha: senha } : {}) } : { email: email.trim() });
      setMensagem(data.mensagem); setSenha(''); setConfirmacao('');
    } catch (err) { setErro(mensagemErro(err, 'Não foi possível concluir. Solicite um novo link e tente novamente.')); }
    finally { setOcupado(false); }
  }
  return <AuthLayout ilustracao={ilustracao} titulo={<>Uma conexão com<br />mais cuidado.</>} frase="Proteja seu acesso e continue fazendo parte desta rede.">
    <form className="auth-form" onSubmit={enviar}>
      <div className="auth-form__cabecalho"><h2>{TITULOS[acao]}</h2><p>{precisaToken ? 'Conclua a ação solicitada para sua conta.' : 'Informe o e-mail usado no cadastro para receber as instruções.'}</p></div>
      {erro && <Alert variant="error">{erro}</Alert>}
      {mensagem ? <Alert variant="success">{mensagem}</Alert> : precisaToken && !token ? <Alert variant="warning">Abra o link recebido por e-mail ou solicite um novo link.</Alert> : <>
        {!precisaToken && <Field label="E-mail"><input type="email" maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></Field>}
        {acao === 'redefinir-senha' && <>
          <Field label="Nova senha"><CampoSenha autoComplete="new-password" value={senha} onChange={e => setSenha(e.target.value)} required /></Field>
          <ForcaSenha senha={senha} />
          <Field label="Confirme a nova senha"><CampoSenha autoComplete="new-password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} required /></Field>
        </>}
        <Button type="submit" variant="primary" block loading={ocupado}>{acao === 'confirmar-email' ? 'Confirmar e-mail' : acao === 'redefinir-senha' ? 'Redefinir senha' : 'Enviar instruções'}</Button>
      </>}
      <p className="auth-form__rodape"><Link to="/login">Voltar para entrar</Link></p>
      {precisaToken && <p className="auth-form__rodape"><Link to={acao === 'confirmar-email' ? '/reenviar-confirmacao' : '/recuperar-senha'}>Solicitar outro link</Link></p>}
    </form>
  </AuthLayout>;
}
