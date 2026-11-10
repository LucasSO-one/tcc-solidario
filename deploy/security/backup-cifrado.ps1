# Requer PowerShell 7, PostgreSQL client compatível com o servidor e age.
param(
    [Parameter(Mandatory)][string]$OutputFile,
    [Parameter(Mandatory)][string]$Recipient,
    [string]$AgeCommand = 'age',
    [long]$MaxBytes = 8388608
)
$ErrorActionPreference = 'Stop'
$target = [IO.Path]::GetFullPath($OutputFile)
if (-not $target.EndsWith('.age') -or (Test-Path -LiteralPath $target) -or (Test-Path -LiteralPath ($target+'.sha256'))) {
    throw 'Escolha um novo destino .age. Arquivos existentes serão preservados.'
}
if (-not (Test-Path -LiteralPath ([IO.Path]::GetDirectoryName($target)))) { throw 'Crie antes o diretório privado de destino.' }
if ($Recipient -notmatch '^age1[0-9a-z]+$') { throw 'Informe a chave pública age1...; a chave privada nunca é usada no backup.' }
if ($MaxBytes -lt 1) { throw 'MaxBytes deve ser positivo.' }
Get-Command $AgeCommand -ErrorAction Stop | Out-Null
$temp = Join-Path ([IO.Path]::GetTempPath()) ('vittaflow-backup-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null
$dump = Join-Path $temp 'database.dump'
$partial = $target + '.partial'
if (Test-Path -LiteralPath $partial) { throw 'Arquivo parcial já existe. Revise-o antes de tentar novamente.' }
try {
    & (Join-Path $PSScriptRoot 'backup.ps1') -OutputFile $dump
    & $AgeCommand --encrypt --recipient $Recipient --output $partial $dump
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao cifrar o backup.' }
    $size = (Get-Item -LiteralPath $partial).Length
    if ($size -lt 1 -or $size -gt $MaxBytes) { throw 'Backup excede o limite de armazenamento configurado. Nenhum artefato será publicado.' }
    Move-Item -LiteralPath $partial -Destination $target
    [IO.File]::WriteAllText($target+'.sha256', (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash)
    Write-Output "Backup cifrado validado para armazenamento: $size bytes."
} finally {
    foreach ($file in @($dump, ($dump+'.sha256'), $partial)) {
        if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file -Force }
    }
    Remove-Item -LiteralPath $temp
}
