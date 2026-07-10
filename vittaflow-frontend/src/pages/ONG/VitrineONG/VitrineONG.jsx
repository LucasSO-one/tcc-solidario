import "./VitrineONG.css";
import ProductCard from "../../../components/ProductCard/ProductCard";
import produtos from "../../../data/produtos";

function VitrineONG() {
  return (
    <main className="vitrine">

      <h1>Vitrine para ONGs</h1>

      <p className="descricao">
        Alimentos disponíveis para resgate — janela de reserva libera
        24h antes da validade.
      </p>

      <div className="info-box">

        <div className="info-icon">
          ℹ️
        </div>

        <span>
          Como funciona: produtos com até 24h para vencer ficam
          liberados para reserva imediata. Entre 24h e 36h aparecem
          bloqueados com contagem para liberação.
        </span>

      </div>

      <div className="search-box">

        <input
          type="text"
          placeholder="Buscar alimento..."
        />

      </div>

      <div className="categories">

        <button className="active">Todos</button>
        <button>Carnes</button>
        <button>Laticínios</button>
        <button>Hortifruti</button>
        <button>Padaria</button>

      </div>

      <div className="produtos">

        {produtos.map((produto) => (

          <ProductCard
            key={produto.id}
            imagem={produto.imagem}
            nome={produto.nome}
            categoria={produto.categoria}
            estabelecimento={produto.estabelecimento}
            quantidade={produto.quantidade}
            validade={produto.validade}
          />

        ))}

      </div>

    </main>
  );
}

export default VitrineONG;