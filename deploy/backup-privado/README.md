# Backup diário em repositório privado separado

Modelo preparado, ainda não ativado. Não copiar para o repositório público do aplicativo.
Sem canal adicional de alertas; confira o histórico das execuções no GitHub Actions.

1. Crie um repositório **privado** na sua conta GitHub. Convide apenas responsáveis pelo banco.
2. Copie a pasta `.github` deste diretório para a raiz desse repositório. Copie também
   `deploy/security/backup.ps1`, `backup-cifrado.ps1` e `supabase-ca.crt` do aplicativo, preservando esses caminhos.
3. Instale age pela distribuição oficial e gere uma identidade local:
   `age-keygen -o backup-identity.txt`. Guarde o arquivo privado fora do Git e outra cópia offline.
   A chave pública age1... pode ir à variável do repositório `BACKUP_AGE_RECIPIENT`.
   O runner não precisa e não deve receber a identidade privada.
4. Em Settings → Secrets and variables → Actions, configure os secrets
   `BACKUP_PGHOST`, `BACKUP_PGUSER`, `BACKUP_PGPASSWORD` usando a conexão do Session pooler.
   Não use o papel restrito de runtime: RLS pode impedir uma cópia completa.
   Use credencial de manutenção ou um papel exclusivo de backup com leitura integral,
   validado com pg_dump. Nunca conceda essa credencial ao frontend.
5. Confira o uso e orçamento da conta: GitHub Free inclui uma franquia compartilhada de
   execução e armazenamento. O modelo limita cada dump cifrado a 8 MiB e retém 14 dias
   (até aproximadamente 112 MiB para uma execução por dia; execuções manuais somam).
   Isso não reserva espaço nem impede cobranças por outros repositórios. Mantenha cobrança
   adicional desabilitada/orçamento de bloqueio conforme disponível na conta.
6. Execute Actions → Backup cifrado VittaFlow → Run workflow. Baixe o artefato e restaure em
   banco vazio isolado com `restore-cifrado.ps1`. Valide tabelas, contagens, migrations e login.
   Só considere o backup operacional após essa restauração. A listagem do catálogo,
   feita pelo job, não equivale a um teste completo de restauração.
7. O agendamento é diário às 06:23 UTC, aproximadamente 03:23 em Brasília. GitHub pode
   atrasar execuções agendadas; confira o histórico e mantenha outra cópia offline.
   Retenção: 14 dias; perda potencial: desde o último backup válido (meta de 24h,
   sem SLA). Se o banco ultrapassar o limite, revise armazenamento e orçamento.

Restaurar: instale PostgreSQL client compatível e age, configure PGHOST, PGPORT, PGUSER,
PGDATABASE, PGSSLMODE e PGPASSFILE para um banco **vazio de teste**, coloque age no PATH e rode:

```powershell
./deploy/security/restore-cifrado.ps1 -BackupFile 'C:/Backup/vittaflow.dump.age' -IdentityFile 'C:/Chaves/backup-identity.txt' -ConfirmDatabase 'nome_exato_do_banco_de_teste'
```

O checksum verifica integridade acidental; não substitui autenticação do armazenamento.
Guarde separadamente também a chave Security__EncryptionKey da aplicação e os códigos
de recuperação MFA. Sem a chave da aplicação, dados cifrados no dump podem ficar
irrecuperáveis. Este backup cobre o schema public; não inclui as imagens do Cloudinary,
configuração do Railway, papéis PostgreSQL, publicações/assinaturas de replicação, schemas internos do Supabase nem logs de provedor.

Referências oficiais: [custos do GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions),
[agendamentos](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
[age](https://github.com/FiloSottile/age).
