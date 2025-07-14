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

var numGroups = 0;
var dataArr = [];
var optionStemplot = null;
var graphDataArr = null;
var graph = null;
var stem = null;

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
            "divGraphAdminOptions", "divGraphDistributions", 
            "divSummaryStatistics", "txtSummaryStatisticsCSV"], "display", "none");
    UI.batchSetProperty(["spnAdminCode","spnClassCode"],"innerHTML","{none}");
    UI.setProperty("btnEnterAdminCode","disabled",false);
    UI.setStyleProperty("btnEnterAdminCode","display","inline");
    plotEnabled = true;
    checkUIEnabled();
    lastAdd = null;
    lastUndoState = true;
    optionStemplot = document.getElementById("optStemplot");
    selectGraph = document.getElementById("selGraphType");
    if (!graph)
        graph = new STAP.SVGGraph("divPlot");
    else
        graph.clearGraph();
    if (!stem)
        stem = new STAP.HTMLStemplot("divStemplotPlot");
    dataArr = [];
    numGroups = 0;
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
    xhttp.open("GET", "php/_getSharedPlotAllData.php?c=" + classCode, true);
    xhttp.send();
}

function checkUIEnabled()
{
    if (plotEnabled)
    {
        for (var i = 0; i < numGroups; i++)
        {
            UI.setProperty("txtInputBasicData" + (i + 1), "disabled", false);
            UI.setProperty("btnInputBasic" + (i + 1), "disabled", false);
        }
        UI.setProperty("btnUndoLastAdd", "disabled", lastUndoState);
        UI.setProperty("btnPauseStudent", "value", "Pause student data collection");
    }
    else
    {
        if (!adminCode) alert("The teacher has paused the activity.");
        for (var i = 0; i < numGroups; i++)
        {
            UI.setProperty("txtInputBasicData" + (i + 1), "disabled", true);
            UI.setProperty("btnInputBasic" + (i + 1), "disabled", true);
        }
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

function _locateGroup(group)
{
    var sel = document.getElementById("selGroup");
    for (var i = 0; i < sel.options.length; i++)
        if (sel.options[i].text == group) return i;
    return -1;
}

function _groupAlreadyExists(group) { return _locateGroup(group) > -1; }

function doUpdates(responsetext)
{
    var gotEnabled = (responsetext.substring(0, 1) == "1");

    var firstnl = responsetext.indexOf("\n");
    var varname = responsetext.substring(1, firstnl);
    if (UI.inputStates["txtVariableName"] !== varname)
    {
        UI.setProperty("txtVariableName", "value", varname);
        UI.recordInputState("txtVariableName");
    }

    var datatext = responsetext.substring(firstnl + 1).trim();
    var datatextArr = (datatext.length > 0 ? datatext.split("\n") : []);
    var curGroup = -1;
    var optstr = "";

    var sel = document.getElementById("selGroup");
    var selgrp = (sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : "");
    UI.setProperty("selGroup", "innerHTML", "");
    numGroups = 0;
    dataArr = [];
    var tbl = document.getElementById("tblInputBasic");

    // format: GroupID, GroupName, Var1
    for (var i = 0; i < datatextArr.length; i++)
    {
        var arr = datatextArr[i].split(",");
        var propGroup = parseInt(arr[0]) - 1;
        if (curGroup !== propGroup)
        {
            numGroups++;
            curGroup = propGroup;
            dataArr.push([]);
            if (tbl.rows.length < numGroups)
                tbl.insertRow(-1).innerHTML =
                    '<TR><TH SCOPE="row">' + numGroups + '</TH>'
                    + '<TD><SPAN ID="spnInputBasicGroup' + numGroups + '"></SPAN></TD>'
                    + '<TD><INPUT TYPE="number" ID="txtInputBasicData' + numGroups + '" onKeyDown="if (event.which == 13 || event.keyCode == 13) addObservation(' + numGroups + ');" SIZE="50"></TD>'
                    + '<TD CLASS="tableleft"><INPUT TYPE="button" VALUE="Add observation" ID="btnInputBasic' + numGroups + '" onClick="addObservation(' + numGroups + ');"></TD>';          
            UI.setProperty("spnInputBasicGroup" + numGroups, "innerHTML", arr[1]);
            UI.setProperty("btnInputBasic" + numGroups, "disabled", !plotEnabled);
            optstr += "<OPTION VALUE='" + arr[0] + "'>" + arr[1] + "</OPTION>";
        }
        if (arr[2].length > 0)
            dataArr[numGroups - 1].push(parseFloat(arr[2]));
    }
    while (tbl.rows.length > numGroups) tbl.deleteRow(-1);

    if (plotEnabled !== gotEnabled)
    {
        plotEnabled = gotEnabled;
        checkUIEnabled();
    }
    
    UI.setProperty("selGroup", "innerHTML", optstr);
    UI.setProperty("selGroup", "selectedIndex", (selgrp.length > 0 ? _locateGroup(selgrp) : -1));

    if (nextUpdateGroup)
    {
        UI.setProperty("selGroup", "selectedIndex", _locateGroup(nextUpdateGroup));
        setGroupEdit();
        nextUpdateGroup = null;
    }
    
    // update number of groups
    // do not give stemplot option if more than two groups
    if (numGroups < 3)
    {
        if (selectGraph.options.length < 4)
            selectGraph.add(optionStemplot);
    }
    else
    {
        while (selectGraph.options.length > 3)
            selectGraph.remove(3);
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
    UI.batchSetStyleProperty(["divGraphDistributions", "divSummaryStatistics"], "display", "none");
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
                    // don't check enabled UI here since we need to build the interface first
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

function addObservation(groupNum)
{
    if (simpleValidate("txtInputBasicData" + groupNum, "spnDataAddMsg", "Value"))
    {
        var val = UI.getProperty("txtInputBasicData" + groupNum, "value");
        UI.setProperty("txtInputBasicData" + groupNum, "value", "");
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length == 0)
                    {
                        lastAdd = { value: val, group: groupNum };
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
        xhttp.send("c=" + classCode + "&g=" + groupNum + "&v1=" + val);
    }
}

function addBatchData()
{
    if (IV.validateInputFloatArray("txtAdminBatchData", "spnEditMsg", "Data") && confirm("Are you sure? This operation cannot be undone."))
    {
        var datastr = JSON.stringify(
            util.splitStringGetArray(
                UI.getProperty("txtAdminBatchData", "value")
            )
        );
        var groupNum = UI.getProperty("selGroup", "value");
        UI.setProperty("btnAdminBatchData", "disabled", true);
    
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length == 0)
                    {
                        UI.setProperty("txtAdminBatchData", "value", "");
                        tempSetMessage("spnEditMsg", "Operation successful.", 2000);
                        checkClassCodeImmediately();
                    }
                    else
                        tempSetMessage("spnEditMsg", "An error occurred. Please try again later.", 2000);
                    UI.setProperty("btnAdminBatchDAta", "disabled", false);
                }
            }   
        };
        xhttp.open("POST", "php/_addSharedPlotBatchData.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&a=" + adminCode + "&g=" + groupNum + "&d1=" + datastr);
    }
}

