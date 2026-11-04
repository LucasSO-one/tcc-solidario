import { Link } from 'react-router-dom';
import PaginaDocumento from './PaginaDocumento';
import ContatoPrivacidade from './ContatoPrivacidade';

export default function Termos() {
  return <PaginaDocumento titulo="Termos de uso" atualizadoEm="3 de novembro de 2026">
    <p>A VittaFlow é uma plataforma desenvolvida em um projeto acadêmico para aproximar estabelecimentos, consumidores e organizações sociais na destinação de excedentes alimentares. A plataforma organiza anúncios, reservas e registros de retirada. Ela não realiza transporte, processamento de pagamentos ou avaliação sanitária dos alimentos.</p>
    <h2>1. Cadastro e acesso</h2>
    <p>Informe dados verdadeiros, mantenha seu cadastro atualizado e proteja sua senha e seus códigos de retirada. Varejistas e ONGs dependem de aprovação administrativa para operar. A aprovação permite o acesso às funcionalidades institucionais e não constitui certificação sanitária ou garantia sobre os alimentos.</p>
    <h2>2. Ofertas e vitrine</h2>
    <p>Ofertas reúne os lotes destacados pelos varejistas. O botão “Ver na vitrine” abre o alimento correspondente. Na Vitrine, o consumidor consulta o catálogo comercial, com ou sem desconto, e realiza a reserva. A indicação de destaque não significa, por si só, desconto. Preço, quantidade, estabelecimento e validade devem ser conferidos antes da reserva.</p>
    <h2>3. Validade, doação e reservas</h2>
    <ul>
      <li>Lotes comerciais livres e válidos ficam disponíveis para venda enquanto restarem mais de 24 horas para o vencimento. Com 24 horas ou menos, passam à doação para ONGs aprovadas, com preço zero. O varejista pode antecipar a doação.</li>
      <li>Na janela de mais de 24 e até 36 horas, a ONG pode consultar uma prévia logística. Essa prévia não permite reservar enquanto o lote permanecer comercial.</li>
      <li>Uma reserva bloqueia o lote inteiro por até duas horas, com encerramento antecipado se o alimento vencer. Reservas ativas mantêm a exclusividade quando o lote entra na janela de doação.</li>
      <li>Cada consumidor ou ONG pode manter até cinco reservas ativas. A reserva pode ser cancelada antes da retirada. Após expiração ou cancelamento, o lote ainda válido retorna ao fluxo aplicável à sua destinação e validade.</li>
      <li>A apresentação de um anúncio não garante disponibilidade até a conclusão da reserva. Produtos vencidos não podem ser reservados nem ter sua retirada confirmada.</li>
    </ul>
    <h2>4. Retirada e pagamento</h2>
    <p>A retirada ocorre presencialmente no estabelecimento, dentro do prazo da reserva. O receptor apresenta o código e o varejista responsável o valida para concluir a operação. Nas vendas, o pagamento é combinado e realizado diretamente com o varejista, fora da VittaFlow. A plataforma não cobra, guarda dados de cartão ou emite documento fiscal.</p>
    <h2>5. Responsabilidades</h2>
    <p>O varejista responde pela exatidão das informações, pela conservação e pelas condições sanitárias do alimento ofertado. Consumidores e ONGs devem conferir o lote e organizar sua coleta, transporte e conservação. A validade cadastrada e o registro de retirada não substituem a verificação das condições físicas do produto nem as obrigações legais de cada participante.</p>
    <p>É proibido publicar informações falsas, conteúdo ilícito ou imagens de terceiros sem autorização, usar credenciais de outra pessoa e fazer reservas com finalidade de prejudicar os demais participantes. Doações devem observar sua finalidade social e as normas aplicáveis.</p>
    <h2>6. Exclusão da conta</h2>
    <p>Em Configurações da conta, na seção Segurança, é possível solicitar a exclusão com a senha atual e a confirmação “EXCLUIR”. É necessário encerrar as reservas ativas relacionadas à conta. O último administrador aprovado não pode se excluir antes de haver outro administrador aprovado.</p>
    <p>A exclusão é definitiva para o cadastro: impede novos acessos, invalida o uso das sessões existentes e remove os dados de perfil do banco operacional. Os vínculos técnicos e os registros de reservas e retiradas são preservados com identificação de conta excluída. A <Link to="/privacidade">Política de privacidade</Link> detalha os limites desse tratamento.</p>
    <h2>7. Disponibilidade e alterações</h2>
    <p>Por se tratar de uma aplicação acadêmica em desenvolvimento, podem ocorrer falhas, manutenção e indisponibilidade. Consulte a data desta página para identificar a versão dos termos. Eventuais mudanças devem respeitar os direitos dos participantes; estes termos não afastam direitos previstos na legislação aplicável.</p>
    <h2>8. Contato</h2><ContatoPrivacidade />
  </PaginaDocumento>;
}
