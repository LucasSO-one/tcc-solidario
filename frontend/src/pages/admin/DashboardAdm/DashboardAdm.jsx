import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HandHeart, Leaf, ShieldCheck, Store, Users } from 'lucide-react';
import { obterImpacto } from '../../../service/impacto';
import { mensagemErro } from '../../../utils/mensagemErro';
import GraficoEvolucao from '../../../components/impacto/GraficoEvolucao';
import IndicadoresImpacto from '../../../components/impacto/IndicadoresImpacto';
import Alert from '../../../components/ui/Alert';
import '../../../components/Fluxos/Fluxos.scss';

export default function DashboardAdministrativo() {
  const [impacto, setImpacto] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    obterImpacto().then(setImpacto).catch(e => setErro(mensagemErro(e, 'Não foi possível carregar os indicadores.')));
  }, []);

  const i = impacto?.indicadores ?? {};
  const carregando = !impacto && !erro;
  return <div className="fluxo">
    <header><span className="eyebrow">Visão geral</span><h1>Painel administrativo</h1>
      <p>Indicadores da plataforma calculados em tempo real a partir das retiradas confirmadas.</p></header>
    {erro && <Alert variant="error">{erro}</Alert>}

    {i.cadastrosPendentes > 0 && <div className="banner-pendencias">
      <ShieldCheck aria-hidden="true" />
      <div>
        <p className="banner-pendencias__titulo">{i.cadastrosPendentes} {i.cadastrosPendentes === 1 ? 'cadastro aguardando' : 'cadastros aguardando'} análise</p>
        <p>Revise os dados de varejistas e ONGs para liberar o acesso à plataforma.</p>
      </div>
      <Link className="btn btn--primary" to="/dashboard/admin/approvals">Analisar cadastros</Link>
    </div>}

    <section><h2>Impacto da plataforma</h2>
      <IndicadoresImpacto carregando={carregando} itens={[
        { valor: i.alimentosSalvos, rotulo: 'Unidades salvas do desperdício', icone: Leaf },
        { valor: i.doacoesRealizadas, rotulo: 'Doações realizadas', icone: HandHeart },
        { valor: i.ongsAtendidas, rotulo: 'ONGs atendidas', icone: Users },
        { valor: i.varejistasAtivos, rotulo: 'Varejistas ativos', icone: Store },
      ]} />
      {impacto && <GraficoEvolucao titulo="Alimentos retirados por mês" descricao="Unidades doadas e vendidas nos últimos 6 meses."
        dados={impacto.evolucao} series={[
          { chave: 'doadas', rotulo: 'Doadas', classe: 'doadas' },
          { chave: 'vendidas', rotulo: 'Vendidas', classe: 'vendidas' },
        ]} />}
    </section>

    <section><h2>Uso da plataforma</h2>
      <div className="fluxo-grade">
        <article className="stat"><span className="stat__value">{carregando ? '–' : (i.usuarios ?? 0).toLocaleString('pt-BR')}</span>
          <span className="stat__label">Usuários cadastrados</span></article>
        <article className="stat"><span className="stat__value">{carregando ? '–' : (i.alimentosCadastrados ?? 0).toLocaleString('pt-BR')}</span>
          <span className="stat__label">Lotes de alimentos cadastrados</span></article>
      </div>
      <Link to="/dashboard/admin/users">Ver todos os usuários</Link>
    </section>
  </div>;
}
