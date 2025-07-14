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
var fnInitializeEnd = function() {};
var fnProcessRawData = null; // accept responseText, return true if data changed
var fnDataSyncFail = function() {};
var fnDataSyncError = function(xhttp) {};
var fnAdminCodeSet = function() {};
*/

var graphData = [];
var graph = null;
var stem = null;
var lastAdd = null;

fnInitializeBegin = function()
{
    UI.batchSetStyleProperty(["divGraphBasicOptions", "divGraphAdmin", 
            "divGraphAdminOptions",
            "divGraphDistributions", "divSummaryStatistics",
            "txtSummaryStatisticsCSV", "txtGraphDataCSV", "divPlot",
            "divStemplot"], "display", "none");
    UI.setProperty("btnUndoLastAdd","disabled",true);
    UI.setProperty("btnUndoLastAdd","value","Undo last add");
    if (!graph)
        graph = new STAP.SVGGraph("divPlot");
    else
        graph.clearGraph();
    if (!stem) stem = new STAP.HTMLStemplot("divStemplotPlot");

    graphData = [];
    lastAdd = null;
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

var ctlAddIds = ["txtDataAdd", "btnDataAdd", "btnUndoLastAdd"];
var ctlAddStates = [false, false, true];

fnStudentEnabled = function()
{
    for (var i = 0; i < ctlAddIds.length; i++)
        UI.setProperty(ctlAddIds[i], "disabled", ctlAddStates[i]);
};

fnStudentDisabled = function()
{
    if (!adminCode) alert("The teacher has paused the activity.");
    for (var i = 0; i < ctlAddIds.length; i++)
        ctlAddStates[i] = UI.getProperty(ctlAddIds[i], "disabled");
    UI.batchSetProperty(ctlAddIds, "disabled", true);
};

fnVariableNameChanged = function()
{
    UI.setProperty("txtVariableName", "value", variableNames[0]);
};

fnDataSyncSuccess = function(bChanged)
{
    if (bChanged)
    {
        UI.setProperty("txtVariableName", "value", variableNames[0]);
        if (!graph.selectionRect.dragging)
        {
            if (rawData[0])
                graphData = rawData[0].slice(0);
            else
                graphData = [];
            UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString());
            updateSummaryStatistics();
            updateGraphDistributions();
        }
    }
    UI.setProperty("spnLastUpdate", "innerHTML", 
        "Last update successful on " + lastUpdateDate.toLocaleString());
};

fnClassCodeSet = function()
{
    UI.batchSetStyleProperty(["divGraphBasicOptions","divGraphAdmin"],  "display","block");
    UI.batchSetStyleProperty(["divGraphDistributions",
            "divSummaryStatistics"],
            	"display", "none");
};

function handleVariableNameChange()
{
    var name = UI.getProperty("txtVariableName", "value");
    if (name.length > 50)
        alert("The variable name must be 50 characters or less.");
    else
    {
        UI.HTTPRequest(false, "php/_editSharedPlotVarName.php",
            "c=" + classCode + "&v=1&n=" + name,
            function() {
                tempSetMessage("spnVariableNameMsg", "Operation successful.", 2000);
                variableNames[0] = name;
                updateGraphDistributions();
            },
            UI.defaultAsyncFailHandler("changing graph caption"),
            UI.defaultAsyncErrorHandler("changing graph caption")
        );
    }
}

