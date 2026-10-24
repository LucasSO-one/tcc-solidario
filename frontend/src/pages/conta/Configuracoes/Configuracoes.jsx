import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { Bell, Building2, ChevronDown, Lock, UserRound } from 'lucide-react';
import { useConta } from '../../../contexts/contaContext';
import useBreakpoint from '../../../hooks/useBreakpoint';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Skeleton from '../../../components/ui/Skeleton';
import SecaoPerfil from './SecaoPerfil';
import SecaoOrganizacao from './SecaoOrganizacao';
import SecaoSeguranca from './SecaoSeguranca';
import SecaoNotificacoes from './SecaoNotificacoes';
import './Configuracoes.scss';

const SECOES = [
  { id: 'perfil', rotulo: 'Perfil', icone: UserRound, Componente: SecaoPerfil },
  { id: 'organizacao', rotulo: 'Dados da organização', icone: Building2, Componente: SecaoOrganizacao, perfis: ['Varejista', 'ONG'] },
  { id: 'seguranca', rotulo: 'Segurança', icone: Lock, Componente: SecaoSeguranca },
  { id: 'notificacoes', rotulo: 'Notificações', icone: Bell, Componente: SecaoNotificacoes, perfis: ['Varejista', 'ONG', 'Consumidor'] },
];

/**
 * Configurações da conta: abas laterais no tablet/desktop, acordeão no celular.
 * Todas as seções ficam montadas (só escondidas) para não perder o que foi digitado ao trocar de aba.
 * Sair da página com alterações não salvas pede confirmação.
 */
export default function Configuracoes() {
  const { conta, setConta, erroConta, recarregarConta } = useConta();
  const modo = useBreakpoint();
  const [ativa, setAtiva] = useState('perfil');
  const [sujas, setSujas] = useState({});
  const abasRef = useRef([]);

  const secoes = SECOES.filter(s => !s.perfis || s.perfis.includes(conta?.tipo));
  const algumaSuja = Object.values(sujas).some(Boolean);

  // Callbacks estáveis por seção (evitam loop no useEffect das seções)
  const onSujo = useMemo(() => Object.fromEntries(SECOES.map(s =>
    [s.id, valor => setSujas(atual => (atual[s.id] === valor ? atual : { ...atual, [s.id]: valor }))])), []);

  const blocker = useBlocker(useCallback(({ currentLocation, nextLocation }) =>
    algumaSuja && currentLocation.pathname !== nextLocation.pathname && nextLocation.pathname !== '/login', [algumaSuja]));

  useEffect(() => {
    if (!algumaSuja) return;
    const avisar = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [algumaSuja]);

  function aoTeclarAba(e, indice) {
    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const proxima = (indice + delta + secoes.length) % secoes.length;
    setAtiva(secoes[proxima].id);
    abasRef.current[proxima]?.focus();
  }

  if (!conta) {
    return <div className="configuracoes">
      <Cabecalho />
      {erroConta
        ? <Alert variant="error">Não foi possível carregar sua conta. <Button size="sm" variant="secondary" onClick={recarregarConta}>Tentar novamente</Button></Alert>
        : <div className="panel" aria-busy="true"><Skeleton variant="title" /><Skeleton width="70%" /><Skeleton width="50%" /></div>}
    </div>;
  }

  const acordeao = modo === 'mobile';

  return <div className="configuracoes">
    <Cabecalho />
    <div className={`configuracoes__corpo${acordeao ? ' configuracoes__corpo--acordeao' : ''}`}>
      {!acordeao && <div className="configuracoes__abas" role="tablist" aria-orientation="vertical" aria-label="Seções das configurações">
        {secoes.map(({ id, rotulo, icone: Icone }, i) => (
          <button key={id} ref={el => { abasRef.current[i] = el; }} type="button" role="tab" id={`aba-${id}`}
            aria-selected={ativa === id} aria-controls={`painel-${id}`} tabIndex={ativa === id ? 0 : -1}
            className={`configuracoes__aba${ativa === id ? ' configuracoes__aba--ativa' : ''}`}
            onClick={() => setAtiva(id)} onKeyDown={e => aoTeclarAba(e, i)}>
            <Icone aria-hidden="true" /><span>{rotulo}</span>
            {sujas[id] && <span className="configuracoes__pendente" title="Alterações não salvas"><span className="sr-only">(alterações não salvas)</span></span>}
          </button>
        ))}
      </div>}

      <div className="configuracoes__paineis">
        {secoes.map(({ id, rotulo, icone: Icone, Componente }) => {
          const aberta = ativa === id;
          return <section key={id} className="configuracoes__item">
            {acordeao && <h2 className="configuracoes__acordeao-titulo">
              <button type="button" aria-expanded={aberta} aria-controls={`painel-${id}`} id={`aba-${id}`}
                onClick={() => setAtiva(aberta ? null : id)}>
                <Icone aria-hidden="true" /><span>{rotulo}</span>
                {sujas[id] && <span className="configuracoes__pendente"><span className="sr-only">(alterações não salvas)</span></span>}
                <ChevronDown className="configuracoes__chevron" aria-hidden="true" />
              </button>
            </h2>}
            <div id={`painel-${id}`} className="configuracoes__painel panel" hidden={!aberta}
              {...(acordeao ? {} : { role: 'tabpanel', 'aria-labelledby': `aba-${id}` })}>
              <Componente conta={conta} setConta={setConta} onSujo={onSujo[id]} />
            </div>
          </section>;
        })}
      </div>
    </div>

    {blocker.state === 'blocked' && <Modal title="Sair sem salvar?" onClose={() => blocker.reset()} footer={<>
      <Button variant="ghost" onClick={() => blocker.reset()} data-autofocus>Continuar editando</Button>
      <Button variant="danger" onClick={() => blocker.proceed()}>Sair sem salvar</Button>
    </>}>
      <p>Você tem alterações que ainda não foram salvas. Se sair agora, elas serão perdidas.</p>
    </Modal>}
  </div>;
}

function Cabecalho() {
  return <header className="page-header">
    <div className="page-header__text">
      <span className="eyebrow">Conta</span>
      <h1 className="page-header__title">Configurações da conta</h1>
      <p className="page-header__subtitle">Mantenha seus dados atualizados para que as doações cheguem ao lugar certo.</p>
    </div>
  </header>;
}
