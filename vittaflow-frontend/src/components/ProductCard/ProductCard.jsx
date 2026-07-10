import "./ProductCard.css";
import { FaMapMarkerAlt, FaClock, FaLeaf } from "react-icons/fa";

function ProductCard({
    imagem,
    nome,
    categoria,
    estabelecimento,
    quantidade,
    validade
}) {

    return (

        <div className="card">

            <img src={imagem} alt={nome} />

            <div className="card-body">

                <div className="topo">

                    <h3>{nome}</h3>

                    <span>{categoria}</span>

                </div>

                <p className="empresa">

                    <FaMapMarkerAlt />

                    {estabelecimento}

                </p>

                <div className="validade">

                    <FaClock />

                    {validade}

                </div>

                <p className="quantidade">

                    {quantidade}

                </p>

                <div className="impacto">

                    <FaLeaf />

                    Pode ajudar pessoas em vulnerabilidade

                </div>

                <button>

                    Reservar Agora

                </button>

            </div>

        </div>

    );

}

export default ProductCard;