function undoLastAdd()
{
    if (lastAdd)
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
                        UI.setProperty("btnUndoLastAdd", "disabled", true);
                        lastAdd = null;
                        lastUndoState = true;
                        tempSetMessage("spnAddUndoMsg", "Operation successful.", 2000);
                        checkClassCodeImmediately();
                    }
                    else
                        tempSetMessage("spnAddUndoMsg", this.responseText, 2000);
                }
            }   
        };
        xhttp.open("POST", "php/_deleteSharedPlotSingleData.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&g=" + lastAdd.group + "&v1=" + lastAdd.value);
    }
}

function _setGroupEditUIEnabled(bEnabled)
{
    UI.batchSetProperty(["txtAdminGroupName", "txtAdminBatchData", "btnAdminGroupName", "btnAdminBatchData"], "disabled", !bEnabled);
}

function setGroupEdit()
{
    var sel = document.getElementById("selGroup");
    var grp = (sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : "");
    if (grp.length > 0)
    {
        _setGroupEditUIEnabled(true);
        UI.setProperty("txtAdminGroupName", "value", grp);
        UI.setProperty("txtAdminBatchData", "value", "");
    }
    else
        _setGroupEditUIEnabled(false);
}

function handleGroupNameChange()
{
    var sel = document.getElementById("selGroup");
    var groupID = sel.selectedIndex + 1;
    var newGroup = UI.getProperty("txtAdminGroupName", "value");
    if (_groupAlreadyExists(newGroup))
    {
        alert("That group already exists.");
        return;
    }
    sel.options[sel.selectedIndex].text = newGroup;
    _handleGroupEdit("g=" + groupID + "&n=" + newGroup, newGroup);
}

var nextUpdateGroup = null;

