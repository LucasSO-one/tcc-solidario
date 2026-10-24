import PaginaDocumento from './PaginaDocumento';

// Modelo de termos para o projeto acadêmico. Revisar com orientação jurídica antes de uso comercial.
export default function Termos() {
  return (
    <PaginaDocumento titulo="Termos de uso" atualizadoEm="outubro de 2026">
      <p>A VittaFlow conecta estabelecimentos que têm alimentos próximos do vencimento a consumidores e organizações sociais, para reduzir o desperdício. Ao criar uma conta, você concorda com as regras abaixo.</p>

      <h2>1. Quem pode usar</h2>
      <ul>
        <li><strong>Consumidores</strong> podem reservar alimentos à venda com desconto.</li>
        <li><strong>Varejistas</strong> e <strong>ONGs</strong> só operam após a aprovação do cadastro pela nossa equipe, que confere o CNPJ informado.</li>
      </ul>

      <h2>2. Como funcionam as reservas e doações</h2>
      <ul>
        <li>Alimentos com mais de 24 horas de validade ficam à venda na vitrine dos consumidores.</li>
        <li>Com 24 horas ou menos para vencer, o alimento passa a ser exclusivo para doação a ONGs aprovadas, sem custo.</li>
        <li>Cada reserva bloqueia o lote inteiro por até 2 horas e gera um código de retirada único. Ela é encerrada antes se o alimento vencer.</li>
        <li>Cada conta pode manter no máximo 5 reservas ativas ao mesmo tempo. Reservas podem ser canceladas a qualquer momento antes da retirada.</li>
        <li>A retirada só é confirmada pelo estabelecimento, com o código apresentado por quem reservou.</li>
      </ul>

      <h2>3. Responsabilidades do varejista</h2>
      <p>O varejista é responsável pelas informações publicadas (descrição, fotos, validade e preço) e por entregar apenas alimentos próprios para consumo, armazenados de acordo com as normas sanitárias. Alimentos vencidos são bloqueados automaticamente pela plataforma e não devem ser entregues.</p>

      <h2>4. Responsabilidades de quem retira</h2>
      <p>Consumidores e ONGs devem retirar os alimentos dentro do prazo da reserva e conferir as condições do produto no momento da retirada. O pagamento das compras é feito diretamente no estabelecimento.</p>

      <h2>5. Conduta</h2>
      <p>É proibido usar a plataforma para revenda de doações, cadastrar informações falsas ou reservar alimentos sem a intenção de retirá-los. Contas que descumprirem estas regras podem ser suspensas.</p>

      <h2>6. Alterações</h2>
      <p>Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas na própria plataforma.</p>
    </PaginaDocumento>
  );
}
