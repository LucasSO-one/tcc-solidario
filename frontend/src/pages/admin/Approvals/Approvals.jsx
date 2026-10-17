import { useEffect, useState } from 'react';
import api from '../../../config/api';
import { mensagemErro } from '../../../utils/mensagemErro';
import '../../../components/Fluxos/Fluxos.scss';

export default function Approvals() {
  const [cadastros, setCadastros] = useState([]);
  const [filtro, setFiltro] = useState('1');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(null);
  const [revisao, setRevisao] = useState(0);
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try { const { data } = await api.get('/Admin/cadastros', { params: filtro ? {status:filtro} : {} }); if (ativo) { setCadastros(data); setErro(''); } }
      catch(e) { if (ativo) setErro(mensagemErro(e)); }
    }
    carregar(); const timer=setInterval(carregar,30000);
    return () => { ativo=false; clearInterval(timer); };
  }, [filtro, revisao]);
  async function avaliar(id, novoStatus) {
    setOcupado(id); setErro('');
    try { await api.put('/Admin/avaliar-cadastro/'+id, {novoStatus}); setRevisao(v => v+1); }
    catch(e) { setErro(mensagemErro(e)); }
    finally { setOcupado(null); }
  }
  return <main className="fluxo"><header><h1>Aprovação de cadastros</h1><p>Confira os dados de ONGs e varejistas antes de liberar o acesso.</p></header>
    <label>Situação <select value={filtro} onChange={e => setFiltro(e.target.value)}><option value="1">Pendentes</option><option value="2">Aprovados</option><option value="3">Rejeitados</option><option value="">Todos</option></select></label>
    {erro && <p role="alert" className="fluxo-erro">{erro}</p>}
    <div className="fluxo-lista">{cadastros.map(c => <article key={c.id} className="fluxo-card"><h2>{c.nomeOuRazaoSocial}</h2>
      <p>{c.tipoUsuario} · {c.email}</p><p>CNPJ: {c.documento}</p><p>Solicitado em {new Date(c.dataSolicitacao).toLocaleString('pt-BR')}</p>
      <span className="fluxo-status">{c.status}</span>
      {c.status === 'Pendente' && <div className="fluxo-acoes"><button className="btn btn--primary" disabled={ocupado !== null} onClick={() => avaliar(c.id,2)}>Aprovar</button>
        <button className="btn btn--ghost" disabled={ocupado !== null} onClick={() => avaliar(c.id,3)}>Rejeitar</button></div>}
    </article>)}</div>
    {!cadastros.length && <p>Nenhum cadastro nesta situação.</p>}
  </main>;
}
