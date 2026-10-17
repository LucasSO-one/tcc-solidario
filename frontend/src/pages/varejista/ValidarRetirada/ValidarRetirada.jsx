import { useCallback, useEffect, useState } from 'react';
import { validarRetirada, listarReservasPendentes, listarValidacoesRecentes } from '../../../service/reserva';
import { mensagemErro } from '../../../utils/mensagemErro';
import '../../../components/Fluxos/Fluxos.scss';

export default function ValidarRetirada() {
  const [codigo, setCodigo] = useState('');
  const [pendentes, setPendentes] = useState([]);
  const [recentes, setRecentes] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [validando, setValidando] = useState(false);
  const carregar = useCallback(async () => {
    const [p, r] = await Promise.all([listarReservasPendentes(), listarValidacoesRecentes()]);
    setPendentes(p); setRecentes(r);
  }, []);
  useEffect(() => {
    const atualizar = () => carregar().catch(e => setErro(mensagemErro(e)));
    atualizar(); const timer = setInterval(atualizar, 30000);
    return () => clearInterval(timer);
  }, [carregar]);
  async function confirmar(e) {
    e.preventDefault(); setValidando(true); setErro(''); setSucesso('');
    try { const resposta = await validarRetirada(codigo.trim()); setSucesso(resposta.message); setCodigo(''); }
    catch (e) { setErro(mensagemErro(e)); }
    finally { setValidando(false); carregar().catch(e => setErro(mensagemErro(e))); }
  }
  return <main className="fluxo"><header><h1>Validar retirada</h1>
    <p>Confira o alimento e insira o código apresentado pelo consumidor ou pela ONG.</p></header>
    <form className="fluxo-acoes" onSubmit={confirmar}>
      <label>Código de retirada <input required value={codigo} onChange={e => setCodigo(e.target.value)} autoComplete="off" maxLength={20} /></label>
      <button className="btn btn--primary" disabled={validando || !codigo.trim()}>{validando ? 'Validando...' : 'Confirmar retirada'}</button>
    </form>
    {erro && <p role="alert" className="fluxo-erro">{erro}</p>}
    {sucesso && <p role="status" className="fluxo-sucesso">{sucesso}</p>}
    <section><h2>Aguardando retirada</h2><div className="fluxo-lista">{pendentes.map(r => <article className="fluxo-card" key={r.id}>
      <h3>{r.produtoNome}</h3><p>{r.nomeReceptor} · {r.tipo === 'Doacao' ? 'Doação' : 'Compra'}</p>
      <p>Prazo: {new Date(Math.min(new Date(r.dataExpiracao), new Date(r.dataValidade))).toLocaleString('pt-BR')}</p>
    </article>)}</div>{!pendentes.length && <p>Nenhuma reserva aguardando retirada.</p>}</section>
    <section><h2>Retiradas recentes</h2><div className="fluxo-lista">{recentes.map(r => <article className="fluxo-card" key={r.id}>
      <h3>{r.produtoNome}</h3><p>{r.nomeReceptor} · {r.dataRetirada ? new Date(r.dataRetirada).toLocaleString('pt-BR') : 'Data não registrada no histórico'}</p>
    </article>)}</div>{!recentes.length && <p>Nenhuma retirada concluída.</p>}</section>
  </main>;
}
