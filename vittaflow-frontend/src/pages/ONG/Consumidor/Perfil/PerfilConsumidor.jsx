import PerfilBase from "../../../components/PerfilBase/PerfilBase";

function PerfilConsumidor() {
  return (
    <PerfilBase
      titulo="Meu Perfil"
      subtitulo="Gerencie suas informações e configurações"
      nome="João da Silva"
      tipo="Consumidor"
      email="joao@email.com"
      telefone="(11) 99999-0000"
      endereco="Rua das Flores, 123 - São Paulo"
      desde="Janeiro 2026"
      estatisticas={[
        { valor: "18", rotulo: "Reservas realizadas" },
        { valor: "R$ 186", rotulo: "Economizados" },
      ]}
      atividades={[
        { data: "12/03/2026", descricao: "Reservou Combo Padaria" },
        { data: "10/03/2026", descricao: "Retirou Cesta de Hortifruti" },
      ]}
    />
  );
}

export default PerfilConsumidor;