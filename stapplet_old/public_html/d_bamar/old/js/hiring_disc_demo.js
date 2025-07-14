var graphData = [];
var graph = null;
var sample = null;
var caption = "Number of females selected";

var shuffler25 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

function clearTable()
{
    var tbl = document.getElementById("tblSRS");
    for (var i = 0; i < 25; i++)
        tbl.rows[1].cells[i].innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
}

fnInitializeBegin = function()
{
    UI.batchSetStyleProperty(["txtGraphDataCSV", "divIntro", "divSRS", "divResults"], "display", "none");
    UI.setProperty("spnNumFemales","innerHTML","?");
    clearTable();
    graphData = [];
    if (!graph)
        graph = new STAP.SVGGraph("divPlot", 600, 400);
    else
        graph.clearGraph();
};

fnStudentEnabled = function()
{
    UI.setProperty("btnSRS", "disabled", false);
};

fnStudentDisabled = function()
{
    UI.setProperty("btnSRS", "disabled", true);
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
            UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString(caption));
            updateGraphDistributions();
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
    UI.batchSetStyleProperty(["divIntro", "divSRS", "divResults"], "display", "block");
};

function _getFemaleCount()
{
    if (!sample) return 0;

    var countFem = 0;
    for (var i = 0; i < sample.length; i++)
        if (sample[i] >= 15) countFem++;

    return countFem;
}

function generateSRS()
{
    util.knuthShuffle(shuffler25);
    sample = shuffler25.slice(0,8);

    clearTable();
    var tbl = document.getElementById("tblSRS");
    for (var i = 0; i < sample.length; i++)
        tbl.rows[1].cells[sample[i]].innerHTML = "X";

    var countFem = _getFemaleCount();
    UI.setProperty("spnNumFemales","innerHTML","" + countFem);
    queueForAdd1Var([countFem]);
    graphData.push(countFem);
    util.sortArrayAscending(graphData);
    updateGraphDistributions();
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
            _batchReq(arr, "spnDataBatchAddMsg", "txtDataBatchAdd");
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
        tempSetMessage("spnManySamplesMsg", "You can only add 2000 items at once.", 2000, true);
        return;
    }
    var batch = [];
    for (var i = 0; i < numSamples; i++)
    {
        util.knuthShuffle(shuffler25);
        sample = shuffler25.slice(0,8);
        batch.push(_getFemaleCount());
    }
    _batchReq(batch, "spnManySamplesMsg");
}

function _batchReq(arr, msgCtlId, clrCtlId)
{
    UI.setStyleProperty("divResults","display","block");
    queueForAdd1Var(arr);
    refreshData();
    if (clrCtlId)
        UI.setProperty(clrCtlId, "value", "");
    tempSetMessage(msgCtlId, "Operation successful.", 2000);
}    

function handleSingleDataDelete()
{
    UI.setProperty("spnDataDeleteMsg", "innerHTML", "");  
    if (simpleValidate("txtDataDelete", "spnDataDeleteMsg"))
        deleteSingleData(parseFloat(UI.getProperty("txtDataDelete","value")));
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

function updateGraphDistributions()
{
    if (graphData.length > 0)
    {
        UI.setStyleProperty("divResults","display","block");
        graphDataArr = util.arrayToGraphData(graphData, caption);
        graph.dotplot(graphDataArr, caption, null, true, false, [0, 8]);
    }
    else
    {
        UI.setStyleProperty("divResults","display","none");
        graph.clearGraph();
    }
}

function exportGraphData()
{
    file.saveCSV("txtGraphDataCSV", "hiring_disc_data_" + classCode);
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