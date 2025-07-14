var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var _newClassBtnValue = "Start a new class code as a teacher";
var _enterClassBtnValue = "Enter an existing class code";

var _defaultRefreshTime = 2500;
var _defaultMaxRefreshTime = 5000;
var _slowRefreshThreshold = 20000;

var classCode = null;
var adminCode = null;
var refreshTime = _defaultRefreshTime;
var maxRefreshTime = _defaultMaxRefreshTime;
var plotEnabled = true;
var classCodeSetDate = null;
var lastUpdateDate = null;
var lastErrorDate = null;
var variableNames = [];
var groupNames = [];
var rawData = []; // split by groups or variables, but never both

var _schedExec = null;
var _tmpMsgExec = null;
var _slowRefreshExec = null;
var _requestOut = false;
var _slowRefresh = false;

var _addQueue = [];

// required
var fnInitializeBegin = function() {};
var fnDataSyncSuccess = function(bChanged) {};
var fnStudentEnabled = function() {};
var fnStudentDisabled = function() {};
var fnClassCodeSet = function() {};

// optional
var fnSlowRefreshDetected = function() {};
var fnSlowRefreshCleared = function() {};
var fnVariableNameChanged = function() {};
var fnGroupNameChanged = function() {};
var fnInitializeEnd = function() {};
var fnProcessRawData = null; // accept responseText, return true if data changed
var fnDataSyncFail = function() {};
var fnDataSyncError = function(xhttp) {};
var fnAdminCodeSet = function() {};

function tempSetMessage(spnID, msg, timems, bIsErr)
{
    if (_tmpMsgExec) clearTimeout(_tmpMsgExec);
    UI.setProperty(spnID,"innerHTML",msg);
    UI.setProperty(spnID,"className",(bIsErr ? "errormsg" : "successmsg"));
    _tmpMsgExec = setTimeout(function() {
        UI.setProperty(spnID,"innerHTML","");
    }, timems);
}

function simpleValidate(inputID, spnID, param, parseFn)
{
    parseFn = parseFn || parseFloat;
    if (isNaN(parseFn(UI.getProperty(inputID, "value"))))
    {
        tempSetMessage(spnID, "innerHTML", param + " must be a valid numeric value.", 2000, true);
        return false;
    }
    return true;
}

function initializePage()
{
    fnInitializeBegin();
    UI.batchSetProperty(["spnAdminCode","spnClassCode"],"innerHTML","{none}");
    UI.setProperty("btnEnterAdminCode","disabled",false);
    UI.setStyleProperty("btnEnterAdminCode","display","inline");
    UI.batchSetStyleProperty(["divGraphAdmin","divGraphAdminOptions"],"display","none");

    classCode = null;
    adminCode = null;
    refreshTime = _defaultRefreshTime;
    plotEnabled = true;
    lastUpdateDate = null;
    lastErrorDate = null;
    classCodeSetDate = null;
    _requestOut = false;
    _slowRefresh = false;
    variableNames = [];
    groupNames = [];
    if (_schedExec)
    {
        clearTimeout(_schedExec);
        _schedExec = null;
    }
    if (_tmpMsgExec)
    {
        clearTimeout(_tmpMsgExec);
        _tmpMsgExec = null;
    }
    if (_slowRefreshExec)
    {
        clearTimeout(_slowRefreshExec);
        _slowRefreshExec = null;
    }
    _addQueue = [];
    _rawData = [];

    checkUIEnabled(true);
    UI.writeLinkColorOriginRules();
    fnInitializeEnd();
}

function getVariableName(varnum)
{
    return (variableNames.length < varnum ? "Variable " + varnum : variableNames[varnum - 1]);
}

function getGroupName(groupnum)
{
    return (groupNames.length < groupnum ? "Group " + groupnum : groupNames[groupnum - 1]);
}

