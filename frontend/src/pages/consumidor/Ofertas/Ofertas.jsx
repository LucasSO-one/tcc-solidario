import React, { useEffect, useMemo, useState } from 'react'
import { Search, ShoppingCart, Recycle } from 'lucide-react'
import { listarOfertas } from '../../../service/produtoService'
import './Ofertas.scss'

const formatarPreco = (valor) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatarDiasRestantes = (dias) => {
  if (dias <= 0) return 'Vence hoje'
  if (dias === 1) return '1 dia restante'
  return `${dias} dias restantes`
}

const ProdutoCard = ({ produto, onReservar }) => (
  <article className={`produto-card ${produto.frutaFeia ? 'produto-card--feia' : ''}`}>
    {produto.frutaFeia && (
      <div className="produto-card__banner">
        <Recycle size={13} />
        Fruta Feia
      </div>
    )}

    <div className="produto-card__body">
      <div className="produto-card__imagem">
        {produto.imagemUrl ? (
          <img src={produto.imagemUrl} alt={produto.nome} />
        ) : (
          <span className="produto-card__imagem-placeholder">{produto.categoria?.[0] ?? '?'}</span>
        )}
      </div>

      <h3 className="produto-card__nome">{produto.nome}</h3>
      <p className="produto-card__varejista">{produto.nomeVarejista}</p>

      <span className="produto-card__validade">
        {formatarDiasRestantes(produto.diasRestantes)}
      </span>

      {produto.frutaFeia && (
        <div className="produto-card__mensagem">
          <Recycle size={14} />
          Ao comprar, você valoriza alimentos imperfeitos e reduz o desperdício
        </div>
      )}

      <div className="produto-card__preco">
        {produto.precoDesconto != null && (
          <span className="produto-card__preco-original">{formatarPreco(produto.precoOriginal)}</span>
        )}
        <span className="produto-card__preco-atual">
          {formatarPreco(produto.precoDesconto ?? produto.precoOriginal)}
        </span>
        {produto.descontoPercentual != null && (
          <span className="produto-card__desconto">{produto.descontoPercentual}%</span>
        )}
      </div>

      <button type="button" className="btn btn--primary btn--block" onClick={() => onReservar?.(produto)}>
        <ShoppingCart size={16} />
        Reservar
      </button>
    </div>
  </article>
)

const VitrineProdutos = ({ onReservar }) => {
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas') // 'todas' | 'frutas-feias'

  useEffect(() => {
    const controller = new AbortController()

    async function carregar() {
      setCarregando(true)
      setErro(null)
      try {
        const data = await listarOfertas({
          busca,
          signal: controller.signal,
        })
        setProdutos(data)
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setErro('Não foi possível carregar a vitrine.')
        }
      } finally {
        setCarregando(false)
      }
    }

    const debounce = setTimeout(carregar, 300)
    return () => {
      clearTimeout(debounce)
      controller.abort()
    }
  }, [busca, filtro])

  const { frutasFeias, demaisProdutos } = useMemo(() => {
    return {
      frutasFeias: produtos.filter((p) => p.frutaFeia),
      demaisProdutos: produtos.filter((p) => !p.frutaFeia),
    }
  }, [produtos])

  return (
    <div className="vitrine-produtos">
      <header className="vitrine-produtos__header">
        <h1>Melhores Ofertas</h1>
        <p className="subtitle">Produtos com melhores ofertas</p>
      </header>

      <div className="search-input search-input--lg">
        <Search size={18} className="search-input__icon" />
        <input
          type="text"
          placeholder="Buscar oferta ou estabelecimento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}  
        />
      </div>

      <div className="filter-tabs">
        <button
          type="button"
          className={`filter-tabs__btn ${filtro === 'todas' ? 'is-active' : ''}`}
          onClick={() => setFiltro('todas')}
        >
          Todas
        </button>
        <button
          type="button"
          className={`filter-tabs__btn ${filtro === 'frutas-feias' ? 'is-active' : ''}`}
          onClick={() => setFiltro('frutas-feias')}
        >
          <Recycle size={14} />
          Frutas Feias
        </button>
      </div>

      {carregando && <p className="vitrine-produtos__status">Carregando ofertas...</p>}
      {!carregando && erro && <p className="vitrine-produtos__status">{erro}</p>}

      {!carregando && !erro && (
        <>
          {frutasFeias.length > 0 && (
            <section className="vitrine-produtos__section">
              <h2 className="section-title">
                <Recycle size={16} />
                Frutas Feias — Mesma qualidade, preço especial
              </h2>
              <div className="produto-grid">
                {frutasFeias.map((produto) => (
                  <ProdutoCard key={produto.id} produto={produto} onReservar={onReservar} />
                ))}
              </div>
            </section>
          )}

          {filtro === 'todas' && demaisProdutos.length > 0 && (
            <section className="vitrine-produtos__section">
              <h2 className="section-title">Todos os produtos</h2>
              <div className="produto-grid">
                {demaisProdutos.map((produto) => (
                  <ProdutoCard key={produto.id} produto={produto} onReservar={onReservar} />
                ))}
              </div>
            </section>
          )}

          {produtos.length === 0 && (
            <p className="vitrine-produtos__status">
              Nenhuma oferta encontrada{busca ? ` para "${busca}"` : ''}.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default VitrineProdutos