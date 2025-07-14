var dataArr = null;
var graphDataArr = null;
var graph = null;
var stem = null;
var classCode = null;
var adminCode = null;
var schedExec = null;
var tmpMsgExec = null;
var lastAdd = null;

var refreshTime = 3000;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;

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
    UI.batchSetStyleProperty(["divGraphBasicOptions", "divGraphAdminOptions",
            "divGraphDistributions", "divSummaryStatistics",
            "txtSummaryStatisticsCSV", "txtGraphDataCSV", "divPlot",
            "divStemplot"], "display", "none");
    UI.batchSetProperty(["spnAdminCode","spnClassCode"],"innerHTML","{none}");
    UI.setProperty("btnEnterAdminCode","disabled",false);
    UI.setProperty("btnUndoLastAdd","disabled",true);
    if (!graph) graph = new STAP.SVGGraph("divPlot");
    if (!stem) stem = new STAP.HTMLStemplot("divStemplotPlot");
    dataArr = null;
    graphDataArr = null;
    lastAdd = null;
    UI.recordInputState("txtVariableName");
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
                    if (!graph.selectionRect.element)
                        doUpdates(this.responseText);
                }
                else // the class code was not found
                {
                    alert("This class code is invalid or has expired.");
                    clearClassCode();
                }
                UI.setProperty("txtGraphDataCSV", "value", this.responseText);
            }
            checkRefresh();
        }   
    };
    xhttp.open("GET", "php/_getSharedPlotData.php?c=" + classCode, true);
    xhttp.send();
}

function doUpdates(responsetext)
{
    var firstnl = responsetext.indexOf("\n");
    var varname = responsetext.substring(0, firstnl);
    if (UI.inputStates["txtVariableName"] !== varname)
    {
        UI.setProperty("txtVariableName", "value", varname);
        UI.recordInputState("txtVariableName");
    }
    var datatext = responsetext.substring(firstnl + 1);
    dataArr = (datatext.length > 0) ? util.splitStringGetArray(datatext) : null;
    if (dataArr) util.sortArrayAscending(dataArr);
    updateSummaryStatistics();
    updateGraphDistributions();
}

function setClassCode(code)
{
    classCode = code;
    adminCode = null;
    UI.setProperty("btnEnterAdminCode","disabled",false);
    if (schedExec) clearTimeout(schedExec);
    UI.setProperty("spnClassCode","innerHTML",code);
    UI.setProperty("spnAdminCode","innerHTML","{none}");
    UI.setStyleProperty("divGraphBasicOptions","display","block");
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
    UI.setProperty("btnNewClassCode", "value", "Creating...");
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
                UI.setProperty("btnNewClassCode", "value", "Generate new class code");
            }    
        }        
    };
    xhttp.open("POST", "php/_createSharedPlot.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("q=1&v=1");
}

function enterClassCode()
{
    UI.setProperty("btnNewClassCode", "disabled", true);
    UI.setProperty("btnEnterClassCode", "disabled", true);
    UI.setProperty("btnEnterClassCode", "value", "Please wait...");

    var code = "";
    while (code.length === 0)
    {
        code = prompt("Please enter the six-character class code.");
        if (code.length !== 6)
        {
            alert("That is not a valid code. Please try again.");
            code = "";
        }
    }
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
                UI.setProperty("btnEnterClassCode", "value", "Enter class code");
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
    UI.setProperty("btnEnterAdminCode", "disabled", true);
}

function enterAdminCode()
{
    UI.setProperty("btnEnterAdminCode", "disabled", true);
    UI.setProperty("btnEnterAdminCode", "value", "Please wait...");

    var code = "";
    while (code.length === 0)
    {
        code = prompt("Please enter the four-character admin code.");
        if (code.length !== 4)
        {
            alert("That is not the correct code. Please try again.");
            code = "";
        }
    }
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
                UI.setProperty("btnEnterAdminCode", "value", "Enter admin code");
            }
        }   
    };
    xhttp.open("GET", "php/_getSharedPlotInfo.php?c=" + classCode + "&a=" + code, true);
    xhttp.send();
}

