# launch_shiny_app.ps1
# PowerShell script to launch the R Shiny app in the current directory

# Find the app.R file in the current directory or subdirectory
$appPath = Join-Path $PSScriptRoot "..\app.R"
$appPath = Resolve-Path $appPath

if (-Not (Test-Path $appPath)) {
    Write-Host "Could not find app.R. Please run this script from within the RShinyStapplet directory."
    exit 1
}

# Check if Rscript is available
$rscript = Get-Command Rscript -ErrorAction SilentlyContinue
if (-not $rscript) {
    Write-Host "Rscript is not installed or not in your PATH. Please install R and ensure Rscript is available."
    exit 1
}

# Launch the Shiny app
Write-Host "Launching Shiny app from $appPath ..."
Rscript -e "shiny::runApp('$(Split-Path -Parent $appPath)', launch.browser=TRUE)"
