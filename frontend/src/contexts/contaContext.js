import { createContext, useContext } from 'react';

// Conta do usuário logado (GET /api/conta), carregada pelo AppShell.
// { conta, setConta, erroConta, recarregarConta } — conta é null enquanto carrega ou se falhar.
export const ContaContext = createContext({ conta: null, setConta: () => {}, erroConta: false, recarregarConta: () => {} });

export const useConta = () => useContext(ContaContext);
