param([Parameter(Mandatory)][string]$BackupFile,
      [Parameter(Mandatory)][string]$ConfirmDatabase)
$ErrorActionPreference = 'Stop'
if (-not $env:PGHOST -or -not $env:PGUSER -or -not $env:PGDATABASE -or $env:PGDATABASE -cne $ConfirmDatabase) {
    throw 'Configure PGHOST/PGUSER/PGDATABASE e confirme exatamente o nome do banco de destino.'
}
$source = (Resolve-Path -LiteralPath $BackupFile).Path
if (-not (Test-Path -LiteralPath ($source + '.sha256'))) { throw 'Arquivo SHA256 do backup ausente.' }
if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -cne ([IO.File]::ReadAllText($source + '.sha256').Trim())) { throw 'Checksum divergente.' }
$count = & psql -X -A -t -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S');"
if ($LASTEXITCODE -ne 0 -or [int]($count.Trim()) -ne 0) { throw 'Restauração permitida somente em banco vazio. Não há --clean nem exclusão automática.' }
# public já existe em bancos vazios: não recriar nem remover o schema do destino.
$catalog = & pg_restore --list $source
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível ler catálogo do backup.' }
$listFile = [IO.Path]::GetTempFileName()
try {
    [IO.File]::WriteAllLines($listFile, [string[]]($catalog | Where-Object { $_ -notmatch '^\d+; \d+ \d+ SCHEMA - public(?:\s|$)' }))
    & pg_restore --exit-on-error --single-transaction --no-owner --no-privileges --use-list=$listFile --dbname=$env:PGDATABASE $source
    if ($LASTEXITCODE -ne 0) { throw 'Restauração falhou; transação revertida.' }
} finally { Remove-Item -LiteralPath $listFile }

Write-Output 'Restauração concluída. Reaplique permissões/RLS, configure a mesma chave de cifragem e valide em ambiente isolado antes de liberar acesso.'
