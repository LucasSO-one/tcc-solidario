# Certificado raiz do Supabase

`supabase-root.crt` é uma CA pública, sem chave privada ou credenciais. Sua inclusão no Git é intencional.

- Origem HTTPS: https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt
- Emissor/subject: Supabase Root 2021 CA, Supabase Inc.
- Validade: até 26 de abril de 2031, 10:56:53 UTC.
- SHA-256 do DER: `807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`.
- Obtido e verificado em 4 de novembro de 2026.

O Docker copia este arquivo para `/app/certs/supabase-root.crt` e define `PGSSLROOTCERT`, reconhecido pelo Npgsql. A conexão deve manter `SSL Mode=VerifyFull`. Não se usa callback que aceite qualquer certificado.

Verificação efetuada: negociação PostgreSQL TLS 1.3 com `aws-1-us-east-1.pooler.supabase.com:5432`, validação da cadeia contra esta CA e verificação do hostname. Nenhum usuário, senha, consulta ou comando de escrita foi enviado. Esse teste verifica TLS; não comprova autenticação PostgreSQL nem existência das tabelas.

Em uma futura rotação de CA, obtenha a nova raiz em Supabase > Database Settings > SSL Configuration, confira a procedência e a validade, substitua o arquivo, atualize a impressão digital e publique uma nova imagem. Baixar a CA apresentada por uma conexão não verificada não é um modo confiável de estabelecer sua identidade.

Referências: [Supabase SSL](https://supabase.com/docs/guides/platform/ssl-enforcement), [Npgsql TLS](https://www.npgsql.org/doc/security.html).
