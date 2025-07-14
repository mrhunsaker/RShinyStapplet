var graph = null;
var sample = null;
var caption = "Number of females selected";
var offline = false;

var shuffler25 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

function clearTable()
{
    var tbl = document.getElementById("tblSRS");
    for (var i = 0; i < 25; i++)
        tbl.rows[1].cells[i].innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
}

fnInitializeBegin = function()
{
    UI.batchSetStyleProperty(["txtGraphDataCSV", "divIntro", "divSRS", "divResults", "divOfflineAdmin", "divCodeData"], "display", "none");
    UI.setProperty("spnNumFemales","innerHTML","?");
    clearTable();
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

function _beginCommon()
{
    UI.setStyleProperty("divCodes", "display", "none");
    UI.batchSetStyleProperty(["divIntro", "divSRS", "divResults"], "display", "block");
}

fnClassCodeSet = function()
{
    UI.setStyleProperty("divCodeData", "display", "block");
    _beginCommon();
};

function beginOffline()
{
    offline = true;
    _beginCommon();
}

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
    resetIdle();
    util.knuthShuffle(shuffler25);
    sample = shuffler25.slice(0,8);

    clearTable();
    var tbl = document.getElementById("tblSRS");
    for (var i = 0; i < sample.length; i++)
        tbl.rows[1].cells[sample[i]].innerHTML = "X";

    var countFem = _getFemaleCount();
    UI.setProperty("spnNumFemales","innerHTML","" + countFem);
    if (offline)
        UI.setStyleProperty("divOfflineAdmin", "display", "block");
    else
        queueForAdd1Var([countFem]);

    if (!rawData[0]) rawData.push([]);
    rawData[0].push(countFem);
    if (offline)
        UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString(caption));
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

function doManyOfflineSamples()
{
    var numSamples = parseInt(UI.getProperty("txtManyOfflineSamples","value"));
    if (numSamples > 2000)
    {
        tempSetMessage("spnOfflineEditMsg", "You can only add 2000 items at once.", 2000, true);
        return;
    }
    for (var i = 0; i < numSamples; i++)
    {
        util.knuthShuffle(shuffler25);
        sample = shuffler25.slice(0,8);
        rawData[0].push(_getFemaleCount());
    }
    UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString(caption));
    updateGraphDistributions();
    tempSetMessage("spnOfflineEditMsg", "Data added successfully.", 2000);
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
    resetIdle();
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
    if (rawData[0] && rawData[0].length > 0)
    {
        UI.setStyleProperty("divResults","display","block");
        graph.dotplot(util.arrayToGraphData(rawData[0], caption),
            caption, null, true, false, [0, 8]);
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
    file.saveCSV("txtGraphDataCSV", "hiring_disc_data" + 
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