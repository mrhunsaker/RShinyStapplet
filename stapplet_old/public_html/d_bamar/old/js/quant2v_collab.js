var xDataArr = null;
var yDataArr = null;
var graphDataArr = null;
var classCode = null;
var adminCode = null;
var schedExec = null;
var tmpMsgExec = null;
var lastAdd = null;

var refreshTime = 3000;
var plotEnabled = true;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var scatterplot = null;
var residualPlot = null;
var residualDotplot = null;
var lastRegressionFn = null;
                                            
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
        if (spnID)
            UI.setProperty(spnID, "innerHTML", param + " must be a valid numeric value.");
        return false;
    }
    return true;
}

function initializePage()
{
    UI.batchSetStyleProperty(["divGraphBasicOptions", "divGraphAdmin",
            "divGraphAdminOptions",
            "divDisplayScatterplot", "divSummaryStatistics",
            "txtGraphDataCSV", "divResidualPlot",  
            "divResidualDotplot"], "display", "none");
    UI.batchSetProperty(["spnAdminCode","spnClassCode"],"innerHTML","{none}");
    UI.batchSetProperty(["spnModelResults","spnModelMsg"],"innerHTML","");
    UI.setStyleProperty("btnEnterAdminCode","display","inline");
    UI.batchSetProperty(["btnUndoLastAdd","btnToggleRegression","btnToggleResidualPlot","btnToggleResidualDotplot"],"disabled",true);
    UI.setProperty("selModel","selectedIndex",0);
    xDataArr = null;
    yDataArr = null;
    graphDataArr = null;
    lastAdd = null;
    plotEnabled = true;
    checkUIEnabled();

    if (!scatterplot)
        scatterplot = new STAP.SVGGraph("divScatterplot");
    else
        scatterplot.clearGraph();
    if (!residualPlot)
        residualPlot = new STAP.SVGGraph("divResidualPlot", null, 200);
    else
        residualPlot.clearGraph();
    if (!residualDotplot)
        residualDotplot = new STAP.SVGGraph("divResidualDotplot", null, 200);
    else
        residualDotplot.clearGraph();

    UI.recordInputState("txtExplanatoryName");
    UI.recordInputState("txtResponseName");
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
                {
                    doUpdates(this.responseText);
                }
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

function doUpdates(responsetext)
{
    var gotEnabled = (responsetext.substring(0, 1) == "1");
    if (plotEnabled !== gotEnabled)
    {
        plotEnabled = gotEnabled;
        checkUIEnabled();
    }
    
    var commaindex = responsetext.indexOf(",");
    var firstnl = responsetext.indexOf("\n");
    var expName = responsetext.substring(1, commaindex);
    var respName = responsetext.substring(commaindex + 1, firstnl);
    if (UI.inputStates["txtExplanatoryName"] !== expName)
    {
        UI.setProperty("txtExplanatoryName", "value", expName);
        UI.recordInputState("txtExplanatoryName");
    }
    if (UI.inputStates["txtResponseName"] !== respName)
    {
        UI.setProperty("txtResponseName", "value", respName);
        UI.recordInputState("txtResponseName");
    }

    UI.setProperty("txtGraphDataCSV", "value", responsetext.substring(1));

    var datatext = responsetext.substring(firstnl + 1);
    var xyDataArr = (datatext.length > 0) ? util.splitStringGetArray(datatext) : null;
    if (xyDataArr)
    {
        xDataArr = [];
        yDataArr = [];
        var index = 0;
        while (index < xyDataArr.length)
        {
            xDataArr.push(xyDataArr[index++]);
            yDataArr.push(xyDataArr[index++]);
        }
    }
    else
    {
        xDataArr = null;
        yDataArr = null;
    }
    updateModel();
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
    UI.batchSetStyleProperty(["divGraphBasicOptions","divGraphAdmin"],"display","block");
    UI.batchSetStyleProperty(["divGraphDistributions",
            "divSummaryStatistics"],
            	"display", "none");
    dataArr = null;
    graphDataArr = null;
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
    xhttp.send("q=1&v=2&n1=Explanatory&n2=Response");
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
    UI.setStyleProperty("btnEnterAdminCode","display","none");
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

var ctlAddIds = ["txtDataAddX", "txtDataAddY", "btnDataAdd", "btnUndoLastAdd"];
var ctlAddStates = [false, false, false, true];

function checkUIEnabled()
{
    if (plotEnabled)
    {
        for (var i = 0; i < ctlAddIds.length; i++)
            UI.setProperty(ctlAddIds[i], "disabled", ctlAddStates[i]);
        UI.setProperty("btnPauseStudent", "value", "Pause student data collection");
    }
    else
    {
        if (!adminCode) alert("The teacher has paused the activity.");
        for (var i = 0; i < ctlAddIds.length; i++)
            ctlAddStates[i] = UI.getProperty(ctlAddIds[i], "disabled");
        UI.batchSetProperty(ctlAddIds, "disabled", true);
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

function toggleEnabled()
{
    setEnablePlot(!plotEnabled);
}

function handleExplanatoryNameChange()
{
    handleVariableNameChange("txtExplanatoryName", "Explanatory variable name", 1);
}

function handleResponseNameChange()
{
    handleVariableNameChange("txtResponseName", "Response variable name", 2);
}

function handleVariableNameChange(ctlID, msgPrefix, varnum)
{
    var name = UI.getProperty(ctlID, "value");
    if (name.length > 50)
    {
        alert(msgPrefix + " must be 50 characters or less.");
        UI.resetInputState(ctlID);
    }
    else
    {
        UI.recordInputState(ctlID);
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length > 0)
                        alert("There was a problem changing the variable name. Please try again later.");
                    else
                        checkClassCodeImmediately();
                }
            }   
        };
        xhttp.open("POST", "php/_editSharedPlotVarName.php");
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&v=" + varnum + "&n=" + name);
    }
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

function validatePointEntry(strFunc, bX)
{
    var xctl = "txtData" + strFunc + "X";
    var yctl = "txtData" + strFunc + "Y";
    var mctl = "spnData" + strFunc + "msg";
    UI.setProperty(mctl, "innerHTML", "");
    
    var valid = simpleValidate(xctl, mctl);
    if (valid && !simpleValidate(yctl))
    {
        valid = false;
        if (bX)
            document.getElementById(yctl).focus();
        else
            simpleValidate(yctl, mctl);
    }
    return valid;
}

function handleSingleDataAdd(bX)
{
    if (validatePointEntry("Add", bX)) addSingleData();
}

function addSingleData()
{
    var valXText = UI.getProperty("txtDataAddX", "value");
    var valYText = UI.getProperty("txtDataAddY", "value");
    UI.setProperty("btnDataAdd", "disabled", true);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                lastAdd = {x: parseFloat(valXText), y: parseFloat(valYText)};
                if (this.responseText.length == 0)
                    tempSetMessage("spnDataAddMsg", "Data added successfully.", 2000);
                else
                    tempSetMessage("spnDataAddMsg", "There was an error adding data. Please try again later.", 2000);
                UI.batchSetProperty(["btnDataAdd", "btnUndoLastAdd"],"disabled", false);
                UI.setProperty("btnUndoLastAdd", "value", "Undo add of (" + valXText + ", " + valYText + ")");
                UI.batchSetProperty(["txtDataAddX", "txtDataAddY"], "value", "");
                checkClassCodeImmediately();
            }
        }   
    };
    xhttp.open("POST", "php/_addSharedPlotSingleData.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&v1=" + valXText + "&v2=" + valYText);
}

