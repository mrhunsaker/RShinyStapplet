#!/bin/zsh
# launch_shiny_app.zsh
# Quick entry script to launch the RShinyStapplet app from the command line (Zsh)

# Change to the directory containing this script, then to the app directory
SCRIPT_DIR="${0:A:h}"
cd "$SCRIPT_DIR/.." || exit 1

# Launch the Shiny app using Rscript
echo "Launching RShinyStapplet app..."
Rscript -e "shiny::runApp('RShinyStapplet', launch.browser=TRUE)"
