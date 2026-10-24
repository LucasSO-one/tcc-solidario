import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cadastrarLote } from '../../../service/produtoService'
import { mensagemErro } from '../../../utils/mensagemErro'
import SeletorImagens from '../../../components/produto/SeletorImagens'
import Alert from '../../../components/ui/Alert'
import Button from '../../../components/ui/Button'
import Field from '../../../components/ui/Field'
import { useToast } from '../../../components/ui/toastContext'
import './CadastrarLote.scss'

const categorias = ['Padaria', 'Hortifruti', 'Laticínios', 'Carnes', 'Frios', 'Mercearia', 'Bebidas', 'Refeições', 'Congelados', 'Outros']

const estadoInicial = {
  nome: '',
  categoria: '',
  descricao: '',
  quantidade: '',
  dataValidade: '',
  horaValidade: '',
  precoOriginal: '',
  precoDesconto: '',
  fotos: [],
  frutaFeia: false,
  isOferta: false,
}

// Mesmos prazos de RegrasCicloVida.cs (backend)
const HORAS_DOACAO = 24
const HORAS_PREVIA_ONG = 36

function validar(form) {
  const erros = {}
  if (!form.nome.trim()) erros.nome = 'Informe o nome do alimento.'
  if (!form.categoria) erros.categoria = 'Escolha uma categoria.'
  if (!(Number(form.quantidade) >= 1) || !Number.isInteger(Number(form.quantidade))) erros.quantidade = 'Informe uma quantidade inteira a partir de 1.'
  if (!form.dataValidade || !form.horaValidade) erros.validade = 'Informe a data e o horário de validade.'
  else if (new Date(`${form.dataValidade}T${form.horaValidade}`) <= new Date()) erros.validade = 'A validade precisa ser no futuro.'
  if (form.precoOriginal === '' || Number(form.precoOriginal) < 0) erros.precoOriginal = 'Informe o preço original.'
  if (form.precoDesconto !== '') {
    if (Number(form.precoDesconto) < 0) erros.precoDesconto = 'O preço não pode ser negativo.'
    else if (Number(form.precoDesconto) > Number(form.precoOriginal)) erros.precoDesconto = 'O preço com desconto deve ser menor ou igual ao original.'
  }
  return erros
}

function horasAteValidade(form) {
  if (!form.dataValidade || !form.horaValidade) return null
  return (new Date(`${form.dataValidade}T${form.horaValidade}`) - new Date()) / 36e5
}

