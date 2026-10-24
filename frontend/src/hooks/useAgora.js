import { useEffect, useState } from 'react';

// Horário atual que se atualiza sozinho (padrão: a cada minuto), para contagens como "vence em 3h".
export default function useAgora(intervaloMs = 60000) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(timer);
  }, [intervaloMs]);
  return agora;
}
