import { useEffect, useRef, useState } from 'react';
import { atualizarConta, buscarCep, listarTiposEstabelecimento } from '../../../service/conta';
import { mensagemErro } from '../../../utils/mensagemErro';
import { digitos, mascaraCep, mascaraCnpj } from '../../../utils/mascaras';
import useFormulario from '../../../hooks/useFormulario';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import { useToast } from '../../../components/ui/toastContext';
import { errosDoServidor, montarRequisicao } from './requisicao';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function inicial(conta) {
  const o = conta.organizacao ?? {};
  const e = conta.endereco ?? {};
  return {
    nomeEstabelecimento: o.nomeEstabelecimento ?? '', tipoEstabelecimento: o.tipoEstabelecimento ?? '',
    nomeFantasia: o.nomeFantasia ?? '', areaAtuacao: o.areaAtuacao ?? '', capacidadeRecebimento: o.capacidadeRecebimento ?? '',
    horarioFuncionamento: o.horarioFuncionamento ?? '',
    cep: mascaraCep(e.cep), rua: e.rua ?? '', numero: e.numero ?? '', complemento: e.complemento ?? '',
    bairro: e.bairro ?? '', cidade: e.cidade ?? '', estado: e.estado ?? '',
  };
}

function validar(v, varejista) {
  const erros = {};
  if (varejista && !v.nomeEstabelecimento.trim()) erros.nomeEstabelecimento = 'Informe o nome do estabelecimento.';
  if (!varejista && !v.nomeFantasia.trim()) erros.nomeFantasia = 'Informe o nome fantasia.';
  const enderecoIniciado = ['cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'].some(c => v[c].trim());
  if (enderecoIniciado) {
    if (digitos(v.cep).length !== 8) erros.cep = 'O CEP deve ter 8 dígitos.';
    if (!v.rua.trim()) erros.rua = 'Informe a rua.';
    if (!v.numero.trim()) erros.numero = 'Informe o número (ou "s/n").';
    if (!v.bairro.trim()) erros.bairro = 'Informe o bairro.';
    if (!v.cidade.trim()) erros.cidade = 'Informe a cidade.';
    if (!v.estado) erros.estado = 'Escolha o estado.';
  }
  return erros;
}

