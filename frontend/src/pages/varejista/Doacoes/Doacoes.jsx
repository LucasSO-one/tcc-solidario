import { useEffect, useMemo, useState } from "react";
import {
    FaHeart,
    FaMapPin,
    FaClock,
    FaInfoCircle,
    FaBoxOpen,
    FaCheckCircle,
    FaHandHoldingHeart,
    FaSearch,
    FaLeaf,
} from "react-icons/fa";
import { listarDoacoes } from "../../../service/produtoService";
import "./Doacoes.scss";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatarDiasRestantes = (dias) => {
    if (dias == null) return "Validade indisponível";
    if (dias <= 0) return "Vence hoje";
    if (dias === 1) return "1 dia restante";
    return `${dias} dias restantes`;
};

const getStatusInfo = (status) => {
    switch (status) {
        case "Reservado":
            return { label: "Reservado", modifier: "reservado" };
        case "Doado":
        case "Vendido":
            return { label: "Doado", modifier: "doado" };
        default:
            return { label: "Disponível", modifier: "disponivel" };
    }
};

// ---------------------------------------------------------------------------
// Card de doação
// ---------------------------------------------------------------------------

const DoacaoCard = ({ item, onVerDetalhes }) => {
    const status = getStatusInfo(item.status);

    return (
        <article className={`doacao-card doacao-card--${status.modifier}`}>
            <div className="doacao-card__top">
                <div className="doacao-card__top-info">
                    <h3>{item.produto}</h3>
                    <span className="doacao-card__unidades">
                        {item.unidades} {item.unidades === 1 ? "unidade" : "unidades"}
                    </span>
                </div>

                <span className={`doacao-card__status doacao-card__status--${status.modifier}`}>
                    {status.modifier === "doado" && <FaCheckCircle />}
                    {status.label}
                </span>
            </div>

            <p className="doacao-card__estabelecimento">
                {item.estabelecimento}
            </p>

            <div className="doacao-card__meta">
                <span>
                    <FaMapPin />
                    {item.local}
                </span>
                <span className="doacao-card__meta-validade">
                    <FaClock />
                    {formatarDiasRestantes(item.diasRestantes)}
                </span>
            </div>

            <div className="doacao-card__notice">
                <FaInfoCircle />
                <span>
                    Este alimento pode ajudar pessoas em situação de
                    vulnerabilidade.
                </span>
            </div>

            <button
                type="button"
                className="doacao-card__btn"
                onClick={() => onVerDetalhes?.(item)}
            >
                <FaHandHoldingHeart />
                Ver detalhes
            </button>
        </article>
    );
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

const Doacoes = ({ doacoes: doacoesProp, onSolicitarRetirada }) => {
    const [doacoes, setDoacoes] = useState(doacoesProp ?? []);
    const [carregando, setCarregando] = useState(!doacoesProp);
    const [erro, setErro] = useState(null);
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState("todas"); // todas | disponiveis | reservadas

    // Se não vier prop, carrega da API
    useEffect(() => {
        if (doacoesProp) return;

        let ativo = true;

        async function carregar() {
            try {
                setCarregando(true);
                setErro(null);

                const data = await listarDoacoes({ apenasDoacoes: true });

                if (ativo) setDoacoes(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Erro ao carregar doações:", err);
                if (ativo) {
                    setErro("Não foi possível carregar as doações.");
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        carregar();
        return () => {
            ativo = false;
        };
    }, [doacoesProp]);

    // Filtro + busca
    const doacoesFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return doacoes.filter((d) => {
            const matchBusca =
                !termo ||
                d.produto?.toLowerCase().includes(termo) ||
                d.estabelecimento?.toLowerCase().includes(termo);

            const matchFiltro =
                filtro === "todas" ||
                (filtro === "disponiveis" && d.status !== "Doado" && d.status !== "Vendido") ||
                (filtro === "reservadas" && d.status === "Reservado") ||
                (filtro === "doadas" && (d.status === "Doado" || d.status === "Vendido"));

            return matchBusca && matchFiltro;
        });
    }, [doacoes, busca, filtro]);

    // Estatísticas rápidas
    const stats = useMemo(() => {
        const total = doacoes.length;
        const disponiveis = doacoes.filter(
            (d) => d.status !== "Doado" && d.status !== "Vendido"
        ).length;
        const doadas = doacoes.filter(
            (d) => d.status === "Doado" || d.status === "Vendido"
        ).length;

        return { total, disponiveis, doadas };
    }, [doacoes]);

    return (
        <div className="doacoes">
            {/* ---------------------------------------------------------- */}
            {/* Header                                                      */}
            {/* ---------------------------------------------------------- */}
            <header className="doacoes__header">
                <div className="doacoes__header-info">
                    <span className="doacoes__header-icon">
                        <FaHeart />
                    </span>

                    <div>
                        <h1>Doações disponíveis</h1>
                        <p className="subtitle">
                            Alimentos próximos do vencimento disponíveis
                            para ONGs e instituições.
                        </p>
                    </div>
                </div>

                <div className="doacoes__stats">
                    <div className="doacoes-stat">
                        <strong>{stats.total}</strong>
                        <span>Total</span>
                    </div>
                    <div className="doacoes-stat doacoes-stat--disponivel">
                        <strong>{stats.disponiveis}</strong>
                        <span>Disponíveis</span>
                    </div>
                    <div className="doacoes-stat doacoes-stat--doada">
                        <strong>{stats.doadas}</strong>
                        <span>Doadas</span>
                    </div>
                </div>
            </header>

            {/* ---------------------------------------------------------- */}
            {/* Busca                                                       */}
            {/* ---------------------------------------------------------- */}
            <div className="doacoes__busca">
                <FaSearch />
                <input
                    type="text"
                    placeholder="Buscar alimento ou estabelecimento..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Filtros                                                     */}
            {/* ---------------------------------------------------------- */}
            <div className="doacoes__filtros">
                {[
                    { id: "todas", label: "Todas" },
                    { id: "disponiveis", label: "Disponíveis" },
                    { id: "reservadas", label: "Reservadas" },
                    { id: "doadas", label: "Doadas" },
                ].map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        className={`doacoes__filtro ${
                            filtro === f.id ? "is-active" : ""
                        }`}
                        onClick={() => setFiltro(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Estados                                                     */}
            {/* ---------------------------------------------------------- */}
            {carregando && (
                <div className="doacoes__estado">
                    <span className="doacoes__spinner" />
                    <p>Carregando doações...</p>
                </div>
            )}

            {!carregando && erro && (
                <div className="doacoes__estado doacoes__estado--erro">
                    <p>{erro}</p>
                </div>
            )}

            {!carregando && !erro && doacoesFiltradas.length === 0 && (
                <div className="doacoes__vazio">
                    <FaBoxOpen />
                    <p>
                        Nenhuma doação encontrada
                        {busca ? ` para "${busca}"` : ""}.
                    </p>
                </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Grid                                                        */}
            {/* ---------------------------------------------------------- */}
            {!carregando && !erro && doacoesFiltradas.length > 0 && (
                <div className="doacoes-grid">
                    {doacoesFiltradas.map((item) => (
                        <DoacaoCard
                            key={item.id}
                            item={item}
                            onVerDetalhes={onSolicitarRetirada}
                        />
                    ))}
                </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Rodapé de impacto                                           */}
            {/* ---------------------------------------------------------- */}
            {!carregando && !erro && stats.doadas > 0 && (
                <div className="doacoes__impacto">
                    <FaLeaf />
                    <span>
                        Você já doou <strong>{stats.doadas}</strong>{" "}
                        {stats.doadas === 1 ? "item" : "itens"} e ajudou a
                        reduzir o desperdício alimentar. Continue assim!
                    </span>
                </div>
            )}
        </div>
    );
};

export default Doacoes;