function getRawDataCSVString(header)
{
    var is2var = (variableNames.length == 2);
    var groups = (!is2var && groupNames.length > 1);
    var str = (header ? header : "" + getVariableName(1) + (is2var ? "," + getVariableName(2) : "") + "\n");
    if (is2var)
    {
        for (var i = 0; i < graphData[0].length; i++)
        {
            str += graphData[0][i] + "," + graphData[1][i];
            if (i + 1 < graphData[0].length) str += "\n";
        }
    }
    else
    {
        if (groups)
            for (var i = 0; i < groupNames.length; i++)
            {
                str += getGroupName(i + 1);
                if (i < groupNames.length - 1) str += ",";
            }
        var maxLength = Math.max.apply(null,
            rawData.map(function(s) { if (s) return s.length; else return 0; }));
        for (var i = 0; i < maxLength; i++)
        {
            var data = graphData.map(function(arr) {
                if (i >= arr.length) return "";
                else return "" + arr[i];
            });
            for (var j = 0; j < data.length; j++)
            {
                str += data[j];
                if (j < data.length - 1) str += ",";
            }
            if ((i + 1) < maxLength)
                str += "\n";
        }
    }
    return str;
}

function checkForSlowRefresh(bInit)
{
    if (!classCode) return;

    if (_slowRefreshExec)
        clearTimeout(_slowRefreshExec);

    _slowRefreshExec = null;
    
    if (!bInit)
    {
        var lastUpdateMS = (lastUpdateDate ? lastUpdateDate.getTime() : 0);
        lastUpdateMS = Math.max((lastErrorDate ? lastErrorDate.getTime() : 0), lastUpdateMS);
        if ((new Date()).getTime() - lastUpdateMS > _slowRefreshThreshold)
        {
            if (!_slowRefresh)
            {
                console.log("Slow refresh detected.")
                fnSlowRefreshDetected();
            }
            _slowRefresh = true;
        }
        else
        {
            if (_slowRefresh)
                fnSlowRefreshCleared();
            _slowRefresh = false;
        }
    }
    
    _slowRefreshExec = setTimeout(checkForSlowRefresh, _slowRefreshThreshold + refreshTime);
}

function queueForAdd1Var(arrData, groupNum) // queues are groups
{
    groupNum = groupNum || 1;
    while (_addQueue.length < groupNum)
        _addQueue.push([]);
    Array.prototype.push.apply(_addQueue[groupNum-1], arrData);
}

function queueForAdd2Var(arrXData, arrYData) // queues are variables
{
    while (_addQueue.length < 2) _addQueue.push([]);
    Array.prototype.push.apply(_addQueue[0], arrXData);
    Array.prototype.push.apply(_addQueue[1], arrYData);
}

function defaultProcessData(responseText)
{
    var rows = responseText.split('\n');
    // process first row for enabled and variable name
    checkUIEnabled(rows[0].charAt(0) == '1');
    var varnames = rows[0].substring(1).split(",");
    var dataChanged = false;
    var newData = [];
    
    if (varnames.length === 1)
    {
        // each row thereafter is a single datum for a group
        var grpnames = [];
        for (var i = 1; i < rows.length; i++)
        {
            var groupData = rows[i].split(",");
            var grpNum = parseInt(groupData[0]);
            if (grpnames.length < grpNum)
                while (grpnames.length < grpNum)
                {
                    grpnames.push("");
                    newData.push([]);
                }
            grpnames[grpNum - 1] = groupData[1];
            if (groupData.length > 2)
                newData[grpNum - 1].push(parseFloat(groupData[2]));
        }

        if (!util.arraysEqual(grpnames, groupNames))
        {
            groupNames = grpnames;
            fnGroupNameChanged();
            dataChanged = true;
        }
    }
    else
    {
        newData.push([]);
        newData.push([]);
        // each row is a single datum
        for (var i = 1; i < rows.length; i++)
        {
            var data = rows[i].split(",");
            newData[0].push(parseFloat(data[0]));
            newData[1].push(parseFloat(data[1]));
        }
    }

    if (!util.arraysEqual(variableNames, varnames))
    {
        variableNames = varnames;
        fnVariableNameChanged();
        dataChanged = true;
    }
    
    dataChanged = dataChanged || (newData.length !== rawData.length);
    if (!dataChanged)
        for (var i = 0; i < rawData.length; i++)
        {
            if (!util.arraysEqual(newData[i], rawData[i]))
            {
                dataChanged = true;
                break;
            }
        }
    
    if (dataChanged)
    {
        refreshTime = _defaultRefreshTime;
        rawData = newData;
    }
    else
        refreshTime = Math.min(refreshTime * 2, maxRefreshTime);
        
    return dataChanged;
}

