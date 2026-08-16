import { useMemo, useState } from 'react';
import { Users, Search } from 'lucide-react';
import './Users.scss';

// --- Dados mockados — substituir por chamada à API quando disponível ---
const users = [
  {
    id: 1,
    nome: 'Supermercado Bom Preço',
    tipo: 'Varejista',
    documento: '12.345.678/0001-90',
    email: 'contato@bompreco.com',
    status: 'Ativo',
    cadastro: '14/01/2026',
  },
  {
    id: 2,
    nome: 'Supermercado Bom Preço',
    tipo: 'Varejista',
    documento: '12.345.678/0001-90',
    email: 'contato@bompreco.com',
    status: 'Ativo',
    cadastro: '14/01/2026',
  },
];

const tabs = [
  { id: 'todas', label: 'Todas' },
  { id: 'Varejista', label: 'Varejistas' },
  { id: 'ONG', label: 'ONGs' },
  { id: 'Consumidor', label: 'Consumidores' },
];

export default function UsuariosPlataforma() {
  const [activeTab, setActiveTab] = useState('todas');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return users
      .filter((u) => activeTab === 'todas' || u.tipo === activeTab)
      .filter((u) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return (
          u.nome.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.documento.toLowerCase().includes(term)
        );
      });
  }, [activeTab, search]);

  return (
    <div className="usuarios-plataforma">
      <header className="usuarios-plataforma__header">
        <h1 className="usuarios-plataforma__title">Usuários da Plataforma</h1>
        <p className="usuarios-plataforma__subtitle">
          Gerencie todos os usuários cadastrados no sistema
        </p>
      </header>

      <section className="usuarios-plataforma__panel">
        <div className="usuarios-plataforma__toolbar">
          <span className="usuarios-plataforma__count">
            <Users size={16} />
            {users.length} usuários
          </span>

          <div className="usuarios-plataforma__toolbar-right">
            <nav className="usuarios-plataforma__tabs" role="tablist" aria-label="Filtro de tipo">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`usuarios-plataforma__tab${
                    activeTab === tab.id ? ' usuarios-plataforma__tab--active' : ''
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="usuarios-plataforma__search">
              <Search size={16} className="usuarios-plataforma__search-icon" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou documento"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="usuarios-plataforma__table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Email</th>
                <th>Status</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="users-table__name">{u.nome}</td>
                  <td>
                    <span className="users-table__badge users-table__badge--type">{u.tipo}</span>
                  </td>
                  <td className="users-table__muted">{u.documento}</td>
                  <td>
                    <a href={`mailto:${u.email}`} className="users-table__link">
                      {u.email}
                    </a>
                  </td>
                  <td>
                    <span className="users-table__badge users-table__badge--status">
                      {u.status}
                    </span>
                  </td>
                  <td className="users-table__muted">{u.cadastro}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="users-table__empty">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}