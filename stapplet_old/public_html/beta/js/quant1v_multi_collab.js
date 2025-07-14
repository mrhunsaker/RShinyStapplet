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
var optStemplot = null;
var normplots = [];

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
    optStemplot = document.getElementById("optStemplot");
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

var ctlAddIds = ["txtDataAdd", "btnDataAdd", "selInputGroup"];

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
    UI.setProperty("txtVariableName", "value", variableNames[0]);
};

fnGroupNameChanged = function()
{
    var doGroupSelectReset = function(id) {
        UI.resetInputState(id);
        if (UI.getProperty(id, "selectedIndex") < 0)
            UI.setProperty(id, "selectedIndex", 0);
        UI.recordInputState(id);
    };

    var removeOptions = function(id) {
        var sel = document.getElementById(id);
        if (sel)
            while (sel.options.length) sel.remove(0);
    };

    var sel1 = document.getElementById("selInputGroup");
    var sel2 = document.getElementById("selGroup");

    sel1.blur();
    sel2.blur();
    removeOptions("selInputGroup");
    removeOptions("selGroup");
    for (var i = 0; i < groupNames.length; i++)
    {
        var opt1 = document.createElement("option");
        opt1.text = groupNames[i];
        var opt2 = document.createElement("option");
        opt2.text = groupNames[i];
        sel1.add(opt1);        
        sel2.add(opt2);        
    }
    doGroupSelectReset("selInputGroup");
    doGroupSelectReset("selGroup");
    
    updateGraphTypeOptions();
};

fnDataSyncSuccess = function(bChanged)
{
    if (bChanged)
    {
        UI.setProperty("txtVariableName", "value", variableNames[0]);
        UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString());
        updateSummaryStatistics();
        updateGraphDistributions();
    }
    UI.setProperty("spnLastUpdate", "innerHTML", 
        "Last update successful on " + lastUpdateDate.toLocaleString());
};

fnClassCodeSet = function()
{
    UI.clearInputStates();
    UI.batchSetStyleProperty(["divGraphBasicOptions","divGraphAdmin"],  "display","block");
    UI.batchSetStyleProperty(["divGraphDistributions",
            "divSummaryStatistics"],
            	"display", "none");
};

function updateGraphTypeOptions()
{
    var selGraph = document.getElementById("selGraphType");
    if (groupNames.length < 3)
    {
        if (selGraph.options.length < 5) selGraph.add(optStemplot, 3);
    }
    else
    {
        var index = selGraph.selectedIndex;
        if (index == 3)
        {
            selGraph.blur();
            selGraph.selectedIndex = 0;
        }

        while (selGraph.options.length > 4)
            selGraph.remove(3);
    }
}

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

function handleGroupSelect()
{
    UI.recordInputState("selInputGroup");
}

function handleAdminGroupSelect()
{
    UI.recordInputState("selGroup");
}

// There should always be a group
function addSingleData()
{
    UI.setProperty("spnDataAddMsg", "innerHTML", "");
    if (simpleValidate("txtDataAdd", "spnDataAddMsg"))
    {
        var valtext = UI.getProperty("txtDataAdd", "value");
        var groupIndex = UI.getProperty("selInputGroup", "selectedIndex");

        lastAdd = [parseFloat(valtext), groupIndex + 1];
        queueForAdd1Var([lastAdd[0]], groupIndex + 1);
        rawData[groupIndex].push(lastAdd[0]);
        UI.tempSetMessage("spnDataAddMsg", "Data added successfully.", 2000);
        UI.setProperty("btnUndoLastAdd", "disabled", false);
        UI.setProperty("btnUndoLastAdd", "value", "Undo add of " + valtext +
            " to " + UI.getProperty("selInputGroup", "value"));
        UI.setProperty("txtDataAdd", "value", "");
        updateSummaryStatistics();
        updateGraphDistributions();
    }
}