function handleVariableNameChange()
{
    var name = UI.getProperty("txtVariableName", "value");
    if (name.length > 50)
    {
        alert("The graph caption must be 50 characters or less.");
        UI.resetInputState("txtVariableName");
    }
    else
    {
        UI.recordInputState("txtVariableName");
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length > 0)
                        alert("There was a problem changing the graph caption. Please try again later.");
                    else
                        checkClassCodeImmediately();
                }
            }   
        };
        xhttp.open("POST", "php/_editSharedPlotVarName.php");
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&v=1&n=" + name);
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

function addSingleData()
{
    UI.setProperty("spnDataAddMsg", "innerHTML", "");  
    if (simpleValidate("txtDataAdd", "spnDataAddMsg"))
    {
        var valtext = UI.getProperty("txtDataAdd", "value");
        UI.setProperty("btnDataAdd", "disabled", true);
        UI.setProperty("btnDataAdd", "value", "Adding...");
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    lastAdd = parseFloat(valtext);
                    if (this.responseText.length == 0)
                        tempSetMessage("spnDataAddMsg", "Data added successfully.", 2000);
                    else
                        tempSetMessage("spnDataAddMsg", "There was an error adding data. Please try again later.", 2000);
                    UI.batchSetProperty(["btnDataAdd", "btnUndoLastAdd"],"disabled", false);
                    UI.setProperty("btnDataAdd", "value", "Add to plot");
                    UI.setProperty("btnUndoLastAdd", "value", "Undo add of " + valtext);
                    UI.setProperty("txtDataAdd", "value", "");
                    checkClassCodeImmediately();
                }
            }   
        };
        xhttp.open("POST", "php/_addSharedPlotSingleData.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&v1=" + valtext);
    }
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
                        UI.setProperty("txtDataBatchAdd", "value", "");
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
        xhttp.send("c=" + classCode + "&a=" + adminCode + "&d1=" + datastr);
    }
}

function handleSingleDataDelete()
{
    UI.setProperty("spnDataDeleteMsg", "innerHTML", "");  
    if (simpleValidate("txtDataDelete", "spnDataDeleteMsg"))
        deleteSingleData(parseFloat(UI.getProperty("txtDataDelete","value")));
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
        UI.setProperty("btnDataDeleteAll", "value", "Deleting...");
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
                    UI.setProperty("btnDataDeleteAll", "value", "Delete all plot data");
                    UI.setProperty("btnDataDeleteAll", "disabled", false);
                }
            }   
        };
        xhttp.open("POST", "php/_deleteSharedPlotAllData.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&a=" + adminCode);
    }
}

function updateSummaryStatistics()
{
    if (!dataArr) return;

    var stat1 = stat.getOneVariableStatistics(dataArr);
    
    // Render a table programmatically
    var tableHTML = "<TABLE><TR>";
    tableHTML += "<TH>n</TH><TH>mean</TH><TH>SD</TH><TH>min</TH><TH>Q<sub>1</sub></TH><TH>med</TH><TH>Q<sub>3</sub></TH><TH>max</TH></TR><TR>"
    tableHTML += "<TD>" + stat1.n + "</TD><TD>" + format.formatNumber(stat1.mean) + "</TD><TD>" +
        + format.formatNumber(stat1.Sx) + "</TD><TD>"
        + format.formatNumber(stat1.min) + "</TD><TD>" + format.formatNumber(stat1.Q1) + "</TD><TD>"
        + format.formatNumber(stat1.median) + "</TD><TD>" + format.formatNumber(stat1.Q3)
        + "</TD><TD>" + format.formatNumber(stat1.max) + "</TD></TR>";
    tableHTML += "</TABLE>"
    UI.setStyleProperty("spnSummaryStatistics", "display", "inline");
    UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);

    // Also render a CSV and store it in the hidden textarea
    var resultsCSV = "n,mean,SD,min,Q1,med,Q3,max\r\n";
    resultsCSV += stat1.n + "," + format.formatNumber(stat1.mean) + "," + format.formatNumber(stat1.Sx)
        + "," + format.formatNumber(stat1.min) + "," + format.formatNumber(stat1.Q1) + ","
        + format.formatNumber(stat1.median) + "," + format.formatNumber(stat1.Q3) + ","
        + format.formatNumber(stat1.max) + "\r\n";
    UI.setProperty("txtSummaryStatisticsCSV", "value", resultsCSV);
}

