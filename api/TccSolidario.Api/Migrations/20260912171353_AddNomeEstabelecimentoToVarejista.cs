using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TccSolidario.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNomeEstabelecimentoToVarejista : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NomeEstabelecimento",
                table: "Usuarios",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NomeEstabelecimento",
                table: "Usuarios");
        }
    }
}
