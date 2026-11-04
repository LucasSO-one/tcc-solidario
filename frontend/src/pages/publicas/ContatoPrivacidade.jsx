const email = import.meta.env.VITE_CONTATO_PRIVACIDADE || 'lucas.silva2014outbook@gmail.com';
export default function ContatoPrivacidade() {
  return <p>Contato da equipe responsável pela VittaFlow para dúvidas, solicitações sobre dados pessoais e comunicação de problemas: <a href={`mailto:${email}`}>{email}</a>.</p>;
}