const CadastrarLote = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(estadoInicial)
  const [tocados, setTocados] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  const erros = validar(form)
  const mostrarErro = campo => (tocados[campo] || tocados.enviar) ? erros[campo] : undefined
  const horas = horasAteValidade(form)

  const handleChange = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }
  const tocar = (campo) => () => setTocados((prev) => ({ ...prev, [campo]: true }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTocados({ enviar: true })
    if (Object.keys(erros).length) return
    setErro(null)
    setEnviando(true)
    try {
      await cadastrarLote(form)
      toast.success(`${form.nome.trim()} foi cadastrado com sucesso.`)
      navigate('/dashboard/varejista/meus-produtos')
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível cadastrar o alimento. Confira os dados e tente novamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="cadastrar-lote">
      <header className="page-header">
        <div className="page-header__text">
          <span className="eyebrow">Estoque</span>
          <h1 className="page-header__title">Cadastrar alimento</h1>
          <p className="page-header__subtitle">Publique um lote para venda com desconto. Perto do vencimento, ele é destinado automaticamente às ONGs.</p>
        </div>
      </header>

      <form className="cadastrar-lote__form" onSubmit={handleSubmit} noValidate>
        {erro && <Alert variant="error">{erro}</Alert>}

        <section className="panel cadastrar-lote__secao">
          <h2 className="cadastrar-lote__titulo">Informações do alimento</h2>
          <div className="cadastrar-lote__grade">
            <Field label="Nome do alimento" required error={mostrarErro('nome')}>
              <input type="text" placeholder="Ex.: Pão francês" maxLength={120} value={form.nome}
                onChange={handleChange('nome')} onBlur={tocar('nome')} />
            </Field>
            <Field label="Categoria" required error={mostrarErro('categoria')}>
              <select value={form.categoria} onChange={handleChange('categoria')} onBlur={tocar('categoria')}>
                <option value="" disabled>Selecione uma categoria</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Descrição" full help="Conte sobre o estado e a conservação. Isso ajuda quem vai retirar.">
              <textarea rows={3} maxLength={500} placeholder="Ex.: Pães do dia, embalados individualmente." value={form.descricao}
                onChange={handleChange('descricao')} />
            </Field>
            <Field label="Quantidade (unidades)" required error={mostrarErro('quantidade')}>
              <input type="number" min="1" step="1" inputMode="numeric" placeholder="Ex.: 20" value={form.quantidade}
                onChange={handleChange('quantidade')} onBlur={tocar('quantidade')} />
            </Field>
          </div>
        </section>

        <section className="panel cadastrar-lote__secao">
          <h2 className="cadastrar-lote__titulo">Validade e preço</h2>
          <div className="cadastrar-lote__grade">
            <Field label="Data de validade" required error={mostrarErro('validade')}>
              <input type="date" value={form.dataValidade} onChange={handleChange('dataValidade')} onBlur={tocar('validade')} />
            </Field>
            <Field label="Horário" required help="Horário em que o alimento deixa de ser próprio para consumo.">
              <input type="time" value={form.horaValidade} onChange={handleChange('horaValidade')} onBlur={tocar('validade')} />
            </Field>
            {horas !== null && horas > 0 && horas <= HORAS_DOACAO && <Alert variant="info" className="field--full">
              Faltam menos de {HORAS_DOACAO} horas para o vencimento: este alimento vai direto para a vitrine de doação das ONGs, sem custo.
            </Alert>}
            {horas !== null && horas > HORAS_DOACAO && horas <= HORAS_PREVIA_ONG && <Alert variant="warning" className="field--full">
              O alimento fica à venda até faltarem {HORAS_DOACAO} horas para o vencimento. Depois disso, passa automaticamente para doação.
            </Alert>}
            <Field label="Preço original" required prefixo="R$" error={mostrarErro('precoOriginal')}>
              <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,00"
                value={form.precoOriginal} onChange={handleChange('precoOriginal')} onBlur={tocar('precoOriginal')} />
            </Field>
            <Field label="Preço com desconto" prefixo="R$" error={mostrarErro('precoDesconto')} help="Opcional. Deixe em branco para vender pelo preço original.">
              <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,00"
                value={form.precoDesconto} onChange={handleChange('precoDesconto')} onBlur={tocar('precoDesconto')} />
            </Field>
          </div>
        </section>

        <section className="panel cadastrar-lote__secao">
          <h2 className="cadastrar-lote__titulo">Fotos</h2>
          <p className="cadastrar-lote__descricao">Boas fotos aumentam as chances de o alimento ser reservado. A primeira é a capa exibida na vitrine.</p>
          <SeletorImagens fotos={form.fotos} onChange={(fotos) => setForm((prev) => ({ ...prev, fotos }))} />
        </section>

        <section className="panel cadastrar-lote__secao">
          <h2 className="cadastrar-lote__titulo">Destaques</h2>
          <label className="toggle-row">
            <span className="toggle-row__switch">
              <input type="checkbox" checked={form.isOferta} onChange={handleChange('isOferta')} />
              <span className="toggle-row__slider" />
            </span>
            <span className="toggle-row__text">
              <strong>Destacar como oferta</strong>
              <span>Aparece também na página de ofertas dos consumidores.</span>
            </span>
          </label>
          <label className="toggle-row">
            <span className="toggle-row__switch">
              <input type="checkbox" checked={form.frutaFeia} onChange={handleChange('frutaFeia')} />
              <span className="toggle-row__slider" />
            </span>
            <span className="toggle-row__text">
              <strong>Fora do padrão estético</strong>
              <span>Alimento com aparência diferente do comum, mas próprio para consumo.</span>
            </span>
          </label>
        </section>

        <div className="cadastrar-lote__rodape">
          <Button variant="ghost" onClick={() => navigate(-1)} disabled={enviando}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={enviando}>Cadastrar alimento</Button>
        </div>
      </form>
    </div>
  )
}

export default CadastrarLote