function addBatchData()
{
    if (IV.validateInputFloatArray("txtAdminBatchData", "spnEditMsg", "Data"))
    {
        var arr = util.splitStringGetArray(
                UI.getProperty("txtAdminBatchData", "value")
            );
        if (arr.length > 2000)
        {
            UI.tempSetMessage("spnEditMsg", "Only 2000 items can be added at a time.", 2000, true);
            return;
        }
        if (confirm("Are you sure? This operation cannot be undone."))
        {
            var groupIndex = UI.getProperty("selGroup", "selectedIndex");
            queueForAdd1Var(arr, 1 + groupIndex);
            for (var i = 0; i < arr.length; i++)
                rawData[groupIndex].push(arr[i]);
            UI.tempSetMessage("spnEditMsg", "Data added successfully.", 2000);
            UI.setProperty("txtAdminBatchData", "value", "");
            updateSummaryStatistics();
            updateGraphDistributions();
        }
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
        adminSingleDataDelete1Var(lastAdd[0], "spnDataAddMsg", lastAdd[1], 
            function(b) {
                if (b)
                {
                    UI.setProperty("btnUndoLastAdd", "value", "Undo last add");
                    var index = rawData[lastAdd[1] - 1].indexOf(lastAdd[0]);
                    if (index > -1)
                    {
                        rawData[lastAdd[1] - 1].splice(index, 1);
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

function _isDataEmpty()
{
    for (var i = 0; i < rawData.length; i++)
        if (rawData[i].length) return false;
    return true;
}

function updateSummaryStatistics()
{
    if (!_isDataEmpty())
    {
        UI.setStyleProperty("divSummaryStatistics", "display", "block");

        var stats = [];
        for (var i = 0; i < groupNames.length; i++)
            if (rawData[i].length > 0)
            	stats.push(stat.getOneVariableStatistics(rawData[i]));
            else
                stats.push(null);
        	
        // Render a table programmatically
        // Also render a CSV and store it in the hidden textarea
        var tableHTML = "<TABLE><TR><TH>Group Name</TH>";
        tableHTML += "<TH>n</TH><TH>mean</TH><TH>SD</TH><TH>min</TH><TH>Q<sub>1</sub></TH><TH>med</TH><TH>Q<sub>3</sub></TH><TH>max</TH></TR><TR>"
    
        var resultsCSV = "Group Name,n,mean,SD,min,Q1,med,Q3,max\r\n";
    
        for (var i = 0; i < groupNames.length; i++)
        {
            var curstat = stats[i];
            if (curstat)
            {
                tableHTML += "<TR><TD>" + (i + 1) + ": " + groupNames[i] + "</TD>"
                + "<TD>" + curstat.n + "</TD><TD>" + format.formatNumber(curstat.mean) + "</TD><TD>" +
                + format.formatNumber(curstat.Sx) + "</TD><TD>"
                + format.formatNumber(curstat.min) + "</TD><TD>" + format.formatNumber(curstat.Q1) + "</TD><TD>"
                + format.formatNumber(curstat.median) + "</TD><TD>" + format.formatNumber(curstat.Q3)
                + "</TD><TD>" + format.formatNumber(curstat.max) + "</TD></TR>";
        
                resultsCSV += groupNames[i]
                + "," + curstat.n + "," + format.formatNumber(curstat.mean) + "," + format.formatNumber(curstat.Sx)
                + "," + format.formatNumber(curstat.min) + "," + format.formatNumber(curstat.Q1) + ","
                + format.formatNumber(curstat.median) + "," + format.formatNumber(curstat.Q3) + ","
                + format.formatNumber(curstat.max) + "\r\n";
            }
        }
        tableHTML += "</TABLE>"
        UI.setStyleProperty("spnSummaryStatistics", "display", "inline");
        UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);
        UI.setProperty("txtSummaryStatisticsCSV", "value", resultsCSV);
    }
    else
        UI.setStyleProperty("divSummaryStatistics", "display", "none");
}

function updateGraphDistributions()
{
    if (!_isDataEmpty())
    {
        UI.setStyleProperty("divGraphDistributions", "display", "block");
        UI.setStyleProperty("spnGraphOptions", "display", "inline");
    
        var varname = util.trimString(UI.getProperty("txtVariableName", "value"));
        if (varname.length == 0) varname = "Variable";
    
        var graphType = UI.getProperty("selGraphType", "value");
    
        var graphdatas = [];
        rawData.forEach(function(arr) { graphdatas.push(util.arrayToGraphData(arr, varname)); });

        UI.setStyleProperty("spnHistogramOptions", "display", (graphType == "histogram" ? "inline" : "none"));
        if (graphType == "histogram")
    	{
            UI.setStyleProperty("divPlot", "display", "block");
            UI.batchSetStyleProperty(["divNormPlots", "divStemplot"], "display", "none");
    	    var firstBin = null;
    	    var binWidth = null;
    	    if (util.trimString(UI.getProperty("txtHistogramBinAlignment", "value")).length > 0)
    	    {  if (!IV.validateInputFloat("txtHistogramBinAlignment", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
    	            "spnHistogramOptionsErrorMsg", "Bin alignment"))
    	    		return false;
    		else
    			firstBin = parseFloat(UI.getProperty("txtHistogramBinAlignment", "value"));
    	    }
    	
    	    if (util.trimString(UI.getProperty("txtHistogramBinWidth", "value")).length > 0)
    	    {
    		if (!IV.validateInputFloat("txtHistogramBinWidth", 0, Number.MAX_VALUE, true, "spnHistogramOptionsErrorMsg", "Bin width", "should be a positive number."))
    			return false;
    		else
    			binWidth = parseFloat(UI.getProperty("txtHistogramBinWidth", "value"));
    	    }
    
    	    graph.parallelHistogram(graphdatas, groupNames,
    		 varname, (UI.getProperty("selHistogramLabel", "value") == "rel"), binWidth, firstBin);
    	}
    	else if (graphType == "boxplot")
    	{
            UI.setStyleProperty("divPlot", "display", "block");
            UI.batchSetStyleProperty(["divNormPlots", "divStemplot"], "display", "none");
            graph.parallelBoxplot(graphdatas, groupNames, varname);
    	}
    	else if (graphType == "dotplot")
    	{
            UI.setStyleProperty("divPlot", "display", "block");
            UI.batchSetStyleProperty(["divNormPlots", "divStemplot"], "display", "none");
            graph.parallelDotplot(graphdatas, groupNames, varname);
    	}
        else if (graphType == "stemplot")
        {
            var gapHide = (UI.getProperty("selGapHide", "value") == "yes");
            UI.setStyleProperty("spnGapHide", "display",
                (gapHide ? "inline" : "none"));
            var gap = gapHide ?
                            parseInt(UI.getProperty("numGapHide", "value")) :
                            Number.MAX_VALUE;
            UI.batchSetStyleProperty(["divNormPlots", "divPlot"], "display", "none");
            UI.setStyleProperty("divStemplot", "display", "block");
            stem.stemplot(rawData[0], groupNames[0], varname,
                parseInt(UI.getProperty("selStemplotStems", "value")),
                parseInt(UI.getProperty("numSigAdj", "value")),
                gap, rawData[1], groupNames[1]);
        }
        else    // NPP
        {
            var yCaption = "Expected z-score";
            UI.setStyleProperty("divPlot", "display", "none");
        	UI.setStyleProperty("spnHistogramOptions", "display", "none");
            UI.setStyleProperty("divNormPlots", "display", "block");
            UI.setStyleProperty("divStemplot", "display", "none");
            var normdiv = document.getElementById("divNormPlots");
            while (normdiv.firstChild) {normdiv.removeChild(normdiv.firstChild);}
            normplots = [];
            for (var i = 0; i < groupNames.length; i++)
            {
                var subplotdiv = document.createElement("div");
                var subplotid = "divNormPlot" + i;
                subplotdiv.id = subplotid;
                normdiv.appendChild(subplotdiv);
                var subgraph = new STAP.SVGGraph(subplotid, null, 300);
                normplots.push(subgraph);
    
                var sArr = rawData[i].slice(0);
                var xname = (i == groupNames.length - 1 ? variableNames[0] : "");
                util.sortArrayAscending(sArr);
                var graphDataArr = util.arraysTo2DGraphData(sArr, util.NPPZ(sArr.length), xname, yCaption);
                subgraph.scatterplot(graphDataArr, xname, yCaption, null, null, null, null, groupNames[i]);
                var statsX = stat.getOneVariableStatistics(rawData[i]);
                // Plot a line that passes through (xbar, 0) and (xbar + sd, 1)
                subgraph.plotTopCurve(function(x)
                    {
                        return 1 / statsX.Sx * (x - statsX.mean);
                    }
                );
            }
        }
    }
    else
        UI.setStyleProperty("divGraphDistributions", "display", "none");
}

function resetHistogramOptions()
{
    resetIdle();
	UI.setProperty("txtHistogramBinAlignment", "value", "");
	UI.setProperty("txtHistogramBinWidth", "value", "");
	updateGraphDistributions();
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
    if (_isDataEmpty() || !confirm("This will leave the current page.\nDo you want to continue?")) return;
    
    STAP.Storage.setPageTransferData(groupNames, rawData, variableNames[0]);
    window.location.href = "./quant1v_multi.html?t=1";
}

function addGroup()
{
    var grp = prompt("Enter the group name.");
    if (!grp) return;
    else if (groupNames.indexOf(grp) > -1)
    {
        alert("That group already exists.");
        return;
    }

    disableAdminEditing("btnAddGroup", "Adding...");
    adminAddGroup(grp, "spnAddGroupMsg", function(b)
    {
        if (b)
        {
            var sel1 = document.getElementById("selGroup");
            var sel2 = document.getElementById("selInputGroup");
            var opt1 = document.createElement("option");
            var opt2 = document.createElement("option");
            opt1.text = grp;
            opt2.text = grp;
            sel1.add(opt1);
            sel2.add(opt2);
            sel1.value = grp;
            UI.recordInputState("selGroup");
            updateGraphTypeOptions();
        }
        reenableAdminEditing();
    });
}

function renameGroup()
{
    var newName = prompt('Enter the new name for group "' + UI.getProperty("selGroup", "value") + '".');
    if (!newName) return;

    var groupIndex = groupNames.indexOf(newName);
    if (groupIndex > -1)
    {
        alert("A group with that name already exists.");
        return;
    }
    
    disableAdminEditing("btnRenameGroup", "Renaming...");
    adminChangeGroupName(newName, UI.getProperty("selGroup", "selectedIndex") + 1, "spnGroupNameMsg",
        function(b) {
            if (b)
            {
                var sel1 = document.getElementById("selGroup");
                var sel2 = document.getElementById("selInputGroup");
                sel1.options[sel1.selectedIndex].text = newName;
                sel2.options[sel1.selectedIndex].text = newName;
                UI.recordInputState("selGroup");
                UI.recordInputState("selInputGroup");
                
                updateGraphDistributions();
                updateSummaryStatistics();
            }
            reenableAdminEditing();
        }
    );
}

function deleteGroup()
{
    var sel = document.getElementById("selGroup");
    var sel2 = document.getElementById("selInputGroup");
    if (sel.selectedIndex < 0) return;
    if (groupNames.length < 3)
    {
        UI.tempSetMessage("spnGroupNameMsg", "There must be at least two groups.", 3000, true);
        return;
    }
    if (confirm("Are you sure? This cannot be undone."))
    {
        var groupID = sel.selectedIndex + 1;
        disableAdminEditing("btnDeleteGroup", "Deleting...");
        adminDeleteGroup(groupID, "spnGroupNameMsg",
            function (b)
            {
                if (b)
                {
                    var index = sel.selectedIndex;
                    sel.remove(index);
                    UI.resetInputState("selGroup");
                    sel.selectedIndex = Math.max(0, sel.selectedIndex);
                    sel2.remove(index);
                    UI.resetInputState("selInputGroup");
                    sel2.selectedIndex = Math.max(0, sel2.selectedIndex);
                    updateGraphTypeOptions();
                    
                    rawData.splice(index, 1);
                    groupNames.splice(index, 1);
                    
                    updateGraphDistributions();
                    updateSummaryStatistics();
                }
                reenableAdminEditing();
            }
        );
    }
}

function deleteGroupData()
{
    var sel = document.getElementById("selGroup");
    if (sel.selectedIndex < 0) return;

    if (confirm("Are you sure? This cannot be undone."))
    {
        var groupID = sel.selectedIndex + 1;
        disableAdminEditing("btnDeleteGroupData", "Deleting...");
        adminDeleteGroupData(groupID, "spnEditMsg",
            function (b)
            {
                if (b)
                {
                    rawData[sel.selectedIndex] = [];
                    UI.batchSetProperty(["btnAddGroup", "btnDeleteGroup", "btnDataDeleteAll", "selGroup"], "disabled", false);
                    updateGraphDistributions();
                    updateSummaryStatistics();
                }
                reenableAdminEditing();
            }
        );
    }
}

function deleteSingle()
{
    var groupNum = 1 + UI.getProperty("selGroup", "selectedIndex");
    if (simpleValidate("txtAdminDelete", "spnDataDeleteMsg"))
    {
        var val = parseFloat(UI.getProperty("txtAdminDelete", "value"));
        disableAdminEditing("btnAdminDelete", "Deleting...");
        adminSingleDataDelete1Var(val, "spnDataDeleteMsg", groupNum, function(b)
            {
                if (b)
                {
                    var index = rawData[groupNum - 1].indexOf(val);
                    if (index > -1)
                    {
                        rawData[groupNum - 1].splice(index, 1);
                        updateGraphDistributions();
                        updateSummaryStatistics();
                    }
                    reenableAdminEditing();
                    UI.setProperty("txtAdminDelete", "value", "");
                }
            }
        );
    }
}

function handleDeleteAllData()
{
    if (confirm("Are you sure? This cannot be undone."))
    {
        disableAdminEditing("btnDataDeleteAll", "Deleting...");
        adminDeleteAllData("spnDataDeleteAllMsg",
            function(b) {
                if (b)
                {
                    for (var i = 0; i < rawData.length; i++)
                        rawData[i] = [];
                    
                    updateGraphDistributions();
                    updateSummaryStatistics();
                }
                reenableAdminEditing();
                UI.setProperty("btnUndoLastAdd", "disabled", true);
                UI.setProperty("btnUndoLastAdd", "value", "Undo last add");
            }
        );
    }
}

adminEditControls = ["btnPauseStudent", "btnRenew", "txtVariableName", "btnVariableName", "selGroup", "txtAdminBatchData", "btnAdminBatchData", "txtAdminDelete", "btnAdminDelete", "btnDeleteGroupData", "btnDeleteGroup", "btnRenameGroup", "btnAddGroup", "btnDataDeleteAll", "btnExtend"];