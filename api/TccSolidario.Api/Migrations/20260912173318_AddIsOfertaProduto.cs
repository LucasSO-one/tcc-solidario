using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TccSolidario.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIsOfertaProduto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsOferta",
                table: "Produtos",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsOferta",
                table: "Produtos");
        }
    }
}
