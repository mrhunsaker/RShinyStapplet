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
*/

var graphData = [];
var graph = null;
var sample = null;
var caption = "Number of correct identifications";

var pattern = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
var guesses = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
var activityDone = false;

fnInitializeBegin = function()
{
    UI.batchSetStyleProperty(["txtGraphDataCSV", "divIntro", "divGraphAdmin",
            "divActivity", "divActivityResults", "divResults"], "display", "none");
    UI.batchSetProperty(["spnLastUpdate", "spnSummaryStatistics"], "innerHTML", "");
    graphDataArr = null;
    activityDone = false;
    if (!graph)
        graph = new STAP.SVGGraph("divPlot", 600, 400);
    else
        graph.clearGraph();
};

fnStudentEnabled = function()
{
    for (var i = 1; i <= 12; i++)
    {
        UI.setProperty("btnYes" + i, "disabled", false);
        UI.setProperty("btnNo" + i, "disabled", false);
    }        
    UI.setProperty("btnRestart", "disabled", false);
};

fnStudentDisabled = function()
{
    for (var i = 1; i <= 12; i++)
    {
        UI.setProperty("btnYes" + i, "disabled", true);
        UI.setProperty("btnNo" + i, "disabled", true);
    }        
    UI.setProperty("btnRestart", "disabled", true);
};

fnDataSyncSuccess = function(bChanged)
{
    if (bChanged)
    {
        if (!graph.selectionRect.dragging)
        {
            if (rawData[0] && rawData[0].length > 0)
                graphData = rawData[0].slice(0);
            else
                graphData = [];
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

fnClassCodeSet = function()
{
    UI.setStyleProperty("divIntro","display","block");
    initializeActivity();
};

function _transitionShirt(id)
{
    UI.setProperty(id, "className", "shirt_hidden");
    setTimeout(function(){
        UI.setProperty(id, "className", "shirt_present");    
        UI.setProperty(id, "innerHTML", '<lottie-player src="json/parkinsons_maybe.json" background="transparent" speed="0" style="width: 100px; height: 100px;" loop autoplay></lottie-player>');
    }, 1000);
}

function initializeActivity()
{
    util.knuthShuffle(pattern);
    for (var i = 1; i <= 12; i++)
    {
        if (activityDone)
            _transitionShirt("divIcon" + i, "shirt_hidden", "shirt_present", 1000);
        else
        {
            UI.setProperty("divIcon" + i, "className", "shirt_present");    
            UI.setProperty("divIcon" + i, "innerHTML", '<lottie-player src="json/parkinsons_maybe.json" background="transparent" speed="0" style="width: 100px; height: 100px;" loop autoplay></lottie-player>');
        }
        UI.setStyleProperty("spnButtons" + i, "display", "inline");
        UI.setProperty("spnGuess" + i, "innerHTML", "");
        UI.setStyleProperty("spnGuess" + i, "color", "black");
        guesses[i - 1] = -1;
    }
    UI.setStyleProperty("divActivityResults","display","none");
    UI.setStyleProperty("divActivity","display","block");
}

function makeGuess(trial, guess)
{
    guesses[trial - 1] = (guess ? 1 : 0);
    UI.setStyleProperty("spnButtons" + trial, "display", "none");
    UI.setProperty("spnGuess" + trial, "innerHTML", (guess ? "Yes" : "No"));
    
    if (guesses.indexOf(-1) == -1)
    {
        activityDone = true;
        var correct = 0;
        for (var j = 1; j <= 12; j++)
        {
            if (guesses[j - 1] == pattern[j - 1])
            {
                UI.setStyleProperty("spnGuess" + j, "color", "#21E21C");
                correct++;
                UI.setProperty("divIcon" + j, "className", "shirt_correct");
            }
            else
            {
                UI.setStyleProperty("spnGuess" + j, "color", "#E21C21");
                UI.setProperty("divIcon" + j, "className", "shirt_incorrect");
            }
            if (pattern[j - 1])
                UI.setProperty("divIcon" + j, "innerHTML",'<lottie-player src="json/parkinsons_yes.json" background="transparent" speed="0" style="width: 100px; height: 100px;" loop autoplay></lottie-player>');
            else
                UI.setProperty("divIcon" + j, "innerHTML",'<lottie-player src="json/parkinsons_no.json" background="transparent" speed="0" style="width: 100px; height: 100px;" loop autoplay></lottie-player>');
        }
        UI.setProperty("spnNumCorrect","innerHTML","" + correct);
        UI.setStyleProperty("divActivityResults","display","block");
        queueForAdd1Var([correct]);
        graphData.push(correct);
        util.sortArrayAscending(graphData);
        updateSummaryStatistics();
        updateGraphDistributions();
    }
}

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
    {
        var count = 0;
        util.knuthShuffle(pattern);
        for (var j = 0; j < pattern.length; j++)
            if (pattern[j] == util.randomIntFromInterval(0,1)) count++;
        batch.push(count);
    }
    queueForAdd1Var(batch);
    tempSetMessage("spnManySamplesMsg", "Data added successfully.", 2000);
    refreshData();
}

function handleSingleDataDelete()
{
    handleSingleDataDelete1Var("txtDataDelete", "spnDataDeleteMsg");
    refreshData();
}

function updateSummaryStatistics()
{
    if (graphData.length === 0) return;

    var stat1 = stat.getOneVariableStatistics(graphData);
    
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
    if (activityDone && graphData.length > 0)
    {
        UI.setStyleProperty("divResults","display","block");
        graph.dotplot(util.arrayToGraphData(graphData, caption),
            caption, null, true, false, [0, 12]);
    }
    else
    {
        UI.setStyleProperty("divResults","display","none");
        graph.clearGraph();
    }
}

function exportGraphData()
{
    file.saveCSV("txtGraphDataCSV", "parkinsons_data_" + classCode);
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

STAP.UIHandlers.setOnLoad(initializePage);