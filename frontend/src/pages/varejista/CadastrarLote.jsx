import React, { useState } from 'react'
import { IconPlus } from '../../components/Icons/Icons'
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
}

const CadastrarLote = ({ onCadastrar }) => {
  const [form, setForm] = useState(estadoInicial)

  const handleChange = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const handleImagem = (e) => {
    setForm((prev) => ({ ...prev, imagem: e.target.files?.[0] ?? null }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onCadastrar?.(form)
  }

  return (
    <div className="cadastrar-lote">
      <header className="cadastrar-lote__header">
        <h1>Cadastrar Alimento</h1>
        <p className="subtitle">Adicione um novo lote de alimentos à vitrine</p>
      </header>

      <form className="panel form" onSubmit={handleSubmit}>
        <div className="form__title">
          <IconPlus size={16} />
          Novo Lote
        </div>

        <div className="form__grid">
          <div className="field">
            <label htmlFor="nome">Nome do alimento</label>
            <input
              id="nome"
              type="text"
              placeholder="Ex: Pão Francês"
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
              placeholder="Descreva o alimento, condições de conservação, etc."
              value={form.descricao}
              onChange={handleChange('descricao')}
            />
          </div>

          <div className="field">
            <label htmlFor="quantidade">Quantidade</label>
            <input
              id="quantidade"
              type="number"
              min="0"
              placeholder="Ex: 50"
              value={form.quantidade}
              onChange={handleChange('quantidade')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="dataValidade">Data de Validade</label>
            <input
              id="dataValidade"
              type="date"
              value={form.dataValidade}
              onChange={handleChange('dataValidade')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="horaValidade">Hora da Validade</label>
            <input
              id="horaValidade"
              type="time"
              value={form.horaValidade}
              onChange={handleChange('horaValidade')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="precoOriginal">Preço Original (R$)</label>
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

          <div className="field">
            <label htmlFor="precoDesconto">Preço Sugerido com Desconto</label>
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

          <div className="field field--full">
            <label htmlFor="imagem">Imagem do Produto</label>
            <input id="imagem" type="file" accept="image/*" onChange={handleImagem} />
            {form.imagem && <span className="field__hint">{form.imagem.name}</span>}
          </div>
        </div>

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

        <button type="submit" className="btn btn--primary btn--block">
          Cadastrar Alimento
        </button>
      </form>
    </div>
  )
}

export default CadastrarLote
