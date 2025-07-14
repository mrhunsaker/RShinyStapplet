var classCode = null;
var adminCode = null;
var schedExec = null;
var tmpMsgExec = null;

var refreshTime = 3000;
var plotEnabled = true;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;

var data = new STAP.CategoricalData1Var();
var graph = null;

var lastAdd = null;
var lastUndoState = true;

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
    UI.batchSetStyleProperty(["divInputBasic", "divGraphAdmin", 
            "divGraphAdminOptions", "divGraph", "divSummaryStatistics",
            "txtSummaryStatisticsCSV"], "display", "none");
    UI.batchSetProperty(["spnAdminCode","spnClassCode"],"innerHTML","{none}");
    UI.setProperty("btnEnterAdminCode","disabled",false);
    UI.setStyleProperty("btnEnterAdminCode","display","inline");
    lastAdd = null;
    lastUndoState = true;
    plotEnabled = true;
    checkUIEnabled();
    if (!graph)
        graph = new STAP.SVGGraph("divPlot");
    else
        graph.clearGraph();
    data = new STAP.CategoricalData1Var();
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
    {
        for (var i = 0; i < data.categories.length; i++)
            UI.setProperty("btnInputBasic" + (i + 1), "disabled", false);
        UI.setProperty("btnUndoLastAdd", "disabled", lastUndoState);
        UI.setProperty("btnPauseStudent", "value", "Pause student data collection");
    }
    else
    {
        if (!adminCode) alert("The teacher has paused the activity.");
        for (var i = 0; i < data.categories.length; i++)
            UI.setProperty("btnInputBasic" + (i + 1), "disabled", true);
        UI.setProperty("btnUndoLastAdd", "disabled", true);
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

function doUpdates(responsetext)
{
    var gotEnabled = (responsetext.substring(0, 1) == "1");
    if (plotEnabled !== gotEnabled)
    {
        plotEnabled = gotEnabled;
        checkUIEnabled();
    }

    var firstnl = responsetext.indexOf("\n");
    var varname = responsetext.substring(1, firstnl);
    if (UI.inputStates["txtVariableName"] !== varname)
    {
        UI.setProperty("txtVariableName", "value", varname);
        UI.recordInputState("txtVariableName");
    }

    var datatext = responsetext.substring(firstnl + 1).trim();
    var datatextArr = (datatext.length > 0 ? datatext.split("\n") : []);
    var numCategories = datatextArr.length;
    
    // set up input table
    var tbl = document.getElementById("tblInputBasic");
    while (tbl.rows.length > (numCategories + 1)) tbl.deleteRow(-1);
    for (var i = tbl.rows.length; i < (numCategories + 1); i++)
        tbl.insertRow(-1).innerHTML =
            '<TR><TH SCOPE="row">' + i + '</TH>'
            + '<TD><SPAN ID="spnInputBasicCategory' + i + '"></SPAN></TD>'
            + '<TD><SPAN ID="spnInputBasicFrequency' + i + '"></SPAN></TD>'
            + '<TD CLASS="tableleft"><INPUT TYPE="button" VALUE="Add observation" ID="btnInputBasic' + i + '" onClick="addObservation(' + i + ');"></TD>';

    data = new STAP.CategoricalData1Var();
    var selvalue = UI.getProperty("selCategory", "value");
    UI.setProperty("selCategory", "innerHTML", "");
    var optstr = "";
    
    // Var1, Frequency
    for (var i = 0; i < datatextArr.length; i++)
    {
        var arr = datatextArr[i].split(",");
        data.categories.push(arr[0]);
        data.frequencies[arr[0]] = parseInt(arr[1]);
        UI.setProperty("spnInputBasicCategory" + (i + 1), "innerHTML", arr[0]);
        UI.setProperty("spnInputBasicFrequency" + (i + 1), "innerHTML", arr[1]);
        UI.setProperty("btnInputBasic" + (i + 1), "disabled", !plotEnabled);
        optstr += "<OPTION>" + arr[0] + "</OPTION>";
    }
    UI.setProperty("selCategory", "innerHTML", optstr);
    UI.setProperty("selCategory", "value", selvalue);
    if (nextUpdateCategory)
    {
        UI.setProperty("selCategory", "value", nextUpdateCategory);
        setCategoryEdit();
        nextUpdateCategory = null;
    }    
    updateSummaryStatistics();
    updateGraphDistributions();

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
    UI.batchSetStyleProperty(["divInputBasic","divGraphAdmin"], "display","block");
    UI.batchSetStyleProperty(["divGraph", "divSummaryStatistics"], "display", "none");
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
    xhttp.send("q=0&v=1");
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

function addObservation(catNum)
{
    _addSingleData(UI.getProperty("spnInputBasicCategory" + catNum, "innerHTML"));
}

function _addSingleData(catname)
{
    UI.setProperty("spnDataAddMsg", "innerHTML", "");
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (this.responseText.length == 0)
                {
                    lastAdd = catname;
                    lastUndoState = false;
                    UI.setProperty("btnUndoLastAdd", "disabled", false);
                    tempSetMessage("spnAddUndoMsg", "Data added successfully.", 2000);
                }
                else
                    tempSetMessage("spnAddUndoMsg", "There was an error adding data. Please try again later.", 2000);
                checkClassCodeImmediately();
            }
        }   
    };
    xhttp.open("POST", "php/_addSharedPlotSingleData.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&v1=" + catname);
}

