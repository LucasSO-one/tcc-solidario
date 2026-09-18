import { useEffect, useState } from "react";
import {
    FaClipboardList,
    FaQrcode,
    FaKeyboard,
    FaCheckCircle
} from "react-icons/fa";

import {
    listarMinhasReservas,
    validarRetirada
} from "../../../service/reserva";

import "./Solicitacoes.scss";

function Solicitacoes() {
    const [reservas, setReservas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);

    const [codigo, setCodigo] = useState("");
    const [reservaSelecionada, setReservaSelecionada] = useState(null);

    const [validando, setValidando] = useState(false);
    const [mensagem, setMensagem] = useState(null);

    useEffect(() => {
        carregarReservas();
    }, []);

    async function carregarReservas() {
        try {
            setCarregando(true);
            setErro(null);

            const data = await listarMinhasReservas();

            setReservas(data);
        } catch (err) {
            console.error("Erro ao carregar reservas:", err);

            setErro(
                err.response?.data?.message ||
                "Não foi possível carregar suas solicitações."
            );
        } finally {
            setCarregando(false);
        }
    }

    async function handleValidarCodigo(e) {
        e.preventDefault();

        if (!codigo.trim()) return;

        try {
            setValidando(true);
            setMensagem(null);

            const resultado = await validarRetirada(codigo.trim());

            setMensagem({
                tipo: "sucesso",
                texto: `${resultado.produto} retirado com sucesso!`
            });

            setCodigo("");
            setReservaSelecionada(null);

            await carregarReservas();

        } catch (err) {
            console.error("Erro ao validar retirada:", err);

            setMensagem({
                tipo: "erro",
                texto:
                    err.response?.data?.message ||
                    "Código inválido ou retirada não autorizada."
            });
        } finally {
            setValidando(false);
        }
    }

    const reservasPendentes = reservas.filter(
        (reserva) => reserva.status === "Reservado"
    );

    const reservasConcluidas = reservas.filter(
        (reserva) =>
            reserva.status === "Doado" ||
            reserva.status === "Vendido"
    );

    return (
        <main className="solicitacoes">

            <div className="titulo">
                <FaClipboardList className="titulo-icon" />
                <h1>Solicitações</h1>
            </div>

            <div className="subtitulo">
                <p>
                    Acompanhe suas reservas e confirme a retirada dos alimentos.
                </p>

                <span>
                    Total: {reservas.length}
                </span>
            </div>

            {carregando && (
                <p className="estado">
                    Carregando suas solicitações...
                </p>
            )}

            {!carregando && erro && (
                <p className="estado erro">
                    {erro}
                </p>
            )}

            {!carregando && !erro && (
                <>

                    {/* RESERVAS AGUARDANDO RETIRADA */}

                    <section className="solicitacoes-secao">

                        <div className="secao-header">
                            <div>
                                <h2>
                                    Aguardando retirada
                                </h2>

                                <p>
                                    Vá até o estabelecimento e apresente o
                                    código ou QR Code disponibilizado pelo varejista.
                                </p>
                            </div>

                            <span className="contador">
                                {reservasPendentes.length}
                            </span>
                        </div>

                        {reservasPendentes.length === 0 ? (
                            <div className="estado-vazio">
                                <FaClipboardList />

                                <p>
                                    Nenhuma reserva aguardando retirada.
                                </p>
                            </div>
                        ) : (

                            <div className="reservas-lista">

                                {reservasPendentes.map((reserva) => (

                                    <article
                                        key={reserva.id}
                                        className="reserva-card"
                                    >

                                        <div className="reserva-card__info">

                                            <h3>
                                                {reserva.produtoNome}
                                            </h3>

                                            <p>
                                                Reserva realizada em{" "}
                                                {new Date(
                                                    reserva.dataReserva
                                                ).toLocaleString("pt-BR", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </p>

                                            <span className="reserva-status">
                                                Aguardando retirada
                                            </span>

                                        </div>

                                        <div className="reserva-card__acoes">

                                            <button
                                                type="button"
                                                className="btn-qrcode"
                                                onClick={() =>
                                                    setReservaSelecionada(
                                                        reserva
                                                    )
                                                }
                                            >
                                                <FaQrcode />
                                                Confirmar retirada
                                            </button>

                                        </div>

                                    </article>

                                ))}

                            </div>
                        )}

                    </section>


                    {/* RETIRADA POR CÓDIGO */}

                    <section className="confirmacao-retirada">

                        <div className="secao-header">
                            <div>
                                <h2>
                                    Confirmar retirada
                                </h2>

                                <p>
                                    No estabelecimento, informe o código
                                    exibido pelo varejista.
                                </p>
                            </div>
                        </div>

                        <form
                            className="confirmacao-form"
                            onSubmit={handleValidarCodigo}
                        >

                            <div className="codigo-input">

                                <FaKeyboard />

                                <input
                                    type="text"
                                    placeholder="Ex.: A7X-99P"
                                    value={codigo}
                                    onChange={(e) =>
                                        setCodigo(
                                            e.target.value.toUpperCase()
                                        )
                                    }
                                />

                            </div>

                            <button
                                type="submit"
                                disabled={
                                    validando ||
                                    !codigo.trim()
                                }
                            >
                                <FaCheckCircle />

                                {validando
                                    ? "Confirmando..."
                                    : "Confirmar retirada"}
                            </button>

                        </form>

                        {mensagem && (
                            <div
                                className={`feedback ${mensagem.tipo}`}
                            >
                                {mensagem.texto}
                            </div>
                        )}

                    </section>


                    {/* CONCLUÍDAS */}

                    <section className="solicitacoes-secao">

                        <div className="secao-header">
                            <div>
                                <h2>
                                    Solicitações concluídas
                                </h2>

                                <p>
                                    Reservas que já foram retiradas.
                                </p>
                            </div>
                        </div>

                        {reservasConcluidas.length === 0 ? (
                            <div className="estado-vazio">
                                Nenhuma retirada concluída ainda.
                            </div>
                        ) : (

                            <div className="reservas-lista">

                                {reservasConcluidas.map((reserva) => (

                                    <article
                                        key={reserva.id}
                                        className="reserva-card reserva-card--concluida"
                                    >

                                        <div className="reserva-card__info">

                                            <h3>
                                                {reserva.produtoNome}
                                            </h3>

                                            <p>
                                                Retirada concluída em{" "}
                                                {reserva.dataRetirada
                                                    ? new Date(
                                                        reserva.dataRetirada
                                                    ).toLocaleString("pt-BR")
                                                    : "-"
                                                }
                                            </p>

                                        </div>

                                        <FaCheckCircle />

                                    </article>

                                ))}

                            </div>

                        )}

                    </section>

                </>
            )}


            {/* MODAL PARA CONFIRMAÇÃO */}

            {reservaSelecionada && (

                <div
                    className="modal-confirmacao"
                    onClick={() => setReservaSelecionada(null)}
                >

                    <div
                        className="modal-confirmacao__content"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <span className="eyebrow">
                            RETIRADA
                        </span>

                        <h2>
                            Confirmar retirada
                        </h2>

                        <p>
                            No estabelecimento, peça ao varejista
                            para mostrar o QR Code ou informar o código
                            desta reserva.
                        </p>

                        <div className="modal-produto">

                            <strong>
                                {reservaSelecionada.produtoNome}
                            </strong>

                            <span>
                                Reserva #{reservaSelecionada.id}
                            </span>

                        </div>

                        <div className="modal-acoes">

                            <button
                                type="button"
                                className="btn-qrcode"
                                onClick={() => {
                                    // Aqui vamos colocar o leitor de QR Code
                                    alert("Leitor de QR Code em breve");
                                }}
                            >
                                <FaQrcode />
                                Escanear QR Code
                            </button>

                            <span>
                                ou informe o código abaixo
                            </span>

                            <form onSubmit={handleValidarCodigo}>

                                <input
                                    type="text"
                                    placeholder="A7X-99P"
                                    value={codigo}
                                    onChange={(e) =>
                                        setCodigo(
                                            e.target.value.toUpperCase()
                                        )
                                    }
                                />

                                <button
                                    type="submit"
                                    disabled={
                                        validando ||
                                        !codigo.trim()
                                    }
                                >
                                    {validando
                                        ? "Confirmando..."
                                        : "Confirmar retirada"}
                                </button>

                            </form>

                        </div>

                    </div>

                </div>

            )}

        </main>
    );
}

export default Solicitacoes;