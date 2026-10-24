import { useEffect, useState } from 'react';
import { HandHeart, PackageCheck } from 'lucide-react';
import { listarMeusProdutos } from '../../../service/produtoService';
import { listarReservasPendentes } from '../../../service/reserva';
import { dataHora } from '../../../utils/formatar';
import { mensagemErro } from '../../../utils/mensagemErro';
import Alert from '../../../components/ui/Alert';
import { StatusBadge } from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import '../../../components/Fluxos/Fluxos.scss';

export default function Doacoes() {
  const [produtos, setProdutos] = useState([]);
  const [reservadas, setReservadas] = useState([]);
  const [erro, setErro] = useState('');
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const [itens, pendentes] = await Promise.all([listarMeusProdutos(), listarReservasPendentes()]);
        if (ativo) { setProdutos(itens); setReservadas(pendentes.filter(r => r.tipo === 'Doacao')); setErro(''); }
      }
      catch (e) { if (ativo) setErro(mensagemErro(e)); }
    }
    carregar(); const timer = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(timer); };
  }, []);
  const doacoes = produtos.filter(p => ['DisponivelParaDoacao', 'Doado'].includes(p.status));
  return <div className="fluxo"><header><span className="eyebrow">Doações</span><h1>Doações do estabelecimento</h1>
    <p>Alimentos destinados a ONGs: disponíveis, reservados e já entregues.</p></header>
    {erro && <Alert variant="error">{erro}</Alert>}
    <section><h2>Reservadas por ONGs</h2><p>Confirme a entrega na tela "Validar retirada" com o código apresentado pela ONG.</p>
      {!reservadas.length ? <EmptyState icon={HandHeart} title="Nenhuma retirada pendente">Quando uma ONG solicitar um alimento, ele aparece aqui até a retirada.</EmptyState>
        : <div className="fluxo-grade">{reservadas.map(r => <article className="fluxo-card" key={r.id}>
          <StatusBadge tipo="reserva" status="Ativa" /><h3>{r.produtoNome}</h3>
          <p>{r.nomeReceptor}</p><p>Código termina em <strong>{r.finalCodigo}</strong></p>
          <p>Prazo: {dataHora(Math.min(new Date(r.dataExpiracao), new Date(r.dataValidade)))}</p></article>)}</div>}
    </section>
    <section><h2>Disponíveis e entregues</h2>
      {!doacoes.length ? <EmptyState icon={PackageCheck} title="Nenhuma doação ainda">
        Alimentos com menos de 24 horas de validade são liberados automaticamente para ONGs. Você também pode antecipar a doação pelo painel.
      </EmptyState>
        : <div className="fluxo-grade">{doacoes.map(p => <article className="fluxo-card" key={p.id}>
          <StatusBadge status={p.status} /><h3>{p.titulo}</h3>
          <p>Quantidade: <strong>{p.quantidade}</strong></p>
          <p>Validade: {dataHora(p.dataValidade)}</p></article>)}</div>}
    </section>
  </div>;
}
