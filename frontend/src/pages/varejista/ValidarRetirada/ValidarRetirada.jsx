import { useEffect, useState } from "react";
import { FaCheckCircle, FaQrcode, FaBoxOpen, FaEye } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import {
    validarRetirada,
    listarValidacoesRecentes,
    listarReservasPendentes
} from "../../../service/reserva";
import "./ValidarRetirada.scss";

function ValidacaoRetirada() {
    const [codigo, setCodigo] = useState("");
    const [mensagem, setMensagem] = useState(null);
    const [validando, setValidando] = useState(false);
    const [recentes, setRecentes] = useState([]);
    const [reservasPendentes, setReservasPendentes] = useState([]);
    const [reservaSelecionada, setReservaSelecionada] = useState(null);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        await Promise.all([
            carregarRecentes(),
            carregarReservasPendentes()
        ]);
    }

    async function carregarRecentes() {
        try {
            const data = await listarValidacoesRecentes();
            setRecentes(data);
        } catch (err) {
            console.error("Erro ao carregar validações recentes:", err);
        }
    }

    async function carregarReservasPendentes() {
        try {
            const data = await listarReservasPendentes();
            setReservasPendentes(data);
        } catch (err) {
            console.error("Erro ao carregar reservas pendentes:", err);
        }
    }

    async function handleValidar(e) {
        e.preventDefault();

        if (!codigo.trim()) return;

        setValidando(true);
        setMensagem(null);

        try {
            const resultado = await validarRetirada(codigo.trim());

            setMensagem({
                tipo: "sucesso",
                texto: `${resultado.produto} retirado com sucesso!`
            });

            setCodigo("");

            await carregarDados();
        } catch (err) {
            const texto =
                err.response?.data?.message ||
                "Não foi possível validar esse código.";

            setMensagem({
                tipo: "erro",
                texto
            });
        } finally {
            setValidando(false);
        }
    }

    return (
        <main className="validacao-retirada">

            <span className="eyebrow">RETIRADAS</span>

            <h1>Validação de retirada</h1>

            <p>
                Confirme a retirada e dê baixa no estoque com segurança.
            </p>

            {/* RESERVAS PENDENTES */}

            <section className="reservas-pendentes">

                <div className="section-header">
                    <div>
                        <h2>Reservas aguardando retirada</h2>

                        <p className="subtitulo">
                            Mostre o código ou QR Code da reserva para o responsável pela ONG.
                        </p>
                    </div>
                </div>

                <div className="lista-reservas">

                    {reservasPendentes.length === 0 && (
                        <p className="estado-vazio">
                            Nenhuma reserva aguardando retirada.
                        </p>
                    )}

                    {reservasPendentes.map((reserva) => (

                        <article
                            key={reserva.id}
                            className="card-reserva"
                        >

                            <div className="card-reserva__info">

                                <div className="item-icon">
                                    <FaBoxOpen />
                                </div>

                                <div>
                                    <h3>{reserva.produtoNome}</h3>

                                    <p>
                                        Reservado por{" "}
                                        <strong>{reserva.ongNome}</strong>
                                    </p>

                                    <span>
                                        {new Date(
                                            reserva.dataReserva
                                        ).toLocaleString("pt-BR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </span>
                                </div>

                            </div>

                            <button
                                type="button"
                                className="btn-qrcode"
                                onClick={() =>
                                    setReservaSelecionada(reserva)
                                }
                            >
                                <FaQrcode />
                                Mostrar QR Code
                            </button>

                        </article>

                    ))}

                </div>

            </section>

            {/* VALIDAÇÕES RECENTES */}

            <section className="validacoes-recentes">

                <h2>Validações recentes</h2>

                <p className="subtitulo">
                    Últimas retiradas concluídas neste estabelecimento
                </p>

                <div className="lista-recentes">

                    {recentes.length === 0 && (
                        <p className="estado-vazio">
                            Nenhuma retirada validada ainda.
                        </p>
                    )}

                    {recentes.map((r) => (

                        <div
                            key={r.id}
                            className="item-recente"
                        >

                            <div className="item-icon">
                                <FaBoxOpen />
                            </div>

                            <div>
                                <h3>{r.produtoNome}</h3>

                                <p>
                                    {new Date(
                                        r.dataRetirada
                                    ).toLocaleString("pt-BR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </p>
                            </div>

                        </div>

                    ))}

                </div>

            </section>

            {/* MODAL DO QR CODE */}

            {reservaSelecionada && (

                <div
                    className="modal-qrcode"
                    onClick={() => setReservaSelecionada(null)}
                >

                    <div
                        className="modal-qrcode__content"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <span className="eyebrow">
                            RETIRADA
                        </span>

                        <h2>
                            Código da reserva
                        </h2>

                        <p>
                            Mostre este QR Code para o responsável
                            pela ONG.
                        </p>

                        <div className="modal-qrcode__produto">
                            <strong>
                                {reservaSelecionada.produtoNome}
                            </strong>

                            <span>
                                ONG: {reservaSelecionada.ongNome}
                            </span>
                        </div>

                        <div className="modal-qrcode__qr">
                            <QRCodeSVG
                                value={
                                    reservaSelecionada.codigoRetirada
                                }
                                size={220}
                            />
                        </div>

                        <div className="modal-qrcode__codigo">
                            {reservaSelecionada.codigoRetirada}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setReservaSelecionada(null)
                            }
                        >
                            Fechar
                        </button>

                    </div>

                </div>

            )}

        </main>
    );
}

export default ValidacaoRetirada;