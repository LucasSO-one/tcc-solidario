import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, Settings, X } from "lucide-react";
import BotaoLogout from "../BotaoLogout/BotaoLogout.jsx";
import Logo from "../Logo/Logo.jsx";
import { NOME_TIPO } from "../../config/navegacao";
import Avatar from "../ui/Avatar.jsx";
import "./Sidebar.scss";

/**
 * Menu lateral. O comportamento por tamanho de tela é decidido pelo AppShell:
 * - desktop: expandido, com botão para recolher em trilho de ícones;
 * - tablet: trilho de ícones que expande sobre o conteúdo;
 * - celular: drawer que desliza da esquerda.
 */
function Sidebar({ id, ref, secoes, usuario, conta, rotaConfiguracoes, modo, recolhida, aberta, onAlternar, onFechar, onNavegar }) {
  const drawer = modo === "mobile";
  const overlay = modo !== "desktop" && aberta;
  const classes = ["sidebar", `sidebar--${modo}`, recolhida && "sidebar--recolhida", aberta && "sidebar--aberta"]
    .filter(Boolean).join(" ");

  return (
    <aside id={id} ref={ref} className={classes} aria-label="Menu principal"
      inert={drawer && !aberta ? true : undefined}
      {...(overlay ? { role: "dialog", "aria-modal": true } : {})}>
      <div className="sidebar__topo">
        <Logo variant={recolhida ? "symbol" : "full"} />
        {drawer ? (
          <button type="button" className="icon-btn" onClick={onFechar} aria-label="Fechar menu"><X /></button>
        ) : (
          <button type="button" className="icon-btn sidebar__alternar" onClick={onAlternar}
            aria-expanded={!recolhida} aria-controls={id}
            aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
            data-tooltip={recolhida ? "Expandir menu" : undefined}>
            {recolhida ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
        )}
      </div>

      <nav className="sidebar__nav">
        {secoes.map(secao => (
          <div className="sidebar__secao" key={secao.titulo}>
            <p className="sidebar__titulo-secao">{secao.titulo}</p>
            <ul>
              {secao.itens.map(({ to, icon: Icon, label, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} onClick={onNavegar} data-tooltip={recolhida ? label : undefined}
                    className={({ isActive }) => `sidebar__link${isActive ? " sidebar__link--ativo" : ""}`}>
                    <Icon aria-hidden="true" />
                    <span className="sidebar__label">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar__rodape">
        <div className="sidebar__conta" data-tooltip={recolhida ? conta?.nomeExibicao ?? usuario?.email : undefined}>
          <Avatar conta={conta} usuario={usuario} />
          <span className="sidebar__conta-texto">
            <span className="sidebar__conta-nome">{conta?.nomeExibicao ?? usuario?.email ?? "Conta"}</span>
            <span className="sidebar__conta-tipo">{NOME_TIPO[usuario?.tipo] ?? "Usuário"}</span>
          </span>
        </div>
        <NavLink to={rotaConfiguracoes} onClick={onNavegar} data-tooltip={recolhida ? "Configurações da conta" : undefined}
          className={({ isActive }) => `sidebar__link${isActive ? " sidebar__link--ativo" : ""}`}>
          <Settings aria-hidden="true" />
          <span className="sidebar__label">Configurações da conta</span>
        </NavLink>
        <BotaoLogout tooltip={recolhida} />
      </div>
    </aside>
  );
}

export default Sidebar;
