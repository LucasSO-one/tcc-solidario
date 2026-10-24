import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "../Sidebar/Sidebar";
import Logo from "../Logo/Logo";
import { NAVEGACAO } from "../../config/navegacao";
import useBreakpoint from "../../hooks/useBreakpoint";
import useFocusTrap from "../../hooks/useFocusTrap";
import { gravarLocal, lerLocal, lerUsuario } from "../../utils/armazenamento";
import { ContaContext } from "../../contexts/contaContext";
import { obterConta } from "../../service/conta";
import Avatar from "../ui/Avatar";
import Rodape from "../Rodape/Rodape";
import "./AppShell.scss";

const CHAVE_RECOLHIDA = "sidebar-recolhida";
const ID_MENU = "menu-principal";
const BASE_PERFIL = { Admin: "/dashboard/admin", Varejista: "/dashboard/varejista", ONG: "/dashboard/ong", Consumidor: "/dashboard/consumidor" };

// Estrutura comum às áreas logadas: menu lateral + cabeçalho no celular + conteúdo.
export default function AppShell({ perfil }) {
  const modo = useBreakpoint();
  const [usuario] = useState(lerUsuario);
  const [recolhidaDesktop, setRecolhidaDesktop] = useState(() => lerLocal(CHAVE_RECOLHIDA) === "true");
  const [aberta, setAberta] = useState(false); // tablet: expandida sobre o conteúdo | celular: drawer aberto
  const [conta, setConta] = useState(null);
  const [erroConta, setErroConta] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const sidebarRef = useRef(null);

  const overlay = modo !== "desktop" && aberta;
  const recolhida = modo === "desktop" ? recolhidaDesktop : modo === "tablet" && !aberta;
  const fechar = useCallback(() => setAberta(false), []);

  useFocusTrap(sidebarRef, overlay, fechar);

  // Nome de exibição e foto para o menu. Se falhar, o menu mostra o e-mail salvo no login.
  useEffect(() => {
    let ativo = true;
    obterConta().then(c => { if (ativo) { setConta(c); setErroConta(false); } })
      .catch(() => { if (ativo) setErroConta(true); });
    return () => { ativo = false; };
  }, [tentativa]);
  const recarregarConta = useCallback(() => setTentativa(t => t + 1), []);

  // Sem rolagem do conteúdo atrás do drawer no celular
  useEffect(() => {
    if (!(overlay && modo === "mobile")) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = anterior; };
  }, [overlay, modo]);

  function alternar() {
    if (modo !== "desktop") { setAberta(a => !a); return; }
    setRecolhidaDesktop(atual => {
      gravarLocal(CHAVE_RECOLHIDA, String(!atual));
      return !atual;
    });
  }

  const classes = ["app-shell", `app-shell--${modo}`, recolhida && "app-shell--recolhida"].filter(Boolean).join(" ");

  return (
    <ContaContext.Provider value={{ conta, setConta, erroConta, recarregarConta }}>
    <div className={classes}>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>

      {modo === "mobile" && (
        <header className="app-header">
          <button type="button" className="icon-btn" onClick={() => setAberta(true)}
            aria-label="Abrir menu" aria-expanded={aberta} aria-controls={ID_MENU}>
            <Menu />
          </button>
          <Logo variant="full" />
          <Avatar conta={conta} usuario={usuario} className="app-header__avatar" />
        </header>
      )}

      <Sidebar id={ID_MENU} ref={sidebarRef} secoes={NAVEGACAO[perfil] ?? []} usuario={usuario} conta={conta}
        rotaConfiguracoes={`${BASE_PERFIL[perfil]}/configuracoes`}
        modo={modo} recolhida={recolhida} aberta={aberta}
        onAlternar={alternar} onFechar={fechar} onNavegar={overlay ? fechar : undefined} />

      {overlay && <div className="app-shell__fundo" onClick={fechar} aria-hidden="true" />}

      <main id="conteudo" className="content" tabIndex={-1}>
        <Outlet />
        <Rodape />
      </main>
    </div>
    </ContaContext.Provider>
  );
}
