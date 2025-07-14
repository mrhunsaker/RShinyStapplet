var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var scatterplot = null;

var currXData = null;
var currYData = null;
var currCorr = null;
var n = 25;
var expName = "x";
var respName = "y";

function initializePage()
{
	scatterplot = new STAP.SVGGraph("divScatterplot");
    UI.writeLinkColorOriginRules();
    restartActivity();
}

function restartActivity()
{
    scatterplot.clearGraph();
    UI.setProperty("txtCorrGuess", "value", "");
    UI.setStyleProperty("btnGo", "display", "inline");
    UI.setStyleProperty("btnAgain", "display", "none");
    UI.setProperty("spnResults", "innerHTML", "");
    UI.setProperty("txtCorrGuess", "disabled", false);
    
    currXData = [];
    currYData = [];
    var desCorr = jStat.uniform.sample(-1, 1);
    var scaleFactor = desCorr / Math.sqrt(1 - desCorr * desCorr);
    for (var i = 0; i < n; i++)
    {
        currXData.push(jStat.normal.sample(0, 5));
        currYData.push(scaleFactor * currXData[i] + jStat.normal.sample(0, 5));
    }
    currCorr = jStat.corrcoeff(currXData, currYData);
    scatterplot.scatterplot(util.arraysTo2DGraphData(currXData, currYData, expName, respName), expName, respName);
}

function revealAnswer()
{
    // FIX: validate

    UI.setStyleProperty("btnGo", "display", "none");
    UI.setStyleProperty("btnAgain", "display", "inline");
    UI.setProperty("txtCorrGuess", "disabled", true);

    var guess = parseFloat(UI.getProperty("txtCorrGuess", "value"));
    var error = guess - currCorr;
    
    UI.setProperty("spnResults", "innerHTML",
        "Actual correlation: r = " + format.formatNumber(currCorr) + "&nbsp;&nbsp; Error (estimated - actual) =  " + format.formatNumber(error)
    );
}

STAP.UIHandlers.setOnLoad(initializePage);