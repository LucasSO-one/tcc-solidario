import { useEffect, useState } from 'react';
import { Ban, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { avaliarCadastro, listarCadastros } from '../../../service/admin';
import { dataHora } from '../../../utils/formatar';
import { mascaraCnpj } from '../../../utils/mascaras';
import { mensagemErro } from '../../../utils/mensagemErro';
import Alert from '../../../components/ui/Alert';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/toastContext';
import '../../../components/Fluxos/Fluxos.scss';

const STATUS = {
  Pendente: ['warning', Clock, 'Em análise'],
  Aprovado: ['success', CheckCircle2, 'Aprovado'],
  Rejeitado: ['danger', Ban, 'Rejeitado'],
};

export default function Approvals() {
  const toast = useToast();
  const [cadastros, setCadastros] = useState([]);
  const [filtro, setFiltro] = useState('1');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(null);
  const [rejeitar, setRejeitar] = useState(null);
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try { const dados = await listarCadastros(filtro); if (ativo) { setCadastros(dados); setErro(''); } }
      catch (e) { if (ativo) setErro(mensagemErro(e)); }
    }
    carregar(); const timer = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(timer); };
  }, [filtro, revisao]);

  async function avaliar(cadastro, novoStatus) {
    setOcupado(cadastro.id);
    try {
      await avaliarCadastro(cadastro.id, novoStatus);
      toast.success(novoStatus === 2 ? `${cadastro.nomeOuRazaoSocial} foi aprovado.` : `${cadastro.nomeOuRazaoSocial} foi rejeitado.`);
      setRevisao(v => v + 1);
    } catch (e) { toast.error(mensagemErro(e)); }
    finally { setOcupado(null); setRejeitar(null); }
  }

  return <div className="fluxo">
    <header><span className="eyebrow">Administração</span><h1>Aprovação de cadastros</h1>
      <p>Confira o CNPJ e os dados de ONGs e varejistas antes de liberar o acesso.</p></header>
    <div className="fluxo-filtros">
      <div className="field"><select aria-label="Filtrar por situação" value={filtro} onChange={e => setFiltro(e.target.value)}>
        <option value="1">Em análise</option><option value="2">Aprovados</option><option value="3">Rejeitados</option><option value="">Todos</option>
      </select></div>
    </div>
    {erro && <Alert variant="error">{erro}</Alert>}
    {!cadastros.length ? <EmptyState icon={ShieldCheck} title={filtro === '1' ? 'Nenhum cadastro aguardando análise' : 'Nenhum cadastro nesta situação'}>
      {filtro === '1' ? 'Tudo em dia! Novos pedidos de varejistas e ONGs aparecem aqui.' : 'Mude o filtro para ver outros cadastros.'}
    </EmptyState>
      : <div className="fluxo-lista">{cadastros.map(c => {
        const [variante, icone, texto] = STATUS[c.status] ?? ['neutral', null, c.status];
        return <article key={c.id} className="fluxo-card">
          <Badge variant={variante} icon={icone}>{texto}</Badge>
          <h3>{c.nomeOuRazaoSocial}</h3>
          <p>{c.tipoUsuario === 'ONG' ? 'ONG' : 'Varejista'} · {c.email}</p>
          <p>CNPJ: <strong>{mascaraCnpj(c.documento)}</strong></p>
          <small>Solicitado em {dataHora(c.dataSolicitacao)}</small>
          {c.status === 'Pendente' && <div className="fluxo-card__acoes">
            <Button variant="secondary" loading={ocupado === c.id && !rejeitar} disabled={ocupado !== null} onClick={() => avaliar(c, 2)}>Aprovar</Button>
            <Button variant="danger" disabled={ocupado !== null} onClick={() => setRejeitar(c)}>Rejeitar</Button>
          </div>}
        </article>;
      })}</div>}

    {rejeitar && <Modal title="Rejeitar cadastro?" onClose={() => !ocupado && setRejeitar(null)} footer={<>
      <Button variant="ghost" onClick={() => setRejeitar(null)} disabled={ocupado !== null} data-autofocus>Voltar</Button>
      <Button variant="danger" loading={ocupado === rejeitar.id} onClick={() => avaliar(rejeitar, 3)}>Rejeitar cadastro</Button>
    </>}>
      <p><strong>{rejeitar.nomeOuRazaoSocial}</strong> não poderá acessar a plataforma. Essa decisão não pode ser desfeita por aqui.</p>
    </Modal>}
  </div>;
}
