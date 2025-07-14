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

var ctlAddIds = ["txtDataAdd", "btnDataAdd"];

fnStudentEnabled = function()
{
    UI.batchSetProperty(ctlAddIds, "disabled", false);
    if (lastAdd)
        UI.setProperty("btnUndoLastAdd", "disabled", false);
    else
        UI.setProperty("btnUndoLastAdd", "disabled", true);
};

fnStudentDisabled = function()
{
    UI.batchSetProperty(ctlAddIds, "disabled", true);
    UI.setProperty("btnUndoLastAdd", "disabled", true);
};

fnVariableNameChanged = function()
{
//    UI.setProperty("txtVariableName", "value", variableNames[0]);
    updateGraphDistributions();
};

fnDataSyncSuccess = function(bChanged)
{
    if (bChanged)
    {
        UI.setProperty("txtVariableName", "value", variableNames[0]);
        if (!graph.selectionRect.dragging)
        {
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
    var varname = UI.getProperty("txtVariableName", "value");
    disableAdminEditing("btnVariableName", "Updating...");
    adminChangeVariableName(varname, 1, "spnVariableNameMsg", function(b) {
        if (b)
        {
            variableNames[0] = varname;
            updateGraphDistributions();
        }
        reenableAdminEditing();
    });
}

function addSingleData()
{
    UI.setProperty("spnDataAddMsg", "innerHTML", "");  
    if (simpleValidate("txtDataAdd", "spnDataAddMsg"))
    {
        var valtext = UI.getProperty("txtDataAdd", "value");
        lastAdd = parseFloat(valtext);
        queueForAdd1Var([lastAdd]);
        rawData[0].push(lastAdd);
        UI.tempSetMessage("spnDataAddMsg", "Data added successfully.", 2000);
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
            UI.tempSetMessage("spnDataBatchAddMsg", "Only 2000 items can be added at a time.", 2000, true);
            return;
        }
        if (confirm("Are you sure? This operation cannot be undone."))
        {
            queueForAdd1Var(arr);
            UI.tempSetMessage("spnDataBatchAddMsg", "Data added successfully.", 2000);
            UI.setProperty("txtDataBatchAdd", "value", "");

            for (var i = 0; i < arr.length; i++)
                rawData[0].push(arr[i]);
            updateSummaryStatistics();
            updateGraphDistributions();
        }
    }
}

function handleSingleDataDelete(spnDataId, spnMsgId)
{
    if (simpleValidate(spnDataId, spnMsgId))
    {
        var val = parseFloat(UI.getProperty(spnDataId, "value"));
        disableAdminEditing("btnDataDelete", "Deleting...");
        adminSingleDataDelete1Var(val, spnMsgId, 1,
            function (b) {
                if (b)
                {
                    var index = rawData[0].indexOf(val);
                    if (index > -1)
                    {
                        rawData[0].splice(index, 1);
                        updateGraphDistributions();
                        updateSummaryStatistics();
                    }
                    UI.setProperty(spnDataId, "value", "");
                }
                reenableAdminEditing();
            }
        );
    }
}

function undoLastAdd()
{
    if (lastAdd)
    {
        var curBtnVal = UI.getProperty("btnUndoLastAdd", "value");
        UI.setProperty("btnUndoLastAdd", "value", "Undoing...");
        UI.setProperty("btnUndoLastAdd", "disabled", true);
        disableAdminEditing();
        adminSingleDataDelete1Var(lastAdd[0], "spnDataAddMsg", 1, 
            function(b) {
                if (b)
                {
                    UI.setProperty("btnUndoLastAdd", "value", "Undo last add");
                    var index = rawData[0].indexOf(lastAdd[0]);
                    if (index > -1)
                    {
                        rawData[0].splice(index, 1);
                        updateGraphDistributions();
                        updateSummaryStatistics();
                    }
                    lastAdd = null;
                }
                else
                {
                    UI.setProperty("btnUndoLastAdd", "value", curBtnVal);
                    UI.setProperty("btnUndoLastAdd", "disabled", false);
                }
                reenableAdminEditing();
            });
    }
}

function handleDeleteAllData()
{
    if (confirm("Are you sure? This cannot be undone."))
    {
        disableAdminEditing("btnDataDeleteAll", "Deleting...");
        adminDeleteAllData("spnDataDeleteMsg", function(b)
        {
            if (b)
            {
                lastAdd = null;
                UI.setProperty("btnUndoLastAdd","disabled",true);
                UI.setProperty("btnUndoLastAdd","value","Undo last add");
                rawData[0] = [];
                updateGraphDistributions();
                updateSummaryStatistics();
            }
            reenableAdminEditing();
        });
    }
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
    if (!rawData[0] || rawData[0].length === 0)
    {
        UI.batchSetStyleProperty(["divGraphDistributions",
        "divSummaryStatistics"],
        	"display", "none");
        return;
    }
    UI.batchSetStyleProperty(["divGraphDistributions",
        "divSummaryStatistics"],
        	"display", "block");

    var graphDataArr = util.arrayToGraphData(rawData[0], getVariableName(1));

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
    else if (graphType == "stemplot")
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
    	stem.stemplot(rawData[0], null, getVariableName(1),
    	    parseInt(UI.getProperty("selStemplotStems", "value")),
    	    parseInt(UI.getProperty("numSigAdj", "value")),
    	    gap);
    }
    else    // norm prob plot
    {
        var yCaption = "Expected z-score";
    	UI.setStyleProperty("spnHistogramOptions", "display", "none");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divStemplot", "display", "none");
    	UI.setStyleProperty("divDotplotCountingOptions", "display", "none");

        var sArr = rawData[0].slice(0);
        util.sortArrayAscending(sArr);
        var graphDataArr = util.arraysTo2DGraphData(sArr, util.NPPZ(sArr.length), variableNames[0], yCaption);
        graph.scatterplot(graphDataArr, variableNames[0], yCaption, null, null, null, null, variableNames[0]);
        var statsX = stat.getOneVariableStatistics(rawData[0]);
        // Plot a line that passes through (xbar, 0) and (xbar + sd, 1)
        graph.plotTopCurve(function(x)
            {
                return 1 / statsX.Sx * (x - statsX.mean);
            }
        );
    }
}

function replotHistogram()
{
    resetIdle();
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

	graph.histogram(util.arrayToGraphData(rawData[0], getVariableName(1)),
	    getVariableName(1),
        (UI.getProperty("selHistogramLabel", "value") == "rel"),
		width, align);
}

function resetHistogramOptions()
{
    resetIdle();
	UI.setProperty("txtHistogramBinAlignment", "value", "");
	UI.setProperty("txtHistogramBinWidth", "value", "");
	replotHistogram();
}

function exportSummaryStatistics()
{
    resetIdle();
    file.saveCSV("txtSummaryStatisticsCSV", "summary_statistics_" + classCode);
}

function exportGraphData()
{
    resetIdle();
    file.saveCSV("txtGraphDataCSV", "data_" + classCode);
}

function transferDataNC()
{
    if (!rawData[0].length || !confirm("This will leave the current page.\nDo you want to continue?")) return;
    
    STAP.Storage.setPageTransferData(["data"], rawData, variableNames[0]);
    window.location.href = "./quant1v_single.html?t=1";
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

adminEditControls = ["btnPauseStudent", "btnRenew", "txtVariableName", "btnVariableName", "txtDataBatchAdd", "btnDataBatchAdd", "txtDataDelete", "btnDataDelete", "btnDataDeleteAll", "btnExtend"];