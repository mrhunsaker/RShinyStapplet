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
var selfHeads = 0;
var xAttr = "Number of flips";
var yAttr = "Proportion of heads";
var headsProb = 0.5;

function initializePage()
{
    selfAttempts = 0;
    selfHeads = 0;
    attHistX = [];
    attHistY = [];
    UI.recordInputState("txtHeadsProb");
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
    llScatterplot.scatterplot(util.arraysTo2DGraphData(attHistX, attHistY, xAttr, yAttr), xAttr, yAttr, null, radius, [0, xMax], [0, 1]);
    llScatterplot.plotTopCurve(function(x) { return headsProb; });
}

function handleHeadsProbChange()
{
    if (selfAttempts && !confirm("This will clear all current results. Do you wish to continue?"))
    {
        UI.resetInputState("txtHeadsProb");
        return;
    }
    
    headsProb = parseFloat(UI.getProperty("txtHeadsProb", "value"));
    UI.recordInputState("txtHeadsProb");
    initializePage();
}

function updateSelfStats(bSilent)
{
    if (selfAttempts)
    {
        var propHeads = selfHeads / selfAttempts;
        attHistX.push(selfAttempts);
        attHistY.push(propHeads);
        if (!bSilent)
        {
            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TD>&nbsp;</TD><TH>Count</TH><TH>Proportion</TH></TR>";
            tableHTML += "<TR><TD>Heads</TD><TD>" + selfHeads + "</TD><TD>" + format.formatNumber(propHeads) + "</TD></TR>";
            tableHTML += "<TR><TD>Tails</TD><TD>" + (selfAttempts - selfHeads) + "</TD><TD>" + format.formatNumber(1 - propHeads) + "</TD></TR>";
            tableHTML += "<TR><TD>Total</TD><TD>" + selfAttempts + "</TD><TD>&nbsp;</TD></TR></TABLE>";
          
            UI.setProperty("spnSelfStatistics", "innerHTML", tableHTML);
            updateGraphDistributions();
        }
    }
    else
        UI.setProperty("spnSelfStatistics", "innerHTML", "");
}

function selfAttempt(bSilent)
{
    selfAttempts++;
    if (Math.random() < headsProb)
        selfHeads++;
    updateSelfStats(bSilent);
}

function doFlips()
{
    var currHeads = selfHeads;
    var howMany = parseInt(UI.getProperty("txtNumFlips", "value"));
    for (var i = 0; i < (howMany - 1); i++)
        selfAttempt(true);
    selfAttempt();
    var heads = selfHeads - currHeads;
    var tails = howMany - heads;
    var resultHTML = (heads ? (howMany > 1 ? "Heads: " + heads : "Heads") : "");
    if (heads * tails)
        resultHTML += "&nbsp;&nbsp;&nbsp;";
    if (tails)
        resultHTML += (howMany > 1 ? "Tails: " + tails : "Tails");
    UI.setProperty("spnSelfResult", "innerHTML", resultHTML);
}

STAP.UIHandlers.setOnLoad(initializePage);