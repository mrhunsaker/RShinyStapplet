var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;

// 0 = SRS, 1 = Cluster, 2 = Systematic
var dataArrs = [null, null, null];
var graphDataArrs = [null, null, null];
var graphs = [null, null, null];
var samples = [null, null, null];
var meanSpanIds = ["spnMeanSRS", "spnMeanCluster", "spnMeanSystematic"];
var tblIds = ["tblSRS", "tblCluster", "tblSystematic"];
var graphDivIds = ["divSRSPlot", "divClusterPlot", "divSystematicPlot"];
var divIds = ["divSRS", "divCluster", "divSystematic"];
var btnIds = ["btnSRS", "btnCluster", "btnSystematic"];
var btnTempStates = [false, false, false];

var dataMin = Number.MAX_VALUE;
var dataMax = Number.MIN_VALUE;
var minDotSize = 8;
var showInstant = false;
var plotEnabled = true;

var classCode = null;
var adminCode = null;
var schedExec = null;
var tmpMsgExec = null;
var shuffler50 = [];
var shuffler10 = [];

var realData = [[92,89,90,88,95,100,98,93,95,84],[82,86,90,88,86,91,90,89,85,83],[80,74,80,67,81,82,76,77,74,65],[72,68,74,73,70,69,72,70,68,67],[69,67,68,68,64,66,63,63,70,68]];
var trueMean = 78.38;

var refreshTime = 2000;

function tempSetMessage(spnID, msg, timems)
{
    if (tmpMsgExec) clearTimeout(tmpMsgExec);
    UI.setProperty(spnID,"innerHTML",msg);
    tmpMsgExec = setTimeout(function() {
        UI.setProperty(spnID,"innerHTML","");
    }, timems);
}

function simpleValidate(inputID, spnID, param, parseFn)
{
    parseFn = parseFn || parseFloat;
    if (isNaN(parseFn(UI.getProperty(inputID, "value"))))
    {
        UI.setProperty(spnID, "innerHTML", param + " must be a valid numeric value.");
        return false;
    }
    return true;
}

function clearTable(tblId)
{
    var tbl = document.getElementById(tblId);
    for (var i = 0; i < 5; i++)
        for (var j = 0; j < 10; j++)
            tbl.rows[i + 1].cells[j].innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
}

function initializeTables()
{
    for (var i = 0; i < meanSpanIds.length; i++)
    {
        UI.setProperty(meanSpanIds[i],"innerHTML","?");
        clearTable(tblIds[i]);
        UI.setStyleProperty(tblIds[i], "color", "red");
    }
    UI.batchSetProperty(btnIds,"disabled",false);
}

function initializePage()
{
    UI.batchSetStyleProperty(["divIntro", "divGraphAdmin", "divShowResults",
            "divGraphAdminOptions"], "display", "none");
    UI.batchSetStyleProperty(divIds, "display", "none");
    UI.batchSetProperty(["spnAdminCode","spnClassCode"],"innerHTML","{none}");
    UI.setStyleProperty("btnEnterAdminCode","display","inline");
    UI.setProperty("spnMeanResults","innerHTML","?");
    initializeTables();
    clearTable("tblResults");
    plotEnabled = true;
    btnTempStates = [false, false, false];
    checkUIEnabled();
    UI.setProperty("btnRevealRestart","disabled",true);
    UI.setStyleProperty("btnRevealRestart","display","inline");
    UI.batchSetProperty(btnIds,"value","Generate sample");
    showInstant = false;
    for (var i = 0; i < dataArrs.length; i++)
    {
        dataArrs[i] = null;
        graphDataArrs[i] = null;
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
    UI.writeLinkColorOriginRules();
}

function clearClassCode()
{
    if (schedExec)
    {
        clearTimeout(schedExec);
        schedExec = null;
    }
    classCode = null;
    adminCode = null;
    initializePage();
}

function checkClassCodeImmediately()
{
    if (!classCode) return;
    if (schedExec) clearTimeout(schedExec);
    checkClassCode();
}

function checkRefresh()
{
    if (schedExec)
    {
        clearTimeout(schedExec);
        schedExec = null;
    }
    schedExec = setTimeout(checkClassCode, refreshTime);
}

function checkGroup(groupInd)
{
    if (!classCode) return;
    
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (util.trimString(this.responseText).length > 0)
                {
                    doUpdates(this.responseText, groupInd);
                }
                else // the class code was not found
                {
                    alert("This class code is invalid or has expired.");
                    clearClassCode();
                }
            }
        }   
    };
    xhttp.open("GET", "php/_getSharedPlotData.php?c=" + classCode + "&g=" + (groupInd + 1), true);
    xhttp.send();
}

