import "./Solicitacoes.css"; //Importando o arquivo de estilo CSS para a página de solicitações

import { FaClipboardList } from "react-icons/fa";

import SolicitacaoCard from "../../../components/SolicitacaoCard/SolicitacaoCard";

import solicitacoes from "../../../data/solicitacoes";

function Solicitacoes(){

    return(

        <main className="solicitacoes">

            <div className="titulo">

                <FaClipboardList className="titulo-icon"/>

                <h1>Solicitações</h1>

            </div>

            <div className="subtitulo">

            <p>

                Acompanhe o status das solicitações realizadas.

            </p>

            <span>

                Total: {solicitacoes.length}

            </span>

            </div>

            <div className="filtros">

                <button className="ativo">Todas</button>

                <button>Pendentes</button>

                <button>Aceitas</button>

                <button>Recusadas</button>

            </div>

            {

                solicitacoes.map((solicitacao)=>(

                    <SolicitacaoCard

                        key={solicitacao.id}

                        produto={solicitacao.produto}

                        estabelecimento={solicitacao.estabelecimento}

                        quantidade={solicitacao.quantidade}

                        status={solicitacao.status}

                    />

                ))

            }

        </main>

    );

}

export default Solicitacoes;