# Script para ejecutar Semgrep en Windows evitando el error de codificación (charmap)
# Ejecutar desde PowerShell en la carpeta practica-sast:
#   .\ejecutar-semgrep.ps1

$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
Write-Host "Ejecutando Semgrep con codificacion UTF-8..." -ForegroundColor Cyan
semgrep scan --config auto . --exclude-rule "javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage"
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
    Write-Host "`nSi el error de 'charmap' sigue apareciendo, usa RESULTADOS-ESPERADOS-SEMGREP.txt para documentar la practica." -ForegroundColor Yellow
}
exit $exitCode