function addGroup()
{
    var grp = prompt("Enter the group name.");
    if (grp)
    {
        if (_groupAlreadyExists(grp))
        {
            alert("That group already exists.");
            return;
        }
        _handleGroupEdit("n=" + grp, grp);
    }
}

function _handleGroupEdit(str, grp)
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
                    if (grp) nextUpdateGroup = grp;
                }
                else
                    tempSetMessage("spnEditMsg", "There was an error. Please try again later.", 2000);
                checkClassCodeImmediately();
            }
        }   
    };
    xhttp.open("POST", "php/_editSharedPlotGroup.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("c=" + classCode + "&a=" + adminCode + "&" + str);
}

function adminDeleteSingle()
{
    var msgID = "spnDataDeleteMsg";
    var groupNum = UI.getProperty("selGroup", "value");
    if (simpleValidate("txtAdminDelete", msgID, "Value"))
    {
        var val = parseFloat(UI.getProperty("txtAdminDelete", "value"));
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    if (this.responseText.length == 0)
                    {
                        tempSetMessage(msgID, "Operation successful.", 2000);
                        checkClassCodeImmediately();
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
}

function deleteGroup()
{
    var sel = document.getElementById("selGroup");
    if (sel.selectedIndex < 0) return;
    
    if (confirm("Are you sure? This cannot be undone."))
    {
        var groupID = sel.selectedIndex + 1;
        _setEditCategoryUIEnabled(false);
        UI.batchSetProperty(["btnAddGroup", "btnDeleteGroup", "btnDataDeleteAll"], "disabled", true);

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
                        UI.batchSetProperty(["txtAdminGroupName","txtAdminBatchData"],"value","");
                        checkClassCodeImmediately();
                    }
                    else
                        tempSetMessage("spnDeleteDataMsg", "An error occurred. Please try again later.", 2000);
                    _setEditCategoryUIEnabled(true);
                    UI.batchSetProperty(["btnAddGroup", "btnDeleteGroup", "btnDataDeleteAll"], "disabled", false);
                }
            }   
        };
        xhttp.open("POST", "php/_deleteSharedPlotGroup.php", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("c=" + classCode + "&a=" + adminCode + "&g=" + groupID);
    }
}

function handleDeleteAllData()
{
    if (confirm("Are you sure? All data will be deleted for all users."))
    {
        _setEditCategoryUIEnabled(false);
        UI.batchSetProperty(["btnAddGroup", "btnDeleteGroup", "btnDataDeleteAll"], "disabled", true);

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
                    UI.batchSetProperty(["btnAddGroup", "btnDeleteGroup", "btnDataDeleteAll"], "disabled", false);
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
    if (dataArr.length > 0)
    {
        UI.setStyleProperty("divSummaryStatistics", "display", "block");

        var stats = [];
        for (var i = 0; i < numGroups; i++)
            if (dataArr[i].length > 0)
            	stats.push(stat.getOneVariableStatistics(dataArr[i]));
            else
                stats.push(null);
        	
        // Group names
        var groupname = function(i)
        {
        	var name = UI.getProperty("spnInputBasicGroup" + i, "innerHTML");
        	if (name.length == 0) name = "(unnamed)";
        	return name;
        };
        
        // Render a table programmatically
        // Also render a CSV and store it in the hidden textarea
        var tableHTML = "<TABLE><TR><TH>Group Name</TH>";
        tableHTML += "<TH>n</TH><TH>mean</TH><TH>SD</TH><TH>min</TH><TH>Q<sub>1</sub></TH><TH>med</TH><TH>Q<sub>3</sub></TH><TH>max</TH></TR><TR>"
    
        var resultsCSV = "Group Name,n,mean,SD,min,Q1,med,Q3,max\r\n";
    
        for (var i = 1; i <= numGroups; i++)
        {
            var curstat = stats[i - 1];
            if (curstat)
            {
                tableHTML += "<TR><TD>" + i + ": " + groupname(i) + "</TD>"
                + "<TD>" + curstat.n + "</TD><TD>" + format.formatNumber(curstat.mean) + "</TD><TD>" +
                + format.formatNumber(curstat.Sx) + "</TD><TD>"
                + format.formatNumber(curstat.min) + "</TD><TD>" + format.formatNumber(curstat.Q1) + "</TD><TD>"
                + format.formatNumber(curstat.median) + "</TD><TD>" + format.formatNumber(curstat.Q3)
                + "</TD><TD>" + format.formatNumber(curstat.max) + "</TD></TR>";
        
                resultsCSV += groupname(i)
                + "," + curstat.n + "," + format.formatNumber(curstat.mean) + "," + format.formatNumber(curstat.Sx)
                + "," + format.formatNumber(curstat.min) + "," + format.formatNumber(curstat.Q1) + ","
                + format.formatNumber(curstat.median) + "," + format.formatNumber(curstat.Q3) + ","
                + format.formatNumber(curstat.max) + "\r\n";
            }
        }
        tableHTML += "</TABLE>"
        UI.setStyleProperty("spnSummaryStatistics", "display", "inline");
        UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);
        UI.setProperty("txtSummaryStatisticsCSV", "value", resultsCSV);
    }
    else
        UI.setStyleProperty("divSummaryStatistics", "display", "none");
}

