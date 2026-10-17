import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarMeusProdutos, anteciparDoacao } from '../../../service/produtoService';
import { mensagemErro } from '../../../utils/mensagemErro';
import '../../../components/Fluxos/Fluxos.scss';

export default function DashboardVarejista() {
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
    setOcupado(id); setErro('');
    try { await anteciparDoacao(id); await carregar(); }
    catch (e) { setErro(mensagemErro(e)); }
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
  return <main className="fluxo"><header><h1>Painel do varejista</h1>
    <p>Acompanhe os lotes cadastrados e os alimentos que precisam de atenção.</p>
    <Link className="btn btn--primary" to="/dashboard/varejista/cadastrar-lote">Novo alimento</Link></header>
    {erro && <p role="alert" className="fluxo-erro">{erro}</p>}
    <div className="fluxo-grade">{stats.map(([nome,total]) => <article className="fluxo-card" key={nome}><h2>{total}</h2><p>{nome}</p></article>)}</div>
    <section><h2>Alerta prévio de doação</h2><p>Alimentos com mais de 24 e até 36 horas de validade. Você pode antecipar a doação.</p>
      {!alertas.length && <p>Nenhum alerta prévio no momento.</p>}
      <div className="fluxo-lista">{alertas.map(p => <article key={p.id} className="fluxo-card fluxo-aviso">
        <h3>{p.titulo}</h3><p>Validade: {new Date(p.dataValidade).toLocaleString('pt-BR')}</p>
        <button className="btn btn--primary" disabled={ocupado !== null} onClick={() => doar(p.id)}>{ocupado === p.id ? 'Atualizando...' : 'Antecipar doação'}</button>
      </article>)}</div>
    </section>
    <section><h2>Alimentos vencidos</h2><p>Separe os alimentos abaixo para descarte físico. Eles estão bloqueados para reserva e retirada.</p>
      {!vencidos.length && <p>Nenhum lote vencido.</p>}
      <div className="fluxo-lista">{vencidos.map(p => <article key={p.id} className="fluxo-card fluxo-card--urgente"><h3>{p.titulo}</h3>
        <p>Quantidade: {p.quantidade} · Validade: {new Date(p.dataValidade).toLocaleString('pt-BR')}</p></article>)}</div>
    </section>
    <section><h2>Estoque por validade</h2><div className="fluxo-tabela"><table><thead><tr><th>Alimento</th><th>Quantidade</th><th>Validade</th><th>Situação</th></tr></thead>
      <tbody>{produtos.map(p => <tr key={p.id}><td>{p.titulo}</td><td>{p.quantidade}</td><td>{new Date(p.dataValidade).toLocaleString('pt-BR')}</td><td>{p.status}</td></tr>)}</tbody></table></div>
      <Link to="/dashboard/varejista/meus-produtos">Ver meus produtos</Link>
    </section>
  </main>;
}