function validateBatchInput(bX)
{
    var valid = IV.validateInputFloatArray("txtDataBatchAddX", "spnDataBatchAddMsg", "Explanatory data ");
    if (valid)
    {
        if (bX && util.trimString(UI.getProperty("txtDataBatchAddY","value")) == "")
        {
            document.getElementById("txtDataBatchAddY").focus();
            return false;
        }
        else
            valid = IV.validateInputFloatArray("txtDataBatchAddY", "spnDataBatchAddMsg", "Response data ");
    }
    
    // Also validate the number of observations here
    if (valid)
    {
        xDataArr = util.splitStringGetArray(document.getElementById("txtDataBatchAddX").value);
        yDataArr = util.splitStringGetArray(document.getElementById("txtDataBatchAddY").value);
        if (xDataArr.length !== yDataArr.length)
        {
            UI.setProperty("spnDataBatchAddMsg", "innerHTML",
                           "The number of observations in each group must be the same.");
            xDataArr = null;
            yDataArr = null;
            valid = false;
        }
    }
    return valid;
}

function handleDataBatchAdd(bX)
{
    if (validateBatchInput(bX) && confirm("Are you sure? This operation cannot be undone."))
    {
        var datastrX = JSON.stringify(
            util.splitStringGetArray(
                UI.getProperty("txtDataBatchAddX", "value")
            )
        );
        var datastrY = JSON.stringify(
            util.splitStringGetArray(
                UI.getProperty("txtDataBatchAddY", "value")
            )
        );

        UI.setProperty("btnDataBatchAdd", "value", "Adding...");
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
                        UI.batchSetProperty(["txtDataBatchAddX", "txtDataBatchAddY"], "value", "");
                        tempSetMessage("spnDataBatchAddMsg", "Operation successful.", 2000);
                        checkClassCodeImmediately();
                    }
                    else
                        tempSetMessage("spnDataBatchAddMsg", "An error occurred. Please try again later.", 2000);
                    UI.setProperty("btnDataBatchAdd", "value", "Add these data");
                    UI.setProperty("btnDataBatchAdd", "disabled", false);
                }
            }   
        };
        xhttp.open("POST", "php/_addSharedPlotBatchData.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&a=" + adminCode + "&d1=" + datastrX + "&d2=" + datastrY);
    }
}

