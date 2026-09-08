import React from 'react'
import { IconHeart, IconMapPin, IconClock, IconInfo } from '../../../components/Icons/Icons'
import './Doacoes.scss'

const doacoesMock = [
  {
    id: 1,
    produto: 'Pão Francês',
    unidades: 50,
    estabelecimento: 'Padaria Artesanal',
    local: 'Centro, São Paulo',
    validade: '13/03/2026',
    prazo: '1 dia',
    aviso: 'Este alimento pode ajudar pessoas em situação de vulnerabilidade',
  },
  {
    id: 2,
    produto: 'Pão Francês',
    unidades: 50,
    estabelecimento: 'Padaria Artesanal',
    local: 'Centro, São Paulo',
    validade: '13/03/2026',
    prazo: '1 dia',
    aviso: 'Este alimento pode ajudar pessoas em situação de vulnerabilidade',
  },
  {
    id: 3,
    produto: 'Pão Francês',
    unidades: 50,
    estabelecimento: 'Padaria Artesanal',
    local: 'Centro, São Paulo',
    validade: '13/03/2026',
    prazo: '1 dia',
    aviso: 'Este alimento pode ajudar pessoas em situação de vulnerabilidade',
  },
  {
    id: 4,
    produto: 'Pão Francês',
    unidades: 50,
    estabelecimento: 'Padaria Artesanal',
    local: 'Centro, São Paulo',
    validade: '13/03/2026',
    prazo: '1 dia',
    aviso: 'Este alimento pode ajudar pessoas em situação de vulnerabilidade',
  },
]

const Doacoes = ({ doacoes = doacoesMock, onSolicitarRetirada }) => {
  return (
    <div className="doacoes">
      <header className="doacoes__header">
        <h1>
          <IconHeart size={20} />
          Disponível para Doação
        </h1>
        <p className="subtitle">Alimentos próximos do vencimento disponíveis para ONGs e instituições</p>
      </header>

      <div className="doacoes-grid">
        {doacoes.map((item) => (
          <div className="doacao-card" key={item.id}>
            <div className="doacao-card__top">
              <h3>
                {item.produto} <span>({item.unidades} unidades)</span>
              </h3>
              <span className="badge badge--danger">{item.prazo}</span>
            </div>

            <p className="doacao-card__store">{item.estabelecimento}</p>

            <div className="doacao-card__meta">
              <span>
                <IconMapPin size={13} />
                {item.local}
              </span>
              <span>
                <IconClock size={13} />
                Validade {item.validade}
              </span>
            </div>

            <div className="doacao-card__notice">
              <IconInfo size={13} />
              <span>{item.aviso}</span>
            </div>

            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => onSolicitarRetirada?.(item)}
            >
              <IconHeart size={14} />
              Solicitar Retirada
            </button>
          </div>
        ))}

        {doacoes.length === 0 && (
          <p className="doacoes-empty">Nenhum alimento disponível para doação no momento.</p>
        )}
      </div>
    </div>
  )
}

export default Doacoes
