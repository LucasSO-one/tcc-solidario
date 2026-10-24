import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, History } from 'lucide-react';
import { validarRetirada, listarReservasPendentes, listarValidacoesRecentes } from '../../../service/reserva';
import { dataHora } from '../../../utils/formatar';
import { mensagemErro } from '../../../utils/mensagemErro';
import Alert from '../../../components/ui/Alert';
import { StatusBadge } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Field from '../../../components/ui/Field';
import { useToast } from '../../../components/ui/toastContext';
import '../../../components/Fluxos/Fluxos.scss';

export default function ValidarRetirada() {
  const toast = useToast();
  const [codigo, setCodigo] = useState('');
  const [pendentes, setPendentes] = useState([]);
  const [recentes, setRecentes] = useState([]);
  const [erro, setErro] = useState('');
  const [erroCodigo, setErroCodigo] = useState('');
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
    e.preventDefault(); setValidando(true); setErroCodigo('');
    try { const resposta = await validarRetirada(codigo.trim()); toast.success(`${resposta.message} ${resposta.produto ?? ''}`.trim()); setCodigo(''); }
    catch (e) { setErroCodigo(mensagemErro(e)); }
    finally { setValidando(false); carregar().catch(e => setErro(mensagemErro(e))); }
  }
  return <div className="fluxo"><header><span className="eyebrow">Retiradas</span><h1>Validar retirada</h1>
    <p>Confira o alimento e digite o código apresentado pelo consumidor ou pela ONG.</p></header>
    {erro && <Alert variant="error">{erro}</Alert>}
    <form className="fluxo-acoes panel" onSubmit={confirmar}>
      <Field label="Código de retirada" help="Formato XXXX-XXXX. Maiúsculas e minúsculas são aceitas." error={erroCodigo}>
        <input value={codigo} onChange={e => { setCodigo(e.target.value); setErroCodigo(''); }} autoComplete="off" maxLength={20}
          placeholder="Ex.: K7QF-3WPA" required />
      </Field>
      <Button type="submit" variant="primary" loading={validando} disabled={!codigo.trim()}>Confirmar retirada</Button>
    </form>
    <section><h2>Aguardando retirada</h2>
      {!pendentes.length ? <EmptyState icon={ClipboardCheck} title="Nenhuma retirada pendente">As reservas feitas por consumidores e ONGs aparecem aqui até serem retiradas.</EmptyState>
        : <div className="fluxo-lista">{pendentes.map(r => <article className="fluxo-card" key={r.id}>
          <StatusBadge tipo="reserva" status="Ativa" />
          <h3>{r.produtoNome}</h3><p>{r.nomeReceptor} · {r.tipo === 'Doacao' ? 'Doação' : 'Compra'}</p>
          {r.finalCodigo && <p>Código termina em <strong>{r.finalCodigo}</strong></p>}
          <p>Prazo: {dataHora(Math.min(new Date(r.dataExpiracao), new Date(r.dataValidade)))}</p>
        </article>)}</div>}
    </section>
    <section><h2>Retiradas recentes</h2>
      {!recentes.length ? <EmptyState icon={History} title="Nenhuma retirada concluída">As últimas 20 retiradas confirmadas ficam registradas aqui.</EmptyState>
        : <div className="fluxo-lista">{recentes.map(r => <article className="fluxo-card" key={r.id}>
          <StatusBadge tipo="reserva" status="Concluida" />
          <h3>{r.produtoNome}</h3><p>{r.nomeReceptor} · {r.dataRetirada ? dataHora(r.dataRetirada) : 'Data não registrada'}</p>
        </article>)}</div>}
    </section>
  </div>;
}
