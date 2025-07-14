var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;

var dataArr = null;
var graphDataArr = null;
var graph = null;
var sample = null;
var plotEnabled = true;
var caption = "Number of correct identifications";

var classCode = null;
var adminCode = null;
var schedExec = null;
var tmpMsgExec = null;

var pattern = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
var guesses = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
var activityDone = false;

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

function initializePage()
{
    UI.batchSetStyleProperty(["txtGraphDataCSV", "divIntro", "divGraphAdmin",
            "divGraphAdminOptions", "divActivity", "divActivityResults", "divResults"], "display", "none");
    UI.batchSetProperty(["spnAdminCode","spnClassCode"],"innerHTML","{none}");
    UI.setStyleProperty("btnEnterAdminCode","display","inline");
    plotEnabled = true;
    checkUIEnabled();
    dataArr = null;
    graphDataArr = null;
    activityDone = false;
    if (!graph)
        graph = new STAP.SVGGraph("divPlot", 600, 400);
    else
        graph.clearGraph();
        
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

function checkClassCode()
{
    if (!classCode) return;

    schedExec = null;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (util.trimString(this.responseText).length > 0)
                    doUpdates(this.responseText);
                else // the class code was not found
                {
                    alert("This class code is invalid or has expired.");
                    clearClassCode();
                }
            }
        }   
    };
    xhttp.open("GET", "php/_getSharedPlotData.php?c=" + classCode, true);
    xhttp.send();
}

function checkUIEnabled()
{
    if (plotEnabled)
        UI.setProperty("btnPauseStudent", "value", "Pause student data collection");
    else
    {
        if (!adminCode) alert("The teacher has paused the activity.");
        UI.setProperty("btnPauseStudent", "value", "Resume student data collection");
    }
    
    for (var i = 1; i <= 12; i++)
    {
        UI.setProperty("btnYes" + i, "disabled", !plotEnabled);
        UI.setProperty("btnNo" + i, "disabled", !plotEnabled);
    }        
    UI.setProperty("btnRestart", "disabled", !plotEnabled);
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

function doUpdates(responsetext, groupInd)
{
    var gotEnabled = (responsetext.substring(0, 1) == "1");
    if (plotEnabled !== gotEnabled)
    {
        plotEnabled = gotEnabled;
        checkUIEnabled();
    }
    if (!graph.selectionRect.dragging)
    {
        var firstnl = responsetext.indexOf("\n");
        var datatext = responsetext.substring(firstnl + 1);
        UI.setProperty("txtGraphDataCSV", "value", caption + "\n" + datatext);
        dataArr = (datatext.length > 0) ? util.splitStringGetArray(datatext) : null;
    
        updateGraphDistributions();
    }
    if (classCode) checkRefresh();
}

function setClassCode(code)
{
    classCode = code;
    adminCode = null;
    UI.setProperty("btnEnterAdminCode","disabled",false);
    if (schedExec) clearTimeout(schedExec);
    UI.setProperty("spnClassCode","innerHTML",code);
    UI.setProperty("spnAdminCode","innerHTML","{none}");
    UI.batchSetStyleProperty(["divGraphAdmin", "divIntro"],"display","block");
    initializeActivity();
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
                    if (this.responseText.split("\n")[3] == "0")
                    {
                        plotEnabled = false;
                        checkUIEnabled();
                    }
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

function toggleEnabled()
{
    setEnablePlot(!plotEnabled);
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

function _transitionShirt(id)
{
    UI.setProperty(id, "className", "shirt_hidden");
    setTimeout(function(){
        UI.setProperty(id, "className", "shirt_present");    
        UI.setProperty(id, "innerHTML", '<lottie-player src="json/parkinsons_maybe.json" background="transparent" speed="0" style="width: 100px; height: 100px;" loop autoplay></lottie-player>');
    }, 1000);
}

function initializeActivity()
{
    util.knuthShuffle(pattern);
    for (var i = 1; i <= 12; i++)
    {
        if (activityDone)
            _transitionShirt("divIcon" + i, "shirt_hidden", "shirt_present", 1000);
        else
        {
            UI.setProperty("divIcon" + i, "className", "shirt_present");    
            UI.setProperty("divIcon" + i, "innerHTML", '<lottie-player src="json/parkinsons_maybe.json" background="transparent" speed="0" style="width: 100px; height: 100px;" loop autoplay></lottie-player>');
        }
        UI.setStyleProperty("spnButtons" + i, "display", "inline");
        UI.setProperty("spnGuess" + i, "innerHTML", "");
        UI.setStyleProperty("spnGuess" + i, "color", "black");
        guesses[i - 1] = -1;
    }
    UI.setStyleProperty("divActivityResults","display","none");
    UI.setStyleProperty("divActivity","display","block");
}

function makeGuess(trial, guess)
{
    guesses[trial - 1] = (guess ? 1 : 0);
    UI.setStyleProperty("spnButtons" + trial, "display", "none");
    UI.setProperty("spnGuess" + trial, "innerHTML", (guess ? "Yes" : "No"));
    
    if (guesses.indexOf(-1) == -1)
    {
        activityDone = true;
        var correct = 0;
        for (var j = 1; j <= 12; j++)
        {
            if (guesses[j - 1] == pattern[j - 1])
            {
                UI.setStyleProperty("spnGuess" + j, "color", "#21E21C");
                correct++;
                UI.setProperty("divIcon" + j, "className", "shirt_correct");
            }
            else
            {
                UI.setStyleProperty("spnGuess" + j, "color", "#E21C21");
                UI.setProperty("divIcon" + j, "className", "shirt_incorrect");
            }
            if (pattern[j - 1])
                UI.setProperty("divIcon" + j, "innerHTML",'<lottie-player src="json/parkinsons_yes.json" background="transparent" speed="0" style="width: 100px; height: 100px;" loop autoplay></lottie-player>');
            else
                UI.setProperty("divIcon" + j, "innerHTML",'<lottie-player src="json/parkinsons_no.json" background="transparent" speed="0" style="width: 100px; height: 100px;" loop autoplay></lottie-player>');
        }
        UI.setProperty("spnNumCorrect","innerHTML","" + correct);
        UI.setStyleProperty("divActivityResults","display","block");

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length !== 0)
                        UI.setProperty("spnDataAddMsg", "innerHTML", "There was an error adding your results. Please try again later.");
                    else
                        UI.setProperty("spnDataAddMsg", "innerHTML", "Your data has been added to the class plot below.");
                }
            }   
        };
        xhttp.open("POST", "php/_addSharedPlotSingleData.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&v1=" + correct);
    }
}

