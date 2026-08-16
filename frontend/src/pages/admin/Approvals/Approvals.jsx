import { useState } from 'react';
import { Store, Check, X } from 'lucide-react';
import './Approvals.scss';

// --- Dados mockados — substituir por chamada à API quando disponível ---
const requests = [
  {
    id: 1,
    nome: 'Supermercado Bom Preço',
    tipo: 'Estabelecimento',
    email: 'contato@bompreco.com',
    documento: '12.345.678/0001-90',
    solicitadoEm: '23/03/2026',
    status: 'pendente',
  },
  {
    id: 2,
    nome: 'Supermercado Bom Preço',
    tipo: 'Estabelecimento',
    email: 'contato@bompreco.com',
    documento: '12.345.678/0001-90',
    solicitadoEm: '23/03/2026',
    status: 'pendente',
  },
];

const tabs = [
  { id: 'pendente', label: 'Pendentes' },
  { id: 'aprovado', label: 'Aprovados' },
  { id: 'recusado', label: 'Recusados' },
  { id: 'todos', label: 'Todos' },
];

export default function AprovacaoUsuarios() {
  const [activeTab, setActiveTab] = useState('pendente');

  const filtered =
    activeTab === 'todos' ? requests : requests.filter((r) => r.status === activeTab);

  return (
    <div className="aprovacao-usuarios">
      <header className="aprovacao-usuarios__header">
        <h1 className="aprovacao-usuarios__title">Aprovação de Usuários</h1>
        <p className="aprovacao-usuarios__subtitle">
          Gerencie as solicitações de cadastro na plataforma
        </p>
      </header>

      <nav className="aprovacao-usuarios__tabs" role="tablist" aria-label="Filtro de status">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`aprovacao-usuarios__tab${
              activeTab === tab.id ? ' aprovacao-usuarios__tab--active' : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <ul className="aprovacao-usuarios__list">
        {filtered.map((req) => (
          <li key={req.id} className="request-card">
            <div className="request-card__info">
              <span className="request-card__icon">
                <Store size={18} />
              </span>
              <div className="request-card__details">
                <div className="request-card__name-row">
                  <span className="request-card__name">{req.nome}</span>
                  <span className="request-card__badge">{req.tipo}</span>
                </div>
                <p className="request-card__email">{req.email}</p>
                <p className="request-card__meta">
                  Doc: {req.documento} · Solicitado em {req.solicitadoEm}
                </p>
              </div>
            </div>

            <div className="request-card__actions">
              <button type="button" className="request-card__btn request-card__btn--approve">
                <Check size={16} />
                Aprovar
              </button>
              <button type="button" className="request-card__btn request-card__btn--reject">
                <X size={16} />
                Recusar
              </button>
            </div>
          </li>
        ))}

        {filtered.length === 0 && (
          <li className="aprovacao-usuarios__empty">Nenhuma solicitação nesta categoria.</li>
        )}
      </ul>
    </div>
  );
}