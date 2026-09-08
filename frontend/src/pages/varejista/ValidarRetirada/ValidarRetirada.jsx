import React, { useState } from 'react'
import { IconClipboard, IconQrCode, IconCheckCircle, IconBox } from '../../../components/Icons/Icons'
import './ValidarRetirada.scss'

const validacoesMock = [
  { id: 1, produto: 'Alface Crespa', origem: 'Banco de Alimentos SP', quantidade: '25 un', quando: 'Hoje, 09:15' },
  { id: 2, produto: 'Alface Crespa', origem: 'Banco de Alimentos SP', quantidade: '25 un', quando: 'Hoje, 09:15' },
]

const ValidarRetirada = ({ validacoes = validacoesMock, onValidar, onLerQrCode }) => {
  const [codigo, setCodigo] = useState('')

  const handleValidar = () => {
    if (!codigo.trim()) return
    onValidar?.(codigo.trim())
    setCodigo('')
  }

  return (
    <div className="validar-retirada">
      <header className="validar-retirada__header">
        <h1>
          <IconClipboard size={20} />
          Validação de Retirada
        </h1>
        <p className="subtitle">Confirme a retirada e dê baixa no estoque informando o código apresentado pela ONG</p>
      </header>

      <section className="panel">
        <label className="field-label" htmlFor="codigo">
          Digite o código de retirada
        </label>
        <input
          id="codigo"
          type="text"
          className="code-input"
          placeholder="Ex: A7X-99P"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        />

        <div className="actions-row">
          <button type="button" className="btn btn--outline" onClick={onLerQrCode}>
            <IconQrCode size={16} />
            Ler QR Code
          </button>
          <button type="button" className="btn btn--primary" onClick={handleValidar} disabled={!codigo.trim()}>
            <IconCheckCircle size={16} />
            Validar e Baixar Estoque
          </button>
        </div>
      </section>

      <section className="recent">
        <h2>Validações Recentes</h2>
        <div className="recent-list">
          {validacoes.map((v) => (
            <div className="recent-item" key={v.id}>
              <span className="recent-item__icon">
                <IconBox size={16} />
              </span>
              <div>
                <div className="recent-item__title">{v.produto}</div>
                <div className="recent-item__subtitle">
                  {v.origem} &middot; {v.quantidade} &middot; {v.quando}
                </div>
              </div>
            </div>
          ))}
          {validacoes.length === 0 && (
            <p className="recent-empty">Nenhuma validação recente.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default ValidarRetirada
