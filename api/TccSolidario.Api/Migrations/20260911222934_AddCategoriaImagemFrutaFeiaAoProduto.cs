using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TccSolidario.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoriaImagemFrutaFeiaAoProduto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Categoria",
                table: "Produtos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "FrutaFeia",
                table: "Produtos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ImagemUrl",
                table: "Produtos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Categoria",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "FrutaFeia",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "ImagemUrl",
                table: "Produtos");
        }
    }
}
