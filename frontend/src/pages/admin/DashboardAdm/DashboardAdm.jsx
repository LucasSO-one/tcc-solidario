import { ShieldCheck, Package, Heart, Users, Store, Leaf, ArrowUpDown } from 'lucide-react';
import './DashboardAdm.scss';

// --- Dados mockados — substituir por chamadas à API quando disponíveis ---
const metrics = [
  { id: 'alimentos', label: 'Alimentos Cadastrados', value: '1.482', delta: '+124 esta semana', icon: Package },
  { id: 'doacoes', label: 'Doações Realizadas', value: '326', delta: '+42 este mês', icon: Heart },
  { id: 'usuarios', label: 'Usuários Totais', value: '2.847', delta: '+188 este mês', icon: Users },
  { id: 'varejistas', label: 'Varejistas Ativos', value: '134', delta: '+12 este mês', icon: Store },
];

const impact = [
  { id: 'kg', label: 'Alimentos salvos', value: '8.640 kg', icon: Leaf },
  { id: 'pessoas', label: 'Pessoas beneficiadas', value: '2.150', icon: Users },
  { id: 'estabelecimentos', label: 'Estabelecimentos', value: '47', icon: Store },
];

const activity = [
  { id: 1, tipo: 'Cadastro', descricao: 'Novo varejista solicitou cadastro: Mercado Verde', quando: 'há 12 min' },
];

export default function DashboardAdministrativo() {
  return (
    <div className="dashboard-admin">
      <header className="dashboard-admin__header">
        <div>
          <h1 className="dashboard-admin__title">Dashboard Administrativo</h1>
          <p className="dashboard-admin__subtitle">Visão geral da plataforma</p>
        </div>
        <button type="button" className="dashboard-admin__btn dashboard-admin__btn--ghost">
          <ShieldCheck size={16} />
          Ver Aprovações Pendentes
        </button>
      </header>

      <section className="dashboard-admin__banner" role="status">
        <div className="dashboard-admin__banner-text">
          <ShieldCheck size={16} className="dashboard-admin__banner-icon" />
          <div>
            <p className="dashboard-admin__banner-title">7 cadastros aguardando análise</p>
            <p className="dashboard-admin__banner-desc">
              Revise as solicitações de varejistas e ONGs para liberar o acesso à plataforma.
            </p>
          </div>
        </div>
        <button type="button" className="dashboard-admin__btn dashboard-admin__btn--primary">
          Analisar Agora
        </button>
      </section>

      <section className="dashboard-admin__metrics" aria-label="Métricas gerais">
        {metrics.map(({ id, label, value, delta, icon: Icon }) => (
          <article key={id} className="metric-card">
            <div className="metric-card__top">
              <span className="metric-card__label">{label}</span>
              <Icon size={18} className="metric-card__icon" />
            </div>
            <p className="metric-card__value">{value}</p>
            <p className="metric-card__delta">{delta}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-admin__section">
        <h2 className="dashboard-admin__section-title">
          <Leaf size={16} />
          Impacto da Plataforma
        </h2>
        <div className="dashboard-admin__impact">
          {impact.map(({ id, label, value, icon: Icon }) => (
            <article key={id} className="impact-card">
              <Icon size={20} className="impact-card__icon" />
              <div>
                <p className="impact-card__value">{value}</p>
                <p className="impact-card__label">{label}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-admin__activity">
        <h2 className="dashboard-admin__section-title">
          <ArrowUpDown size={16} />
          Atividade Recente da Plataforma
        </h2>

        <table className="activity-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th className="activity-table__when-col">Quando</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="activity-table__badge">{item.tipo}</span>
                </td>
                <td>{item.descricao}</td>
                <td className="activity-table__when">{item.quando}</td>
              </tr>
            ))}
            {activity.length === 0 && (
              <tr>
                <td colSpan={3} className="activity-table__empty">
                  Nenhuma atividade recente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}