using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TccSolidario.Api.Migrations
{
    /// <inheritdoc />
    public partial class ControleReservasEValidade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transacoes_ProdutoId",
                table: "Transacoes");

            migrationBuilder.AddColumn<DateTime>(
                name: "DataExpiracao",
                table: "Transacoes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.AddColumn<string>(
                name: "StatusReserva",
                table: "Transacoes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "Versao",
                table: "Transacoes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "Versao",
                table: "Produtos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));


            // Preserva os prazos originais e encerra reservas antigas sem reativar códigos.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM "Transacoes" WHERE "CodigoRetirada" <> ''
                        GROUP BY "CodigoRetirada" HAVING COUNT(*) > 1) THEN
                        RAISE EXCEPTION 'Existem códigos de retirada duplicados. Corrija os registros antes de aplicar ControleReservasEValidade.';
                    END IF;
                END $$;
                UPDATE "Transacoes" SET "DataExpiracao" = "DataTransacao" + INTERVAL '2 hours';
                WITH ordenadas AS (
                    SELECT "Id", ROW_NUMBER() OVER (PARTITION BY "ProdutoId" ORDER BY "DataTransacao" DESC, "Id" DESC) AS posicao
                    FROM "Transacoes"
                )
                UPDATE "Transacoes" AS t SET "StatusReserva" = CASE
                    WHEN t."DataRetirada" IS NOT NULL THEN 'Concluida'
                    WHEN p."Status" IN ('Vendido', 'Doado') AND o.posicao = 1
                        AND NOT EXISTS (SELECT 1 FROM "Transacoes" registrada
                            WHERE registrada."ProdutoId" = p."Id" AND registrada."DataRetirada" IS NOT NULL) THEN 'Concluida'
                    WHEN p."Status" = 'Reservado' AND o.posicao = 1 AND t."CodigoRetirada" <> ''
                        AND t."DataExpiracao" > CURRENT_TIMESTAMP AND p."DataValidade" > CURRENT_TIMESTAMP THEN 'Ativa'
                    ELSE 'Expirada' END
                FROM "Produtos" AS p, ordenadas AS o
                WHERE t."ProdutoId" = p."Id" AND t."Id" = o."Id";

                UPDATE "Produtos" AS p SET "Status" = CASE
                    WHEN p."DataValidade" <= CURRENT_TIMESTAMP THEN 'Vencido'
                    WHEN p."DataValidade" <= CURRENT_TIMESTAMP + INTERVAL '24 hours' OR
                        (SELECT t."Tipo" FROM "Transacoes" t WHERE t."ProdutoId" = p."Id"
                         ORDER BY t."DataTransacao" DESC, t."Id" DESC LIMIT 1) = 'Doacao' THEN 'DisponivelParaDoacao'
                    WHEN p."PrecoVenda" IS NOT NULL THEN 'EmDesconto'
                    ELSE 'Disponivel' END
                WHERE p."Status" = 'Reservado' AND NOT EXISTS (
                    SELECT 1 FROM "Transacoes" t WHERE t."ProdutoId" = p."Id" AND t."StatusReserva" = 'Ativa');
                UPDATE "Produtos" SET "Status" = 'Vencido', "IsOferta" = FALSE, "AlertaPreDoacaoEnviado" = FALSE
                    WHERE "DataValidade" <= CURRENT_TIMESTAMP AND "Status" NOT IN ('Vendido', 'Doado');
                UPDATE "Produtos" SET "PrecoVenda" = 0, "IsOferta" = FALSE, "AlertaPreDoacaoEnviado" = FALSE
                    WHERE "Status" = 'DisponivelParaDoacao';
                UPDATE "Usuarios" SET "StatusAprovacao" = 2 WHERE "Tipo" = 'Consumidor' AND "StatusAprovacao" = 1;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Transacoes_CodigoRetirada",
                table: "Transacoes",
                column: "CodigoRetirada",
                unique: true,
                filter: "\"CodigoRetirada\" <> ''");

            migrationBuilder.CreateIndex(
                name: "IX_Transacoes_ProdutoId",
                table: "Transacoes",
                column: "ProdutoId",
                unique: true,
                filter: "\"StatusReserva\" = 'Ativa'");

            migrationBuilder.CreateIndex(
                name: "IX_Transacoes_StatusReserva_DataExpiracao",
                table: "Transacoes",
                columns: new[] { "StatusReserva", "DataExpiracao" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transacoes_CodigoRetirada",
                table: "Transacoes");

            migrationBuilder.DropIndex(
                name: "IX_Transacoes_ProdutoId",
                table: "Transacoes");

            migrationBuilder.DropIndex(
                name: "IX_Transacoes_StatusReserva_DataExpiracao",
                table: "Transacoes");

            migrationBuilder.DropColumn(
                name: "DataExpiracao",
                table: "Transacoes");

            migrationBuilder.DropColumn(
                name: "StatusReserva",
                table: "Transacoes");

            migrationBuilder.DropColumn(
                name: "Versao",
                table: "Transacoes");

            migrationBuilder.DropColumn(
                name: "Versao",
                table: "Produtos");

            migrationBuilder.CreateIndex(
                name: "IX_Transacoes_ProdutoId",
                table: "Transacoes",
                column: "ProdutoId");
        }
    }
}
