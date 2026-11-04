// localStorage pode lançar erro (modo privado, armazenamento bloqueado): nunca deixa a tela quebrar.
export function lerLocal(chave, padrao = null) {
  try {
    const valor = window.localStorage.getItem(chave);
    return valor ?? padrao;
  } catch {
    return padrao;
  }
}

export function gravarLocal(chave, valor) {
  try {
    window.localStorage.setItem(chave, valor);
  } catch {
    // preferência apenas visual: ignorar falha
  }
}