function undoLastAdd()
{
    if (!lastAdd) return;
    
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
                    lastUndoState = true;
                    UI.setProperty("btnUndoLastAdd", "disabled", true);
                    tempSetMessage("spnAddUndoMsg", "Operation successful.", 2000);
                }
                else
                    tempSetMessage("spnAddUndoMsg", "There was an error. Please try again later.", 2000);
                checkClassCodeImmediately();
            }
        }   
    };
    xhttp.open("POST", "php/_decrementSharedPlotCategory.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&v1=" + lastAdd);
}

function _setCategoryEditUIEnabled(bEnabled)
{
    UI.batchSetProperty(["txtAdminCategoryName", "txtAdminFrequency", "btnAdminCategoryName", "btnAdminFrequency"], "disabled", !bEnabled);
}

function setCategoryEdit()
{
    var cat = UI.getProperty("selCategory", "value");
    if (cat.length > 0)
    {
        _setCategoryEditUIEnabled(true);
        UI.setProperty("txtAdminCategoryName", "value", cat);
        UI.setProperty("txtAdminFrequency", "value", data.frequencies[cat]);
    }
    else
        _setCategoryEditUIEnabled(false);
}

function _categoryAlreadyExists(cat)
{
    var sel = document.getElementById("selCategory");
    for (var i = 0; i < sel.options.length; i++)
        if (sel.options[i].text == cat) return true;
    return false;
}

function handleCategoryNameChange()
{
    var sel = document.getElementById("selCategory");
    var oldcat = UI.getProperty("selCategory", "value");
    var newcat = UI.getProperty("txtAdminCategoryName", "value");
    if (_categoryAlreadyExists(newcat))
    {
        alert("That category already exists.");
        return;
    }
    sel.options[sel.selectedIndex].text = newcat;
    _handleCategoryEdit("o=" + oldcat + "&n=" + newcat + "&f=" + data.frequencies[oldcat], newcat);
}

function handleFrequencyChange()
{
    if (simpleValidate("txtAdminFrequency", "spnEditMsg", "Frequency"))
        _handleCategoryEdit("f=" + parseInt(UI.getProperty("txtAdminFrequency", "value")) + "&o=" + UI.getProperty("selCategory", "value"));
}

var nextUpdateCategory = null;

function addCategory()
{
    var cat = prompt("Enter the category name.");
    if (cat)
    {
        if (_categoryAlreadyExists(cat))
        {
            alert("That category already exists.");
            return;
        }
        _handleCategoryEdit("f=0&n=" + cat, cat);
    }
}

function _handleCategoryEdit(str, cat)
{
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == 4)
        {
            if (this.status == 200)
            {
                if (this.responseText.length == 0)
                {
                    tempSetMessage("spnEditMsg", "Operation successful.", 2000);
                    if (cat) nextUpdateCategory = cat;
                }
                else
                    tempSetMessage("spnEditMsg", "There was an error. Please try again later.", 2000);
                checkClassCodeImmediately();
            }
        }   
    };
    xhttp.open("POST", "php/_editSharedPlotCategory.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&a=" + adminCode + "&g=1&" + str);
}

function deleteCategory()
{
    var cat = UI.getProperty("selCategory", "value");
    if (cat.length == 0) return;
    
    if (confirm("Are you sure? This cannot be undone."))
    {
        _setEditCategoryUIEnabled(false);
        UI.batchSetProperty(["btnAddCategory", "btnDeleteCategory", "btnDataDeleteAll"], "disabled", true);

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length == 0)
                    {
                        tempSetMessage("spnDeleteDataMsg", "Operation successful.", 2000);
                        UI.batchSetProperty(["txtAdminCategoryName","txtAdminFrequency"],"value","");
                        checkClassCodeImmediately();
                    }
                    else
                        tempSetMessage("spnDeleteDataMsg", "An error occurred. Please try again later.", 2000);
                    _setEditCategoryUIEnabled(true);
                    UI.batchSetProperty(["btnAddCategory", "btnDeleteCategory", "btnAdminFrequency", "btnAdminCategoryName", "btnDataDeleteAll"], "disabled", false);
                }
            }   
        };
        xhttp.open("POST", "php/_deleteSharedPlotSingleData.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&v1=" + cat);
    }
}