export default function SecaoOrganizacao({ conta, setConta, onSujo }) {
  const toast = useToast();
  const varejista = conta.tipo === 'Varejista';
  const form = useFormulario(inicial(conta));
  const { valores, alterar, erros, setErros, sujo } = form;
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [tipos, setTipos] = useState([]);
  const numeroRef = useRef(null);

  useEffect(() => { onSujo(sujo); }, [sujo, onSujo]);
  useEffect(() => {
    if (varejista) listarTiposEstabelecimento().then(setTipos).catch(() => {});
  }, [varejista]);

  async function aoMudarCep(valor) {
    const cep = mascaraCep(valor);
    alterar('cep', cep);
    if (digitos(cep).length !== 8) return;
    setBuscandoCep(true);
    try {
      const endereco = await buscarCep(digitos(cep));
      if (!endereco) { setErros(e => ({ ...e, cep: 'CEP não encontrado. Confira os números ou preencha o endereço manualmente.' })); return; }
      Object.entries(endereco).forEach(([campo, v]) => v && alterar(campo, v));
      numeroRef.current?.focus();
    } catch { setErros(e => ({ ...e, cep: 'Não foi possível consultar o CEP agora. Preencha o endereço manualmente.' })); }
    finally { setBuscandoCep(false); }
  }

  async function salvar(e) {
    e.preventDefault();
    const locais = validar(valores, varejista);
    if (Object.keys(locais).length) { setErros(locais); return; }
    setSalvando(true);
    const v = valores;
    const temEndereco = digitos(v.cep).length === 8;
    try {
      const atualizada = await atualizarConta(montarRequisicao(conta, {
        organizacao: varejista
          ? { nomeEstabelecimento: v.nomeEstabelecimento, tipoEstabelecimento: v.tipoEstabelecimento || null, horarioFuncionamento: v.horarioFuncionamento }
          : { nomeFantasia: v.nomeFantasia, areaAtuacao: v.areaAtuacao, capacidadeRecebimento: v.capacidadeRecebimento, horarioFuncionamento: v.horarioFuncionamento },
        endereco: temEndereco ? { cep: digitos(v.cep), rua: v.rua, numero: v.numero, complemento: v.complemento, bairro: v.bairro, cidade: v.cidade, estado: v.estado } : conta.endereco,
      }));
      setConta(atualizada);
      form.redefinir(inicial(atualizada));
      toast.success('Dados da organização atualizados.');
    } catch (err) {
      const porCampo = { ...errosDoServidor(err, 'organizacao'), ...errosDoServidor(err, 'endereco') };
      if (Object.keys(porCampo).length) setErros(porCampo); else toast.error(mensagemErro(err));
    } finally { setSalvando(false); }
  }

  const campo = (nome, rotulo, props = {}) => (
    <Field label={rotulo} error={erros[nome]} required={props.required} full={props.full} help={props.help}>
      <input value={valores[nome]} maxLength={props.maxLength ?? 150} placeholder={props.placeholder}
        autoComplete={props.autoComplete} ref={props.inputRef} onChange={e => alterar(nome, e.target.value)} />
    </Field>
  );

  return <form className="config-secao" onSubmit={salvar} noValidate>
    <div className="config-secao__cabecalho">
      <h2>Dados da organização</h2>
      <p>Essas informações aparecem para {varejista ? 'consumidores e ONGs na vitrine' : 'os estabelecimentos que doam alimentos'}.</p>
    </div>

    <fieldset className="config-grupo">
      <legend>Identificação</legend>
      <div className="config-grade">
        {varejista && <Field label="Razão social" help="Conferida na aprovação do cadastro.">
          <input value={conta.organizacao?.razaoSocial ?? ''} readOnly />
        </Field>}
        <Field label="CNPJ" help="Para alterar o CNPJ ou a razão social, fale com o suporte.">
          <input value={mascaraCnpj(conta.organizacao?.cnpj)} readOnly />
        </Field>
        {varejista ? <>
          {campo('nomeEstabelecimento', 'Nome do estabelecimento', { required: true })}
          <Field label="Tipo de estabelecimento">
            <select value={valores.tipoEstabelecimento} onChange={e => alterar('tipoEstabelecimento', e.target.value)}>
              <option value="">Não informado</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </> : <>
          {campo('nomeFantasia', 'Nome fantasia', { required: true, maxLength: 100 })}
          {campo('areaAtuacao', 'Área de atuação', { placeholder: 'Ex.: Segurança alimentar' })}
          {campo('capacidadeRecebimento', 'Capacidade de recebimento e armazenamento', { full: true, maxLength: 100,
            placeholder: 'Ex.: Até 200 unidades por semana, com câmara fria',
            help: 'Ajuda os varejistas a saber que tipo de doação vocês conseguem receber.' })}
        </>}
        {campo('horarioFuncionamento', varejista ? 'Horário de funcionamento' : 'Horário de recebimento', { full: true, maxLength: 120,
          placeholder: varejista ? 'Ex.: Seg a Sáb, 08h às 20h' : 'Ex.: Seg a Sex, 09h às 17h' })}
      </div>
    </fieldset>

    <fieldset className="config-grupo">
      <legend>Endereço</legend>
      <div className="config-grade">
        <Field label="CEP" error={erros.cep} help={buscandoCep ? 'Buscando endereço...' : 'Preenchemos o endereço automaticamente.'}>
          <input value={valores.cep} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
            onChange={e => aoMudarCep(e.target.value)} aria-busy={buscandoCep || undefined} />
        </Field>
        {campo('rua', 'Rua', { autoComplete: 'address-line1', maxLength: 200 })}
        {campo('numero', 'Número', { maxLength: 20, inputRef: numeroRef })}
        {campo('complemento', 'Complemento', { maxLength: 100 })}
        {campo('bairro', 'Bairro', { maxLength: 100 })}
        {campo('cidade', 'Cidade', { autoComplete: 'address-level2', maxLength: 100 })}
        <Field label="Estado" error={erros.estado}>
          <select value={valores.estado} autoComplete="address-level1" onChange={e => alterar('estado', e.target.value)}>
            <option value="">Selecione</option>
            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </Field>
      </div>
    </fieldset>

    <div className="config-secao__acoes">
      {sujo && <Button variant="ghost" onClick={form.descartar} disabled={salvando}>Descartar</Button>}
      <Button type="submit" variant="primary" loading={salvando} disabled={!sujo}>Salvar alterações</Button>
    </div>
  </form>;
}
