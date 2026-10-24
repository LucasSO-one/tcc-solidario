import { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Clock, Search, SearchX, Users as IconeUsuarios } from 'lucide-react';
import { listarUsuarios } from '../../../service/admin';
import { dataCurta } from '../../../utils/formatar';
import { mascaraCnpj } from '../../../utils/mascaras';
import { mensagemErro } from '../../../utils/mensagemErro';
import Alert from '../../../components/ui/Alert';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Skeleton from '../../../components/ui/Skeleton';
import '../../../components/Fluxos/Fluxos.scss';

const ABAS = [
  { id: '', label: 'Todos' },
  { id: 'Varejista', label: 'Varejistas' },
  { id: 'ONG', label: 'ONGs' },
  { id: 'Consumidor', label: 'Consumidores' },
];
const STATUS = {
  Aprovado: ['success', CheckCircle2, 'Ativo'],
  Pendente: ['warning', Clock, 'Em análise'],
  Rejeitado: ['danger', Ban, 'Rejeitado'],
};

export default function UsuariosPlataforma() {
  const [usuarios, setUsuarios] = useState(null);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    listarUsuarios().then(setUsuarios).catch(e => setErro(mensagemErro(e, 'Não foi possível carregar os usuários.')));
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (usuarios ?? []).filter(u => (!aba || u.tipo === aba) &&
      (!termo || [u.nome, u.email, u.documento].some(v => v?.toLowerCase().includes(termo))));
  }, [usuarios, aba, busca]);

  return <div className="fluxo">
    <header><span className="eyebrow">Administração</span><h1>Usuários da plataforma</h1>
      <p>Todas as contas de varejistas, ONGs e consumidores. O CPF aparece mascarado para proteger os dados pessoais.</p></header>

    <div className="fluxo-filtros">
      <div className="abas-filtro" role="group" aria-label="Filtrar por tipo">
        {ABAS.map(a => <button key={a.id} type="button" className={`abas-filtro__aba${aba === a.id ? ' abas-filtro__aba--ativa' : ''}`}
          aria-pressed={aba === a.id} onClick={() => setAba(a.id)}>
          {a.label}{usuarios && <span className="abas-filtro__total">{usuarios.filter(u => !a.id || u.tipo === a.id).length}</span>}
        </button>)}
      </div>
      <div className="search-input">
        <Search className="search-input__icon" aria-hidden="true" />
        <input type="search" placeholder="Buscar por nome, e-mail ou documento" aria-label="Buscar usuário"
          value={busca} onChange={e => setBusca(e.target.value)} />
      </div>
    </div>

    {erro && <Alert variant="error">{erro}</Alert>}
    {!usuarios && !erro ? <div className="panel" aria-busy="true"><Skeleton variant="title" /><Skeleton /><Skeleton /><Skeleton /></div>
      : usuarios && !usuarios.length ? <EmptyState icon={IconeUsuarios} title="Nenhum usuário cadastrado ainda">Assim que alguém criar uma conta, ela aparece aqui.</EmptyState>
      : usuarios && !filtrados.length ? <EmptyState icon={SearchX} title="Nenhum usuário encontrado">Tente outro termo de busca ou mude o filtro.</EmptyState>
      : usuarios && <div className="table-wrapper">
        <table className="data-table data-table--responsiva">
          <thead><tr><th>Nome</th><th>Tipo</th><th>Documento</th><th>Situação</th><th>Cadastro</th></tr></thead>
          <tbody>{filtrados.map(u => {
            const [variante, icone, texto] = STATUS[u.status] ?? ['neutral', null, u.status];
            return <tr key={u.id}>
              <td data-label="Nome"><span className="data-table__strong">{u.nome}</span><span className="data-table__muted">{u.email}</span></td>
              <td data-label="Tipo">{u.tipo}</td>
              <td data-label="Documento">{/^\d{14}$/.test(u.documento) ? mascaraCnpj(u.documento) : u.documento || '–'}</td>
              <td data-label="Situação"><Badge variant={variante} icon={icone}>{texto}</Badge></td>
              <td data-label="Cadastro">{dataCurta(u.dataCriacao)}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
  </div>;
}
