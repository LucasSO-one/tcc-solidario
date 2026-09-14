import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react'
import { listarMeusProdutos } from '../../../service/produtoService'
import './MeusProdutos.scss'

const statusLabels = {
  Disponivel: 'Disponível',
  EmDesconto: 'Em desconto',
  DisponivelParaDoacao: 'Disponível para doação',
  Reservado: 'Reservado',
  Vendido: 'Vendido',
  Doado: 'Doado',
  Vencido: 'Vencido',
}

const statusClass = (status) => {
  switch (status) {
    case 'EmDesconto':
      return 'badge--warning'
    case 'Disponivel':
    case 'Doado':
      return 'badge--success'
    case 'Reservado':
    case 'DisponivelParaDoacao':
      return 'badge--info'
    case 'Vencido':
      return 'badge--danger'
    default:
      return 'badge--neutral'
  }
}

const formatarValidade = (dataValidade) =>
  new Date(dataValidade).toLocaleDateString('pt-BR')

const MeusProdutos = ({ onNovoProduto, onAbrirFiltros, onAbrirAcoes }) => {
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarMeusProdutos()
        setProdutos(data)
      } catch (err) {
        setErro('Não foi possível carregar os produtos.')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  const produtosFiltrados = useMemo(() => {
    if (!busca.trim()) return produtos
    return produtos.filter((p) =>
      p.titulo.toLowerCase().includes(busca.trim().toLowerCase())
    )
  }, [produtos, busca])

  return (
    <div className="meus-produtos">
      <header className="meus-produtos__header">
        <div className="meus-produtos__heading">
          <span className="eyebrow">Estoque</span>
          <h1>Meus produtos</h1>
          <p className="subtitle">Gerencie os alimentos cadastrados pelo seu estabelecimento.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onNovoProduto}>
          <Plus size={14} />
          Novo produto
        </button>
      </header>

      <section className="panel">
        <div className="toolbar">
          <div className="search-input">
            <Search size={16} className="search-input__icon" />
            <input
              type="text"
              placeholder="Buscar produtos"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn--ghost" onClick={onAbrirFiltros}>
            <Filter size={16} />
            Todos os filtros
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
                <th aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr><td colSpan={5} className="data-table__empty">Carregando...</td></tr>
              )}

              {!carregando && erro && (
                <tr><td colSpan={5} className="data-table__empty">{erro}</td></tr>
              )}

              {!carregando && !erro && produtosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="data-table__strong">{item.titulo}</span>
                    <span className="data-table__muted">{item.categoria}</span>
                  </td>
                  <td>{item.quantidade}</td>
                  <td>{formatarValidade(item.dataValidade)}</td>
                  <td>
                    <span className={`badge ${statusClass(item.status)}`}>
                      {statusLabels[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="data-table__actions">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => onAbrirAcoes?.(item)}
                      aria-label="Mais ações"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {!carregando && !erro && produtosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="data-table__empty">
                    Nenhum produto encontrado para &ldquo;{busca}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default MeusProdutos