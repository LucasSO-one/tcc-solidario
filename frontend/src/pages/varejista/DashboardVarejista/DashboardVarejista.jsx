import React from 'react'
import { IconPlus, IconAlertTriangle, IconBox, IconHeart, IconTrendingUp, IconLeaf, IconUsers, IconStore, IconBell } from '../../../components/Icons/Icons'
import './DashboardVarejista.scss'

const stats = [
  { label: 'Produtos Ativos', value: 82, delta: '+12 esta semana', icon: IconBox },
  { label: 'Doações Realizadas', value: 52, delta: '+6 este mês', icon: IconHeart },
  { label: 'Vendas Salvas', value: 186, delta: '+28 este mês', icon: IconTrendingUp },
]

const produtosEmEstoque = [
  { id: 1, produto: 'Pão Francês', quantidade: '80 un.', validade: '10h', status: 'Em desconto' },
  { id: 2, produto: 'Pão Francês', quantidade: '80 un.', validade: '10h', status: 'Em desconto' },
  { id: 3, produto: 'Pão Francês', quantidade: '80 un.', validade: '10h', status: 'Em desconto' },
  { id: 4, produto: 'Pão Francês', quantidade: '80 un.', validade: '10h', status: 'Em desconto' },
]

const impacto = [
  { label: 'Alimentos salvos', value: '1240kg', icon: IconLeaf },
  { label: 'Pessoas beneficiadas', value: '320', icon: IconUsers },
  { label: 'Estabelecimentos', value: '47', icon: IconStore },
]

const notificacoes = [
  { id: 1, tipo: 'urgente', texto: '15 produtos vencem nas próximas 36 horas' },
  { id: 2, tipo: 'info', texto: 'ONG Mãos que Alimentam reservou 20 itens' },
]

const statusClass = (status) => {
  switch (status) {
    case 'Em desconto':
      return 'badge--warning'
    case 'Pré-validado':
      return 'badge--success'
    default:
      return 'badge--neutral'
  }
}

const DashboardVarejista = ({ onNovoLote, onGerenciarAlerta, onAntecipDoacao }) => {
  return (
    <div className="dashboard-varejista">
      <header className="dashboard-varejista__header">
        <div>
          <h1>Dashboard do Varejista</h1>
          <p className="subtitle">Monitoramento do seu estoque</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onNovoLote}>
          <IconPlus size={16} />
          Novo Lote
        </button>
      </header>

      <div className="alert-banner">
        <IconAlertTriangle className="alert-banner__icon" />
        <p className="alert-banner__text">
          <strong>Atenção:</strong> 3 produtos irão para doação automática em menos de 12
          horas &mdash; a regra está ativa &mdash; antecipe a doação ou ajuste o desconto
          para evitar perdas.
        </p>
        <div className="alert-banner__actions">
          <button type="button" className="btn btn--ghost" onClick={onGerenciarAlerta}>
            Gerenciar Alerta
          </button>
          <button type="button" className="btn btn--danger" onClick={onAntecipDoacao}>
            Antecipar Doação
          </button>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map(({ label, value, delta, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-card__info">
              <span className="stat-card__label">{label}</span>
              <span className="stat-card__value">{value}</span>
              <span className="stat-card__delta">{delta}</span>
            </div>
            <div className="stat-card__icon">
              <Icon size={20} />
            </div>
          </div>
        ))}
      </div>

      <section className="panel">
        <h2 className="panel__title">
          <IconBox size={16} />
          Produtos em estoque
        </h2>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Validade em</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {produtosEmEstoque.map((item) => (
                <tr key={item.id}>
                  <td className="data-table__strong">{item.produto}</td>
                  <td>{item.quantidade}</td>
                  <td>{item.validade}</td>
                  <td>
                    <span className={`badge ${statusClass(item.status)}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Impacto da Plataforma</h2>
        <div className="impact-grid">
          {impacto.map(({ label, value, icon: Icon }) => (
            <div className="impact-card" key={label}>
              <span className="impact-card__icon">
                <Icon size={18} />
              </span>
              <div>
                <div className="impact-card__value">{value}</div>
                <div className="impact-card__label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">
          <IconBell size={16} />
          Notificações
        </h2>
        <ul className="notification-list">
          {notificacoes.map((n) => (
            <li className="notification-item" key={n.id}>
              <span className={`badge ${n.tipo === 'urgente' ? 'badge--danger' : 'badge--info'}`}>
                {n.tipo === 'urgente' ? 'Urgente' : 'Info'}
              </span>
              <span className="notification-item__text">{n.texto}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default DashboardVarejista
