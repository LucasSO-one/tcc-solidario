import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TimerOff } from 'lucide-react';
import Modal from '../ui/Modal';
import { dataHora } from '../../utils/formatar';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import './CodigoRetiradaModal.scss';

export default function CodigoRetiradaModal({ reserva, onFechar }) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const limite = Math.min(new Date(reserva.dataExpiracao).getTime(), new Date(reserva.dataValidade).getTime());
  const ativa = reserva.status === 'Ativa' && limite > agora && reserva.codigoRetirada;
  return <Modal title={reserva.produtoNome} onClose={onFechar}
    footer={<Button variant="primary" onClick={onFechar} data-autofocus>Entendi</Button>}>
    {ativa ? <div className="codigo-retirada">
      <p>Apresente este código no estabelecimento. O varejista confere o código para confirmar a retirada.</p>
      <div className="codigo-retirada__qr"><QRCodeSVG value={reserva.codigoRetirada} size={200} /></div>
      <p className="codigo-retirada__codigo" aria-label={`Código ${reserva.codigoRetirada.split('').join(' ')}`}>{reserva.codigoRetirada}</p>
      <p className="codigo-retirada__prazo">Retire até <strong>{dataHora(limite)}</strong></p>
    </div> : <EmptyState icon={TimerOff} title="Reserva encerrada">
      Esta reserva não está mais disponível para retirada. Consulte seu histórico para ver a situação atual.
    </EmptyState>}
  </Modal>;
}
