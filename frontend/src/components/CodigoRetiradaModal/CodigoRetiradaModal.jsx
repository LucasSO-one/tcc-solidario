import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './CodigoRetiradaModal.scss';

export default function CodigoRetiradaModal({ reserva, onFechar }) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const limite = Math.min(new Date(reserva.dataExpiracao).getTime(), new Date(reserva.dataValidade).getTime());
  const ativa = reserva.status === 'Ativa' && limite > agora && reserva.codigoRetirada;
  return <div className="modal-overlay" onClick={onFechar}>
    <div className="modal-conteudo" role="dialog" aria-modal="true" aria-label="Código de retirada" onClick={e => e.stopPropagation()}>
      <button className="modal-fechar" aria-label="Fechar" onClick={onFechar}>×</button>
      <h2>{reserva.produtoNome}</h2>
      {ativa ? <>
        <p>Apresente este código ao varejista para confirmar a retirada.</p>
        <p>Retire até {new Date(limite).toLocaleString('pt-BR')}.</p>
        <div className="qrcode-wrapper"><QRCodeSVG value={reserva.codigoRetirada} size={200} /></div>
        <div className="codigo-texto">{reserva.codigoRetirada}</div>
      </> : <p>Esta reserva não está mais disponível para retirada. Atualize seu histórico.</p>}
    </div>
  </div>;
}