function handleDeleteAllData()
{
    if (confirm("Are you sure? All data will be deleted for all users."))
    {
        _setEditCategoryUIEnabled(false);
        UI.batchSetProperty(["btnAddCategory", "btnDeleteCategory", "btnDataDeleteAll"], "disabled", true);

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length == 0)
                    {
                        tempSetMessage("spnDeleteDataMsg", "Operation successful.", 2000);
                        UI.batchSetProperty(["txtAdminCategoryName","txtAdminFrequency"],"value","");
                        checkClassCodeImmediately();
                    }
                    else
                        tempSetMessage("spnDataDeleteAllMsg", "An error occurred. Please try again later.", 2000);
                    _setEditCategoryUIEnabled(true);
                    UI.batchSetProperty(["btnAddCategory", "btnDeleteCategory", "btnAdminFrequency", "btnAdminCategoryName", "btnDataDeleteAll"], "disabled", false);
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
    if (data.getTotalFrequency() > 0)
    {
        // Render a table programmatically
        var tableHTML = "<TABLE><TR><TH>Category Name</TH><TH>Frequency</TH><TH>Relative Frequency</TH></TR>";
        var total = data.getTotalFrequency();
        var relTotal = 0;
        for (var i = 0; i < data.categories.length; i++)
        {   
            var cat = data.categories[i];
            tableHTML += "<TR><TD>" + cat + "</TD><TD>" + data.frequencies[cat] + "</TD><TD>" +
                format.formatProportion(data.frequencies[cat] / total) + "</TD></TR>";
            relTotal += data.frequencies[cat] / total;
        }
        tableHTML += "<TR><TD>Total</TD><TD>" + total + "</TD><TD>"
                        + format.formatProportion(relTotal) + "</TD></TR>";
        tableHTML += "</TABLE>"
        UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);
    
        // Also render a CSV and store it in the hidden textarea
        var resultsCSV = "Category Name,Frequency,Relative Frequency\r\n";
        for (var i = 0; i < data.categories.length; i++)
        {   
            var cat = data.categories[i];
            resultsCSV += cat + "," + data.frequencies[cat] + ","
                + format.formatProportion(data.frequencies[cat] / total) + "\r\n";
        }
        resultsCSV += "Totals," + total + "," + format.formatProportion(relTotal) + "\r\n";
        UI.setProperty("txtSummaryStatisticsCSV", "value", resultsCSV);
        UI.setStyleProperty("divSummaryStatistics", "display", "block");
    }
    else
        UI.setStyleProperty("divSummaryStatistics", "display", "none");
}

function getVariableName(defaultName)
{
	var attrName = util.trimString(UI.getProperty("txtVariableName", "value"));
	if (attrName.length === 0)
		return defaultName;
	else
		return attrName;
}

function handleBarGraphFreq()
{
	var attrName = getVariableName("Category");
    graph.barChart(data.toDataArray(attrName), attrName,
		(UI.getProperty("selBarGraphFreq", "value") == "rel"));
}

function updateGraphDistributions()
{
    if (data.getTotalFrequency() > 0)
    {
        UI.setStyleProperty("divGraph", "display", "block");
        var graphType = UI.getProperty("selGraphType", "value");
        if (graphType == "bar")
        {
            UI.setStyleProperty("spnBarGraphOptions", "display", "inline");
        	handleBarGraphFreq();
        }
        else
        {
            UI.setStyleProperty("spnBarGraphOptions", "display", "none");
	        var attrName = getVariableName("Category");
        	if (graphType == "seg")
        	{
		        var freq = [];
        		var tot = data.getTotalFrequency();
		        for (var i = 0; i < data.categories.length; i++)
	            freq.push(data.frequencies[data.categories[i]]/tot);
        		graph.stackedBarChart({
		        	columnCategories: [attrName],
		        	rowCategories: data.categories,
		        	getColumnConditionalDistribution: function(d) { return freq; }
        		}, attrName);
        	}
        	else // pie chart
		        graph.pieChart(data.toDataArray(attrName), attrName);
        }
    }
    else
    {
        graph.clearGraph();
        UI.setStyleProperty("divGraph", "display", "none");
    }
}

function exportSummaryStatistics()
{
    file.saveCSV("txtSummaryStatisticsCSV", "summary_statistics_" + classCode);
}

STAP.UIHandlers.setOnLoad(initializePage);