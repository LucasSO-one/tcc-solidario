import { useCallback, useState } from 'react';

// Estado de formulário com detecção de alterações ("sujo") e erros por campo.
export default function useFormulario(inicial) {
  const [original, setOriginal] = useState(inicial);
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState({});

  const alterar = useCallback((campo, valor) => {
    setValores(atual => ({ ...atual, [campo]: valor }));
    setErros(atual => (atual[campo] ? { ...atual, [campo]: undefined } : atual));
  }, []);

  // Após salvar (ou ao receber dados novos do servidor), o estado salvo vira a nova referência
  const redefinir = useCallback(novo => { setOriginal(novo); setValores(novo); setErros({}); }, []);

  const sujo = JSON.stringify(valores) !== JSON.stringify(original);
  return { valores, alterar, erros, setErros, sujo, redefinir, descartar: () => redefinir(original) };
}
