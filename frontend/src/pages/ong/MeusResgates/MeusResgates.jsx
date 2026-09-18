import { useEffect, useMemo, useState } from "react";
import {
    FaHandHoldingHeart,
    FaBoxOpen,
    FaCheckCircle,
} from "react-icons/fa";
import ResgateCard from "../../consumidor/ResgateCard/ResgateCard";
import CodigoRetiradaModal from "../../../components/CodigoRetiradaModal/CodigoRetiradaModal";
import { listarMinhasReservas } from "../../../service/reserva";
import "./MeusResgate.scss";

// Status considerados "em andamento" (ainda pode retirar)
const STATUS_ATIVOS = ["Reservado", "Ativa"];

// Status considerados "finalizados" (já retirado)
const STATUS_CONCLUIDOS = ["Doado", "Vendido", "Concluida", "Concluído"];

function MeusResgates() {
    const [reservas, setReservas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const [reservaSelecionada, setReservaSelecionada] = useState(null);

    useEffect(() => {
        let ativo = true;

        async function carregar() {
            try {
                setCarregando(true);
                setErro(null);

                const data = await listarMinhasReservas();

                if (ativo) setReservas(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Erro ao carregar reservas:", err);
                if (ativo) {
                    setErro(
                        err.response?.data?.message ||
                            "Não foi possível carregar suas reservas."
                    );
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        carregar();
        return () => {
            ativo = false;
        };
    }, []);

    // useMemo evita refiltrar a cada render
    const { ativas, concluidas } = useMemo(() => {
        const ativas = reservas.filter((r) =>
            STATUS_ATIVOS.includes(r.status)
        );

        const concluidas = reservas.filter((r) =>
            STATUS_CONCLUIDOS.includes(r.status)
        );

        // Mais recentes primeiro
        const porDataDesc = (a, b) =>
            new Date(b.dataReserva) - new Date(a.dataReserva);

        return {
            ativas: [...ativas].sort(porDataDesc),
            concluidas: [...concluidas].sort(porDataDesc),
        };
    }, [reservas]);

    const total = reservas.length;
    const totalAtivas = ativas.length;
    const totalConcluidas = concluidas.length;

    return (
        <main className="meus-resgates">
            {/* ---------------------------------------------------------- */}
            {/* Cabeçalho                                                  */}
            {/* ---------------------------------------------------------- */}
            <header className="mr-header">
                <div className="mr-header__titulo">
                    <span className="mr-header__icon">
                        <FaHandHoldingHeart />
                    </span>

                    <div>
                        <h1>Meus Resgates</h1>
                        <p>
                            Acompanhe suas reservas ativas e o histórico
                            de retiradas realizadas.
                        </p>
                    </div>
                </div>

                <div className="mr-header__stats">
                    <div className="mr-stat">
                        <strong>{total}</strong>
                        <span>Total</span>
                    </div>

                    <div className="mr-stat mr-stat--ativa">
                        <strong>{totalAtivas}</strong>
                        <span>Ativas</span>
                    </div>

                    <div className="mr-stat mr-stat--concluida">
                        <strong>{totalConcluidas}</strong>
                        <span>Concluídas</span>
                    </div>
                </div>
            </header>

            {/* ---------------------------------------------------------- */}
            {/* Estado: carregando                                         */}
            {/* ---------------------------------------------------------- */}
            {carregando && (
                <div className="mr-estado">
                    <span className="mr-spinner" aria-hidden />
                    <p>Carregando suas reservas...</p>
                </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Estado: erro                                               */}
            {/* ---------------------------------------------------------- */}
            {!carregando && erro && (
                <div className="mr-estado mr-estado--erro">
                    <p>{erro}</p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Conteúdo                                                   */}
            {/* ---------------------------------------------------------- */}
            {!carregando && !erro && (
                <>
                    {/* ---------------- Reservas ativas ---------------- */}
                    <section className="mr-secao">
                        <div className="mr-secao__header">
                            <div>
                                <h2>Reservas ativas</h2>
                                <p>
                                    Apresente o código no estabelecimento
                                    para concluir a retirada.
                                </p>
                            </div>

                            <span className="mr-badge mr-badge--ativa">
                                {totalAtivas}
                            </span>
                        </div>

                        {ativas.length === 0 ? (
                            <div className="mr-vazio">
                                <FaBoxOpen />
                                <p>
                                    Você não tem nenhuma reserva ativa
                                    no momento.
                                </p>
                            </div>
                        ) : (
                            <div className="mr-lista">
                                {ativas.map((reserva) => (
                                    <ResgateCard
                                        key={reserva.id}
                                        nome={reserva.produtoNome}
                                        codigo={reserva.codigoRetirada}
                                        ehDoacao={
                                            reserva.tipo === "Doacao"
                                        }
                                        dataReserva={reserva.dataReserva}
                                        onVerCodigo={() =>
                                            setReservaSelecionada(reserva)
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ---------------- Concluídos ---------------- */}
                    <section className="mr-secao">
                        <div className="mr-secao__header">
                            <div>
                                <h2>Histórico de retiradas</h2>
                                <p>
                                    Reservas que já foram retiradas
                                    com sucesso.
                                </p>
                            </div>

                            <span className="mr-badge mr-badge--concluida">
                                {totalConcluidas}
                            </span>
                        </div>

                        {concluidas.length === 0 ? (
                            <div className="mr-vazio">
                                <FaCheckCircle />
                                <p>
                                    Nenhuma retirada concluída ainda.
                                </p>
                            </div>
                        ) : (
                            <div className="mr-lista">
                                {concluidas.map((reserva) => (
                                    <ResgateCard
                                        key={reserva.id}
                                        nome={reserva.produtoNome}
                                        codigo={reserva.codigoRetirada}
                                        ehDoacao={
                                            reserva.tipo === "Doacao"
                                        }
                                        dataReserva={reserva.dataReserva}
                                        dataRetirada={
                                            reserva.dataRetirada
                                        }
                                        concluido
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {reservaSelecionada && (
                <CodigoRetiradaModal
                    reserva={reservaSelecionada}
                    onFechar={() => setReservaSelecionada(null)}
                />
            )}
        </main>
    );
}

export default MeusResgates;