function _processRawData(responseText)
{
    return (fnProcessRawData ? fnProcessRawData(responseText) :
        defaultProcessData(responseText));
}

function _syncDB()
{
    _schedExec = null;
    _requestOut = true;
    for (var i = 0; i < _addQueue.length; i++)
    {
        if (variableNames.length > 1 && _addQueue.length > 0 && _addQueue[0].length > 0)
        {
            UI.HTTPRequest(false, "php/_addSharedPlotBatchData.php",
                "c=" + classCode + "&d1=" + JSON.stringify(_addQueue[0]) + "&d2=" + JSON.stringify(_addQueue[1]),
                function(responseText) {
                    if (responseText.length > 0)
                        console.log("Unexpected batch result: " + responseText);
                },
                function() {
                    console.log("Could not connect for batch add");
                },
                function(xhttp) {
                    console.log("Server error " + xhttp.status + " on batch add:  " + xhttp.statusText);
                }
            );
            _addQueue[0] = [];
            _addQueue[1] = [];
        }
        else if (_addQueue.length > 0)
        {
            for (var i = 0; i < _addQueue.length; i++)
            {
                if (_addQueue[i].length > 0)
                UI.HTTPRequest(false, "php/_addSharedPlotBatchData.php",
                    "c=" + classCode + "&g=" + (i + 1) + "&d1=" + JSON.stringify(_addQueue[i]),
                    function(responseText) {
                        if (responseText.length > 0)
                            console.log("Unexpected batch result: " + responseText);
                    },
                    function() {
                        console.log("Could not connect for batch add");
                    },
                    function(xhttp) {
                        console.log("Server error " + xhttp.status + " on batch add:  " + xhttp.statusText);
                    }
                );
                _addQueue[i] = [];
            }
        }
    }

    UI.HTTPRequest(true, "php/_getSharedPlotAllData.php", "c=" + classCode,
        function(responseText) {
            if (responseText.length > 0)
            {
                lastUpdateDate = new Date();
                fnDataSyncSuccess(_processRawData(responseText));
                _requestOut = false;
                _schedExec = setTimeout(_syncDB, refreshTime);
                checkForSlowRefresh();
            }
            else
            {
                alert("The class code is invalid or has expired.");
                clearClassCode();
            }
        },
        function() {
            refreshTime = _defaultMaxRefreshTime;
            lastErrorDate = new Date();
            fnDataSyncFail();
            _requestOut = false;
            _schedExec = setTimeout(_syncDB, refreshTime);
            checkForSlowRefresh();
        },
        function(xhttp) {
            refreshTime = _defaultMaxRefreshTime;
            lastErrorDate = new Date();
            fnDataSyncError(xhttp);
            _requestOut = false;
            _schedExec = setTimeout(_syncDB, refreshTime);
            checkForSlowRefresh();
        }
    );
}

function checkUIEnabled(status)
{
    if (plotEnabled == status) return;
    
    plotEnabled = status;
    if (plotEnabled)
    {
        UI.setProperty("btnPauseStudent", "value", "Pause student data collection");
        fnStudentEnabled();
    }
    else
    {
        if (!adminCode) alert("The teacher has paused the activity.");
        UI.setProperty("btnPauseStudent", "value", "Resume student data collection");
        fnStudentDisabled();
    }
}

