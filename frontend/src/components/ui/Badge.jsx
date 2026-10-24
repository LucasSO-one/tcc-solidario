import {
  AlarmClock, Ban, CheckCircle2, CircleDashed, Clock, HandHeart, HeartHandshake,
  OctagonAlert, ShoppingBag, Tag, TimerOff,
} from 'lucide-react';

export default function Badge({ variant = 'neutral', icon: Icon, children, className = '' }) {
  return (
    <span className={`badge badge--${variant} ${className}`.trim()}>
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </span>
  );
}

// Situação do alimento e da reserva: cor + ícone + texto (acessível sem depender da cor).
const STATUS = {
  produto: {
    Disponivel: ['success', CheckCircle2, 'Disponível'],
    EmDesconto: ['success', Tag, 'Em oferta'],
    VenceEmBreve: ['warning', AlarmClock, 'Vence em breve'],
    DisponivelParaDoacao: ['success', HandHeart, 'Para doação'],
    Reservado: ['info', Clock, 'Reservado'],
    Vendido: ['neutral', ShoppingBag, 'Vendido'],
    Doado: ['highlight', HeartHandshake, 'Doado'],
    Vencido: ['danger', OctagonAlert, 'Vencido'],
  },
  reserva: {
    Ativa: ['info', Clock, 'Aguardando retirada'],
    Concluida: ['success', CheckCircle2, 'Retirada concluída'],
    Expirada: ['neutral', TimerOff, 'Expirada'],
    Cancelada: ['danger', Ban, 'Cancelada'],
  },
};

export function StatusBadge({ status, tipo = 'produto' }) {
  const [variant, icon, texto] = STATUS[tipo][status] ?? ['neutral', CircleDashed, status];
  return <Badge variant={variant} icon={icon}>{texto}</Badge>;
}
