#!/bin/bash
# launch_shiny_app.sh
# Launch the RShinyStapplet Shiny app from the command line (Bash)

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/.."

# Default port (change if needed)
PORT=3838

echo "Launching RShinyStapplet app from $APP_DIR on http://localhost:$PORT ..."
Rscript -e "shiny::runApp('$APP_DIR', port=$PORT, launch.browser=TRUE)"