function setEnablePlot(bEnabled)
{
    if (!adminCode) return;
    
    UI.HTTPRequest(
        false, "php/_setEnabledSharedPlot.php",
        "c=" + classCode + "&a=" + adminCode + "&e=" + (bEnabled ? "1" : "0"),
        function(responseText) {
            if (responseText.length > 0)
                alert("There was a problem pausing the class. Please try again later.");
            else
                checkUIEnabled(bEnabled);
        },
        function () {
            alert("There was a network issue. Please try again later.");
        },
        function () {
            alert("There was a problem pausing the class. Please try again later.");
        }        
    );
}

function toggleEnabled() { setEnablePlot(!plotEnabled); }

function clearClassCode()
{
    if (_schedExec)
    {
        clearTimeout(_schedExec);
        _schedExec = null;
    }
    classCode = null;
    adminCode = null;
    initializePage();
}

function refreshData()
{
    // There's no point in making a database call if there's an unfulfilled request out
    if (!classCode || _requestOut) return;
    if (_schedExec)
    {
        clearTimeout(_schedExec);
        _schedExec = null;
    }
    refreshTime = _defaultRefreshTime;
    _syncDB();
}

function setClassCode(code)
{
    classCode = code;
    adminCode = null;
    _requestOut = false;
    _slowRefresh = false;
    classCodeSetDate = new Date();
    UI.setProperty("btnEnterAdminCode","disabled",false);
    if (_schedExec) clearTimeout(_schedExec);
    UI.setProperty("spnClassCode","innerHTML",code);
    UI.setProperty("spnAdminCode","innerHTML","{none}");
    UI.setStyleProperty("divGraphAdmin","display","block");
    checkForSlowRefresh(true);
    fnClassCodeSet();
    refreshData();
}

function newClassCode(numVar)
{
    numVar = numVar || 1;
    UI.setProperty("btnNewClassCode", "disabled", true);
    UI.setProperty("btnEnterClassCode", "disabled", true);
    UI.setProperty("btnNewClassCode", "value", "Loading...");
    
    UI.HTTPRequest(false, "php/_createSharedPlot.php",
        "q=1&v=" + numVar,
        function(result) {
            if (result.length === 10)
            {
                var ccode = result.substring(0,6);
                var acode = result.substring(6);
                clearClassCode();
                setClassCode(ccode);
                setAdminCode(acode);
                alert("The class was created successfully and will expire in 72 hours.\nClass code: " + ccode + "\nAdmin code: " + acode + "\n\nPlease write down these codes.\n" + "You will not be able to edit the class data without the admin code.");
            }
            UI.setProperty("btnNewClassCode", "value", _newClassBtnValue);
            UI.setProperty("btnNewClassCode", "disabled", false);
            UI.setProperty("btnEnterClassCode", "disabled", false);
        },
        function() {
            alert("Contact with the server failed. Please try again later.");
            UI.setProperty("btnNewClassCode", "value", _newClassBtnValue);
            UI.setProperty("btnNewClassCode", "disabled", false);
            UI.setProperty("btnEnterClassCode", "disabled", false);
        },
        function(xhttp) {
            alert("The server returned an error. Please try again later.");
            UI.setProperty("btnNewClassCode", "value", _newClassBtnValue);
            UI.setProperty("btnNewClassCode", "disabled", false);
            UI.setProperty("btnEnterClassCode", "disabled", false);
        }
    );
}

