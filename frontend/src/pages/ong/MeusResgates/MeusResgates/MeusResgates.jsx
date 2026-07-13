import "./MeusResgates.css";
import ResgateCard from "../../../components/ResgateCard/ResgateCard";
import reservas from "../../../data/reservas";
import { FaHandHoldingHeart } from "react-icons/fa";

function MeusResgates() {

    return (

        <main className="meus-resgates">

    <div className="titulo">

    <FaHandHoldingHeart className="titulo-icon"/>

    <h1>Meus Resgates</h1>

</div>

    <p>
        Reservas ativas e histórico de retiradas
    </p>

    <h2>Reservas Ativas</h2>

{
    reservas
        .filter(reserva => !reserva.concluido)
        .map(reserva => (

            <ResgateCard

                key={reserva.id}

                nome={reserva.nome}

                estabelecimento={reserva.estabelecimento}

                quantidade={reserva.quantidade}

                horario={reserva.horario}

                onVerCodigo={() => {

    console.log("Abrir QRCode");

}}

            />

        ))
}

<h2 className="concluidos">

    Concluídos

</h2>

{
    reservas
        .filter(reserva => reserva.concluido)
        .map(reserva => (

            <ResgateCard

                key={reserva.id}

                nome={reserva.nome}

                estabelecimento={reserva.estabelecimento}

                quantidade={reserva.quantidade}

                horario={reserva.horario}

                concluido={true}

            />

        ))
}

</main>

    );

}

export default MeusResgates;