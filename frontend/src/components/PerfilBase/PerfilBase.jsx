import "./PerfilBase.css";
import { FaUserCircle, FaShieldAlt } from "react-icons/fa";

function PerfilBase({
  titulo = "Meu Perfil",
  subtitulo,
  nome,
  tipo,
  email,
  telefone,
  endereco,
  desde,
  estatisticas = [],
  atividades = [],
}) {
  return (
    <main className="perfil-base">
      <h1>{titulo}</h1>
      <p>{subtitulo}</p>

      <section className="perfil-card">
        <div className="perfil-topo">
          <FaUserCircle className="avatar" />

          <div>
            <h2>{nome}</h2>
            <span className="badge">{tipo}</span>
          </div>
        </div>

        <div className="dados-grid">
          <div><strong>E-mail</strong><p>{email}</p></div>
          <div><strong>Telefone</strong><p>{telefone}</p></div>
          <div><strong>Endereço</strong><p>{endereco}</p></div>
          <div><strong>Desde</strong><p>{desde}</p></div>
        </div>
      </section>

      <section className="stats-grid">
        {estatisticas.map((item, i) => (
          <div className="stat-card" key={i}>
            <h3>{item.valor}</h3>
            <p>{item.rotulo}</p>
          </div>
        ))}
      </section>

      <section className="atividade-card">
        <h2>Atividade Recente</h2>
        {atividades.map((a, i) => (
          <div className="atividade-item" key={i}>
            <span>{a.data}</span>
            <span>{a.descricao}</span>
          </div>
        ))}
      </section>

      <section className="seguranca-card">
        <h2>
          <FaShieldAlt /> Segurança
        </h2>

        <div className="seg-item">
          <span>Alterar senha</span>
          <button>Alterar</button>
        </div>

        <div className="seg-item">
          <span>Autenticação em dois fatores</span>
          <button>Configurar</button>
        </div>
      </section>
    </main>
  );
}

export default PerfilBase;