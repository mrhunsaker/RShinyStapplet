var dataArr = null;
var graphDataArr = null;
var graph = null;
var classCode = null;
var schedExec = null;
var pattern = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
var curTrial = 0;
var curCorrect = 0;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var variableName = "Correct number of identifications";

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
    UI.batchSetStyleProperty(["divData", "divGraphDistributions",
            "divSummaryStatistics", "txtSummaryStatisticsCSV",
            "txtGraphDataCSV", "divPlot", "divActivity", "divActivityResults"],
            	"display", "none");
    graph = new STAP.SVGGraph("divPlot");
    UI.writeLinkColorOriginRules();
}

function initializeActivity()
{
    util.knuthShuffle(pattern);
    curTrial = 0;
    curCorrect = 0;
    UI.setProperty("spnTrialNumber","innerHTML","1");
    UI.setStyleProperty("divActivityResults","display","none");
    UI.setStyleProperty("divActivity","display","block");
}

function makeGuess(guess)
{
    UI.setProperty("spnClassCodeMsg", "innerHTML", "");
    if (pattern[curTrial++] == guess) curCorrect++;
    UI.setProperty("spnTrialNumber","innerHTML","" + (curTrial + 1));
    if (curTrial >= 12)
    {
        UI.setStyleProperty("divActivity","display","none");
        addData();
        UI.setProperty("spnNumCorrect","innerHTML","" + curCorrect);
        UI.setStyleProperty("divActivityResults","display","block");
    }
}

function refreshTime()
{
    var num = parseInt(UI.getProperty("txtRefreshTime", "value"));
    if (isNaN(num)) num = 5;
    if (num < 0) num = 0;
    if (num > 30) num = 30;
    
    return 1000 * num;
}

function checkRefresh()
{
    var refr = refreshTime();
    if (schedExec)
    {
        clearTimeout(schedExec);
        schedExec = null;
    }
    if (refr)
        schedExec = setTimeout(checkClassCode, refr);
    else if (schedExec)
        clearTimeout(schedExec);
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
                UI.setProperty("txtGraphDataCSV", "value", this.responseText);
            }
            checkRefresh();
        }   
    };
    xhttp.open("GET", "php/_getSharedPlotData.php?c=" + classCode, true);
    xhttp.send();
}

function doUpdates(text)
{
    var firstnl = text.indexOf("\n");
    var datatext = text.substring(firstnl + 1);
    if (util.trimString(datatext) == "")
    {
        dataArr = null;
        graphDataArr = null;
        UI.batchSetStyleProperty(["divGraphDistributions",
                "divSummaryStatistics"],
                	"display", "none");
    }    
    else
    {
        dataArr = util.splitStringGetArray(datatext);
        updateSummaryStatistics();
        updateGraphDistributions();
        UI.batchSetStyleProperty(["divGraphDistributions",
                "divSummaryStatistics"],
                	"display", "block");
    }
}

function setClassCode(code)
{
    classCode = code;
    if (schedExec) clearTimeout(schedExec);
//    UI.setProperty("spnClassCode","innerHTML",code);
    UI.batchSetStyleProperty(["divGraphDistributions",
            "divSummaryStatistics"],
            	"display", "none");
    dataArr = null;
    graphDataArr = null;
    checkClassCode();
    initializeActivity();
}

function newClassCode()
{
    UI.setProperty("btnNewClassCode", "disabled", true);
    UI.setProperty("btnEnterClassCode", "disabled", true);
    UI.setProperty("btnNewClassCode", "value", "Creating...");
    UI.setProperty("spnClassCodeMsg", "innerHTML", "");
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                var text = util.trimString(this.responseText);
                if (text.length === 10)
                {
                    var cCode = text.substring(0,6);
                    var aCode = text.substring(6);
                    setClassCode(cCode);
                    alert("Class created successfully. This class code will expire in 72 hours.");
                    UI.setProperty("spnClassCode", "innerHTML", cCode + "<BR>Admin code: " + aCode);
                    setVariableName();
                }
                else
                {
                    UI.setProperty("spnClassCodeMsg", "innerHTML",
                        "An error occurred. Please try again.");
                }
                UI.setProperty("btnNewClassCode", "disabled", false);
                UI.setProperty("btnEnterClassCode", "disabled", false);
                UI.setProperty("btnNewClassCode", "value", "Generate new");
            }    
        }        
    };
    xhttp.open("POST", "php/_createSharedPlot.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("q=1&v=1");
}

function setVariableName()
{
    var xhttp = new XMLHttpRequest();
    // Fail silently if it doesn't work
    xhttp.open("POST", "php/_editSharedPlotVarName.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&v=1&n=" + variableName);
}

function enterClassCode()
{
    UI.setProperty("btnNewClassCode", "disabled", true);
    UI.setProperty("btnEnterClassCode", "disabled", true);

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
    UI.setProperty("spnClassCodeMsg", "innerHTML", "");
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (this.responseText.length > 0)
                    setClassCode(code);
                else
                    UI.setProperty("spnClassCodeMsg", "innerHTML",
                        "That code does not exist. Please try again.");
                UI.setProperty("btnNewClassCode", "disabled", false);
                UI.setProperty("btnEnterClassCode", "disabled", false);
            }
        }   
    };
    xhttp.open("GET", "php/_getSharedPlotInfo.php?c=" + code, true);
    xhttp.send();
}

function handleDataAddChange()
{
    UI.setProperty("spnDataAddMsg", "innerHTML", "");  
}

function addData()
{
    UI.setProperty("spnDataAddMsg", "innerHTML", "");  
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                UI.setProperty("spnDataAddMsg", "innerHTML",
                    this.responseText);
            }
        }   
    };
    xhttp.open("POST", "php/_addSharedPlotSingleData.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&v1=" + curCorrect);
}

function updateSummaryStatistics()
{
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
    graph.setTitle(variableName);
    graphDataArr = util.arrayToGraphData(dataArr, variableName);

	UI.setStyleProperty("divPlot", "display", "block");
	UI.setStyleProperty("divDotplotCountingOptions", "display", "block");
	graph.dotplot(graphDataArr, variableName, null, true);
}

function exportSummaryStatistics()
{
    file.saveCSV("txtSummaryStatisticsCSV", "parkinsons_statistics_" + classCode);
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