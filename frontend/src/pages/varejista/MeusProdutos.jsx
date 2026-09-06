import React, { useMemo, useState } from 'react'
import { IconPlus, IconSearch, IconFilter } from '../../components/Icons/Icons'
import './MeusProdutos.scss'

const produtosMock = [
  { id: 1, produto: 'Pão Francês', categoria: 'Laticínios', qtd: '10h', validade: '26/03/2026', status: 'Pré-validado' },
  { id: 2, produto: 'Pão Francês', categoria: '80 un.', qtd: '10h', validade: '10h', status: 'Em desconto' },
  { id: 3, produto: 'Pão Francês', categoria: '80 un.', qtd: '10h', validade: '10h', status: 'Em desconto' },
  { id: 4, produto: 'Pão Francês', categoria: '80 un.', qtd: '10h', validade: '10h', status: 'Em desconto' },
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

const MeusProdutos = ({ produtos = produtosMock, onNovoProduto, onAbrirFiltros }) => {
  const [busca, setBusca] = useState('')

  const produtosFiltrados = useMemo(() => {
    if (!busca.trim()) return produtos
    return produtos.filter((p) =>
      p.produto.toLowerCase().includes(busca.trim().toLowerCase())
    )
  }, [produtos, busca])

  return (
    <div className="meus-produtos">
      <header className="meus-produtos__header">
        <div>
          <h1>Meus Produtos</h1>
          <p className="subtitle">Gerencie os alimentos cadastrados pelo seu estabelecimento</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={onNovoProduto}>
          <IconPlus size={16} />
          Novo Produto
        </button>
      </header>

      <div className="toolbar">
        <div className="search-input">
          <IconSearch size={16} className="search-input__icon" />
          <input
            type="text"
            placeholder="Buscar Produtos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn--ghost" onClick={onAbrirFiltros}>
          <IconFilter size={16} />
          Todos os Filtros
        </button>
      </div>

      <section className="panel">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Qtd</th>
                <th>Validade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td className="data-table__strong">{item.produto}</td>
                  <td className="data-table__link">{item.categoria}</td>
                  <td>{item.qtd}</td>
                  <td>{item.validade}</td>
                  <td>
                    <span className={`badge ${statusClass(item.status)}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
              {produtosFiltrados.length === 0 && (
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
