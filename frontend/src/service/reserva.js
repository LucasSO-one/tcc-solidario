import api from "../config/api";

export async function reservarProduto(produtoId) {
    const { data } = await api.post("/reservas/reservar", { produtoId });
    return data; // { id, codigoRetirada, ehDoacao }
}

export async function listarReservasPendentes() {
    const { data } = await api.get("/reservas/reservas-pendentes");
    return data;
}

export async function listarMinhasReservas() {
    const { data } = await api.get("/reservas/minhas");
    console.log(data)
    return data;
}

export async function validarRetirada(codigo) {
    const { data } = await api.post("/reservas/validar", { codigo });
    return data;
}

export async function listarValidacoesRecentes() {
    const { data } = await api.get("/reservas/validacoes-recentes");
    return data;
}