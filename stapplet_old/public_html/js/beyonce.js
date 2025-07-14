var lyrics = "I look and stare so deep in your eyes \n I touch on you more and more every time \n When you leave I'm begging you not to go \n Call your name two or three times in a row \n Such a funny thing for me to try to explain \n How I'm feeling and my pride is the one to blame \n 'Cuz I know I don't understand \n Just how your love can do what no one else can \n \n Got me looking so crazy right now, your love's \n Got me looking so crazy right now (in love) \n Got me looking so crazy right now, your touch \n Got me looking so crazy right now (your touch) \n Got me hoping you'll page me right now, your kiss \n Got me hoping you'll save me right now \n Looking so crazy in love's \n Got me looking, got me looking so crazy in love \n \n When I talk to my friends so quietly \n Who he think he is? Look at what you did to me \n Tennis shoes, don't even need to buy a new dress \n If you ain't there ain't nobody else to impress \n The way that you know what I thought I knew \n It's the beat my heart skips when I'm with you \n But I still don't understand \n Just how the love your doing no one else can \n \n I'm looking so crazy in love's \n Got me looking, got me looking so crazy in love \n \n Got me looking, so crazy, my baby \n I'm not myself lately, I'm foolish, I don't do this \n I've been playing myself, baby I don't care \n 'Cuz your love's got the best of me \n And baby you're making a fool of me \n You got me sprung and I don't care who sees \n 'Cuz baby you got me, you got me, so crazy baby \n HEY!";
var lyricsArrayWithNewlines = lyrics.split(" ");
var lyricsArray = util.splitString(lyrics);

var caption = "Average word length";
var offline = false;

// 0 = self-selected, 1 = SRS-5, 2 = SRS-10
var graphData = [null, null, null];
var graphs = [null, null, null];
var samples = [[], [], []];
var meanSpanIds = ["spnMeanSelf", "spnMeanSRS5", "spnMeanSRS20"];
var graphDivIds = ["divSelfPlot", "divSRS5Plot", "divSRS20Plot"];

var minDotSize = 8;

var trueMean = 3.53;

function _makeLyricElements(divId, sampInd, bInstallOnclick)
{
    resetIdle();
    var div = document.getElementById(divId);
    while (div.firstChild) div.removeChild(div.firstChild);
    var count = 0;
    for (var i = 0; i < lyricsArrayWithNewlines.length; i++)
    {
        var str = lyricsArrayWithNewlines[i];
        if (str == "\n")
            div.appendChild(document.createElement("br"));
        else            
        {
            var elt = document.createElement("span");
            elt.id = "spnLyric" + sampInd + "_" + (count++);
            elt.innerHTML = str;
            if (bInstallOnclick) elt.onclick = function ()
            {
                if (plotEnabled && samples[0].length < 5)
                {
                    var lyrInd = parseInt(this.id.slice(10));
                    samples[0].push(lyrInd);
                    _selectLyric(lyrInd, sampInd);
                    if (samples[0].length == 5) _selfCompleted();
                }
            };
            div.appendChild(elt);
            div.appendChild(document.createTextNode(" "));
        }
    }
}

function _selectLyric(lyrInd, sampInd)
{
    document.getElementById("spnLyric" + sampInd + "_" + lyrInd).style.backgroundColor = "gold";
}

function _clearSelection(sampInd)
{
    for (var i = 0; i < samples[sampInd].length; i++)
        document.getElementById("spnLyric" + sampInd + "_" + samples[sampInd][i]).style.backgroundColor = "white";
    samples[sampInd] = [];
}

function _selfCompleted()
{
    updatePlotAndResults(0);
    if (offline)
        UI.setStyleProperty("divOfflineAdmin", "display", "block");
    else
        UI.setStyleProperty("divSRSCollab", "display", "block");
    UI.setStyleProperty("divSRS", "display", "block");
    window.location.href = "#selfCompleted";
}

fnInitializeBegin = function()
{
    UI.batchSetStyleProperty(["divIntro", "divOfflineAdmin", "divShowResults",
                            "divSRS", "divSelf", "divCodeData", "divSRSCollab", "divSRSOffline"], "display", "none");
    samples = [[], [], []];
    graphData = [[], [], []];
    _makeLyricElements("divLyricsSelf", 0, true);
    _makeLyricElements("divLyricsSRS5", 1, false);
    _makeLyricElements("divLyricsSRS20", 2, false);
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
};

fnStudentEnabled = function()
{
    UI.setProperty("btnSRS5", "disabled", false);
    UI.setProperty("btnSRS20", "disabled", false);
};

