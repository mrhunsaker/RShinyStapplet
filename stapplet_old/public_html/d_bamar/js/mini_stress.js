/*
// required
var fnInitializeBegin = function() {};
var fnDataSyncSuccess = function(bChanged) {};
var fnStudentEnabled = function() {};
var fnStudentDisabled = function() {};
var fnClassCodeSet = function() {};

// optional
var fnVariableNameSet = function() {};
var fnGroupNameSet = function() {};
var fnDoUndo = function() {}; // remember to clear undoData at end
var fnInitializeEnd = function() {};
var fnProcessRawData = null;
var fnDataSyncFail = function() {};
var fnDataSyncError = function(xhttp) {};
var fnAdminCodeSet = function() {};
*/

var addLoop = 0;
var addInterval = 1000;
var addExec = null;
var queueLoop = 0;
var queueExec = null;
var graph = null;
var caption = "Random data";

fnInitializeBegin = function()
{
    UI.setStyleProperty("divTest","display","none");
    addLoop = 0;
    addInterval = 1000;
    if (addExec)
    {  
        clearTimeout(addExec);
        addExec = null;
    }
    queueLoop = 0;
    if (queueExec)
    {
        clearTimeout(queueExec);
        queueExec = null;
    }
    
    if (!graph)
        graph = new STAP.SVGGraph("divPlot", 600, 300);
    else
        graph.clearGraph();
};

fnClassCodeSet = function()
{
    UI.setStyleProperty("divTest","display","block");
};

fnDataSyncSuccess = function(bChanged)
{
    if (bChanged)
    {
        if (rawData.length > 0 && rawData[0].length > 0)
            graph.dotplot(util.arrayToGraphData(rawData[0], caption), caption);
        else
            graph.clearGraph();
    }
    prependToLog("UI successfully updated at " + lastUpdateDate.toLocaleString() + ", next refresh in " + refreshTime + " ms");
};

fnDataSyncFail = function()
{
    prependToLog("Connection to server failed at " + (new Date()).toLocaleString());
    queueLoop = 0;
    if (queueExec)
    {
        clearTimeout(queueExec);
        queueExec = null;
    }
};

fnDataSyncError = function(xhttp)
{
    prependToLog("Server returned code " + xhttp.status + ", message: [" + xhttp.statusText + "] at " + (new Date()).toLocaleString());
    queueLoop = 0;
    if (queueExec)
    {
        clearTimeout(queueExec);
        queueExec = null;
    }
};

function singleAddStress()
{
    addInterval = parseInt(UI.getProperty("txtSingleAddInterval", "value"));
    addLoop = parseInt(UI.getProperty("txtNumSingleAdd", "value"));
    doSingleAdd();
}

function doSingleAdd()
{
    addExec = null;
    if (addLoop > 0)
    {
        addLoop--;
        var val = util.randomIntFromInterval(1, 100);
        UI.HTTPRequest(false, "php/_addSharedPlotSingleData.php",
            "c=" + classCode + "&v1=" + val,
            function() {
                prependToLog(val + " successfully added, " + addLoop + " left.");
                if (addLoop > 0)
                    addExec = setTimeout(doSingleAdd, addInterval);
            },
            function() {
                prependToLog("Could not connect to server for single add; failed with " + addLoop + " remaining.");
                addLoop = 0;
            },
            function(xhttp) {
                prependToLog("Server reported " + xhttp.status + " error on single add: " + xhttp.statusText + ". Failed with " + addLoop + " remaining.");
                addLoop = 0;
            }
        );
    }
}

function batchAddStress()
{
    addInterval = parseInt(UI.getProperty("txtSingleAddInterval", "value"));
    queueLoop = parseInt(UI.getProperty("txtNumBatchAdd", "value"));
    doQueueAdd();
}

function doQueueAdd()
{
    queueExec = null;
    if (queueLoop > 0)
    {
        var val = util.randomIntFromInterval(1, 100);
        queueLoop--;
        prependToLog("Queued " + val + " for add, " + queueLoop + " left.");
        queueForAdd1Var([val]);
        if (queueLoop > 0)
            queueExec = setTimeout(doQueueAdd, addInterval);
    }
}

function prependToLog(str)
{
    UI.setProperty("txtLog", "value", str + "\n" + 
        UI.getProperty("txtLog", "value"));    
}

function clearTextLog() { UI.setProperty("txtLog", "value", ""); }