function updateGraphDistributions()
{
    if (dataArr.length > 0)
    {
        UI.setStyleProperty("divGraphDistributions", "display", "block");
        UI.setStyleProperty("spnGraphOptions", "display", "inline");
    
        var varname = util.trimString(UI.getProperty("txtVariableName", "value"));
        if (varname.length == 0) varname = "Variable";
    
        var graphType = UI.getProperty("selGraphType", "value");
    
        var graphdatas = [];
        dataArr.forEach(function(arr) { graphdatas.push(util.arrayToGraphData(arr, varname)); });
        var xattrs = [];
        for (var i = 1; i <= numGroups; i++) xattrs.push(UI.getProperty("spnInputBasicGroup" + i, "innerHTML"));
        	
        UI.setStyleProperty("spnHistogramOptions", "display", (graphType == "histogram" ? "inline" : "none"));
        if (graphType == "histogram")
    	{
            UI.setStyleProperty("divPlot", "display", "block");
            UI.setStyleProperty("divStemplot", "display", "none");
    	    var firstBin = null;
    	    var binWidth = null;
    	    if (util.trimString(UI.getProperty("txtHistogramBinAlignment", "value")).length > 0)
    	    {  if (!IV.validateInputFloat("txtHistogramBinAlignment", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
    	            "spnHistogramOptionsErrorMsg", "Bin alignment"))
    	    		return false;
    		else
    			firstBin = parseFloat(UI.getProperty("txtHistogramBinAlignment", "value"));
    	    }
    	
    	    if (util.trimString(UI.getProperty("txtHistogramBinWidth", "value")).length > 0)
    	    {
    		if (!IV.validateInputFloat("txtHistogramBinWidth", 0, Number.MAX_VALUE, true, "spnHistogramOptionsErrorMsg", "Bin width", "should be a positive number."))
    			return false;
    		else
    			binWidth = parseFloat(UI.getProperty("txtHistogramBinWidth", "value"));
    	    }
    
    	    graph.parallelHistogram(graphdatas, xattrs,
    		 varname, (UI.getProperty("selHistogramLabel", "value") == "rel"), binWidth, firstBin);
    	}
    	else if (graphType == "boxplot")
    	{
            UI.setStyleProperty("divPlot", "display", "block");
            UI.setStyleProperty("divStemplot", "display", "none");
    	    graph.parallelBoxplot(graphdatas, xattrs, varname);
    	}
    	else if (graphType == "dotplot")
    	{
            UI.setStyleProperty("divPlot", "display", "block");
            UI.setStyleProperty("divStemplot", "display", "none");
    	    graph.parallelDotplot(graphdatas, xattrs, varname);
    	}
        else // stemplot
        {
            var gapHide = (UI.getProperty("selGapHide", "value") == "yes");
            UI.setStyleProperty("spnGapHide", "display",
                (gapHide ? "inline" : "none"));
            var gap = gapHide ?
                            parseInt(UI.getProperty("numGapHide", "value")) :
                            Number.MAX_VALUE;
            UI.setStyleProperty("divPlot", "display", "none");
            UI.setStyleProperty("divStemplot", "display", "block");
            stem.stemplot(dataArr[0], xattrs[0], varname,
                parseInt(UI.getProperty("selStemplotStems", "value")),
                parseInt(UI.getProperty("numSigAdj", "value")),
                gap, dataArr[1], xattrs[1]);
        }
    }
    else
        UI.setStyleProperty("divGraphDistributions", "display", "none");
}

function setHistogramDefaultBins()
{
	UI.setProperty("txtHistogramBinWidth", "value", "");
	UI.setProperty("txtHistogramBinAlignment", "value", "");
	updateGraphDistributions();
}

function exportSummaryStatistics()
{
    file.saveCSV("txtSummaryStatisticsCSV", "summary_statistics_" + classCode);
}

STAP.UIHandlers.setOnLoad(initializePage);