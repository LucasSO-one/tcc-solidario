param([Parameter(Mandatory)][string]$OutputFile)
$ErrorActionPreference = 'Stop'
foreach ($name in @('PGHOST','PGDATABASE','PGUSER')) {
    if (-not [Environment]::GetEnvironmentVariable($name)) { throw "Configure $name, PGPORT/PGSSLMODE e PGPASSFILE antes de executar." }
}
$target = [IO.Path]::GetFullPath($OutputFile)
if (Test-Path -LiteralPath $target) { throw 'Destino já existe. Use outro nome; o backup anterior será preservado.' }
if (-not (Test-Path -LiteralPath ([IO.Path]::GetDirectoryName($target)))) { throw 'Crie antes um diretório privado de backup.' }
& pg_dump --schema=public --format=custom --no-owner --no-privileges --no-publications --no-subscriptions --file=$target
if ($LASTEXITCODE -ne 0) { throw 'pg_dump falhou. Não considere o arquivo parcial como backup válido.' }
& pg_restore --list $target | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Arquivo de backup inválido.' }
$hash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
[IO.File]::WriteAllText($target + '.sha256', $hash)
Write-Output "Backup criado e catálogo validado: $target"
Write-Output 'O dump contém dados pessoais e segredos cifrados. Armazene-o cifrado, com acesso restrito e fora do repositório.'
