-- Somente os registros dos roteiros QA próprios de 04/11 e 09/11.
-- Executar com manutenção APÓS a migration SeparacaoDadosTeste e um backup.
-- Não apaga histórico, não troca senhas e não bloqueia usuários.
BEGIN;
CREATE TEMP TABLE qa_lotes (id uuid PRIMARY KEY) ON COMMIT DROP;
INSERT INTO qa_lotes VALUES
 ('ce1e5379-58a2-468d-bf9f-f3ccf2f1e7f2'), ('45e71028-8581-4f90-93d6-3bcbbe269a73'),
 ('fbb88319-f755-4829-bc39-55acc0541fd8'), ('d64dab2d-32cb-4e4c-8425-586192b05c5e');
UPDATE public."Produtos" SET "EhDadoTeste"=true WHERE "Id" IN (SELECT id FROM qa_lotes);
-- Donos destes quatro lotes são as lojas criadas pelos roteiros próprios.
UPDATE public."Usuarios" SET "EhDadoTeste"=true WHERE "Id" IN
 (SELECT "VarejistaId" FROM public."Produtos" WHERE "Id" IN (SELECT id FROM qa_lotes));
-- Os quatro cadastros sem lotes do primeiro roteiro de 09/11.
UPDATE public."Usuarios" SET "EhDadoTeste"=true
WHERE lower("Email") IN (
 'qa-20261109-3194fd-consumidor@example.invalid',
 'qa-20261109-3194fd-varejista@example.invalid',
 'qa-20261109-3194fd-outraloja@example.invalid',
 'qa-20261109-3194fd-ong@example.invalid')
AND "Nome" LIKE 'TESTE QA-20261109-3194fd %';
SELECT (SELECT count(*) FROM public."Produtos" WHERE "Id" IN (SELECT id FROM qa_lotes) AND "EhDadoTeste") AS lotes_qa_classificados,
 (SELECT count(*) FROM public."Usuarios" WHERE "EhDadoTeste") AS contas_qa_classificadas;
COMMIT;
