# Conferência de permissões — 06/11/2026

O diagnóstico fornecido pelo responsável mostrou sete tabelas com RLS desativada e permissões diretas amplas para anon/authenticated/service_role. O histórico de migrations já tinha RLS, mas nenhuma política. O papel vittaflow_app não existia. O responsável confirmou que o runtime Railway ainda usa postgres no Session pooler.

A consulta conferir-permissoes.sql foi preparada somente para leitura. O script permissoes-supabase.sql foi corrigido para conceder CONNECT explicitamente e manter o histórico com RLS e política somente de SELECT para o app. Nenhuma conta, tabela ou registro de produção foi removido e nenhuma alteração de permissões de produção foi executada pelo agente.

Validação local: reproduzido histórico invisível mesmo com GRANT SELECT; confirmado que a política nova torna todas as migrations visíveis; RLS ativada em 12 tabelas; privilégios diretos de anon/authenticated/service_role removidos; app pode gravar auditoria, mas não pode criar tabela, truncar dados ou alterar histórico; reexecução do script aprovada. Seis cenários Playwright passaram usando vittaflow_app, incluindo inicialização Production com as migrations visíveis, login, MFA, alteração de conta/senha, revogação e imagem após reinício. Não foram usados serviços externos ou dados reais nesses testes.

O GitHub main foi conferido no commit 7b977d1, sincronizado com o checkout antes destes ajustes de SQL/documentação. O site https://vittaflow.up.railway.app retornou 200 em /health e /health/ready; o arquivo JavaScript publicado coincide com o build local com a correção de mensagens de cadastro. Isso não identifica por si só o SHA do backend ativo; os logs do deploy continuam sendo a referência para esse SHA.

Roteiro definido em 06/11/2026 e executado posteriormente pelo responsável: aplicar o script atualizado no Supabase enquanto o site usa postgres; habilitar LOGIN e definir senha exclusiva do app; testar conexão independente no Session pooler; só então trocar Username/Password no Railway e validar o site. As permissões entre consumidores, varejistas, ONGs e administradores continuam sendo verificadas pela API, pois o JWT da VittaFlow não é um JWT do Supabase Auth. Migrations futuras exigem revisão de privilégios padrão e novas tabelas/funções.


## Conclusão da troca — 09/11/2026

O responsável informou que o script de permissões terminou com sucesso, habilitou LOGIN e definiu a senha do papel no pgAdmin. A conexão independente com vittaflow_app no Session pooler mostrou o usuário efetivo correto e a migration de segurança. Em seguida, informou ter substituído Username/Password no Railway e validado login, criação de reserva e alteração da foto de perfil.

Após esses testes, o agente verificou publicamente /health e /health/ready no domínio vittaflow.up.railway.app: ambos retornaram HTTP 200 e status ok. O envio e a persistência das imagens no Cloudinary já haviam sido confirmados pelo responsável anteriormente. Não foram necessários novo código de aplicação, migração, exclusão de registros ou troca das chaves de cifragem nesta etapa. O arquivo do TCC permanece inalterado.

A evidência de alteração da conexão e execução das permissões de produção é o relato do responsável; o agente não acessou a credencial privada nem executou nova consulta de metadados de produção após a aplicação. Os testes locais de restrições e cenários de navegador estão descritos acima. Isso não constitui auditoria integral de segurança ou teste de carga.

Os ajustes locais de scripts e documentação desta revisão ainda não foram enviados em novo commit/push pelo agente. A conclusão funcional desta etapa não depende de publicar esses arquivos, pois o script foi aplicado diretamente no Supabase pelo responsável; eles devem ser preservados no repositório para futuras implantações.