function updateGraphDistributions()
{
    if (!dataArr)
    {
        UI.batchSetStyleProperty(["divGraphDistributions",
        "divSummaryStatistics"],
        	"display", "none");
        return;
    }
    UI.batchSetStyleProperty(["divGraphDistributions",
        "divSummaryStatistics"],
        	"display", "block");

    graphDataArr = util.arrayToGraphData(dataArr, UI.inputStates["txtVariableName"]);

    var graphType = UI.getProperty("selGraphType", "value");
                                         
    if (graphType == "histogram")
    {
    	UI.setStyleProperty("spnHistogramOptions", "display", "inline");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divStemplot", "display", "none");
    	UI.setStyleProperty("divDotplotCountingOptions", "display", "none");
    	replotHistogram();
    }
    else if (graphType == "boxplot")
    {
    	UI.setStyleProperty("spnHistogramOptions", "display", "none");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divStemplot", "display", "none");
    	UI.setStyleProperty("divDotplotCountingOptions", "display", "none");
    	graph.boxplot(graphDataArr, UI.inputStates["txtVariableName"]);
    }
    else if (graphType == "dotplot")
    {
    	UI.setStyleProperty("spnHistogramOptions", "display", "none");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divStemplot", "display", "none");
    	UI.setStyleProperty("divDotplotCountingOptions", "display", "block");
        graph.dotplot(graphDataArr, UI.inputStates["txtVariableName"], null, true);
    	handleDotplotCount();
    }
    else // stemplot
    {
        var gapHide = (UI.getProperty("selGapHide", "value") == "yes");
        UI.setStyleProperty("spnGapHide", "display",
            (gapHide ? "inline" : "none"));
        var gap = gapHide ?
                        parseInt(UI.getProperty("numGapHide", "value")) :
                        Number.MAX_VALUE;
        UI.setStyleProperty("spnHistogramOptions", "display", "none");
    	UI.setStyleProperty("divPlot", "display", "none");
    	UI.setStyleProperty("divStemplot", "display", "block");
    	UI.setStyleProperty("divDotplotCountingOptions", "display", "none");
    	stem.stemplot(dataArr, null, UI.inputStates["txtVariableName"],
    	    parseInt(UI.getProperty("selStemplotStems", "value")),
    	    parseInt(UI.getProperty("numSigAdj", "value")),
    	    gap);
    }
}

function replotHistogram()
{
	// validate histogram bin alignment
        var align = util.trimString(UI.getProperty("txtHistogramBinAlignment", "value"));
        if (align.length > 0)
	{
		if (!IV.validateInputFloat("txtHistogramBinAlignment", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
	            "spnHistogramOptionsErrorMsg", "Bin alignment")) return;
        	else
			align = parseFloat(align);
	}
	else
		align = null;

	// validate histogram bin alignment
        var width = util.trimString(UI.getProperty("txtHistogramBinWidth", "value"));
        if (width.length > 0)
	{
		if (!IV.validateInputFloat("txtHistogramBinWidth", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
	            "spnHistogramOptionsErrorMsg", "Bin width")) return;
        	else
			width = parseFloat(width);
	}
	else
		width = null;

    	graph.histogram(graphDataArr, UI.inputStates["txtVariableName"],
                            (UI.getProperty("selHistogramLabel", "value") == "rel"),
			width, align);
}

function resetHistogramOptions()
{
	UI.setProperty("txtHistogramBinAlignment", "value", "");
	UI.setProperty("txtHistogramBinWidth", "value", "");
	replotHistogram();
}

function exportSummaryStatistics()
{
    file.saveCSV("txtSummaryStatisticsCSV", "summary_statistics_" + classCode);
}

function exportGraphData()
{
    file.saveCSV("txtGraphDataCSV", "data_" + classCode);
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