function checkUIEnabled()
{
    if (plotEnabled)
    {
        for (var i = 0; i < btnIds.length; i++)
            UI.setProperty(btnIds[i], "disabled", btnTempStates[i]);
        UI.setProperty("btnPauseStudent", "value", "Pause student data collection");
        if (!showInstant)
            UI.setStyleProperty("btnRevealRestart", "display", "inline");
    }
    else
    {
        if (!adminCode) alert("The teacher has paused the activity.");
        for (var i = 0; i < btnIds.length; i++)
            btnTempStates[i] = UI.getProperty(btnIds[i], "disabled");
        UI.batchSetProperty(btnIds, "disabled", true);
        UI.setStyleProperty("btnRevealRestart", "display", "none");
        UI.setProperty("btnPauseStudent", "value", "Resume student data collection");
    }
}

function setEnablePlot(bEnabled)
{
    if (!adminCode) return;
    
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (this.responseText.length > 0)
                    alert("There was a problem pausing the class. Please try again later.");
                else
                {
                    plotEnabled = bEnabled;
                    checkUIEnabled();
                }
            }
        }   
    };
    xhttp.open("POST", "php/_setEnabledSharedPlot.php");
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&a=" + adminCode + "&e=" +
        (bEnabled ? "1" : "0"));
}

function checkClassCode()
{
    if (!classCode) return;

    schedExec = null;
    for (var i = 0; i < graphs.length; i++) checkGroup(i);

    if (showInstant) updateGraphDistributions();
    if (classCode) checkRefresh();
}

function toggleEnabled() { setEnablePlot(!plotEnabled); }

function doUpdates(responsetext, groupInd)
{
    // only check once per group of 5 updates
    // arbitrarily choosing the first group for updating
    if (groupInd == 0)
    {
        var gotEnabled = (responsetext.substring(0,1) == "1");
        if (plotEnabled !== gotEnabled)
        {
            plotEnabled = gotEnabled;
            checkUIEnabled();
        }
    }
    if (!graphs[groupInd].selectionRect.dragging)
    {
        var firstnl = responsetext.indexOf("\n");
        var datatext = responsetext.substring(firstnl + 1);
        dataArrs[groupInd] = (datatext.length > 0) ? util.splitStringGetArray(datatext) : null;
        if (dataArrs[groupInd])
        {
            var len = dataArrs[groupInd].length;
            util.sortArrayAscending(dataArrs[groupInd]);
            if (dataArrs[groupInd][0] < dataMin)
                dataMin = dataArrs[groupInd][0];
            if (dataArrs[groupInd][len - 1] > dataMax)
                dataMax = dataArrs[groupInd][len - 1];
        }
    }
}

function setClassCode(code)
{
    classCode = code;
    adminCode = null;
    UI.setProperty("btnEnterAdminCode","disabled",false);
    if (schedExec) clearTimeout(schedExec);
    UI.setProperty("spnClassCode","innerHTML",code);
    UI.setProperty("spnAdminCode","innerHTML","{none}");
    UI.batchSetStyleProperty(["divGraphBasicOptions","divGraphAdmin", ,"divShowResults", "divIntro"],  "display","block");
    UI.batchSetStyleProperty(divIds, "display", "block");
    dataMin = Number.MAX_VALUE;
    dataMax = Number.MIN_VALUE;
    minDotSize = 8;
    showInstant = false;
    for (var i = 0; i < dataArrs.length; i++)
    {
        dataArrs[i] = null;
        graphDataArrs[i] = null;
    }
    checkClassCodeImmediately();
}

function newClassCode()
{
    UI.setProperty("btnNewClassCode", "disabled", true);
    UI.setProperty("btnEnterClassCode", "disabled", true);

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                var result = util.trimString(this.responseText);
                if (result.length === 10)
                {
                    clearClassCode();
                    setClassCode(result.substring(0,6));
                    setAdminCode(result.substring(6));
                    alert("The class was created successfully and will expire in 72 hours.\n" + "Please write down the admin code.\n" + "You will not be able to edit the class data without it.");
                }
                else
                    alert("There was an error creating the class.\nPlease try again later." );
                UI.setProperty("btnNewClassCode", "disabled", false);
                UI.setProperty("btnEnterClassCode", "disabled", false);
            }    
        }        
    };
    xhttp.open("POST", "php/_createSharedPlot.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("q=1&v=1");
}

