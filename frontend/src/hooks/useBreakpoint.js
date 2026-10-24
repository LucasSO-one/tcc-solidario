import { useSyncExternalStore } from 'react';

// Mesmos valores de $bp-tablet e $bp-desktop (styles/_tokens.scss)
const DESKTOP = '(min-width: 1200px)';
const TABLET = '(min-width: 768px)';

function atual() {
  if (window.matchMedia(DESKTOP).matches) return 'desktop';
  if (window.matchMedia(TABLET).matches) return 'tablet';
  return 'mobile';
}

function inscrever(callback) {
  const consultas = [DESKTOP, TABLET].map(q => window.matchMedia(q));
  consultas.forEach(c => c.addEventListener('change', callback));
  return () => consultas.forEach(c => c.removeEventListener('change', callback));
}

// 'mobile' (< 768px) | 'tablet' (768–1199px) | 'desktop' (≥ 1200px)
export default function useBreakpoint() {
  return useSyncExternalStore(inscrever, atual);
}
