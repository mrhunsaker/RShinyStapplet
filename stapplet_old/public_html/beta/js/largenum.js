var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;
var pref = STAP.Preferences;

var llScatterplot = null;
var selfAttempts = 0;
var attHistX = [];
var attHistY = [];
var selfMade = 0;
var xAttr = "Shots attempted";
var yAttr = "Proportion made";
var FTProp = 0.8;

// returns data multiplier if it changed
function setYAttr()
{
    var old = yAttr;
    var prefType = pref.getPreference(pref.keys.proportion.display_type);
    yAttr = (prefType == "proportion" ? "Proportion" : "Percent") + " made";

    if (old == yAttr) return 1;
    else if (prefType == "proportion") return 0.01;
    else return 100;
}

function initializePage()
{
    selfAttempts = 0;
    selfMade = 0;
    attHistX = [];
    attHistY = [];
    xAttr = "Shots attempted";
    setYAttr();
    UI.recordInputState("txtFTPercent");
    UI.batchSetProperty(["spnSelfResult", "spnSelfStatistics"], "innerHTML", "");
    if (!llScatterplot)
        llScatterplot = new STAP.SVGGraph("divLLPlot", 600, 300);
    else
        llScatterplot.clearGraph();
    
    updateGraphDistributions();
}

function updateGraphDistributions()
{
    var prefType = pref.getPreference(pref.keys.proportion.display_type);
    var radius = (selfAttempts < 50 ? 4 : (selfAttempts < 100 ? 2 : 1));
    var xMax = Math.max(selfAttempts, 50);
    var yMax = (prefType == "proportion" ? 1 : 100);
    llScatterplot.scatterplot(util.arraysTo2DGraphData(attHistX, attHistY, xAttr, yAttr), xAttr, yAttr, null, radius, [0, xMax], [0, yMax]);
    llScatterplot.plotTopCurve(function(x) { return FTProp * yMax; });
}

function handlePrefChange()
{
    var mult = setYAttr();
    if (mult != 1)
        for (var i = 0; i < attHistY.length; i++)
            attHistY[i] *= mult;
    updateGraphDistributions();
}

function handleFTPercentChange()
{
    if (selfAttempts && !confirm("This will clear all current results. Do you wish to continue?"))
    {
        UI.resetInputState("txtFTPercent");
        return;
    }
    
    FTProp = parseFloat(UI.getProperty("txtFTPercent", "value"))/100;
    UI.recordInputState("txtFTPercent");
    initializePage();
}

function updateSelfStats(bSilent)
{
    if (selfAttempts)
    {
        var prefType = pref.getPreference(pref.keys.proportion.display_type);
        attHistX.push(selfAttempts);
        attHistY.push(prefType == "proportion" ? selfMade / selfAttempts : selfMade / selfAttempts * 100);
        if (!bSilent)
        {
            UI.setProperty("spnSelfStatistics", "innerHTML", selfMade + " out of " + selfAttempts + " (" + format.formatPercent(selfMade / selfAttempts) + ")");
            updateGraphDistributions();
        }
    }
    else
        UI.setProperty("spnSelfStatistics", "innerHTML", "--");
}

function selfAttempt(bSilent)
{
    selfAttempts++;
    var lp = document.getElementById("lpAnim");
    if (Math.random() < FTProp)
    {
        if (!bSilent)
        {
            lp.load("./json/basketball_make.json");
            lp.play();
            UI.setProperty("spnSelfResult", "innerHTML", "Made shot!");
        }
        selfMade++;
    }
    else
    {
        if (!bSilent)
        {
            lp.load("./json/basketball_miss.json");
            lp.play();
            UI.setProperty("spnSelfResult", "innerHTML", "Missed shot.");
        }
    }
    updateSelfStats(bSilent);
}

function batchAttempts()
{
    for (var i = 0; i < 49; i++)
        selfAttempt(true);
    selfAttempt();
}

STAP.UIHandlers.setOnLoad(initializePage);