function addBatchData()
{
    if (IV.validateInputFloatArray("txtDataBatchAdd", "spnDataBatchAddMsg", "Data") && confirm("Are you sure? This operation cannot be undone."))
        _batchReq(util.splitStringGetArray(UI.getProperty("txtDataBatchAdd", "value")), "btnDataBatchAdd", "spnDataBatchAddMsg", "txtDataBatchAdd");
}

function doManySamples()
{
    if (isNaN(UI.getProperty("txtManySamples","value")))
        tempSetMessage("spnManySamplesMsg", "Input must be a positive integer.");

    var numSamples = parseInt(UI.getProperty("txtManySamples","value"));
    var batch = [];
    for (var i = 0; i < numSamples; i++)
    {
        var count = 0;
        util.knuthShuffle(pattern);
        for (var j = 0; j < pattern.length; j++)
            if (pattern[j] == util.randomIntFromInterval(0,1)) count++;
        batch.push(count);
    }
    _batchReq(batch, "btnManySamples", "spnManySamplesMsg");
}

function _batchReq(arr, btnId, msgCtlId, clrCtlId)
{
    var datastr = JSON.stringify(arr);

    UI.setProperty(btnId, "disabled", true);
    UI.setStyleProperty("divResults","display","block");

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (this.responseText.length == 0)
                {
                    if (clrCtlId)
                        UI.setProperty(clrCtlId, "value", "");
                    tempSetMessage(msgCtlId, "Operation successful.", 2000);
                    checkClassCodeImmediately();
                }
                else
                    tempSetMessage(msgCtlId, "An error occurred. Please try again later.", 2000);
                UI.setProperty(btnId, "disabled", false);
            }
        }   
    };
    xhttp.open("POST", "php/_addSharedPlotBatchData.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&a=" + adminCode + "&d1=" + datastr);
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
    xhttp.send("c=" + classCode + "&v1=" + val);
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
    if (confirm("Are you sure? All data will be deleted for all users."))
    {
        UI.setProperty("btnDataDeleteAll", "disabled", true);

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length == 0)
                        checkClassCodeImmediately();
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
    if (activityDone && dataArr)
    {
        UI.setStyleProperty("divResults","display","block");
        graphDataArr = util.arrayToGraphData(dataArr, caption);
        graph.dotplot(graphDataArr, caption, null, true, false, [0, 12]);
    }
    else
    {
        UI.setStyleProperty("divResults","display","none");
        graph.clearGraph();
    }
}

function exportGraphData()
{
    file.saveCSV("txtGraphDataCSV", "parkinsons_data_" + classCode);
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