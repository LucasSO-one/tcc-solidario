import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, HandHeart, PackageCheck, Store } from 'lucide-react';
import { listarDoacoes } from '../../../service/produtoService';
import { listarMinhasReservas } from '../../../service/reserva';
import { obterImpacto } from '../../../service/impacto';
import GraficoEvolucao from '../../../components/impacto/GraficoEvolucao';
import IndicadoresImpacto from '../../../components/impacto/IndicadoresImpacto';
import { dataHora } from '../../../utils/formatar';
import { mensagemErro } from '../../../utils/mensagemErro';
import Alert from '../../../components/ui/Alert';
import { StatusBadge } from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Skeleton from '../../../components/ui/Skeleton';
import '../../../components/Fluxos/Fluxos.scss';

export default function VisaoGeral() {
  const [reservas, setReservas] = useState([]);
  const [disponiveis, setDisponiveis] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [impacto, setImpacto] = useState(null);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const [minhas, doacoes] = await Promise.all([listarMinhasReservas(), listarDoacoes()]);
        if (ativo) { setReservas(minhas); setDisponiveis(doacoes.filter(d => d.podeReservar).length); setErro(''); }
      } catch (e) { if (ativo) setErro(mensagemErro(e)); }
      finally { if (ativo) setCarregando(false); }
    }
    carregar(); const timer = setInterval(carregar, 30000);
    obterImpacto().then(i => { if (ativo) setImpacto(i); }).catch(() => {});
    return () => { ativo = false; clearInterval(timer); };
  }, []);

  const ativas = reservas.filter(r => r.status === 'Ativa');
  const stats = [
    ['Disponíveis para solicitar agora', disponiveis],
    ['Aguardando retirada', ativas.length],
  ];

  return <div className="fluxo">
    <header><span className="eyebrow">Visão geral</span><h1>Painel da ONG</h1>
      <p>Acompanhe as doações disponíveis e as retiradas que a sua organização tem agendadas.</p></header>
    {erro && <Alert variant="error">{erro}</Alert>}
    <div className="fluxo-grade">{stats.map(([nome, total]) => <article className="stat" key={nome}>
      {carregando ? <Skeleton variant="title" width="30%" /> : <span className="stat__value">{total}</span>}
      <span className="stat__label">{nome}</span></article>)}</div>
    <section><h2>Impacto da sua organização</h2>
      <IndicadoresImpacto carregando={!impacto} itens={[
        { valor: impacto?.indicadores.unidadesRecebidas, rotulo: 'Unidades de alimentos recebidas', icone: HandHeart },
        { valor: impacto?.indicadores.doacoesRecebidas, rotulo: 'Doações recebidas', icone: PackageCheck },
        { valor: impacto?.indicadores.estabelecimentosParceiros, rotulo: 'Estabelecimentos parceiros', icone: Store },
      ]} />
      {impacto && <GraficoEvolucao titulo="Alimentos recebidos por mês" descricao="Unidades retiradas nos últimos 6 meses."
        dados={impacto.evolucao} series={[{ chave: 'doadas', rotulo: 'Recebidas', classe: 'doadas' }]} />}
    </section>
    <section><h2>Próximas retiradas</h2>
      {!carregando && !ativas.length ? <EmptyState icon={ClipboardList} title="Nenhuma retirada agendada"
        action={<Link className="btn btn--primary" to="/dashboard/ong/vitrine"><Store aria-hidden="true" />Ver alimentos disponíveis</Link>}>
        Solicite uma doação na vitrine. O código de retirada aparece em "Minhas solicitações".
      </EmptyState>
        : <div className="fluxo-lista">{ativas.map(r => <article className="fluxo-card" key={r.id}>
          <StatusBadge tipo="reserva" status="Ativa" /><h3>{r.produtoNome}</h3><p>{r.nomeVarejista}</p>
          <p>Retire até <strong>{dataHora(Math.min(new Date(r.dataExpiracao), new Date(r.dataValidade)))}</strong></p>
          <Link className="btn btn--secondary" to="/dashboard/ong/solicitacoes">Ver código de retirada</Link>
        </article>)}</div>}
    </section>
  </div>;
}
