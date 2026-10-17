import { useEffect, useState } from 'react';
import { listarMeusProdutos } from '../../../service/produtoService';
import { mensagemErro } from '../../../utils/mensagemErro';
import '../../../components/Fluxos/Fluxos.scss';

export default function Doacoes() {
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState('');
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try { const itens = await listarMeusProdutos(); if (ativo) { setProdutos(itens); setErro(''); } }
      catch (e) { if (ativo) setErro(mensagemErro(e)); }
    }
    carregar(); const timer = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(timer); };
  }, []);
  const doacoes = produtos.filter(p => ['DisponivelParaDoacao', 'Doado'].includes(p.status));
  return <main className="fluxo"><header><h1>Doações do estabelecimento</h1><p>Alimentos disponibilizados para doação e lotes já entregues.</p></header>
    {erro && <p role="alert" className="fluxo-erro">{erro}</p>}
    <div className="fluxo-grade">{doacoes.map(p => <article className="fluxo-card" key={p.id}><h2>{p.titulo}</h2>
      <p>Quantidade: {p.quantidade}</p><p>{p.status === 'Doado' ? 'Doação concluída' : 'Disponível para doação'}</p>
      <p>Validade: {new Date(p.dataValidade).toLocaleString('pt-BR')}</p></article>)}</div>
    {!doacoes.length && <p>Nenhuma doação registrada.</p>}
  </main>;
}
