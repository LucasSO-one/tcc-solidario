import { QRCodeSVG } from "qrcode.react";
import { FaTimes } from "react-icons/fa";
import './CodigoRetiradaModal.scss';

function CodigoRetiradaModal({ reserva, onFechar }) {
    return (
        <div className="modal-overlay" onClick={onFechar}>
            <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
                <button className="modal-fechar" onClick={onFechar}>
                    <FaTimes />
                </button>

                <h2>{reserva.produtoNome}</h2>
                <p>Mostre este código ou QR Code ao responsável do estabelecimento na hora da retirada.</p>

                <div className="qrcode-wrapper">
                    <QRCodeSVG value={reserva.codigoRetirada} size={200} />
                </div>

                <div className="codigo-texto">{reserva.codigoRetirada}</div>
            </div>
        </div>
    );
}

export default CodigoRetiradaModal;