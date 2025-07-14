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

var graphData = [[], [], []];
var graphs = [null, null, null];
var samples = [null, null, null];
var btnTempStates = [false, false, false];
var caption = "Average enjoyment";

var dataMin = Number.MAX_VALUE;
var dataMax = Number.MIN_VALUE;
var minDotSize = 8;
var showInstant = false;

var shuffler50 = [];
var shuffler10 = [];

var realData = [[92,89,90,88,95,100,98,93,95,84],[82,86,90,88,86,91,90,89,85,83],[80,74,80,67,81,82,76,77,74,65],[72,68,74,73,70,69,72,70,68,67],[69,67,68,68,64,66,63,63,70,68]];
var trueMean = 78.38;

//    var URLsuffix = (showInstant ? "custom.php?e=" + enjoyment : "selected.json");
function _writeSelected(tblId, zeroRowInd, zeroColInd, bTextOnly)
{
    var tHeight = 400;
    var third = tHeight / 3;
    var tenth = tHeight / 10;
    var dim = 48;
    var buffer = 4;
    var tbl = document.getElementById(tblId);
    var enjoyment = realData[zeroRowInd][zeroColInd];
    var div = document.createElement("div");
    div.className = "crowdoverlay";
    var html = (bTextOnly ? '' : '<lottie-player src="json/timberlake_crowd_selected.json" background="white"  speed="1" style="width: ' + dim + 'px; height: ' + dim + 'px;" loop autoplay></lottie-player>');
    if (showInstant)
        html += '<span class="textoverlay">' + enjoyment + '</span>';
    div.innerHTML = html;
    div.style.top = "" + (third + (dim + buffer) * zeroRowInd) + "px";
    div.style.left = "" + (tenth * zeroColInd - (dim - tenth) / 4) + "px";
    tbl.appendChild(div);
}

function clearTable(tblId)
{
    var div = document.getElementById(tblId);
    while (div.children.length > 1)
        div.removeChild(div.children[1]);
}

function initializeTables()
{
    for (var i = 0; i < meanSpanIds.length; i++)
    {
        UI.setProperty(meanSpanIds[i],"innerHTML","?");
        clearTable(tblIds[i]);
    }
    UI.batchSetProperty(btnIds,"disabled",false);
}

fnInitializeBegin = function()
{
    UI.batchSetStyleProperty(["divIntro", "divShowResults"], "display", "none");
    UI.batchSetStyleProperty(divIds, "display", "none");
    UI.setProperty("spnMeanResults","innerHTML","?");
    initializeTables();
    clearTable("tblResults");
    graphData = [[],[],[]];
    btnTempStates = [false, false, false];
    UI.setProperty("btnRevealRestart","disabled",true);
    UI.setStyleProperty("btnRevealRestart","display","inline");
    UI.batchSetProperty(btnIds,"value","Generate sample");
    showInstant = false;
    for (var i = 0; i < graphs.length; i++)
    {
        if (!graphs[i])
            graphs[i] = new STAP.SVGGraph(graphDivIds[i], null, 200, null, 200);
        else
        {
            graphs[i].clearGraph();
            graphs[i].clearMarker();
        }
    }
    if (shuffler50.length < 50)
    {
        for (var i = 0; i < 50; i++)
            shuffler50.push(i);
    }
    if (shuffler10.length < 10)
    {
        for (var i = 0; i < 10; i++)
            shuffler10.push(i);
    }
};

fnStudentEnabled = function()
{
    for (var i = 0; i < btnIds.length; i++)
        UI.setProperty(btnIds[i], "disabled", btnTempStates[i]);
    if (!showInstant)
        UI.setStyleProperty("btnRevealRestart", "display", "inline");
};

fnStudentDisabled = function()
{
    for (var i = 0; i < btnIds.length; i++)
        btnTempStates[i] = UI.getProperty(btnIds[i], "disabled");
    UI.batchSetProperty(btnIds, "disabled", true);
    UI.setStyleProperty("btnRevealRestart", "display", "none");
};

