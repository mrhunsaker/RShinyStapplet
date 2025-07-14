var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var graph = null;
var selfAttempts = 0;
var selfMade = 0;
var caption = "Proportion of made shots";

var variableNames = [];
var groupNames = [];
var rawData = [];

var activityDone = false;

function initializePage()
{
    UI.batchSetStyleProperty(["txtGraphDataCSV", "divActivityResults", "divResults"], "display", "none");
    UI.setProperty("spnSummaryStatistics", "innerHTML", "");
    if (!graph)
        graph = new STAP.SVGGraph("divPlot", 600, 400);
    else
        graph.clearGraph();
    initializeActivity();
    UI.writeLinkColorOriginRules();
};

function initializeActivity()
{
    UI.setProperty("spnSelfResult", "innerHTML", "");
    activityDone = false;
    selfAttempts = 0;
    selfMade = 0;
    updateSelfStats();
    UI.setStyleProperty("divActivityResults","display","none");
    UI.setStyleProperty("divActivity","display","block");
};

function updateSelfStats()
{
    if (selfAttempts)
        UI.setProperty("spnSelfStatistics", "innerHTML", selfMade + " out of " + selfAttempts + " (<EM>p&#770;</EM> = " + format.formatNumber(selfMade / selfAttempts) + ")");
    else
        UI.setProperty("spnSelfStatistics", "innerHTML", "--");
}

function selfAttempt()
{
    selfAttempts++;
    UI.setStyleProperty("divLLPlot","display","block");
    var lp = document.getElementById("lpAnim");
    if (Math.random() < 0.8)
    {
        lp.load("./json/generic_basketball_make.json");
        lp.play();
        UI.setProperty("spnSelfResult", "innerHTML", "Made shot!");
        selfMade++;
    }
    else
    {
        lp.load("./json/generic_basketball_miss.json");
        lp.play();
        UI.setProperty("spnSelfResult", "innerHTML", "Missed shot.");
    }
    updateSelfStats();
    if (selfAttempts == 50)
    {
        UI.setProperty("spnClassMade","innerHTML",selfMade);
        UI.setStyleProperty("divActivity","display","none");
        UI.batchSetStyleProperty(["divResults", "divActivityResults"],"display","block");
        activityDone = true;
        recordClassAttempt(selfMade);
        UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString(caption));
    }
}

function classAttempt()
{
    recordClassAttempt(silentSample());
}

function recordClassAttempt(amt)
{
    UI.setProperty("spnClassMade", "innerHTML", "" + selfMade);
    UI.setProperty("spnClassPercent", "innerHTML", "" + format.formatNumber(selfMade/50));
    if (!rawData[0]) rawData.push([]);
    rawData[0].push(amt/50);
    UI.setStyleProperty("divActivityResults","display","block");
    updateSummaryStatistics();
    updateGraphDistributions();
}

function silentSample()
{
    var sampleMade = 0;
    for (var i = 0; i < 50; i++)
        if (util.randomIntFromInterval(1, 100) < 81) sampleMade++;
    return sampleMade;
}

function updateSummaryStatistics()
{
    if (!rawData[0] || rawData[0].length === 0) return;

    var stat1 = stat.getOneVariableStatistics(rawData[0]);
    
    // Render a table programmatically
    var tableHTML = "<TABLE><TR>";
    tableHTML += "<TH>n</TH><TH>mean</TH><TH>SD</TH><TH>min</TH><TH>Q<sub>1</sub></TH><TH>med</TH><TH>Q<sub>3</sub></TH><TH>max</TH></TR><TR>"
    tableHTML += "<TD>" + stat1.n + "</TD><TD>" + format.formatNumber(stat1.mean) + "</TD><TD>" +
        + format.formatNumber(stat1.Sx) + "</TD><TD>"
        + format.formatNumber(stat1.min) + "</TD><TD>" + format.formatNumber(stat1.Q1) + "</TD><TD>"
        + format.formatNumber(stat1.median) + "</TD><TD>" + format.formatNumber(stat1.Q3)
        + "</TD><TD>" + format.formatNumber(stat1.max) + "</TD></TR>";
    tableHTML += "</TABLE>"
    UI.setStyleProperty("spnSummaryStatistics", "display", "inline");
    UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);
}

function updateGraphDistributions()
{
    if (activityDone && rawData[0] && rawData[0].length > 0)
    {
        UI.setStyleProperty("divResults","display","block");
        graph.dotplot(util.arrayToGraphData(rawData[0], caption),
            caption, null, true, false, [0, 1]);
    }
    else
    {
        UI.setStyleProperty("divResults","display","none");
        graph.clearGraph();
    }
}

function getVariableName(varnum)
{
    return (variableNames.length < varnum ? "Variable " + varnum : variableNames[varnum - 1]);
}

function getGroupName(groupnum)
{
    return (groupNames.length < groupnum ? "Group " + groupnum : groupNames[groupnum - 1]);
}

function getRawDataCSVString(header)
{
    var is2var = (variableNames.length == 2);
    var groups = (!is2var && groupNames.length > 1);
    var str = (header ? header : "" + getVariableName(1) + (is2var ? "," + getVariableName(2) : ""))  + "\n";
    if (is2var)
    {
        for (var i = 0; i < rawData[0].length; i++)
        {
            str += rawData[0][i] + "," + rawData[1][i];
            if (i + 1 < rawData[0].length) str += "\n";
        }
    }
    else
    {
        if (groups)
            for (var i = 0; i < groupNames.length; i++)
            {
                str += getGroupName(i + 1);
                if (i < groupNames.length - 1) str += ",";
            }
        var maxLength = Math.max.apply(null,
            rawData.map(function(s) { if (s) return s.length; else return 0; }));
        for (var i = 0; i < maxLength; i++)
        {
            var data = rawData.map(function(arr) {
                if (i >= arr.length) return "";
                else return "" + arr[i];
            });
            for (var j = 0; j < data.length; j++)
            {
                str += data[j];
                if (j < data.length - 1) str += ",";
            }
            if ((i + 1) < maxLength)
                str += "\n";
        }
    }
    return str;
}

function exportGraphData()
{
    file.saveCSV("txtGraphDataCSV", "basketball_data");
}

function handleDotplotCount()
{
    UI.setProperty("spnDotplotCountErrorMsg", "innerHTML", "");
    if ( (UI.getProperty("txtDotplotCountBound", "value").length > 0)
              && IV.validateInputFloat("txtDotplotCountBound", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spnDotplotCountErrorMsg", "Bound"))
    {
	var sel = UI.getProperty("selDotplotCountDir", "value");
	var bound = parseFloat(UI.getProperty("txtDotplotCountBound", "value"));

	if (sel == "left")
		graph.forceSelectionRectangle(null, bound);
	else
		graph.forceSelectionRectangle(bound, null);
    }
}

function clearDotplotCount()
{
    UI.setProperty("spnDotplotCountErrorMsg", "innerHTML", "");
    UI.setProperty("txtDotplotCountBound", "value", "");
    graph.clearSelectionRectangle();
}

function doManySamples()
{
    var howMany = parseInt(UI.getProperty("txtManySamples", "value"));
    if (howMany > 10000)
    {
        UI.setProperty("txtManySamples", "value", 10000);
        howMany = 10000;
    }
    for (var i = 0; i < howMany; i++)
        rawData[0].push(silentSample()/50);
    UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString(caption));
    updateSummaryStatistics();
    updateGraphDistributions();
}

STAP.UIHandlers.setOnLoad(initializePage);