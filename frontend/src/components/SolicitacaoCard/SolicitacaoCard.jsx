import "./SolicitacaoCard.css";

import {
    FaStore,
    FaBox,
    FaClock,
    FaCheckCircle,
    FaTimesCircle
} from "react-icons/fa";

function SolicitacaoCard({

    produto,
    estabelecimento,
    quantidade,
    status

}){

    return(

        <div className="solicitacao-card">

            <div className="dados">

                <h3>{produto}</h3>

                <p>

                    <FaStore />

                    {estabelecimento}

                </p>

                <small>

                    <FaBox />

                    {quantidade}

                </small>

            </div>

            <span className={`status ${status.toLowerCase()}`}>

            {

                status === "Pendente" && <FaClock />

            }

            {

                status === "Aceita" && <FaCheckCircle />

            }

            {

                status === "Recusada" && <FaTimesCircle />

            }

                {status}

            </span>

        </div>

    );

}

export default SolicitacaoCard;