function enterClassCode(numVar)
{
    numVar = numVar || 1;
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
    UI.setProperty("btnEnterClassCode", "value", "Loading...");
    code = code.toUpperCase();
    
    UI.HTTPRequest(true, "php/_getSharedPlotInfo.php",
        "c=" + code,
        function(responseText) {
            if (responseText.length > 0)
            {
                var info = responseText.split("\n");
                if (parseInt(info[1]) !== 1 && parseInt(info[2]) !== numVar)
                    alert("That class code does not match this activity. Please try again.");
                else
                {
                    clearClassCode();
                    if (info[3] == "0")
                        checkUIEnabled(false);
                    setClassCode(code);
                }
            }
            else
                alert("That code does not exist. Please try again.");
            UI.setProperty("btnEnterClassCode", "value", _enterClassBtnValue);
            UI.setProperty("btnNewClassCode", "disabled", false);
            UI.setProperty("btnEnterClassCode", "disabled", false);
        },
        function() {
            alert("Contact with the server failed. Please try again later.");
            UI.setProperty("btnEnterClassCode", "value", _enterClassBtnValue);
            UI.setProperty("btnNewClassCode", "disabled", false);
            UI.setProperty("btnEnterClassCode", "disabled", false);
        },
        function(xhttp) {
            alert("The server returned an error. Please try again later.");
            UI.setProperty("btnEnterClassCode", "value", _enterClassBtnValue);
            UI.setProperty("btnNewClassCode", "disabled", false);
            UI.setProperty("btnEnterClassCode", "disabled", false);
        }
    );
}

function setAdminCode(code)
{
    adminCode = code;
    UI.setProperty("spnAdminCode", "innerHTML", code);
    UI.setStyleProperty("divGraphAdminOptions","display","block");
    UI.setStyleProperty("btnEnterAdminCode", "display", "none");
    fnAdminCodeSet();
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
    
    UI.HTTPRequest(true, "php/_getSharedPlotInfo.php",
        "c=" + classCode + "&a=" + code,
        function(responseText) {
            if (responseText.length > 0)
                setAdminCode(code);
            else
            {
                alert("That is not the correct code. Please try again.");
                UI.setProperty("btnEnterAdminCode", "disabled", false);
            }
        },
        function() {
            alert("Contact with the server failed. Please try again later.");
            UI.setProperty("btnEnterAdminCode", "disabled", false);
        },
        function(xhttp) {
            alert("The server returned an error. Please try again later.");
            UI.setProperty("btnEnterAdminCode", "disabled", false);
        }
    );
}

function adminChangeVariableName(name, varnum)
{
    if (name.length > 50)
    {
        alert("The variable name must be 50 characters or less.");
        return false;
    }
    else
    {
        varnum = (varnum ? varnum : "1");
        while (variableNames.length < varnum)
            variableNames.push("Variable " + (variableNames.length + 1));
        variableNames[varnum - 1] = name;
        UI.HTTPRequest(false, "php/_editSharedPlotVarName.php",
            "c=" + classCode + "&v=" + varnum + "&n=" + name,
            function(responseText) {
                if (responseText.length > 0)
                    console.log("Unexpected error changing variable name.");
            },
            UI.defaultAsyncFailHandler("variable name change"),
            UI.defaultAsyncErrorHandler("variable name change")
        );
    }
}

function adminChangeGroupName(name, groupnum)
{
    if (name.length > 50)
    {
        alert("The group name must be 50 characters or less.");
        return false;
    }
    else
    {
        groupnum = (groupnum ? groupnum : "1");
        while (groupNames.length < groupnum)
            groupNames.push("Group " + (groupNames.length + 1));
        groupNames[groupnum - 1] = name;
        UI.HTTPRequest(false, "php/_editSharedPlotGroup.php",
            "c=" + classCode + "&a=" + adminCode + "&g=" + groupnum + "&n=" + name,
            function(responseText) {
                if (responseText.length > 0)
                    console.log("Unexpected error changing group name.");
            },
            UI.defaultAsyncFailHandler("group name change"),
            UI.defaultAsyncErrorHandler("group name change")
        );
    }
}

