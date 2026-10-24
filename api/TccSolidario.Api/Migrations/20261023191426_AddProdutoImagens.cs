using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TccSolidario.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProdutoImagens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProdutoImagens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProdutoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Url = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutoImagens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProdutoImagens_Produtos_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produtos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProdutoImagens_ProdutoId_Ordem",
                table: "ProdutoImagens",
                columns: new[] { "ProdutoId", "Ordem" },
                unique: true);

            // Alimentos cadastrados antes desta versão tinham uma única foto em ImagemUrl: vira a capa.
            migrationBuilder.Sql("""
                INSERT INTO "ProdutoImagens" ("Id", "ProdutoId", "Url", "Ordem")
                SELECT gen_random_uuid(), "Id", "ImagemUrl", 0 FROM "Produtos"
                WHERE "ImagemUrl" IS NOT NULL AND "ImagemUrl" <> '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProdutoImagens");
        }
    }
}
