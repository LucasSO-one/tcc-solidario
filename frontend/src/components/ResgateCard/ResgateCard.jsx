import "./ResgateCard.css";

import {
    FaBoxOpen,
    FaMapMarkerAlt,
    FaQrcode,
    FaCheckCircle
} from "react-icons/fa";

function ResgateCard({

    nome,
    estabelecimento,
    quantidade,
    horario,
    concluido = false,
    onVerCodigo

}) {

    return (

        <div className="resgate-card">

            <div className="resgate-info">

                <FaBoxOpen className="icone" />

                <div>

                    <h3>{nome}</h3>

                    <p>
                        <FaMapMarkerAlt />
                        {estabelecimento}
                    </p>

                    <small>
                        {quantidade} • Reservado {horario}
                    </small>

                </div>

            </div>

            {
                concluido ? (

                    <button className="retirado">

                        <FaCheckCircle />

                        Retirado

                    </button>

                ) : (

                    <button
                        className="codigo"
                        onClick={onVerCodigo}
                    >

                        <FaQrcode />

                        Ver Código

                    </button>

                )
            }

        </div>

    );

}

export default ResgateCard;