function enterClassCode()
{
    var code = "";
    while (code.length === 0)
    {
        code = prompt("Please enter the six-character class code.");
        if (!code) return;
        if (code.length !== 6)
        {
            alert("That is not a valid code. Please try again.");
            code = "";
        }
    }
    
    UI.setProperty("btnNewClassCode", "disabled", true);
    UI.setProperty("btnEnterClassCode", "disabled", true);
    code = code.toUpperCase();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (this.responseText.length > 0)
                {
                    clearClassCode();
                    setClassCode(code);
                }
                else
                    alert("That code does not exist. Please try again.");
                UI.setProperty("btnNewClassCode", "disabled", false);
                UI.setProperty("btnEnterClassCode", "disabled", false);
            }
        }   
    };
    xhttp.open("GET", "php/_getSharedPlotInfo.php?c=" + code, true);
    xhttp.send();
}

function setAdminCode(code)
{
    adminCode = code;
    UI.setProperty("spnAdminCode", "innerHTML", code);
    UI.setStyleProperty("divGraphAdminOptions","display","block");
    UI.setStyleProperty("btnEnterAdminCode", "display", "none");
}

function enterAdminCode()
{
    var code = "";
    while (code.length === 0)
    {
        code = prompt("Please enter the four-character admin code.");
        if (!code) return;
        if (code.length !== 4)
        {
            alert("That is not the correct code. Please try again.");
            code = "";
        }
    }

    UI.setProperty("btnEnterAdminCode", "disabled", true);
    code = code.toUpperCase();
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (this.responseText.length > 0)
                    setAdminCode(code);
                else
                {
                    alert("That is not the correct code. Please try again.");
                    UI.setProperty("btnEnterAdminCode", "disabled", false);
                }
            }
        }   
    };
    xhttp.open("GET", "php/_getSharedPlotInfo.php?c=" + classCode + "&a=" + code, true);
    xhttp.send();
}

function resetClassExpiration()
{
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (this.responseText.length > 0)
                    alert("There was a problem extending the class. Please try again later.");
                else
                    alert("Class expiration reset successfully.\nThe class will reset 72 hours from now.");
            }
        }   
    };
    xhttp.open("POST", "php/_extendSharedPlot.php");
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode);
}

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
    var tbl = document.getElementById(tblIds[groupInd]);
    if (showInstant)
        UI.setStyleProperty(tblIds[groupInd],"color","black");
    var arr = samples[groupInd];
    for (var i = 0; i < arr.length; i++)
    {
        var ind = getZeroIndices(arr[i]);
        
        // HTML row 0 is the Timberlake picture
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

function generateSRS()
{
    util.knuthShuffle(shuffler50);
    samples[0] = shuffler50.slice(0,10);
    _generateHelper(0);
}

function generateCluster()
{
    util.knuthShuffle(shuffler10);
    samples[1] = [
        shuffler10[0],
        shuffler10[0] + 10,
        shuffler10[0] + 20,
        shuffler10[0] + 30,
        shuffler10[0] + 40,
        shuffler10[1],
        shuffler10[1] + 10,
        shuffler10[1] + 20,
        shuffler10[1] + 30,
        shuffler10[1] + 40
    ];
    _generateHelper(1);
}

function generateSystematic()
{
    var seat = util.randomIntFromInterval(0, 49);
    samples[2] = [seat];
    for (var i = 0; i < 9; i++)
    {
        seat += 7;
        if (seat > 49) seat -= 50;
        samples[2].push(seat);
    }
    _generateHelper(2);
}

function revealRestart()
{
    // reveal data
    var tbl = document.getElementById("tblResults");
    for (var i = 0; i < 5; i++)
        for (var j = 0; j < 10; j++)
            tbl.rows[i + 1].cells[j].innerHTML = "" + realData[i][j];

    showInstant = true;
    UI.setStyleProperty("btnRevealRestart", "display", "none");
    UI.batchSetProperty(btnIds,"value","Generate a new sample");
    UI.batchSetProperty(btnIds,"disabled",false);
    UI.setProperty("spnMeanResults","innerHTML","" + trueMean);
    for (var k = 0; k < graphs.length; k++)
    {
        graphs[k].setMarker(trueMean, "mean", "#990000");
        updatePlotAndResults(k);
    }
}

function updatePlotAndResults(groupInd)
{
    var mean = getSampleMean(samples[groupInd]);
    UI.setProperty(meanSpanIds[groupInd], "innerHTML", format.formatNumber(mean));
    writeIntoTable(groupInd);

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (this.responseText.length !== 0)
                    tempSetMessage("spnResultsMsg", "There was an error adding data. Please try again later.", 2000);
            }
        }   
    };
    xhttp.open("POST", "php/_addSharedPlotSingleData.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&g=" + (groupInd + 1) + "&v1=" + mean);
}

