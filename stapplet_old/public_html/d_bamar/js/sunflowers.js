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
var caption = "Average number of healthy plants";

var dataMin = Number.MAX_VALUE;
var dataMax = Number.MIN_VALUE;
var minDotSize = 8;
var showInstant = false;
var offline = false;

var shuffler100 = [];
var shuffler10 = [];

var realData = [[106,104,106,105,105,105,108,108,107,106],
                [103,102,103,104,103,103,103,104,103,105],
                [101,99,102,101,100,100,102,101,102,101],
                [98,99,99,99,100,99,98,101,99,101],
                [98,100,100,100,99,99,99,98,100,98],
                [97,98,98,98,99,99,99,99,97,98],
                [103,102,102,104,101,102,102,102,104,102],
                [104,103,103,103,102,102,103,104,102,102],
                [106,106,104,106,102,107,104,103,106,106],
                [107,108,109,110,106,107,109,107,106,107]];
var trueMean = 102.46;

// Group indices -- 0 = SRS, 1 = Stratify row, 2 = Stratify column
var meanSpanIds = ["spnMeanSRS", "spnMeanStratifyRow", "spnMeanStratifyColumn"];
var tblIds = ["tblSRS", "tblStratifyRow", "tblStratifyColumn"];
var graphDivIds = ["divSRSPlot", "divStratifyRowPlot", "divStratifyColumnPlot"];
var divIds = ["divSRS", "divStratifyRow", "divStratifyColumn"];
var btnIds = ["btnSRS", "btnStratifyRow", "btnStratifyColumn"];

function clearTable(tblId)
{
    var tbl = document.getElementById(tblId);
    for (var i = 0; i < 10; i++)
        for (var j = 0; j < 10; j++)
            tbl.rows[i + 1].cells[j].innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
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
    UI.batchSetStyleProperty(["divIntro", "divCodeData", "divShowResults", "divOfflineAdmin"], "display", "none");
    UI.batchSetStyleProperty(divIds, "display", "none");
    UI.setProperty("spnMeanResults","innerHTML","?");
    initializeTables();
    clearTable("tblResults");
    graphData = [[],[],[]];
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
    if (shuffler100.length < 100)
    {
        for (var i = 0; i < 100; i++)
            shuffler100.push(i);
    }
    if (shuffler10.length < 10)
    {
        for (var i = 0; i < 10; i++)
            shuffler10.push(i);
    }
};

fnStudentEnabled = function()
{
    UI.batchSetProperty(btnIds, "disabled", false);
    if (!showInstant)
        UI.setStyleProperty("btnRevealRestart", "display", "inline");
};

fnStudentDisabled = function()
{
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

function _beginCommon()
{
    UI.batchSetStyleProperty(["divIntro","divShowResults"],"display","block");
    UI.batchSetStyleProperty(divIds, "display", "block");
    UI.setStyleProperty("divCodes", "display", "none");
    dataMin = Number.MAX_VALUE;
    dataMax = Number.MIN_VALUE;
    minDotSize = 8;
    showInstant = false;
}

fnClassCodeSet = function()
{
    UI.setStyleProperty("divCodeData", "display", "block");
    UI.setProperty("btnOffline", "disabled", true);
    _beginCommon();
};

function beginOffline()
{
    offline = true;
    _beginCommon();
}

// Assumes cells are 0 - 99
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
    var tbl = document.getElementById(tblIds[groupInd]);
    for (var i = 0; i < arr.length; i++)
    {
        var ind = getZeroIndices(arr[i]);
        tbl.rows[ind.row + 1].cells[ind.col].innerHTML =
            (showInstant ? "" + realData[ind.row][ind.col] : "X");
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
    resetIdle();
    if (showInstant)
    {
        updatePlotAndResults(ind);
    }
    else
    {
        writeIntoTable(ind);
        checkForReveal();
    }
}

function _SRS()
{
    util.knuthShuffle(shuffler100);
    return shuffler100.slice(0,10);
}

function generateSRS()
{
    samples[0] = _SRS();
    _generateHelper(0);
}

function _stratRow()
{
    var retval = [];
    for (var i = 0; i < 10; i++)
        retval.push(util.randomIntFromInterval(0,9) + 10 * i);
    return retval;
}

function generateStratifyRow()
{
    samples[1] = _stratRow();
    _generateHelper(1);
}

function _stratCol()
{
    var retval = [];
    for (var i = 0; i < 10; i++)
        retval.push(i + 10 * util.randomIntFromInterval(0,9));
    return retval;    
}

function generateStratifyColumn()
{
    samples[2] = _stratCol();
    _generateHelper(2);
}

function doManySamples() { _manySamples(_stratRow, _stratCol); }

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

function doManyOfflineSamples()
{
    var howMany = parseInt(UI.getProperty("txtManyOfflineSamples", "value"));
    if (howMany > 2000)
    {
        tempSetMessage("spnOfflineEditMsg", "Only 2000 items can be added at a time.", 2000, true);
        return;
    }
    var type = parseInt(UI.getProperty("selOfflinePlotEdit", "value"));
    var fnSample = null;
    if (type == 1) fnSample = _SRS;
    else if (type == 2) fnSample = _stratRow;
    else fnSample = _stratCol;
    for (var i = 0; i < howMany; i++)
    {
        var mean = getSampleMean(fnSample());
        if (mean < dataMin) dataMin = mean;
        if (mean > dataMax) dataMax = mean;
        graphData[type-1].push(mean);
    }
    updateGraphDistributions();
    tempSetMessage("spnOfflineEditMsg", "Data generated.", 2000);
    UI.setProperty("txtOfflineManySamples", "value", "");
}

function revealRestart()
{
    var doRefresh = !offline && !showInstant;
    resetIdle();

    // reveal data
    showInstant = true;
    var tbl = document.getElementById("tblResults");
    for (var i = 0; i < 10; i++)
        for (var j = 0; j < 10; j++)
            tbl.rows[i + 1].cells[j].innerHTML = "" + realData[i][j];

    UI.setStyleProperty("btnRevealRestart", "display", "none");
    UI.batchSetProperty(btnIds,"value","Generate a new sample");
    UI.batchSetProperty(btnIds,"disabled",false);
    UI.setProperty("spnMeanResults","innerHTML","" + trueMean);
    for (var k = 0; k < graphs.length; k++)
    {
        graphs[k].setMarker(trueMean, "True Mean = 102.46", "#990000");
        updatePlotAndResults(k, !offline);
    }
    
    if (offline)
        UI.setStyleProperty("divOfflineAdmin", "display", "block");
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