import "./OfertaCard.css";

import {
    FaMapMarkerAlt,
    FaClock,
    FaLeaf
} from "react-icons/fa";

function OfertaCard({

    imagem,
    nome,
    estabelecimento,
    preco,
    precoOriginal,
    distancia,
    validade

}){

    return(

        <div className="oferta-card">

            <img
                src={imagem}
                alt={nome}
            />

            <div className="oferta-body">

                <h3>{nome}</h3>

                <p className="local">

                    <FaMapMarkerAlt />

                    {estabelecimento}

                </p>

                <div className="precos">

                    <span className="preco-original">

                        {precoOriginal}

                    </span>

                    <span className="preco">

                        {preco}

                    </span>

                </div>

                <div className="info">

                    <span>

                        <FaMapMarkerAlt />

                        {distancia}

                    </span>

                    <span>

                        <FaClock />

                        {validade}

                    </span>

                </div>

                <div className="impacto">

                    <FaLeaf />

                    Você evita desperdício

                </div>

                <button>

                    Reservar Agora

                </button>

            </div>

        </div>

    );

}

export default OfertaCard;