function addBatchData()
{
    if (IV.validateInputFloatArray("txtDataBatchAdd", "spnDataBatchAddMsg", "Data") && confirm("Are you sure? This operation cannot be undone."))
    {
        var datastr = JSON.stringify(
            util.splitStringGetArray(
                UI.getProperty("txtDataBatchAdd", "value")
            )
        );

        var groupNum = UI.getProperty("selPlotEdit", "value");
        
        UI.setProperty("btnDataBatchAdd", "disabled", true);
    
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length == 0)
                    {
                        UI.setProperty("txtDataBatchAdd", "value", "");
                        tempSetMessage("spnDataBatchAddMsg", "Operation successful.", 2000);
                        checkClassCodeImmediately();
                    }
                    else
                        tempSetMessage("spnDataBatchAddMsg", "An error occurred. Please try again later.", 2000);
                    UI.setProperty("btnDataBatchAdd", "disabled", false);
                }
            }   
        };
        xhttp.open("POST", "php/_addSharedPlotBatchData.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&g=" + groupNum + "&a=" + adminCode + "&d1=" + datastr);
    }
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
    var groupNum = UI.getProperty("selPlotEdit", "value");
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                UI.setProperty(ctlID, "value", ctlOldValue);
                UI.setProperty(ctlID, "disabled", false);
                if (this.responseText.length == 0)
                {
                    tempSetMessage(msgID, "Operation successful.", 2000);
                    checkClassCodeImmediately();
                    if (fnSuccCallback) fnSuccCallback();
                }
                else
                    tempSetMessage(msgID, this.responseText, 2000);
            }
        }   
    };
    xhttp.open("POST", "php/_deleteSharedPlotSingleData.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&g=" + groupNum + "&v1=" + val);
}

function deleteSingleData(val)
{
    asyncDeleteRequest(val, "btnDataDelete", "Delete from plot", "Deleting...", "spnDataDeleteMsg", function()
    {
        UI.setProperty("txtDataDelete", "value", "");
    });
}

function handleDeleteAllData()
{
    if (confirm("Are you sure? All data for the selected plot will be deleted for all users."))
    {
        UI.setProperty("btnDataDeleteAll", "disabled", true);

        var groupNum = UI.getProperty("selPlotEdit", "value");
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length == 0)
                    {
                        lastAdd = null;
                        UI.setProperty("btnUndoLastAdd","disabled",true);
                        UI.setProperty("btnUndoLastAdd","value","Undo last add");
                        graphs[parseInt(groupNum) - 1].clearGraph();
                        checkClassCodeImmediately();
                    }
                    else
                        tempSetMessage("spnDataDeleteAllMsg", "An error occurred. Please try again later.", 2000);
                    UI.setProperty("btnDataDeleteAll", "disabled", false);
                }
            }   
        };
        xhttp.open("POST", "php/_deleteSharedPlotGroupData.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&g=" + groupNum + "&a=" + adminCode);
    }
}

function handleDeleteAllPlots()
{
    if (confirm("Are you sure? All data will be deleted for all users."))
    {
        UI.setProperty("btnDataDeleteAll", "disabled", true);

        var groupNum = UI.getProperty("selPlotEdit", "value");
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length == 0)
                    {
                        lastAdd = null;
                        UI.setProperty("btnUndoLastAdd","disabled",true);
                        UI.setProperty("btnUndoLastAdd","value","Undo last add");
                        graphs[parseInt(groupNum) - 1].clearGraph();
                        checkClassCodeImmediately();
                    }
                    else
                        tempSetMessage("spnDataDeleteAllMsg", "An error occurred. Please try again later.", 2000);
                    UI.setProperty("btnDataDeleteAll", "disabled", false);
                }
            }   
        };
        xhttp.open("POST", "php/_deleteSharedPlotAllData.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&a=" + adminCode);
    }
}

function updateGraphDistributions()
{
    var caption = "Average enjoyment";
    var left = Math.floor(dataMin);
    var right = Math.ceil(dataMax);
    
    for (var i = 0; i < graphs.length; i++)
    {
        if (dataArrs[i])
        {
            graphDataArrs[i] = util.arrayToGraphData(dataArrs[i], caption);
            graphs[i].dotplot(graphDataArrs[i], caption, null, true, false,
                [left, right], minDotSize);
            if (graphs[i].suggestedDotDiameter < minDotSize)
                minDotSize = graphs[i].suggestedDotDiameter;
        }
        else
            graphs[i].clearGraph();
    }
}

STAP.UIHandlers.setOnLoad(initializePage);