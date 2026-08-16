import { User, ShoppingBasket, Heart, ShieldCheck } from 'lucide-react';
import './Perfil.scss';

// --- Dados mockados — substituir por chamada à API quando disponível ---
const profile = {
  nome: 'Supermercado Bom Preço',
  tipo: 'Estabelecimento',
  email: 'contato@bompreco.com',
  telefone: '(11) 99999-0000',
  endereco: 'Rua das Flores, 123 — São Paulo',
  desde: 'Janeiro 2025',
};

const stats = [
  { id: 'vendidos', label: 'Vendidos', value: '186', icon: ShoppingBasket },
  { id: 'doados', label: 'Doados', value: '52', icon: Heart },
];

const activity = [
  { id: 1, data: '12/03/2026', descricao: 'Cadastrou 15 unidades de Banana Prata' },
  { id: 2, data: '12/03/2026', descricao: 'Cadastrou 15 unidades de Banana Prata' },
];

export default function MeuPerfil() {
  return (
    <div className="meu-perfil">
      <header className="meu-perfil__header">
        <h1 className="meu-perfil__title">Meu Perfil</h1>
        <p className="meu-perfil__subtitle">Gerencie suas informações e configurações</p>
      </header>

      <section className="profile-card">
        <div className="profile-card__identity">
          <span className="profile-card__avatar">
            <User size={22} />
          </span>
          <div>
            <p className="profile-card__name">{profile.nome}</p>
            <span className="profile-card__badge">{profile.tipo}</span>
          </div>
        </div>

        <div className="profile-card__grid">
          <div className="profile-card__field">
            <span className="profile-card__field-label">Email</span>
            <span className="profile-card__field-value">{profile.email}</span>
          </div>
          <div className="profile-card__field">
            <span className="profile-card__field-label">Telefone</span>
            <span className="profile-card__field-value">{profile.telefone}</span>
          </div>
          <div className="profile-card__field">
            <span className="profile-card__field-label">Endereço</span>
            <span className="profile-card__field-value">{profile.endereco}</span>
          </div>
          <div className="profile-card__field">
            <span className="profile-card__field-label">Desde</span>
            <span className="profile-card__field-value">{profile.desde}</span>
          </div>
        </div>
      </section>

      <section className="meu-perfil__stats">
        {stats.map(({ id, label, value, icon: Icon }) => (
          <article key={id} className="stat-card">
            <Icon size={20} className="stat-card__icon" />
            <div className="stat-card__text">
              <p className="stat-card__value">{value}</p>
              <p className="stat-card__label">{label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="activity-card">
        <h2 className="activity-card__title">Atividade Recente</h2>
        <ul className="activity-card__list">
          {activity.map((item) => (
            <li key={item.id} className="activity-card__item">
              <span className="activity-card__date">{item.data}</span>
              <span className="activity-card__desc">{item.descricao}</span>
            </li>
          ))}
          {activity.length === 0 && (
            <li className="activity-card__empty">Nenhuma atividade recente.</li>
          )}
        </ul>
      </section>

      <section className="security-card">
        <h2 className="security-card__title">
          <ShieldCheck size={16} />
          Segurança
        </h2>

        <div className="security-card__row">
          <span className="security-card__label">Alterar Senha</span>
          <button type="button" className="security-card__btn">
            Alterar
          </button>
        </div>

        <div className="security-card__row">
          <span className="security-card__label">Autenticação em dois fatores</span>
          <button type="button" className="security-card__btn">
            Configurar
          </button>
        </div>
      </section>
    </div>
  );
}