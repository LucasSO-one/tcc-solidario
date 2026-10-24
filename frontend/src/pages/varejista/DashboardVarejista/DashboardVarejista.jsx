import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlarmClock, PackagePlus, Trash2 } from 'lucide-react';
import { listarMeusProdutos, anteciparDoacao } from '../../../service/produtoService';
import { dataHora } from '../../../utils/formatar';
import { mensagemErro } from '../../../utils/mensagemErro';
import Alert from '../../../components/ui/Alert';
import { StatusBadge } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/toastContext';
import '../../../components/Fluxos/Fluxos.scss';

export default function DashboardVarejista() {
  const toast = useToast();
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(null);
  const carregar = useCallback(async () => { setProdutos(await listarMeusProdutos()); }, []);
  useEffect(() => {
    const atualizar = () => carregar().catch(e => setErro(mensagemErro(e)));
    atualizar(); const timer = setInterval(atualizar, 30000);
    return () => clearInterval(timer);
  }, [carregar]);
  async function doar(id) {
    setOcupado(id);
    try { await anteciparDoacao(id); await carregar(); toast.success('Alimento disponibilizado para as ONGs.'); }
    catch (e) { toast.error(mensagemErro(e)); }
    finally { setOcupado(null); }
  }
  const alertas = produtos.filter(p => p.alertaPreDoacao);
  const vencidos = produtos.filter(p => p.alertaVencimento);
  const stats = [
    ['Em venda', produtos.filter(p => ['Disponivel','EmDesconto'].includes(p.status)).length],
    ['Disponíveis para doação', produtos.filter(p => p.status === 'DisponivelParaDoacao').length],
    ['Reservados', produtos.filter(p => p.status === 'Reservado').length],
    ['Doações concluídas', produtos.filter(p => p.status === 'Doado').length],
  ];
  return <div className="fluxo"><header><span className="eyebrow">Visão geral</span><h1>Painel do varejista</h1>
    <p>Acompanhe seus lotes e os alimentos que precisam de atenção hoje.</p></header>
    {erro && <Alert variant="error">{erro}</Alert>}
    <div className="fluxo-grade">{stats.map(([nome,total]) => <article className="stat" key={nome}>
      <span className="stat__value">{total}</span><span className="stat__label">{nome}</span></article>)}</div>
    <section><h2>Alerta prévio de doação</h2><p>Alimentos entre 24 e 36 horas da validade. Antecipe a doação para dar mais tempo às ONGs.</p>
      {!alertas.length ? <EmptyState icon={AlarmClock} title="Nenhum alerta no momento">Tudo em dia: nenhum alimento está perto da janela de doação.</EmptyState>
        : <div className="fluxo-lista">{alertas.map(p => <article key={p.id} className="fluxo-card fluxo-card--urgente">
          <StatusBadge status="VenceEmBreve" />
          <h3>{p.titulo}</h3><p>Validade: {dataHora(p.dataValidade)}</p>
          <Button variant="secondary" loading={ocupado === p.id} disabled={ocupado !== null && ocupado !== p.id} onClick={() => doar(p.id)}>Antecipar doação</Button>
        </article>)}</div>}
    </section>
    <section><h2>Alimentos vencidos</h2><p>Separe estes lotes para descarte. Eles estão bloqueados para reserva e retirada.</p>
      {!vencidos.length ? <EmptyState icon={Trash2} title="Nenhum lote vencido">Ótimo trabalho: nada foi desperdiçado.</EmptyState>
        : <div className="fluxo-lista">{vencidos.map(p => <article key={p.id} className="fluxo-card">
          <StatusBadge status="Vencido" /><h3>{p.titulo}</h3>
          <p>Quantidade: {p.quantidade} · Validade: {dataHora(p.dataValidade)}</p></article>)}</div>}
    </section>
    <section><h2>Estoque por validade</h2>
      {!produtos.length ? <EmptyState icon={PackagePlus} title="Você ainda não cadastrou alimentos"
        action={<Link className="btn btn--primary" to="/dashboard/varejista/cadastrar-lote">Cadastrar alimento</Link>}>
        Comece agora e ajude a reduzir o desperdício.</EmptyState>
        : <div className="table-wrapper"><table className="data-table data-table--responsiva"><thead><tr><th>Alimento</th><th>Quantidade</th><th>Validade</th><th>Situação</th></tr></thead>
          <tbody>{produtos.map(p => <tr key={p.id}><td className="data-table__strong">{p.titulo}</td><td data-label="Quantidade">{p.quantidade}</td>
            <td data-label="Validade">{dataHora(p.dataValidade)}</td><td data-label="Situação"><StatusBadge status={p.status} /></td></tr>)}</tbody></table></div>}
      <Link to="/dashboard/varejista/meus-produtos">Ver todos os alimentos</Link>
    </section>
  </div>;
}
