var spinner = null;

function initializePage()
{
    spinner = new STAP.SVGGraph("divPlot");
    spinner.yesNoSpinner(0.8);
}

function spin()
{
    spinner.spin();
    STAP.UIHandlers.setProperty("spnResult", "innerHTML",
        (spinner.yes() ? "Made" : "Missed"));
}

STAP.UIHandlers.setOnLoad(initializePage);