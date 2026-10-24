import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

// const toast = useToast(); toast.success('Salvo!'); toast.error('Algo deu errado.');
export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  return contexto;
}
