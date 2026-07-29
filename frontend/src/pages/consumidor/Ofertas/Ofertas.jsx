import "./Ofertas.scss";
import { FaSearch } from "react-icons/fa";

import OfertaCard from "../../../components/OfertaCard/OfertaCard";
// import ofertas from "../../../data/ofertas";

function Ofertas() {

    return (

        <main className="ofertas">

            <h1>Ofertas perto de você</h1>

            <p>
                Reserve agora e pague no local — sem carrinho, sem complicação.
            </p>

            <div className="busca">

                <FaSearch />

                <input
                    type="text"
                    placeholder="Buscar oferta ou estabelecimento..."
                />

            </div>

            <div className="grid-ofertas">

                {

                    ofertas.map((oferta) => (

                        <OfertaCard

                            key={oferta.id}

                            imagem={oferta.imagem}

                            nome={oferta.nome}

                            estabelecimento={oferta.estabelecimento}

                            preco={oferta.preco}

                            precoOriginal={oferta.precoOriginal}

                            distancia={oferta.distancia}

                            validade={oferta.validade}

                        />

                    ))

                }

            </div>

        </main>

    );

}

export default Ofertas;