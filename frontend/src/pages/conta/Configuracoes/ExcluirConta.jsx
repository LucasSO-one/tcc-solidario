import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { excluirConta } from '../../../service/conta';
import { mensagemErro } from '../../../utils/mensagemErro';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Modal from '../../../components/ui/Modal';
import Alert from '../../../components/ui/Alert';

export default function ExcluirConta() {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  function fechar() { if (!enviando) { setAberto(false); setSenha(''); setConfirmacao(''); setErro(''); } }
  async function excluir(e) {
    e.preventDefault();
    if (enviando || !senha || confirmacao !== 'EXCLUIR') return;
    setEnviando(true); setErro('');
    try {
      await excluirConta(senha, confirmacao);
      localStorage.removeItem('token'); localStorage.removeItem('usuario');
      navigate('/login', { replace: true });
    } catch (e) { setErro(mensagemErro(e)); setEnviando(false); }
  }
  return <section className="config-secao">
    <div className="config-secao__cabecalho"><h2>Excluir minha conta</h2>
      <p>Esta ação é definitiva. Seu acesso será encerrado e seus dados de perfil serão removidos. O histórico de reservas e retiradas manterá vínculos técnicos com uma conta identificada como excluída.</p>
      <p>É necessário encerrar as reservas ativas antes de continuar.</p>
    </div>
    <div className="config-secao__acoes"><Button variant="danger" onClick={() => setAberto(true)}>Excluir minha conta</Button></div>
    {aberto && <Modal title="Excluir sua conta definitivamente?" onClose={fechar}>
      <form className="config-secao" onSubmit={excluir}>
        <p>Não será possível recuperar este cadastro. A exclusão não apaga o histórico operacional das outras partes.</p>
        {erro && <Alert variant="error">{erro}</Alert>}
        <Field label="Sua senha atual" required><input type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} disabled={enviando} /></Field>
        <Field label="Digite EXCLUIR para confirmar" required><input value={confirmacao} autoComplete="off" onChange={e => setConfirmacao(e.target.value)} disabled={enviando} /></Field>
        <div className="config-secao__acoes"><Button variant="ghost" onClick={fechar} disabled={enviando}>Cancelar</Button>
          <Button type="submit" variant="danger" loading={enviando} disabled={!senha || confirmacao !== 'EXCLUIR'}>Confirmar exclusão</Button></div>
      </form>
    </Modal>}
  </section>;
}
