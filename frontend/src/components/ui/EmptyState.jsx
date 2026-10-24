import { Leaf } from 'lucide-react';

// Estado vazio: ícone, uma frase acolhedora e o próximo passo.
export default function EmptyState({ icon: Icone = Leaf, title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true"><Icone /></span>
      <h3 className="empty-state__title">{title}</h3>
      {children && <p className="empty-state__text">{children}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
