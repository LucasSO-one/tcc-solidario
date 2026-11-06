import { Link } from 'react-router-dom';
import PaginaDocumento from './PaginaDocumento';
import ContatoPrivacidade from './ContatoPrivacidade';

export default function Privacidade() {
  return <PaginaDocumento titulo="Política de privacidade" atualizadoEm="6 de novembro de 2026">
    <p>Esta política descreve o tratamento de dados na VittaFlow, aplicação desenvolvida em um projeto acadêmico de mediação de excedentes alimentares. O tratamento deve observar a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018). A equipe responsável pode ser contatada pelo canal informado ao final desta página.</p>
    <h2>1. Dados tratados</h2>
    <ul>
      <li>Cadastro e perfil: nome, e-mail, telefone, senha protegida por hash e foto de perfil, quando enviada.</li>
      <li>Consumidores: CPF e data de nascimento informados no cadastro.</li>
      <li>Varejistas e ONGs: CNPJ, identificação da organização e de seu responsável, endereço e informações institucionais fornecidas.</li>
      <li>Operações: alimentos publicados, imagens, preços, validade, reservas, códigos de retirada e registros de conclusão, cancelamento ou expiração.</li>
      <li>Dados técnicos: informações necessárias à autenticação e registros de funcionamento e segurança, que podem conter identificadores das operações.</li>
    </ul>
    <h2>2. Finalidades e fundamentos</h2>
    <p>Os dados são usados para cadastrar participantes, autenticar acessos, avaliar cadastros institucionais, apresentar os lotes e viabilizar reservas e retiradas. O tratamento necessário a essas operações relaciona-se à execução do serviço solicitado pelo participante. A conservação por obrigação legal, quando aplicável, e outros tratamentos devem respeitar suas finalidades e fundamentos legais específicos. A aceitação dos termos não representa consentimento genérico para qualquer uso dos dados.</p>
    <p>Preferências de notificações podem ser registradas na conta. Isso não significa que exista envio automático de e-mails ou mensagens push. Indicadores operacionais não comprovam, isoladamente, impacto social ou redução efetiva do desperdício.</p>
    <h2>3. Visibilidade e serviços utilizados</h2>
    <p>Os dados necessários à oferta e à retirada são exibidos aos participantes envolvidos: informações do estabelecimento, dos alimentos e identificação do receptor nas reservas. Administradores têm acesso às informações necessárias à gestão cadastral. A aplicação não utiliza o pagamento como fonte de dados: pagamentos são realizados diretamente no estabelecimento.</p>
    <p>As imagens podem ser armazenadas no Cloudinary, quando esse serviço estiver configurado, ou no armazenamento da própria aplicação. A consulta de CEP utiliza o ViaCEP; os dados enviados nessa consulta são os necessários à busca do endereço. Os segredos de autenticação em duas etapas são protegidos por criptografia no servidor. Serviços de infraestrutura podem tratar os dados necessários ao seu funcionamento, conforme a configuração da implantação e suas condições de privacidade.</p>
    <p>Imagens publicadas podem ser acessíveis por URL. Evite enviar documentos pessoais, informações sensíveis ou fotos de pessoas sem autorização nos anúncios. A VittaFlow não comercializa dados pessoais.</p>
    <h2>4. Armazenamento no navegador e segurança</h2>
    <p>A sessão usa cookie HttpOnly, enviado apenas por HTTPS em produção, com proteção contra solicitações forjadas. Tokens de acesso não ficam no armazenamento local; apenas preferências de interface podem ser mantidas ali. A aplicação não envia confirmação de cadastro nem links de recuperação de senha por e-mail. A troca de senha está disponível na conta autenticada, mediante a senha atual. Administradores utilizam autenticação em duas etapas, com segredo protegido e códigos de recuperação de uso único. As senhas são protegidas com hash BCrypt; não são armazenadas em texto simples nem com criptografia reversível. O JWT identifica a sessão e é distinto do código de retirada de uma reserva.</p>
    <p>O sistema aplica verificações de autenticação, permissões e arquivos enviados. Essas medidas reduzem riscos, mas não eliminam a possibilidade de incidentes. Não compartilhe senhas ou códigos de retirada; comunique suspeitas pelo canal de contato.</p>
    <h2>5. Seus direitos</h2>
    <p>Você pode consultar e corrigir os campos editáveis em Configurações da conta. Para acesso a outras informações, correção de campos institucionais, esclarecimento sobre compartilhamento, oposição ou eliminação de dados quando cabível, utilize o contato abaixo. A equipe pode solicitar informações proporcionais para confirmar a identidade do solicitante.</p>
    <h2>6. Exclusão e conservação de registros</h2>
    <p>A opção Excluir minha conta está em Configurações da conta, na seção Segurança. Ela exige a senha atual e confirmação expressa. Reservas ativas devem ser encerradas antes da exclusão para evitar interromper retiradas em andamento.</p>
    <p>Quando a exclusão é concluída, a conta perde acesso e os dados de perfil são removidos ou substituídos por uma identificação de conta excluída, incluindo nome, e-mail, telefone, CPF ou CNPJ, endereço e referência à foto. O sistema solicita a remoção da foto do armazenamento configurado; falhas desse serviço podem exigir tratamento pela equipe.</p>
    <p>Os registros de alimentos, reservas e retiradas e seus vínculos técnicos são preservados para manter a consistência do histórico. Esse procedimento não equivale à anonimização irreversível de todo o histórico: descrições, imagens de anúncios, registros técnicos e cópias de segurança podem conter informações fornecidas anteriormente. Solicitações adicionais de eliminação devem ser avaliadas pela equipe, observadas as hipóteses legais de conservação. A exclusão do cadastro não promete apagar imediatamente todas as cópias de dados.</p>
    <p>A conservação deve limitar-se ao necessário para as finalidades informadas e às hipóteses permitidas pela legislação. O artigo 16 da LGPD prevê situações específicas de conservação após o término do tratamento.</p>
    <h2>7. Atualizações e contato</h2>
    <p>A versão desta política é identificada pela data no início da página. Consulte também os <Link to="/termos">Termos de uso</Link>.</p>
    <ContatoPrivacidade />
  </PaginaDocumento>;
}
