import { useEffect, useState } from 'react';
import { atualizarConta } from '../../../service/conta';
import { mensagemErro } from '../../../utils/mensagemErro';
import useFormulario from '../../../hooks/useFormulario';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/toastContext';
import { montarRequisicao } from './requisicao';

// O significado de cada preferência muda conforme o perfil
const TEXTOS = {
  Varejista: {
    novasSolicitacoes: ['Novas reservas e solicitações de doação', 'Quando um consumidor ou uma ONG reservar um alimento seu.'],
    vencimentos: ['Alimentos próximos do vencimento', 'Aviso quando um lote entrar na janela de doação.'],
    doacoesConcluidas: ['Retiradas confirmadas', 'Resumo das doações e vendas entregues.'],
  },
  ONG: {
    novasSolicitacoes: ['Novos alimentos para doação', 'Quando um estabelecimento liberar alimentos para ONGs.'],
    vencimentos: ['Lembrete de retirada', 'Aviso antes de uma solicitação expirar.'],
    doacoesConcluidas: ['Doações recebidas', 'Confirmação de cada retirada concluída.'],
  },
  padrao: {
    novasSolicitacoes: ['Novas ofertas', 'Alimentos com desconto perto de você.'],
    vencimentos: ['Lembrete de retirada', 'Aviso antes de uma reserva expirar.'],
    doacoesConcluidas: ['Retiradas confirmadas', 'Confirmação de cada retirada concluída.'],
  },
};

export default function SecaoNotificacoes({ conta, setConta, onSujo }) {
  const toast = useToast();
  const form = useFormulario(conta.notificacoes);
  const { valores, alterar, sujo } = form;
  const [salvando, setSalvando] = useState(false);
  const textos = TEXTOS[conta.tipo] ?? TEXTOS.padrao;

  useEffect(() => { onSujo(sujo); }, [sujo, onSujo]);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const atualizada = await atualizarConta(montarRequisicao(conta, { notificacoes: valores }));
      setConta(atualizada);
      form.redefinir(atualizada.notificacoes);
      toast.success('Preferências de notificação salvas.');
    } catch (err) { toast.error(mensagemErro(err)); }
    finally { setSalvando(false); }
  }

  return <form className="config-secao" onSubmit={salvar}>
    <div className="config-secao__cabecalho">
      <h2>Notificações</h2>
      <p>Escolha sobre o que você quer ser avisado por e-mail.</p>
    </div>
    <Alert variant="info">O envio de e-mails ainda está em implantação. Suas escolhas ficam salvas e passam a valer assim que ele for ativado.</Alert>
    <div className="config-lista-toggles">
      {Object.entries(textos).map(([chave, [titulo, descricao]]) => (
        <label className="toggle-row" key={chave}>
          <span className="toggle-row__switch">
            <input type="checkbox" checked={valores[chave]} onChange={e => alterar(chave, e.target.checked)} />
            <span className="toggle-row__slider" />
          </span>
          <span className="toggle-row__text"><strong>{titulo}</strong><span>{descricao}</span></span>
        </label>
      ))}
    </div>
    <div className="config-secao__acoes">
      {sujo && <Button variant="ghost" onClick={form.descartar} disabled={salvando}>Descartar</Button>}
      <Button type="submit" variant="primary" loading={salvando} disabled={!sujo}>Salvar alterações</Button>
    </div>
  </form>;
}