function handleSingleDataDelete(bX)
{
    if (validatePointEntry("Delete", bX))
        asyncDeleteRequest({x: parseFloat(UI.getProperty("txtDataDeleteX", "value")), y: parseFloat(UI.getProperty("txtDataDeleteY", "value"))}, "btnDataDelete", "Delete from plot", "Deleting...", "spnDataDeleteMsg", function()
        {
            UI.batchSetProperty(["txtDataDeleteX", "txtDataDeleteY"], "value", "");
        });
}

function undoLastAdd()
{
    if (lastAdd)
    {
        asyncDeleteRequest(lastAdd, "btnUndoLastAdd",
            UI.getProperty("btnUndoLastAdd", "value"),
            "Undoing...", "spnDataAddMsg", function()
        {
            UI.setProperty("btnUndoLastAdd", "value", "Undo last add");
            UI.setProperty("btnUndoLastAdd", "disabled", true);
            lastAdd = null;
        });
    }
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
    xhttp.send("c=" + classCode + "&v1=" + val.x + "&v2=" + val.y);
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
                    {
                        lastAdd = null;
                        UI.setProperty("btnUndoLastAdd","disabled",true);
                        UI.setProperty("btnUndoLastAdd","value","Undo last add");
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

function toggleRegression()
{
    if (UI.getProperty("btnToggleRegression", "value") == "Hide regression")
    {
        UI.setProperty("btnToggleRegression", "value", "Show regression");
        scatterplot.clearTopCurve();
    }
    else
    {
        UI.setProperty("btnToggleRegression", "value", "Hide regression");
        scatterplot.plotTopCurve(lastRegressionFn);
    }
}

function toggleResidualPlot()
{
    if (UI.getProperty("btnToggleResidualPlot", "value") == "Hide residual plot")
    {
        UI.setProperty("btnToggleResidualPlot", "value", "Show residual plot");
        UI.setStyleProperty("divResidualPlot", "display", "none");
    }
    else
    {
        UI.setProperty("btnToggleResidualPlot", "value", "Hide residual plot");
        UI.setStyleProperty("divResidualPlot", "display", "inline");
    }
}

function toggleResidualDotplot()
{
    if (UI.getProperty("btnToggleResidualDotplot", "value") == "Hide dotplot of residuals")
    {
        UI.setProperty("btnToggleResidualDotplot", "value", "Show dotplot of residuals");
       UI.setStyleProperty("divResidualDotplot", "display", "none");
    }
    else
    {
        UI.setProperty("btnToggleResidualDotplot", "value", "Hide dotplot of residuals");
        UI.setStyleProperty("divResidualDotplot", "display", "inline");
    }
}

function updateResidualPlot(stats)
{
    residualPlot.clearGraph();
    safenum.cleanArray(stats.residuals);
    residualPlot.scatterplot(util.arraysTo2DGraphData(xDataArr, stats.residuals,
                    UI.inputStates["txtExplanatoryName"], "Residual"),
		    UI.inputStates["txtExplanatoryName"], "Residual");
    residualPlot.plotTopCurve(function(x) { return 0; });    
    residualDotplot.clearGraph();
    residualDotplot.dotplot(util.arrayToGraphData(stats.residuals, "Residual"), "Residual");
}

function handleModelChange()
{
    UI.batchSetProperty(["spnModelMsg","spnModelResults"],"innerHTML","");
    updateModel();
}

function updateModel()
{
    if (xDataArr)
    {
        UI.batchSetStyleProperty(["divDisplayScatterplot", "divSummaryStatistics"], "display", "block");
        graphDataArr = util.arraysTo2DGraphData(xDataArr, yDataArr,
    		UI.inputStates["txtExplanatoryName"],
    		UI.inputStates["txtResponseName"]);
    	scatterplot.clearGraph();
    	scatterplot.scatterplot(graphDataArr,
    	    UI.inputStates["txtExplanatoryName"],
    	    UI.inputStates["txtResponseName"]);
    	if (xDataArr.length < 2)
    	{
            UI.setProperty("spnModelMsg","innerHTML","More observations are required to calculate a regression model.");
            disableRegression();
        }
    	else
    	{
            UI.setProperty("spnModelMsg","innerHTML","");
            var modelType = UI.getProperty("selModel", "value");
            if (modelType == "linear")
                updateLSRL();
            else
                updateHigherOrderModel();
    	}
    }
    else
    {
        graphDataArr = null;
        UI.batchSetStyleProperty(["divDisplayScatterplot", "divSummaryStatistics"], "display", "none");
    }
}

function updateLSRL()
{
    var stat1 = stat.polynomialRegression(xDataArr, yDataArr, 1);

    // Render a table programmatically
    var tableHTML = "<BR><TABLE CLASS='results'><TR>";
    tableHTML += "<TH>Equation</TH><TH><EM>n</EM></TH><TH><EM>s</EM></TH><TH><EM>r</EM></TH><TH><EM>r</EM><SUP>2</SUP></TH></TR><TR>";
    tableHTML += "<TD><em>y&#770;</em> = " + util.polynomialRegEQDisplayHTML(stat1.coeffs) + "</TD><TD>"
        + xDataArr.length + "</TD><TD>"
        + format.formatNumber(stat1.S) + "</TD><TD>"
        + format.formatNumber(jStat.corrcoeff(xDataArr, yDataArr)) + "</TD><TD>"
        + format.formatNumber(stat1.rSquared) + "</TD></TR></TABLE>";
    UI.setProperty("spnModelResults", "innerHTML", tableHTML);
    updateResidualPlot(stat1);
    enableRegression(stat1.fn);
}

function enableRegression(statFn)
{
    lastRegressionFn = statFn;
    UI.batchSetProperty(["btnToggleRegression","btnToggleResidualPlot","btnToggleResidualDotplot"],"disabled",false);
    if (UI.getProperty("btnToggleRegression", "value") == "Hide regression")
        scatterplot.plotTopCurve(statFn);    
}

function disableRegression()
{
    UI.setProperty("spnModelResults","innerHTML","");
    UI.batchSetProperty(["btnToggleRegression","btnToggleResidualPlot","btnToggleResidualDotplot"],"disabled",true);
    if (UI.getProperty("btnToggleRegression", "value") == "Hide regression")
        toggleRegression();
    if (UI.getProperty("btnToggleResidualPlot", "value") == "Hide residual plot")
        toggleResidualPlot();
    if (UI.getProperty("btnToggleResidualDotplot", "value") == "Hide dotplot of residuals")
        toggleResidualDotplot();
}

function updateHigherOrderModel()
{
    var modelType = UI.getProperty("selModel", "value");
    
    if (modelType == "quadratic" && xDataArr.length < 3)
    {
        UI.setProperty("spnModelMsg", "innerHTML", "Three observations are required for a quadratic regression.");
        disableRegression();
        return;
    }
    if (modelType == "exponential")
    {
        for (var i = 0; i < yDataArr.length; i++)
        {
            if (yDataArr[i] <= 0)
            {
                UI.setProperty("spnModelMsg", "innerHTML", "Cannot perform an exponential regression with negative or zero response values.");
                disableRegression();
                return;
            }                        
        }
    }
    var stat1 = (modelType == "quadratic" ? stat.polynomialRegression(xDataArr, yDataArr, 2) :
                        stat.exponentialRegression(xDataArr, yDataArr));
    // Render a table programmatically
    var tableHTML = "<BR><TABLE CLASS='results'><TR>";
    tableHTML += "<TH>Equation</TH><TH><EM>n</EM></TH><TH><EM>s</EM></TH><TH><EM>r</EM><SUP>2</SUP></TH></TR>"
            + "<TR><TD><em>y&#770;</em> = ";
    if (modelType != "exponential")
        tableHTML += util.polynomialRegEQDisplayHTML(stat1.coeffs);
    else
        tableHTML += util.exponentialRegEQDisplayHTML(stat1.constant, stat1.base);
    tableHTML += "</TD><TD>" + xDataArr.length + "</TD><TD>"
        + format.formatNumber(stat1.S) + "</TD><TD>"
        + format.formatNumber(stat1.rSquared) + "</TD></TR></TABLE>";
    UI.setProperty("spnModelResults", "innerHTML", tableHTML);
    updateResidualPlot(stat1);
    enableRegression(stat1.fn);
}

function exportGraphData()
{
    file.saveCSV("txtGraphDataCSV", "data_" + classCode);
}

STAP.UIHandlers.setOnLoad(initializePage);