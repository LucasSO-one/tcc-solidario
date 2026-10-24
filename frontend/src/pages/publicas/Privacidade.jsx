import PaginaDocumento from './PaginaDocumento';

// Modelo de política para o projeto acadêmico, alinhado à LGPD (Lei 13.709/2018).
export default function Privacidade() {
  return (
    <PaginaDocumento titulo="Política de privacidade" atualizadoEm="outubro de 2026">
      <p>Esta política explica quais dados a VittaFlow coleta, para que eles são usados e quais são os seus direitos, de acordo com a Lei Geral de Proteção de Dados (LGPD).</p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> nome, e-mail, telefone e senha (guardada de forma criptografada, nunca em texto).</li>
        <li><strong>Consumidores:</strong> CPF, usado apenas para identificar a conta.</li>
        <li><strong>Varejistas e ONGs:</strong> CNPJ, razão social ou nome fantasia, endereço e horário de funcionamento.</li>
        <li><strong>Uso da plataforma:</strong> alimentos cadastrados, reservas, retiradas e fotos enviadas.</li>
      </ul>

      <h2>2. Para que usamos</h2>
      <ul>
        <li>Permitir reservas, doações e a confirmação de retiradas.</li>
        <li>Conferir a identidade de varejistas e ONGs antes de liberar o acesso.</li>
        <li>Gerar indicadores agregados de impacto (por exemplo, unidades de alimentos salvas).</li>
      </ul>

      <h2>3. Com quem compartilhamos</h2>
      <p>O nome do estabelecimento e seu endereço aparecem para quem reserva alimentos. O nome de quem reservou aparece para o estabelecimento no momento da retirada. Não vendemos dados pessoais a terceiros.</p>

      <h2>4. Seus direitos</h2>
      <p>Você pode consultar e corrigir seus dados a qualquer momento em <strong>Configurações da conta</strong>, e pode solicitar a exclusão da conta pelo suporte. Administradores veem o CPF de consumidores apenas de forma mascarada.</p>

      <h2>5. Segurança</h2>
      <p>O acesso é protegido por senha e por token de sessão com validade limitada. Fotos enviadas são verificadas antes de serem armazenadas.</p>
    </PaginaDocumento>
  );
}
