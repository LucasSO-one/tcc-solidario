param(
    [Parameter(Mandatory)][string]$BackupFile,
    [Parameter(Mandatory)][string]$IdentityFile,
    [Parameter(Mandatory)][string]$ConfirmDatabase,
    [string]$AgeCommand = 'age'
)
$ErrorActionPreference = 'Stop'
$source = [IO.Path]::GetFullPath($BackupFile)
$expected = [IO.File]::ReadAllText($source+'.sha256').Trim()
if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -ne $expected) { throw 'Checksum do arquivo cifrado não confere.' }
Get-Command $AgeCommand -ErrorAction Stop | Out-Null
$temp = Join-Path ([IO.Path]::GetTempPath()) ('vittaflow-restore-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null
$dump = Join-Path $temp 'database.dump'
try {
    & $AgeCommand --decrypt --identity $IdentityFile --output $dump $source
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao decifrar. Verifique a chave privada sem compartilhá-la.' }
    [IO.File]::WriteAllText($dump+'.sha256', (Get-FileHash -LiteralPath $dump -Algorithm SHA256).Hash)
    & (Join-Path $PSScriptRoot 'restore.ps1') -BackupFile $dump -ConfirmDatabase $ConfirmDatabase
} finally {
    foreach ($file in @($dump, ($dump+'.sha256'))) {
        if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file -Force }
    }
    Remove-Item -LiteralPath $temp
}
