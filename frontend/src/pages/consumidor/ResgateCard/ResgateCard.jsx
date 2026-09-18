import { FaQrcode, FaCheckCircle, FaGift } from "react-icons/fa";
import './ResgateCard.scss';

function formatarData(dataISO) {
    if (!dataISO) return "";
    return new Date(dataISO).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function ResgateCard({ nome, codigo, ehDoacao, dataReserva, dataRetirada, concluido = false, onVerCodigo }) {
    return (
        <div className={`resgate-card ${concluido ? "concluido" : ""}`}>
            <div className="resgate-info">
                <div className="resgate-icon">
                    {ehDoacao ? <FaGift /> : <FaCheckCircle />}
                </div>
                <div>
                    <h3>{nome}</h3>
                    <span className="resgate-tipo">{ehDoacao ? "Doação" : "Compra"}</span>
                    <p className="resgate-data">
                        {concluido
                            ? `Retirado em ${formatarData(dataRetirada)}`
                            : `Reservado em ${formatarData(dataReserva)}`}
                    </p>
                </div>
            </div>

            {!concluido && (
                <button className="btn-ver-codigo" onClick={onVerCodigo}>
                    <FaQrcode /> Ver código
                </button>
            )}

            {concluido && <span className="badge-concluido">Concluído</span>}
        </div>
    );
}

export default ResgateCard;