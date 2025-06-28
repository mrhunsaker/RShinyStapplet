@echo off
REM launch_shiny_app.cmd - Launch the RShinyStapplet Shiny app from the command line (Windows CMD)

REM Change directory to the app folder (edit path if needed)
cd /d "%~dp0..\"

REM Launch the Shiny app using Rscript
REM Assumes R is in your PATH and app.R is in the RShinyStapplet directory
Rscript -e "shiny::runApp('app.R', launch.browser=TRUE)"

REM Pause to keep the window open if there is an error
pause
