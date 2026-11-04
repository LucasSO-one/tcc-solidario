using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TccSolidario.Api.Migrations
{
    /// <inheritdoc />
    public partial class SegurancaContasSessoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Interrompe a migração sem mesclar/excluir contas ou divulgar seus e-mails.
            migrationBuilder.Sql("""
                LOCK TABLE "Usuarios" IN SHARE ROW EXCLUSIVE MODE;
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM "Usuarios" GROUP BY lower(btrim("Email")) HAVING count(*) > 1) THEN
                        RAISE EXCEPTION 'Existem e-mails duplicados após normalização. Execute deploy/security/preflight.sql e resolva os cadastros antes de migrar.';
                    END IF;
                    IF EXISTS (SELECT 1 FROM "Usuarios" WHERE "Email" IS NULL OR length(btrim("Email")) NOT BETWEEN 3 AND 254) THEN
                        RAISE EXCEPTION 'Existem e-mails vazios ou maiores que 254 caracteres. Corrija os registros antes de migrar.';
                    END IF;
                END $$;
                """);

            migrationBuilder.AddColumn<string>(
                name: "CodigosRecuperacaoMfa",
                table: "Usuarios",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<bool>(
                name: "EmailConfirmado",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailNormalizado",
                table: "Usuarios",
                type: "character varying(254)",
                maxLength: 254,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "MfaAtivo",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SegredoMfaProtegido",
                table: "Usuarios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "UltimoPassoMfa",
                table: "Usuarios",
                type: "bigint",
                nullable: false,
                defaultValue: -1L);

            migrationBuilder.AddColumn<Guid>(
                name: "VersaoSeguranca",
                table: "Usuarios",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.CreateTable(
                name: "ChavesProtecao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    XmlProtegido = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChavesProtecao", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailsPendentes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    Cancelado = table.Column<bool>(type: "boolean", nullable: false),
                    MensagemProtegida = table.Column<string>(type: "text", nullable: false),
                    CriadoEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiraEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProximaTentativaUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EmProcessamentoAteUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EnviadoEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Tentativas = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailsPendentes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailsPendentes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventosAuditoria",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    EntidadeId = table.Column<Guid>(type: "uuid", nullable: true),
                    Acao = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Sucesso = table.Column<bool>(type: "boolean", nullable: false),
                    EmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventosAuditoria", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LimitesAutenticacao",
                columns: table => new
                {
                    Chave = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    InicioUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Tentativas = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LimitesAutenticacao", x => x.Chave);
                });

            migrationBuilder.CreateTable(
                name: "SessoesAutenticacao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersaoUsuario = table.Column<Guid>(type: "uuid", nullable: false),
                    CriadaEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiraEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevogadaEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessoesAutenticacao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessoesAutenticacao_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TokensSeguranca",
                columns: table => new
                {
                    Hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    UsuarioId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersaoUsuario = table.Column<Guid>(type: "uuid", nullable: false),
                    Finalidade = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ExpiraEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConsumidoEmUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Falhas = table.Column<int>(type: "integer", nullable: false),
                    SegredoProtegido = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokensSeguranca", x => x.Hash);
                    table.ForeignKey(
                        name: "FK_TokensSeguranca_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql("""
                UPDATE "Usuarios" SET "EmailNormalizado" = lower(btrim("Email"));
                CREATE OR REPLACE FUNCTION public.vittaflow_normalizar_email() RETURNS trigger LANGUAGE plpgsql AS $$
                BEGIN NEW."EmailNormalizado" := lower(btrim(NEW."Email")); RETURN NEW; END $$;
                CREATE TRIGGER vittaflow_email_normalizado BEFORE INSERT OR UPDATE OF "Email" ON "Usuarios"
                FOR EACH ROW EXECUTE FUNCTION public.vittaflow_normalizar_email();
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_EmailNormalizado",
                table: "Usuarios",
                column: "EmailNormalizado",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmailsPendentes_EnviadoEmUtc_ProximaTentativaUtc",
                table: "EmailsPendentes",
                columns: new[] { "EnviadoEmUtc", "ProximaTentativaUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_EmailsPendentes_UsuarioId",
                table: "EmailsPendentes",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_EventosAuditoria_EmUtc",
                table: "EventosAuditoria",
                column: "EmUtc");

            migrationBuilder.CreateIndex(
                name: "IX_SessoesAutenticacao_UsuarioId_ExpiraEmUtc",
                table: "SessoesAutenticacao",
                columns: new[] { "UsuarioId", "ExpiraEmUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_TokensSeguranca_UsuarioId_Finalidade",
                table: "TokensSeguranca",
                columns: new[] { "UsuarioId", "Finalidade" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TRIGGER IF EXISTS vittaflow_email_normalizado ON "Usuarios";
                DROP FUNCTION IF EXISTS public.vittaflow_normalizar_email();
                """);

            migrationBuilder.DropTable(
                name: "ChavesProtecao");

            migrationBuilder.DropTable(
                name: "EmailsPendentes");

            migrationBuilder.DropTable(
                name: "EventosAuditoria");

            migrationBuilder.DropTable(
                name: "LimitesAutenticacao");

            migrationBuilder.DropTable(
                name: "SessoesAutenticacao");

            migrationBuilder.DropTable(
                name: "TokensSeguranca");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_EmailNormalizado",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "CodigosRecuperacaoMfa",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "EmailConfirmado",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "EmailNormalizado",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "MfaAtivo",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "SegredoMfaProtegido",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "UltimoPassoMfa",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "VersaoSeguranca",
                table: "Usuarios");
        }
    }
}
