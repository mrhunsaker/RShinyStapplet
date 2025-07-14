/*
// required
var fnInitializeBegin = function() {};
var fnDataSyncSuccess = function(bChanged) {};
var fnStudentEnabled = function() {};
var fnStudentDisabled = function() {};
var fnClassCodeSet = function() {};

// optional
var fnVariableNameChanged = function() {};
var fnGroupNameChanged = function() {};
var fnDoUndo = function() {}; // remember to clear undoData at end
var fnInitializeEnd = function() {};
var fnProcessRawData = null; // accept responseText, return true if data changed
var fnDataSyncFail = function() {};
var fnDataSyncError = function(xhttp) {};
var fnAdminCodeSet = function() {};
var fnIdleShutdown = null; // no parameters; default is just fnStudentDisabled
*/

var graph = null;
var selfAttempts = 0;
var selfMade = 0;
var caption = "Proportion of made shots";

var offline = false;
var activityDone = false;

fnInitializeBegin = function()
{
    UI.batchSetStyleProperty(["txtGraphDataCSV", "divIntro", "divCodeData", "divGraphAdmin", "divActivity", "divActivityResults", "divResults", "divOfflineAdmin"], "display", "none");
    UI.batchSetProperty(["spnLastUpdate", "spnSummaryStatistics"], "innerHTML", "");
    if (!graph)
        graph = new STAP.SVGGraph("divPlot", 600, 400);
    else
        graph.clearGraph();
};

fnStudentEnabled = function()
{
    UI.setProperty("btnSelfAttempt", "disabled", false);
};

fnStudentDisabled = function()
{
    UI.setProperty("btnSelfAttempt", "disabled", true);
};

fnDataSyncSuccess = function(bChanged)
{
    if (bChanged)
    {
        if (!graph.selectionRect.dragging)
        {
            updateSummaryStatistics();
            updateGraphDistributions();
            UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString(caption));
        }
    }
    UI.setProperty("spnLastUpdate", "innerHTML", 
        "Last update successful on " + lastUpdateDate.toLocaleString());
};

fnDataSyncFail = function()
{
    console.log("Sync process could not connect to server at " + (new Date()).toLocaleString());
    UI.setProperty("spnLastUpdate", "innerHTML", 
        "Could not connect to server. Will try again within " + Math.round(refreshTime/1000) + " seconds.");
};

fnDataSyncError = function(xhttp)
{
    console.log("Sync process resulted in server error " + xhttp.status + " at " + (new Date()).toLocaleString());
    UI.setProperty("spnLastUpdate", "innerHTML", 
        "Server returned an error. Will try again within " + Math.round(refreshTime/1000) + " seconds.");
};

function _beginCommon()
{
    UI.setStyleProperty("divCodes","display","none");
    UI.setStyleProperty("divIntro","display","block");
    initializeActivity();
}

fnClassCodeSet = function()
{
    UI.setStyleProperty("divCodeData","display","block");
    _beginCommon();
};

function beginOffline()
{
    offline = true;
    _beginCommon();
}

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
        UI.setProperty("spnSelfStatistics", "innerHTML", selfMade + " out of " + selfAttempts + " (" + format.formatPercent(selfMade / selfAttempts) + ")");
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
        lp.load("./json/basketball_make.json");
        lp.play();
        UI.setProperty("spnSelfResult", "innerHTML", "Made shot!");
        selfMade++;
    }
    else
    {
        lp.load("./json/basketball_miss.json");
        lp.play();
        UI.setProperty("spnSelfResult", "innerHTML", "Missed shot.");
    }
    updateSelfStats();
    if (selfAttempts == 50)
    {
        UI.setProperty("spnClassMade","innerHTML",selfMade);
        UI.setStyleProperty("divActivity","display","none");
        UI.setStyleProperty("divActivityResults","display","block");
        activityDone = true;
        recordClassAttempt(selfMade);
        if (offline)
        {
            UI.setStyleProperty("divOfflineAdmin","display","block");
            UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString(caption));
        }
    }
}

function classAttempt()
{
    recordClassAttempt(silentSample());
}

function recordClassAttempt(amt)
{
    queueForAdd1Var([amt/50]);
    UI.setProperty("spnClassMade", "innerHTML", "" + selfMade);
    UI.setProperty("spnClassPercent", "innerHTML", "" + format.formatPercent(selfMade/50));
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

fnAdminCodeSet = function()
{
    activityDone = true;
    updateSummaryStatistics();
    updateGraphDistributions();
};

function addBatchData()
{
    if (IV.validateInputFloatArray("txtDataBatchAdd", "spnDataBatchAddMsg", "Data"))
    {
        var arr = util.splitStringGetArray(
                UI.getProperty("txtDataBatchAdd", "value")
            );
        if (arr.length > 2000)
        {
            tempSetMessage("spnDataBatchAddMsg", "Only 2000 items can be added at a time.", 2000, true);
            return;
        }
        if (confirm("Are you sure? This operation cannot be undone."))
        {
            queueForAdd1Var(arr);
            tempSetMessage("spnDataBatchAddMsg", "Data added successfully.", 2000);
            UI.setProperty("txtDataBatchAdd", "value", "");
            refreshData();
        }
    }
}

function doManySamples()
{
    if (isNaN(UI.getProperty("txtManySamples","value")))
    {
        tempSetMessage("spnManySamplesMsg", "Input must be a positive integer.", 2000, true);
        return;
    }
    var numSamples = parseInt(UI.getProperty("txtManySamples","value"));
    if (numSamples > 2000)
    {
        tempSetMessage("spnManySamplesMsg", "You can only add 2000 items at a time.", 2000, true);
        return;
    }
    var batch = [];
    for (var i = 0; i < numSamples; i++)
        batch.push(silentSample()/50);
    queueForAdd1Var(batch);
    tempSetMessage("spnManySamplesMsg", "Data added successfully.", 2000);
    refreshData();
}

function doManyOfflineSamples()
{
    var howMany = parseInt(UI.getProperty("txtManyOfflineSamples", "value"));
    if (howMany > 2000)
    {
        tempSetMessage("spnOfflineEditMsg", "Only 2000 items can be added at a time.", 2000, true);
        return;
    }
    for (var i = 0; i < howMany; i++)
        rawData[0].push(silentSample()/50);
    UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString(caption));
    updateSummaryStatistics();
    updateGraphDistributions();
    tempSetMessage("spnOfflineEditMsg", "Data generated.", 2000);
    UI.setProperty("txtOfflineManySamples", "value", "");
}

function handleSingleDataDelete()
{
    handleSingleDataDelete1Var("txtDataDelete", "spnDataDeleteMsg");
    refreshData();
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

function exportGraphData()
{
    resetIdle();
    file.saveCSV("txtGraphDataCSV", "basketball_data" +
        (offline ? "" : "_" + classCode));
}

function handleDotplotCount()
{
    resetIdle();
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
    resetIdle();
    UI.setProperty("spnDotplotCountErrorMsg", "innerHTML", "");
    UI.setProperty("txtDotplotCountBound", "value", "");
    graph.clearSelectionRectangle();
}

STAP.UIHandlers.setOnLoad(initializePage);