function resetClassExpiration()
{
    UI.HTTPRequest(false, "php/_extendSharedPlot.php",
        "c=" + classCode,
        function(responseText) {
            alert("Class expiration reset successfully.\nThe class will reset 72 hours from now.");            
        },
        function() {
            alert("Contact with the server failed. Please try again later.");
        },
        function(xhttp) {
            alert("The server returned an error. Please try again later.");
        }
    );
}

function handleSingleDataDelete1Var(spnDataId, spnMsgId, groupNum)
{
    groupNum = groupNum || 1;
    if (spnMsgId) UI.setProperty(spnMsgId, "innerHTML", "");  
    if (simpleValidate(spnDataId, spnMsgId))
    {
        var delvar = parseFloat(UI.getProperty(spnDataId,"value"));
        UI.HTTPRequest(false, "php/_deleteSharedPlotSingleData.php",
            "c=" + classCode + "&g=" + groupNum + "&v1=" + delvar,
            function (responseText) {
                if (responseText.length > 0)
                    UI.setProperty(spnMsgId, "innerHTML", responseText);
                else
                {
                    UI.setProperty(spnDataId, "value", "");
                    tempSetMessage(spnMsgId, "Operation successful.", 2000);
                }
            },
            UI.defaultAsyncFailHandler("deleting data"),
            UI.defaultAsyncErrorHandler("deleting data")
        );
    }
}

function handleSingleDataDelete2Var(spnXDataId, spnYDataId, spnMsgId)
{
    if (spnMsgId) UI.setProperty(spnMsgId, "innerHTML", "");  
    if (simpleValidate(spnXDataId, spnMsgId) && simpleValidate(spnYDataId, spnMsgId))
    {
        var delX = parseFloat(UI.getProperty(spnXDataId,"value"));
        var delY = parseFloat(UI.getProperty(spnYDataId,"value"));
        UI.HTTPRequest(false, "php/_deleteSharedPlotSingleData.php",
            "c=" + classCode + "&v1=" + delX + "&v2=" + delY,
            function (responseText) {
                if (responseText.length > 0)
                    UI.setProperty(spnMsgId, "innerHTML", responseText);
                else
                {
                    UI.setProperty(spnXDataId, "value", "");
                    UI.setProperty(spnYDataId, "value", "");
                    tempSetMessage(spnMsgId, "Operation successful.", 2000);
                }
            },
            UI.defaultAsyncFailHandler("deleting data"),
            UI.defaultAsyncErrorHandler("deleting data")
        );
    }
}

function handleDeleteGroupData(spnMsgId, groupNum)
{
    if (confirm("Are you sure? All data for the selected plot will be deleted for all users."))
        UI.HTTPRequest(false, "php/_deleteSharedPlotGroupData.php",
            "c=" + classCode + "&g=" + groupNum + "&a=" + adminCode,
            function(responseText) {
                if (responseText.length > 0)
                    alert("An unknown error occurred. Please try again later.");
                else
                {
                    if (spnMsgId) tempSetMessage(spnMsgId, "Operation successful.", 2000);
                    refreshData();
                }             
            },
            function() {
                alert("Contact with the server failed. Please try again later.");
            },
            function(xhttp) {
                alert("The server returned an error. Please try again later.");
            }
        );
}

function handleDeleteAllData(spnMsgId, fnCallback)
{
    if (confirm("Are you sure? All data will be deleted for all users."))
    UI.HTTPRequest(false, "php/_deleteSharedPlotAllData.php",
        "c=" + classCode + "&a=" + adminCode,
        function (responseText) {
            if (responseText.length > 0)
                alert("An unknown error occurred. Please try again later.");
            else
            {
                if (spnMsgId) tempSetMessage(spnMsgId, "Operation successful.", 2000);
                if (fnCallback) fnCallback();
                refreshData();
            }
        },
        function() {
            alert("Contact with the server failed. Please try again later.");
        },
        function(xhttp) {
            alert("The server returned an error. Please try again later.");
        }
    );
}

STAP.UIHandlers.setOnLoad(initializePage);