fnStudentDisabled = function()
{
    UI.setProperty("btnSRS5", "disabled", true);
    UI.setProperty("btnSRS20", "disabled", true);
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
    UI.batchSetStyleProperty(["divIntro","divSelf","divShowResults"],"display","block");
    UI.setStyleProperty("divCodes", "display", "none");
    minDotSize = 8;
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

fnDataSyncSuccess = function(bChanged)
{
    if (bChanged)
    {
        for (var i = 0; i < graphData.length; i++)
            if (rawData[i] && rawData[i].length > 0)
                graphData[i] = rawData[i].slice(0);
            else
                graphData[i] = [];
        updateGraphDistributions();
    }
    UI.setProperty("spnLastUpdate", "innerHTML", 
        "Last update successful on " + lastUpdateDate.toLocaleString());
};

fnAdminCodeSet = function() { handlePlotEditOptions(); }

function _getSRSArray(numLyrics)
{
    var arr = [];
    for (var i = 0; i < numLyrics; i++)
    {
        var prop;
        do
        {
            prop = util.randomIntFromInterval(0, lyricsArray.length - 1);
        } while (arr.indexOf(prop) > -1);
        arr.push(prop);
    }
    return arr;
}

function _handleSRSN(sampInd, numLyrics)
{
    resetIdle();
    _clearSelection(sampInd);
    samples[sampInd] = _getSRSArray(numLyrics);
    for (var i = 0; i < numLyrics; i++)
        _selectLyric(samples[sampInd][i], sampInd);
    updatePlotAndResults(sampInd);
}

function generateSRS5() { _handleSRSN(1, 5); }
function generateSRS20() { _handleSRSN(2, 20); }

function getSampleMean(arr)
{
    var sum = 0;
    for (var i = 0; i < arr.length; i++)
        sum += lyricsArray[arr[i]].replace(/\W/g, '').length;
    return sum / arr.length;
}

var showMean = false;

function toggleShowMean()
{
    resetIdle();
    showMean = !showMean;
    UI.setProperty("btnShowMean", "value", (showMean ? "Hide true mean of " + trueMean : "Show true mean"));
    if (offline)
        UI.setStyleProperty("divSRSOffline", "display",
            (showMean ? "block" : "none"));
    for (var k = 0; k < graphs.length; k++)
        if (showMean)
            graphs[k].setMarker(trueMean, "True Mean = 3.53", "#990000");
        else
            graphs[k].clearMarker();
    updateGraphDistributions();
}

function updatePlotAndResults(groupInd)
{
    resetIdle();
    var mean = getSampleMean(samples[groupInd]);
    UI.setProperty(meanSpanIds[groupInd], "innerHTML", format.formatNumber(mean));
    graphData[groupInd].push(mean);
    queueForAdd1Var([mean], groupInd + 1);
    updateGraphDistributions();
}

function handlePlotEditOptions()
{
    resetIdle();
    var val = UI.getProperty("selPlotEdit", "value"); 
    if (val == "1")
    {
        UI.setProperty("spnDataBatchInstructions", "innerHTML", "Add multiple values separated by spaces or commas: ");
        UI.batchSetProperty(["txtDataBatch", "btnDataBatch"],"disabled", false);
    }
    else if (val == "2" || val == "3")
    {
        UI.setProperty("spnDataBatchInstructions", "innerHTML", "Sample this many times silently and add to plot: ");
        UI.batchSetProperty(["txtDataBatch", "btnDataBatch"],"disabled", false);
    }
    else
        UI.batchSetProperty(["txtDataBatch", "btnDataBatch"],"disabled", true);
}

function _doManySamples()
{
    if (IV.validateInputInt("txtDataBatch", 1, Number.MAX_VALUE, false, "spnDataBatchMsg", "Number of trials", "must be a positive integer."))
    {
        var numTrials = parseInt(UI.getProperty("txtDataBatch", "value"));
        var numWords = (UI.getProperty("selPlotEdit", "value") == "2" ? 5 : 20);
        var data = [];
        for (var i = 0; i < numTrials; i++)
        {
            var arr = _getSRSArray(numWords);
            data.push(getSampleMean(arr));
        }
        _addBatchHelper(data);
    }
}

function doManyOfflineSamples()
{
    var howMany = parseInt(UI.getProperty("txtManyOfflineSamples", "value"));
    if (howMany > 2000)
    {
        UI.tempSetMessage("spnOfflineEditMsg", "Only 2000 items can be added at a time.", 2000, true);
        return;
    }
    var type = parseInt(UI.getProperty("selOfflinePlotEdit", "value"));
    for (var i = 0; i < howMany; i++)
    {
        var numWords = (type == 2 ? 5 : 20);
        for (var i = 0; i < howMany; i++)
        {
            var arr = _getSRSArray(numWords);
            graphData[type-1].push(getSampleMean(arr));
        }
    }
    updateGraphDistributions();
    UI.tempSetMessage("spnOfflineEditMsg", "Data generated.", 2000);
    UI.setProperty("txtOfflineManySamples", "value", "");
}

function _doBatchDataAdd()
{
    if (IV.validateInputFloatArray("txtDataBatch", "spnDataBatchMsg", "Data") && confirm("Are you sure? This operation cannot be undone."))
        _addBatchHelper(util.splitStringGetArray(UI.getProperty("txtDataBatch", "value")));
}

function addBatchData()
{
    var val = UI.getProperty("selPlotEdit", "value"); 
    if (val == "1")
        _doBatchDataAdd();
    else if (val == "2" || val == "3")
        _doManySamples();
}

function _addBatchHelper(arr)
{
    resetIdle();
    var groupNum = UI.getProperty("selPlotEdit", "value");
    queueForAdd1Var(arr, groupNum);
}

function handleSingleDataDelete()
{
    resetIdle();
    handleSingleDataDelete1Var("txtDataDelete", "spnDataDeleteMsg", 
        parseInt(UI.getProperty("selPlotEdit", "value")));
}

function handleDeleteAllPlotData()
{
    resetIdle();
    handleDeleteGroupData("spnDeleteDataMsg", parseInt(UI.getProperty("selPlotEdit", "value")));
}

function updateGraphDistributions()
{
    for (var i = 0; i < graphs.length; i++)
    {
        if (!graphs[i].selectionRect.dragging)
        {
            if (graphData[i] && graphData[i].length > 0)
            {
                graphs[i].dotplot(util.arrayToGraphData(graphData[i], caption), caption, null, true, false,
                    [0, 10], minDotSize);
                if (graphs[i].suggestedDotDiameter < minDotSize)
                    minDotSize = graphs[i].suggestedDotDiameter;
            }
            else
                graphs[i].clearGraph();
        }
    }
}