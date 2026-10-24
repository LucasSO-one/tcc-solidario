import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackagePlus, Search, SearchX } from 'lucide-react'
import { listarMeusProdutos } from '../../../service/produtoService'
import { mensagemErro } from '../../../utils/mensagemErro'
import { dataHora, moeda } from '../../../utils/formatar'
import { fotosDoProduto } from '../../../utils/imagens'
import CarrosselImagens from '../../../components/produto/CarrosselImagens'
import ProdutoCard from '../../../components/produto/ProdutoCard'
import Alert from '../../../components/ui/Alert'
import { StatusBadge } from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import Modal from '../../../components/ui/Modal'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import './MeusProdutos.scss'

const FILTROS_STATUS = [
  ['', 'Todas as situações'],
  ['venda', 'À venda'],
  ['DisponivelParaDoacao', 'Para doação'],
  ['Reservado', 'Reservados'],
  ['entregue', 'Vendidos ou doados'],
  ['Vencido', 'Vencidos'],
]

const ENCERRADOS = ['Vendido', 'Doado', 'Vencido']

function combinaStatus(produto, filtro) {
  if (!filtro) return true
  if (filtro === 'venda') return ['Disponivel', 'EmDesconto'].includes(produto.status)
  if (filtro === 'entregue') return ['Vendido', 'Doado'].includes(produto.status)
  return produto.status === filtro
}

const MeusProdutos = () => {
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [detalhe, setDetalhe] = useState(null)

  useEffect(() => {
    async function carregar() {
      try {
        setProdutos(await listarMeusProdutos())
      } catch (e) {
        setErro(mensagemErro(e, 'Não foi possível carregar seus alimentos.'))
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return produtos.filter((p) => combinaStatus(p, status) && (!termo || p.titulo.toLowerCase().includes(termo)))
  }, [produtos, busca, status])

  return (
    <div className="meus-produtos">
      <header className="page-header">
        <div className="page-header__text">
          <span className="eyebrow">Estoque</span>
          <h1 className="page-header__title">Meus alimentos</h1>
          <p className="page-header__subtitle">Tudo o que o seu estabelecimento cadastrou, do mais próximo do vencimento ao mais distante.</p>
        </div>
        <Link className="btn btn--primary" to="/dashboard/varejista/cadastrar-lote"><PackagePlus aria-hidden="true" />Cadastrar alimento</Link>
      </header>

      <div className="meus-produtos__filtros">
        <div className="search-input">
          <Search className="search-input__icon" aria-hidden="true" />
          <input type="search" placeholder="Buscar pelo nome" aria-label="Buscar alimento pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="field">
          <select aria-label="Filtrar por situação" value={status} onChange={(e) => setStatus(e.target.value)}>
            {FILTROS_STATUS.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
        </div>
      </div>

      {erro && <Alert variant="error">{erro}</Alert>}

      {carregando ? (
        <div className="grade-produtos" aria-busy="true">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : !produtos.length ? (
        <EmptyState icon={PackagePlus} title="Você ainda não cadastrou alimentos"
          action={<Link className="btn btn--primary" to="/dashboard/varejista/cadastrar-lote">Cadastrar alimento</Link>}>
          Comece agora e ajude a reduzir o desperdício.
        </EmptyState>
      ) : !produtosFiltrados.length ? (
        <EmptyState icon={SearchX} title="Nenhum alimento encontrado">Tente outro nome ou mude o filtro de situação.</EmptyState>
      ) : (
        <div className="grade-produtos">
          {produtosFiltrados.map((p) => (
            <ProdutoCard key={p.id} nome={p.titulo} imagens={fotosDoProduto(p)} categoria={p.categoria} quantidade={p.quantidade}
              dataValidade={p.dataValidade} mostrarValidade={!ENCERRADOS.includes(p.status)} badges={<StatusBadge status={p.status} />}>
              <Button variant="secondary" onClick={() => setDetalhe(p)}>Ver detalhes</Button>
            </ProdutoCard>
          ))}
        </div>
      )}

      {detalhe && (
        <Modal title={detalhe.titulo} size="lg" onClose={() => setDetalhe(null)}>
          <div className="detalhe-produto">
            <CarrosselImagens imagens={fotosDoProduto(detalhe)} alt={detalhe.titulo} categoria={detalhe.categoria} variante="lightbox" />
            <div className="detalhe-produto__info">
              <StatusBadge status={detalhe.status} />
              {detalhe.descricao && <p>{detalhe.descricao}</p>}
              <dl className="detalhe-produto__dados">
                <div><dt>Categoria</dt><dd>{detalhe.categoria}</dd></div>
                <div><dt>Quantidade</dt><dd>{detalhe.quantidade} unidades</dd></div>
                <div><dt>Validade</dt><dd>{dataHora(detalhe.dataValidade)}</dd></div>
                <div><dt>Preço original</dt><dd>{moeda(detalhe.precoOriginal)}</dd></div>
                {detalhe.precoVenda != null && <div><dt>{detalhe.status === 'DisponivelParaDoacao' || detalhe.status === 'Doado' ? 'Preço atual' : 'Preço com desconto'}</dt>
                  <dd>{Number(detalhe.precoVenda) === 0 ? 'Doação gratuita' : moeda(detalhe.precoVenda)}</dd></div>}
                <div><dt>Fora do padrão estético</dt><dd>{detalhe.frutaFeia ? 'Sim' : 'Não'}</dd></div>
              </dl>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MeusProdutos