function addSingleData()
{
    UI.setProperty("spnDataAddMsg", "innerHTML", "");  
    if (simpleValidate("txtDataAdd", "spnDataAddMsg"))
    {
        var valtext = UI.getProperty("txtDataAdd", "value");
        lastAdd = parseFloat(valtext);
        queueForAdd1Var([lastAdd]);
        graphData.push(lastAdd);
        util.sortArrayAscending(graphData);
        tempSetMessage("spnDataAddMsg", "Data added successfully.", 2000);
        UI.setProperty("btnUndoLastAdd", "disabled", false);
        UI.setProperty("btnUndoLastAdd", "value", "Undo add of " + valtext);
        UI.setProperty("txtDataAdd", "value", "");
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

function handleSingleDataDelete()
{
    UI.setProperty("spnDataDeleteMsg", "innerHTML", "");  
    if (simpleValidate("txtDataDelete", "spnDataDeleteMsg"))
        deleteSingleData(parseFloat(UI.getProperty("txtDataDelete","value")));
}

function undoLastAdd()
{
    if (lastAdd)
    {
        asyncDeleteRequest(lastAdd, "btnUndoLastAdd",
            UI.getProperty("btnUndoLastAdd", "value"),
            "Undoing...", "spnDataAddMsg", function()
        {
            UI.setProperty("btnUndoLastAdd", "value", "Undo last add");
            UI.setProperty("btnUndoLastAdd", "disabled", true);
            lastAdd = null;
        });
    }
}

function asyncDeleteRequest(val, ctlID, ctlOldValue, ctlNewValue, msgID, fnSuccCallback)
{
    UI.setProperty(ctlID, "value", ctlNewValue);
    UI.setProperty(ctlID, "disabled", true);
    UI.HTTPRequest(false, "php/_deleteSharedPlotSingleData.php",
        "c=" + classCode + "&v1=" + val,
        function(responseText)
        {
            UI.setProperty(ctlID, "value", ctlOldValue);
            UI.setProperty(ctlID, "disabled", false);
            if (responseText.length == 0)
            {
                tempSetMessage(msgID, "Operation successful.", 2000);
                if (fnSuccCallback) fnSuccCallback();
                refreshData();
            }
            else
                tempSetMessage(msgID, responseText, 2000, true);
        },
        UI.defaultAsyncFailHandler("deleting value " + val),
        UI.defaultAsyncErrorHandler("deleting value " + val)
    );
}

function deleteSingleData(val)
{
    asyncDeleteRequest(val, "btnDataDelete", "Delete from plot", "Deleting...", "spnDataDeleteMsg", function()
    {
        UI.setProperty("txtDataDelete", "value", "");
    });
}

function handleDeleteAll()
{
    lastAdd = null;
    UI.setProperty("btnUndoLastAdd","disabled",true);
    UI.setProperty("btnUndoLastAdd","value","Undo last add");
    graph.clearGraph();
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

    // Also render a CSV and store it in the hidden textarea
    var resultsCSV = "n,mean,SD,min,Q1,med,Q3,max\r\n";
    resultsCSV += stat1.n + "," + format.formatNumber(stat1.mean) + "," + format.formatNumber(stat1.Sx)
        + "," + format.formatNumber(stat1.min) + "," + format.formatNumber(stat1.Q1) + ","
        + format.formatNumber(stat1.median) + "," + format.formatNumber(stat1.Q3) + ","
        + format.formatNumber(stat1.max) + "\r\n";
    UI.setProperty("txtSummaryStatisticsCSV", "value", resultsCSV);
}

function updateGraphDistributions()
{
    if (graphData.length === 0)
    {
        UI.batchSetStyleProperty(["divGraphDistributions",
        "divSummaryStatistics"],
        	"display", "none");
        return;
    }
    UI.batchSetStyleProperty(["divGraphDistributions",
        "divSummaryStatistics"],
        	"display", "block");

    var graphDataArr = util.arrayToGraphData(graphData, getVariableName(1));

    var graphType = UI.getProperty("selGraphType", "value");
                                         
    if (graphType == "histogram")
    {
    	UI.setStyleProperty("spnHistogramOptions", "display", "inline");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divStemplot", "display", "none");
    	UI.setStyleProperty("divDotplotCountingOptions", "display", "none");
    	replotHistogram();
    }
    else if (graphType == "boxplot")
    {
    	UI.setStyleProperty("spnHistogramOptions", "display", "none");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divStemplot", "display", "none");
    	UI.setStyleProperty("divDotplotCountingOptions", "display", "none");
    	graph.boxplot(graphDataArr, getVariableName(1));
    }
    else if (graphType == "dotplot")
    {
    	UI.setStyleProperty("spnHistogramOptions", "display", "none");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divStemplot", "display", "none");
    	UI.setStyleProperty("divDotplotCountingOptions", "display", "block");
        graph.dotplot(graphDataArr, getVariableName(1), null, true);
    	handleDotplotCount();
    }
    else // stemplot
    {
        var gapHide = (UI.getProperty("selGapHide", "value") == "yes");
        UI.setStyleProperty("spnGapHide", "display",
            (gapHide ? "inline" : "none"));
        var gap = gapHide ?
                        parseInt(UI.getProperty("numGapHide", "value")) :
                        Number.MAX_VALUE;
        UI.setStyleProperty("spnHistogramOptions", "display", "none");
    	UI.setStyleProperty("divPlot", "display", "none");
    	UI.setStyleProperty("divStemplot", "display", "block");
    	UI.setStyleProperty("divDotplotCountingOptions", "display", "none");
    	stem.stemplot(graphData, null, getVariableName(1),
    	    parseInt(UI.getProperty("selStemplotStems", "value")),
    	    parseInt(UI.getProperty("numSigAdj", "value")),
    	    gap);
    }
}

function replotHistogram()
{
	// validate histogram bin alignment
    var align = util.trimString(UI.getProperty("txtHistogramBinAlignment", "value"));
    if (align.length > 0)
	{
		if (!IV.validateInputFloat("txtHistogramBinAlignment", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
	            "spnHistogramOptionsErrorMsg", "Bin alignment")) return;
        else
			align = parseFloat(align);
	}
	else
		align = null;

	// validate histogram bin alignment
    var width = util.trimString(UI.getProperty("txtHistogramBinWidth", "value"));
    if (width.length > 0)
	{
		if (!IV.validateInputFloat("txtHistogramBinWidth", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
	            "spnHistogramOptionsErrorMsg", "Bin width")) return;
        else
			width = parseFloat(width);
	}
	else
		width = null;

	graph.histogram(util.arrayToGraphData(graphData, getVariableName(1)),
	    getVariableName(1),
        (UI.getProperty("selHistogramLabel", "value") == "rel"),
		width, align);
}

function resetHistogramOptions()
{
	UI.setProperty("txtHistogramBinAlignment", "value", "");
	UI.setProperty("txtHistogramBinWidth", "value", "");
	replotHistogram();
}

function exportSummaryStatistics()
{
    file.saveCSV("txtSummaryStatisticsCSV", "summary_statistics_" + classCode);
}

function exportGraphData()
{
    file.saveCSV("txtGraphDataCSV", "data_" + classCode);
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