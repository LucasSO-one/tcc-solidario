using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TccSolidario.Api.Migrations
{
    /// <inheritdoc />
    public partial class ContaPerfilNotificacoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "HorarioFuncionamento",
                table: "Usuarios",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CapacidadeRecebimento",
                table: "Usuarios",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FotoUrl",
                table: "Usuarios",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotificarDoacoesConcluidas",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotificarNovasSolicitacoes",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotificarVencimentos",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoEstabelecimento",
                table: "Usuarios",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CapacidadeRecebimento",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "FotoUrl",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "NotificarDoacoesConcluidas",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "NotificarNovasSolicitacoes",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "NotificarVencimentos",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "TipoEstabelecimento",
                table: "Usuarios");

            migrationBuilder.AlterColumn<string>(
                name: "HorarioFuncionamento",
                table: "Usuarios",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(120)",
                oldMaxLength: 120,
                oldNullable: true);
        }
    }
}
