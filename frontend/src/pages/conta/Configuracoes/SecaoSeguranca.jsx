import { useEffect, useState } from 'react';
import { alterarSenha } from '../../../service/conta';
import { mensagemErro } from '../../../utils/mensagemErro';
import { senhaValida } from '../../../utils/mascaras';
import useFormulario from '../../../hooks/useFormulario';
import ForcaSenha from '../../../components/conta/ForcaSenha';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import { useToast } from '../../../components/ui/toastContext';
import { errosDoServidor } from './requisicao';

const VAZIO = { senhaAtual: '', novaSenha: '', confirmacao: '' };

export default function SecaoSeguranca({ onSujo }) {
  const toast = useToast();
  const form = useFormulario(VAZIO);
  const { valores, alterar, erros, setErros, sujo } = form;
  const [salvando, setSalvando] = useState(false);
  const confirmacaoErrada = valores.confirmacao && valores.confirmacao !== valores.novaSenha;
  const pronto = valores.senhaAtual && senhaValida(valores.novaSenha) && valores.confirmacao === valores.novaSenha;

  useEffect(() => { onSujo(sujo); }, [sujo, onSujo]);

  async function salvar(e) {
    e.preventDefault();
    if (!pronto) return;
    setSalvando(true);
    try {
      await alterarSenha(valores.senhaAtual, valores.novaSenha);
      form.redefinir(VAZIO);
      toast.success('Senha alterada. Use a nova senha no próximo acesso.');
    } catch (err) {
      const porCampo = errosDoServidor(err);
      if (porCampo) setErros(porCampo); else toast.error(mensagemErro(err));
    } finally { setSalvando(false); }
  }

  return <form className="config-secao" onSubmit={salvar} noValidate>
    <div className="config-secao__cabecalho">
      <h2>Segurança</h2>
      <p>Troque sua senha periodicamente e não a compartilhe com outras pessoas.</p>
    </div>
    <div className="config-grade config-grade--estreita">
      <Field label="Senha atual" required full error={erros.senhaAtual}>
        <input type="password" value={valores.senhaAtual} autoComplete="current-password" onChange={e => alterar('senhaAtual', e.target.value)} />
      </Field>
      <Field label="Nova senha" required full error={erros.novaSenha}>
        <input type="password" value={valores.novaSenha} autoComplete="new-password" onChange={e => alterar('novaSenha', e.target.value)} />
      </Field>
      <div className="field--full"><ForcaSenha senha={valores.novaSenha} /></div>
      <Field label="Confirme a nova senha" required full error={confirmacaoErrada ? 'As senhas não coincidem.' : undefined}>
        <input type="password" value={valores.confirmacao} autoComplete="new-password" onChange={e => alterar('confirmacao', e.target.value)} />
      </Field>
    </div>
    <div className="config-secao__acoes">
      {sujo && <Button variant="ghost" onClick={form.descartar} disabled={salvando}>Limpar</Button>}
      <Button type="submit" variant="primary" loading={salvando} disabled={!pronto}>Alterar senha</Button>
    </div>
  </form>;
}
