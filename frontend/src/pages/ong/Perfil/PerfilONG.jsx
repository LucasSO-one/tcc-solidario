import PerfilBase from "../../../components/PerfilBase/PerfilBase";

export default function PerfilFornecedor() {
  return (
    <PerfilBase
      titulo="Meu Perfil"
      subtitulo="Gerencie suas informações e configurações"
      nome="Supermercado Bom Preço"
      tipo="Estabelecimento"
      email="contato@bompreco.com"
      telefone="(11) 99999-0000"
      endereco="Rua das Flores, 123 - São Paulo"
      desde="Janeiro 2026"
      estatisticas={[
        { valor: "186", rotulo: "Vendidos" },
        { valor: "52", rotulo: "Doados" },
      ]}
      atividades={[
        {
          data: "12/03/2026",
          descricao: "Cadastrou 15 unidades de Banana Prata",
        },
        {
          data: "12/03/2026",
          descricao: "Cadastrou 15 unidades de Banana Prata",
        },
      ]}
    />
  );
}