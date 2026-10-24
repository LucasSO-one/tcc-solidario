import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { atualizarConta, enviarFoto } from '../../../service/conta';
import { mensagemErro } from '../../../utils/mensagemErro';
import { mascaraTelefone } from '../../../utils/mascaras';
import { TIPOS_IMAGEM } from '../../../utils/imagens';
import useFormulario from '../../../hooks/useFormulario';
import RecorteFoto from '../../../components/conta/RecorteFoto';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import { useToast } from '../../../components/ui/toastContext';
import { errosDoServidor, montarRequisicao } from './requisicao';

const TAMANHO_MAXIMO_ORIGINAL = 10 * 1024 * 1024; // antes do recorte; a foto final tem ~100 KB

function validar(v) {
  const erros = {};
  if (v.nome.trim().length < 3) erros.nome = 'Informe um nome com pelo menos 3 letras.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) erros.email = 'Informe um e-mail válido.';
  const tel = v.telefone.replace(/\D/g, '');
  if (tel && tel.length < 10) erros.telefone = 'Informe o telefone com DDD.';
  return erros;
}

export default function SecaoPerfil({ conta, setConta, onSujo }) {
  const toast = useToast();
  const inputFoto = useRef(null);
  const form = useFormulario({ nome: conta.nome, email: conta.email, telefone: mascaraTelefone(conta.telefone), senhaAtual: '' });
  const { valores, alterar, erros, setErros, sujo } = form;
  const [salvando, setSalvando] = useState(false);
  const [arquivoFoto, setArquivoFoto] = useState(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const errosLocais = validar(valores);
  const trocandoEmail = valores.email.trim().toLowerCase() !== conta.email.toLowerCase();

  useEffect(() => { onSujo(sujo); }, [sujo, onSujo]);

  function escolherFoto(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    if (!TIPOS_IMAGEM.includes(arquivo.type)) { toast.error('Use uma foto em JPG, PNG ou WEBP.'); return; }
    if (arquivo.size > TAMANHO_MAXIMO_ORIGINAL) { toast.error('A foto original deve ter até 10 MB.'); return; }
    setArquivoFoto(arquivo);
  }

  async function confirmarFoto(arquivo) {
    setEnviandoFoto(true);
    try {
      const fotoUrl = await enviarFoto(arquivo);
      setConta(c => ({ ...c, fotoUrl }));
      toast.success('Foto atualizada.');
      setArquivoFoto(null);
    } catch (e) { toast.error(mensagemErro(e, 'Não foi possível enviar a foto.')); }
    finally { setEnviandoFoto(false); }
  }

  async function salvar(e) {
    e.preventDefault();
    if (Object.keys(errosLocais).length) { setErros(errosLocais); return; }
    if (trocandoEmail && !valores.senhaAtual) { setErros({ senhaAtual: 'Confirme a senha atual para alterar o e-mail.' }); return; }
    setSalvando(true);
    try {
      const atualizada = await atualizarConta(montarRequisicao(conta, {
        nome: valores.nome.trim(), email: valores.email.trim(), telefone: valores.telefone.replace(/\D/g, ''),
        senhaAtual: trocandoEmail ? valores.senhaAtual : null,
      }));
      setConta(atualizada);
      form.redefinir({ nome: atualizada.nome, email: atualizada.email, telefone: mascaraTelefone(atualizada.telefone), senhaAtual: '' });
      toast.success('Perfil atualizado.');
    } catch (err) {
      const porCampo = errosDoServidor(err);
      if (porCampo) setErros(porCampo); else toast.error(mensagemErro(err));
    } finally { setSalvando(false); }
  }

  return <form className="config-secao" onSubmit={salvar} noValidate>
    <div className="config-secao__cabecalho">
      <h2>Perfil</h2>
      <p>Como você aparece para as outras pessoas na plataforma.</p>
    </div>

    <div className="config-foto">
      <Avatar conta={conta} tamanho={88} />
      <div>
        <Button variant="secondary" icon={Camera} onClick={() => inputFoto.current?.click()}>
          {conta.fotoUrl ? 'Trocar foto' : 'Adicionar foto'}
        </Button>
        <p className="field__help">{conta.organizacao ? 'Use o logo da organização. ' : ''}JPG, PNG ou WEBP. Você ajusta o recorte antes de salvar.</p>
      </div>
      <input ref={inputFoto} type="file" accept={TIPOS_IMAGEM.join(',')} hidden onChange={escolherFoto} />
    </div>

    <div className="config-grade">
      <Field label={conta.organizacao ? 'Nome do responsável' : 'Nome completo'} required error={erros.nome}>
        <input value={valores.nome} maxLength={100} autoComplete="name" onChange={e => alterar('nome', e.target.value)} />
      </Field>
      <Field label="Telefone" error={erros.telefone} help="Com DDD.">
        <input value={valores.telefone} inputMode="tel" autoComplete="tel" placeholder="(31) 99999-0000"
          onChange={e => alterar('telefone', mascaraTelefone(e.target.value))} />
      </Field>
      <Field label="E-mail" required full error={erros.email} help="É também o seu login.">
        <input type="email" value={valores.email} autoComplete="email" onChange={e => alterar('email', e.target.value)} />
      </Field>
      {trocandoEmail && <Field label="Senha atual" required full error={erros.senhaAtual} help="Por segurança, confirme sua senha para trocar o e-mail.">
        <input type="password" value={valores.senhaAtual} autoComplete="current-password" onChange={e => alterar('senhaAtual', e.target.value)} />
      </Field>}
    </div>

    <div className="config-secao__acoes">
      {sujo && <Button variant="ghost" onClick={form.descartar} disabled={salvando}>Descartar</Button>}
      <Button type="submit" variant="primary" loading={salvando} disabled={!sujo}>Salvar alterações</Button>
    </div>

    {arquivoFoto && <RecorteFoto arquivo={arquivoFoto} enviando={enviandoFoto}
      onConfirmar={confirmarFoto} onCancelar={() => setArquivoFoto(null)} />}
  </form>;
}
