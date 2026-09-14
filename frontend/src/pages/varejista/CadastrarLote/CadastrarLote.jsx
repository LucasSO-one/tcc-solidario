import React, { useRef, useState } from 'react'
import { Package, ImagePlus } from 'lucide-react'
import { cadastrarLote } from '../../../service/produtoService'
import './CadastrarLote.scss'

const categorias = ['Padaria', 'Hortifruti', 'Laticínios', 'Mercearia', 'Congelados', 'Outros']

const estadoInicial = {
  nome: '',
  categoria: '',
  descricao: '',
  quantidade: '',
  dataValidade: '',
  horaValidade: '',
  precoOriginal: '',
  precoDesconto: '',
  imagem: null,
  frutaFeia: false,
  isOferta: false,
}

const CadastrarLote = ({ onCadastrar }) => {
  const [form, setForm] = useState(estadoInicial)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const imagemInputRef = useRef(null)

  const handleChange = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const handleImagem = (e) => {
    setForm((prev) => ({ ...prev, imagem: e.target.files?.[0] ?? null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    try {
      const produtoCriado = await cadastrarLote(form)
      onCadastrar?.(produtoCriado)
      setForm(estadoInicial)
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="cadastrar-lote">
      <header className="cadastrar-lote__header">
        <span className="eyebrow">Estoque</span>
        <h1>Cadastrar alimento</h1>
        <p className="subtitle">Adicione um novo lote de alimentos à vitrine de doações.</p>
      </header>

      <form className="panel form" onSubmit={handleSubmit}>
        <div className="form__intro">
          <div className="form__icon">
            <Package size={18} />
          </div>
          <div>
            <h2 className="form__title">Dados do lote</h2>
            <p className="form__subtitle">Preencha as informações para publicação</p>
          </div>
        </div>

        {erro && <p className="form__erro">{erro}</p>}

        <div className="form__grid">
          <div className="field">
            <label htmlFor="nome">Nome do alimento</label>
            <input
              id="nome"
              type="text"
              placeholder="Ex.: Pão francês"
              value={form.nome}
              onChange={handleChange('nome')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="categoria">Categoria</label>
            <select id="categoria" value={form.categoria} onChange={handleChange('categoria')} required>
              <option value="" disabled>
                Selecione uma categoria
              </option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="field field--full">
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              rows={3}
              placeholder="Conte mais sobre o estado e a conservação do alimento"
              value={form.descricao}
              onChange={handleChange('descricao')}
            />
          </div>

          <div className="field field--quantidade">
            <label htmlFor="quantidade">Quantidade</label>
            <input
              id="quantidade"
              type="number"
              min="0"
              placeholder="Ex.: 80 unidades"
              value={form.quantidade}
              onChange={handleChange('quantidade')}
              required
            />
          </div>

          <div className="field field--third">
            <label htmlFor="dataValidade">Data de validade</label>
            <input
              id="dataValidade"
              type="date"
              value={form.dataValidade}
              onChange={handleChange('dataValidade')}
              required
            />
          </div>

          <div className="field field--third">
            <label htmlFor="horaValidade">Horário</label>
            <input
              id="horaValidade"
              type="time"
              value={form.horaValidade}
              onChange={handleChange('horaValidade')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="precoOriginal">Preço original</label>
            <div className="input-prefix">
              <span className="input-prefix__symbol">R$</span>
              <input
                id="precoOriginal"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.precoOriginal}
                onChange={handleChange('precoOriginal')}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="precoDesconto">Preço sugerido com desconto</label>
            <div className="input-prefix">
              <span className="input-prefix__symbol">R$</span>
              <input
                id="precoDesconto"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.precoDesconto}
                onChange={handleChange('precoDesconto')}
              />
            </div>
          </div>

          <div className="field field--full">
            <label htmlFor="imagem">Imagem do produto</label>
            <input
              id="imagem"
              ref={imagemInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagem}
              hidden
            />
            <button
              type="button"
              className="dropzone"
              onClick={() => imagemInputRef.current?.click()}
            >
              <ImagePlus size={18} />
              {form.imagem ? form.imagem.name : 'Selecionar uma imagem'}
            </button>
          </div>
        </div>
        <label className="toggle-row">
          <span className="toggle-row__switch">
            <input
              type="checkbox"
              checked={form.isOferta}
              onChange={handleChange('isOferta')}
            />
            <span className="toggle-row__slider" />
          </span>
          <span className="toggle-row__text">
            <strong>Este produto é uma &ldquo;Oferta ?&rdquo;</strong>
            <span>Produtos criados como ofertas aparecem como vantagem para os consumidores</span>
          </span>
        </label>
        <label className="toggle-row">
          <span className="toggle-row__switch">
            <input
              type="checkbox"
              checked={form.frutaFeia}
              onChange={handleChange('frutaFeia')}
            />
            <span className="toggle-row__slider" />
          </span>
          <span className="toggle-row__text">
            <strong>Marcar como &ldquo;Fruta Feia&rdquo;</strong>
            <span>Produto fora do padrão estético, mas próprio para consumo</span>
          </span>
        </label>

        <button type="submit" className="btn btn--primary btn--block" disabled={enviando}>
          {enviando ? 'Cadastrando...' : 'Cadastrar alimento'}
        </button>
      </form>
    </div>
  )
}

export default CadastrarLote