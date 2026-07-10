import "./Marketplace.css";

import { FaSearch, FaShoppingBasket } from "react-icons/fa";

import OfertaCard from "../../../../components/OfertaCard/OfertaCard.jsx";
import ofertas from "../../../data/ofertas";

function Marketplace(){

    return(

        <main className="marketplace">

            <div className="titulo">

                <FaShoppingBasket className="titulo-icon"/>

                <h1>Marketplace</h1>

            </div>

            <p>

                Encontre alimentos próximos de você com preços reduzidos.

            </p>

            <div className="busca">

                <FaSearch/>

                <input
                    type="text"
                    placeholder="Buscar produtos..."
                />

            </div>

            <div className="categorias">

                <button className="ativo">Todos</button>

                <button>Padaria</button>

                <button>Hortifruti</button>

                <button>Laticínios</button>

                <button>Carnes</button>

            </div>

            <div className="grid">

                {

                    ofertas.map((produto)=>(

                        <OfertaCard

                            key={produto.id}

                            imagem={produto.imagem}

                            nome={produto.nome}

                            estabelecimento={produto.estabelecimento}

                            preco={produto.preco}

                            precoOriginal={produto.precoOriginal}

                            distancia={produto.distancia}

                            validade={produto.validade}

                        />

                    ))

                }

            </div>

        </main>

    );

}

export default Marketplace;