fnDataSyncSuccess = function(bChanged)
{
    if (bChanged)
    {
        for (var i = 0; i < rawData.length; i++)
        {
            if (rawData[i].length > 0)
            {
                var len = rawData[i].length;
                dataMin = Math.min(dataMin, jStat.min(rawData[i]));
                dataMax = Math.max(dataMax, jStat.max(rawData[i]));
            }        
        }
    
        if (showInstant)
        {
            for (var i = 0; i < graphData.length; i++)
                if (rawData[i] && rawData[i].length > 0)
                    graphData[i] = rawData[i].slice(0);
                else
                    graphData[i] = [];
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
    UI.batchSetStyleProperty(["divIntro","divShowResults"],"display","block");
    UI.batchSetStyleProperty(divIds, "display", "block");
    dataMin = Number.MAX_VALUE;
    dataMax = Number.MIN_VALUE;
    minDotSize = 8;
    showInstant = false;
};

// Assumes cells are 0 - 49
function getZeroIndices(n)
{
    var r = 0;
    while (n > 9)
    {
        n -= 10;
        r++;
    }   // now n is the column index
    var ret = {
        row: r,
        col: n
    };
    return ret;
}

function writeIntoTable(groupInd)
{
    clearTable(tblIds[groupInd]);
    var arr = samples[groupInd];
    for (var i = 0; i < arr.length; i++)
    {
        var ind = getZeroIndices(arr[i]);
        _writeSelected(tblIds[groupInd], ind.row, ind.col);
    }
}

function getSampleMean(arr)
{
    var sum = 0;
    for (var i = 0; i < arr.length; i++)
    {
        var ind = getZeroIndices(arr[i]);
        sum += realData[ind.row][ind.col];
    }
    return sum / arr.length;
}

function checkForReveal()
{
    var flag = false;
    for (var i = 0; i < graphs.length; i++)
        if (!samples[i]) flag = true;
    UI.setProperty("btnRevealRestart", "disabled", flag);
}

function _generateHelper(ind)
{
    if (showInstant)
    {
        updatePlotAndResults(ind);
    }
    else
    {
        UI.setProperty(btnIds[ind],"disabled",true);
        writeIntoTable(ind);
        checkForReveal();
    }
}

function _SRS()
{
    util.knuthShuffle(shuffler50);
    return shuffler50.slice(0,10);
}

function generateSRS()
{
    samples[0] = _SRS();
    _generateHelper(0);
}

function _manySamples(fn2, fn3)
{
    var howMany = parseInt(UI.getProperty("txtManySamples", "value"));
    if (howMany > 2000)
    {
        tempSetMessage("spnLastEditMsg", "Only 2000 items can be added at a time.", 2000, true);
        return;
    }
    var type = parseInt(UI.getProperty("selPlotEdit", "value"));
    var fnSample = null;
    if (type == 1) fnSample = _SRS;
    else if (type == 2) fnSample = fn2;
    else fnSample = fn3;
    var means = [];
    for (var i = 0; i < howMany; i++)
        means.push(getSampleMean(fnSample()));
    queueForAdd1Var(means,type);
    tempSetMessage("spnLastEditMsg", "Data generated.", 2000);
    UI.setProperty("txtManySamples", "value", "");
    refreshData();
}

function revealRestart()
{
    var doRefresh = !showInstant;

    // reveal data
    showInstant = true;
    for (var i = 0; i < 5; i++)
        for (var j = 0; j < 10; j++)
            _writeSelected("tblResults", i, j, true);

    UI.setStyleProperty("btnRevealRestart", "display", "none");
    UI.batchSetProperty(btnIds,"value","Generate a new sample");
    UI.batchSetProperty(btnIds,"disabled",false);
    UI.setProperty("spnMeanResults","innerHTML","" + trueMean);
    for (var k = 0; k < graphs.length; k++)
    {
        graphs[k].setMarker(trueMean, "78.38", "#990000");
        updatePlotAndResults(k, true);
    }
    
    if (doRefresh) refreshData();
}

function updatePlotAndResults(groupInd, bSuppressUpdate)
{
    var mean = getSampleMean(samples[groupInd]);
    UI.setProperty(meanSpanIds[groupInd], "innerHTML", format.formatNumber(mean));
    writeIntoTable(groupInd);
    queueForAdd1Var([mean],groupInd + 1);
    if (showInstant && !bSuppressUpdate)
    {
        if (mean < dataMin) dataMin = mean;
        if (mean > dataMax) dataMax = mean;
        graphData[groupInd].push(mean);
        util.sortArrayAscending(graphData[groupInd]);
        updateGraphDistributions();
    }
}

function addBatchData()
{
    if (IV.validateInputFloatArray("txtDataBatchAdd", "spnLastEditMsg", "Data"))
    {
        var arr = util.splitStringGetArray(
                    UI.getProperty("txtDataBatchAdd", "value"));
        if (arr.length > 2000)
        {
            tempSetMessage("spnLastEditMsg", "Only 2000 items can be added at a time.", 2000, true);
            return;
        }
        if (confirm("Are you sure? This operation cannot be undone."))
        {
            queueForAdd1Var(arr,
                parseInt(UI.getProperty("selPlotEdit", "value")));
            UI.setProperty("txtDataBatchAdd", "innerHTML", "");
            tempSetMessage("spnLastEditMsg", "Data added to plot.", 2000);
            refreshData();
        }
    }
}

function handleSingleDataDelete()
{
    if (simpleValidate("txtDataDelete", "spnLastEditMsg"))
        handleSingleDataDelete1Var("txtDataDelete","spnLastEditMsg",
            parseInt(UI.getProperty("selPlotEdit","value")));
}

function handleGroupDataDelete()
{
    handleDeleteGroupData("spnLastEditMsg", 
        parseInt(UI.getProperty("selPlotEdit", "value"))
    );
}

function updateGraphDistributions()
{
    var left = Math.floor(dataMin);
    var right = Math.ceil(dataMax);
    var proposedDotSize = Number.MAX_VALUE;

    var doGraph = function()
    {
        for (var i = 0; i < graphs.length; i++)
        {
            if (graphData[i] && graphData[i].length > 0)
            {
                graphs[i].dotplot(util.arrayToGraphData(graphData[i], caption), caption, null, true, false,
                    [left, right], minDotSize);
                if (graphs[i].suggestedDotDiameter < proposedDotSize)
                    proposedDotSize = graphs[i].suggestedDotDiameter;
            }
            else
                graphs[i].clearGraph();
        }
    };
    doGraph();
    if (minDotSize !== proposedDotSize)
    {
        minDotSize = Math.min(proposedDotSize, 8);
        doGraph();
    }
}