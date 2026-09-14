import React from 'react'
import {
  Plus,
  AlertTriangle,
  ArrowUpRight,
  Leaf,
  Heart,
  Clock,
  Users,
  TrendingUp,
  Store,
  Bell,
} from 'lucide-react'
import './DashboardVarejista.scss'

const stats = [
  { label: 'Produtos ativos', value: 82, delta: '+12 esta semana', icon: Leaf },
  { label: 'Doações realizadas', value: 52, delta: '6 neste mês', icon: Heart },
  { label: 'Retiradas pendentes', value: '07', delta: '3 para hoje', icon: Clock },
  { label: 'Famílias atendidas', value: 320, delta: '+28 este mês', icon: Users },
]

const estoquePrioritario = [
  { id: 1, produto: 'Pão francês', categoria: 'Padaria', quantidade: '80 un.', validade: 'Hoje, 18h', status: 'Em destaque' },
  { id: 2, produto: 'Banana-prata', categoria: 'Hortifruti', quantidade: '24 kg', validade: 'Amanhã', status: 'Disponível' },
  { id: 3, produto: 'Leite integral', categoria: 'Laticínios', quantidade: '36 un.', validade: '12 set', status: 'Reservado' },
]

const impacto = [
  { label: 'kg doados', value: '1.240', icon: Leaf },
  { label: 'pessoas', value: '320', icon: Users },
  { label: 'retiradas', value: '47', icon: Store },
]

const atualizacoes = [
  { id: 1, titulo: 'Retirada confirmada', detalhe: 'ONG Mãos que Alimentam · há 20 min' },
  { id: 2, titulo: 'Novo marco alcançado', detalhe: '1,2 tonelada doada neste ano' },
]

const statusClass = (status) => {
  switch (status) {
    case 'Em destaque':
      return 'badge--warning'
    case 'Disponível':
      return 'badge--success'
    case 'Reservado':
      return 'badge--info'
    default:
      return 'badge--neutral'
  }
}

const DashboardVarejista = ({ onNovoLote, onRevisarProdutos, onVerTodosProdutos }) => {
  return (
    <div className="dashboard-varejista">
      <header className="dashboard-varejista__header">
        <div className="dashboard-varejista__heading">
          <span className="eyebrow">Visão geral</span>
          <h1>Painel do varejista</h1>
          <p className="subtitle">Acompanhe o estoque, as doações e o impacto do seu estabelecimento.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onNovoLote}>
          <Plus size={14} />
          Novo alimento
        </button>
      </header>

      <div className="alert-banner">
        <AlertTriangle className="alert-banner__icon" size={20} />
        <div className="alert-banner__body">
          <p className="alert-banner__title">3 produtos vencem nas próximas 12 horas</p>
          <p className="alert-banner__text">Antecipe uma doação para evitar perdas no estoque.</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={onRevisarProdutos}>
          Revisar produtos
        </button>
      </div>

      <div className="stat-grid">
        {stats.map(({ label, value, delta, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-card__top">
              <span className="stat-card__label">{label}</span>
              <span className="stat-card__icon">
                <Icon size={16} />
              </span>
            </div>
            <span className="stat-card__value">{value}</span>
            <span className="stat-card__delta">{delta}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-varejista__content">
        <section className="panel panel--estoque">
          <div className="panel__header">
            <div>
              <h2 className="panel__title">Estoque prioritário</h2>
              <p className="panel__subtitle">Itens que precisam de atenção primeiro</p>
            </div>
            <button type="button" className="link-btn" onClick={onVerTodosProdutos}>
              Ver todos
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Validade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {estoquePrioritario.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="data-table__strong">{item.produto}</span>
                      <span className="data-table__muted">{item.categoria}</span>
                    </td>
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

        <div className="dashboard-varejista__side">
          <section className="panel panel--impacto">
            <div className="panel__icon">
              <TrendingUp size={18} />
            </div>
            <h2 className="panel__title">Impacto no mês</h2>
            <p className="panel__subtitle">Resultado da sua contribuição</p>
            <div className="impact-grid">
              {impacto.map(({ label, value, icon: Icon }) => (
                <div className="impact-card" key={label}>
                  <Icon size={16} />
                  <span className="impact-card__value">{value}</span>
                  <span className="impact-card__label">{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel panel--updates">
            <h2 className="panel__title">
              <Bell size={16} />
              Atualizações
            </h2>
            <ul className="update-list">
              {atualizacoes.map((item) => (
                <li className="update-item" key={item.id}>
                  <span className="update-item__title">{item.titulo}</span>
                  <span className="update-item__detail">{item.detalhe}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default DashboardVarejista