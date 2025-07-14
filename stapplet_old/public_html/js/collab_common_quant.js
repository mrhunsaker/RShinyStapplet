var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var _newClassBtnValue = "Start a new class code as a teacher";
var _enterClassBtnValue = "Enter an existing class code";
var _pauseBtnPauseValue = "Pause data collection";
var _pauseBtnEnableValue = "Enable data collection for 5 minutes";

var _defaultAdminRefreshTime = 2000;
var _defaultStudentRefreshTime = 5000;
var _defaultMaxRefreshTime = 20000;
var _slowRefreshThreshold = 30000;
var _disableTimeout = 300000;
var _idleTimeout = 300000;
var _disableWarningWindow = 10000;

var classCode = null;
var adminCode = null;
var defaultRefreshTime = _defaultStudentRefreshTime;
var refreshTime = defaultRefreshTime;
var maxRefreshTime = _defaultMaxRefreshTime;
var plotEnabled = true;
var idleTriggered = false;
var lastUpdateDate = null;
var lastErrorDate = null;
var variableNames = [];
var groupNames = [];
var rawData = []; // split by groups or variables, but never both
var ignoreNextRefresh = false;
var ignoreCacheNextRequest = false;

var _shutoffExec = null;
var _disableExec = null;
var _disableWarningExec = null;
var _schedExec = null;
var _slowRefreshExec = null;
var slowRefreshDetected = false;

var _addQueue = [];

// required
var fnInitializeBegin = function() {};
var fnDataSyncSuccess = function(bChanged) {};
var fnStudentEnabled = function() {};
var fnStudentDisabled = function() {};
var fnClassCodeSet = function() {};

// optional
var fnVariableNameChanged = function() {};
var fnGroupNameChanged = function() {};
var fnInitializeEnd = function() {};
var fnProcessRawData = null; // accept responseText, return true if data changed
var fnDataSyncFail = function() {};
var fnDataSyncError = function(xhttp) {};
var fnAdminCodeSet = function() {};
var fnIdleShutdown = null; // no parameters; default is just fnStudentDisabled

function simpleValidate(inputID, spnID, param, parseFn)
{
    parseFn = parseFn || parseFloat;
    if (isNaN(parseFn(UI.getProperty(inputID, "value"))))
    {
        UI.tempSetMessage(spnID, "innerHTML", param + " must be a valid numeric value.", 2000, true);
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
    UI.batchSetStyleProperty(["spnRenewBtn","divGraphAdmin","divGraphAdminOptions"],"display","none");

    classCode = null;
    adminCode = null;
    refreshTime = _defaultStudentRefreshTime;
    defaultRefreshTime = refreshTime;
    plotEnabled = true;
    idleTriggered = false;
    lastUpdateDate = null;
    lastErrorDate = null;
    slowRefreshDetected = false;
    variableNames = [];
    groupNames = [];
    if (_schedExec)
    {
        clearTimeout(_schedExec);
        _schedExec = null;
    }
    if (_slowRefreshExec)
    {
        clearTimeout(_slowRefreshExec);
        _slowRefreshExec = null;
    }
    if (_disableExec)
    {
        clearTimeout(_disableExec);
        _disableExec = null;
    }
    if (_disableWarningExec)
    {
        clearTimeout(_disableExec);
        _disableExec = null;
    }
    if (_shutoffExec)
    {
        clearTimeout(_shutoffExec);
        _shutoffExec = null;
    }
    _addQueue = [];
    rawData = [];

    checkUIEnabled(true);
    UI.writeLinkColorOriginRules();
    fnInitializeEnd();
}

function idleShutdown()
{
    idleTriggered = true;
    if (_schedExec)
    {
        clearTimeout(_schedExec);
        _schedExec = null;
    }
    if (_slowRefreshExec)
    {
        clearTimeout(_slowRefreshExec);
        _slowRefreshExec = null;
    }
    _shutoffExec = null;
    UI.overlayWarning("divOverlayWarning", "Refreshing is paused on this page due to inactivity. Click here to begin refreshing again.", 0, resetIdle);
    if (!fnIdleShutdown)
        fnStudentDisabled();
    else
        fnIdleShutdown();
}

function resetIdle()
{
    if (!classCode) return;
    
    if (_shutoffExec)
    {
        clearTimeout(_shutoffExec);
        _shutoffExec = null;
    }
    _shutoffExec = setTimeout(idleShutdown, _idleTimeout);
    if (idleTriggered)
    {
        UI.clearOverlayWarning("divOverlayWarning");
        forceRefresh();
    }
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
    var str = (header ? header : "" + getVariableName(1) + (is2var ? "," + getVariableName(2) : ""))  + "\n";
    if (is2var)
    {
        for (var i = 0; i < rawData[0].length; i++)
        {
            str += rawData[0][i] + "," + rawData[1][i];
            if (i + 1 < rawData[0].length) str += "\n";
        }
    }
    else
    {
        if (groups)
        {
            for (var i = 0; i < groupNames.length; i++)
            {
                str += getGroupName(i + 1);
                if (i < groupNames.length - 1) str += ",";
            }
            str += "\n";
        }
        var maxLength = Math.max.apply(null,
            rawData.map(function(s) { if (s) return s.length; else return 0; }));
        for (var i = 0; i < maxLength; i++)
        {
            var data = rawData.map(function(arr) {
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

    // If we're already in an inactivity state, don't also do this check.
    if (idleTriggered) return;

    if (_slowRefreshExec)
        clearTimeout(_slowRefreshExec);

    _slowRefreshExec = null;
    
    if (!bInit)
    {
        var lastUpdateMS = (lastUpdateDate ? lastUpdateDate.getTime() : 0);
        lastUpdateMS = Math.max((lastErrorDate ? lastErrorDate.getTime() : 0), lastUpdateMS);
        if ((new Date()).getTime() - lastUpdateMS > _slowRefreshThreshold)
        {
            if (!slowRefreshDetected)
                UI.overlayWarning("divOverlayWarning", "The server appears to be busy. Please wait. If nothing happens for a while, click here to try a manual refresh.", 0, resetIdle);
            slowRefreshDetected = true;
        }
        else
        {
            slowRefreshDetected = false;
        }
    }
    
    _slowRefreshExec = setTimeout(checkForSlowRefresh, _slowRefreshThreshold);
}

function forceRefresh()
{
    UI.setProperty("spnLastUpdate", "innerHTML", "Refreshing, please wait...");
    ignoreNextRefresh = false;
    slowRefreshDetected = false;
    idleTriggered = false;
    checkForSlowRefresh(true);
    refreshData(true);
}

function queueForAdd1Var(arrData, groupNum) // queues are groups
{
    if (!classCode) return;
    ignoreNextRefresh = true;

    groupNum = groupNum || 1;
    while (_addQueue.length < groupNum)
        _addQueue.push([]);
    Array.prototype.push.apply(_addQueue[groupNum-1], arrData);
    resetIdle();
}

function queueForAdd2Var(arrXData, arrYData) // queues are variables
{
    if (!classCode) return;
    ignoreNextRefresh = true;

    while (_addQueue.length < 2) _addQueue.push([]);
    Array.prototype.push.apply(_addQueue[0], arrXData);
    Array.prototype.push.apply(_addQueue[1], arrYData);
    resetIdle();
}

function defaultProcessData(responseText)
{
    var rows = responseText.split('\n');

    // process first row for enabled and variable name
    checkUIEnabled(rows[0].charAt(0) == '1');
    // the second character indicates the number of variables
    var numvars = parseInt(rows[0].charAt(1));

    var varnames = rows[0].substring(2).split(",");
    var dataChanged = false;
    var newData = [];
    
    if (numvars == 1)
    {
        // each row thereafter is a single datum for a group
        var grpnames = varnames.slice(1);
        varnames = [varnames[0]];
        while (newData.length < grpnames.length)
            newData.push([]);
        for (var i = 1; i < rows.length; i++)
        {
            var groupData = rows[i].split(",");
            var grpNum = parseInt(groupData[0]);
            newData[grpNum - 1].push(parseFloat(groupData[1]));
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
        refreshTime = defaultRefreshTime;
        rawData = newData;
    }
    else
        refreshTime = Math.min(refreshTime * 2, maxRefreshTime);
        
    return dataChanged;
}

function _processRawData(responseText)
{
    var changed = (fnProcessRawData ? fnProcessRawData(responseText) :
        defaultProcessData(responseText));
    if (changed) resetIdle();
    return changed;
}

function _syncDB()
{
    _schedExec = null;
    
    if (idleTriggered) return;

    var getData = function()
    {
        if (UI.activeHTTPRequests)
            _schedExec = setTimeout(_syncDB, _defaultAdminRefreshTime);
        else
        {
            var qstring = "c=" + classCode + (ignoreCacheNextRequest ? "&i=1" : "");
            if (ignoreCacheNextRequest) ignoreCacheNextRequest = false;
            UI.HTTPRequest(true, "php/_getSharedPlotAllData.php",
                qstring,
                function(responseText) {
                    if (responseText.length > 0)
                    {
                        lastUpdateDate = new Date();
                        if (!ignoreNextRefresh)
                            fnDataSyncSuccess(_processRawData(responseText));
                        else if (adminCode)
                            ignoreCacheNextRequest = true;
                        _schedExec = setTimeout(_syncDB, refreshTime);
                        ignoreNextRefresh = false;
                        checkForSlowRefresh();
                    }
                    else
                    {
                        alert("The class code is invalid or has expired.");
                        clearClassCode();
                    }
                },
                function() {
                    ignoreNextRefresh = false;
                    refreshTime = _defaultMaxRefreshTime;
                    fnDataSyncFail();
                    _schedExec = setTimeout(_syncDB, refreshTime);
                    checkForSlowRefresh();
                },
                function(xhttp) {
                    ignoreNextRefresh = false;
                    refreshTime = _defaultMaxRefreshTime;
                    fnDataSyncError(xhttp);
                    _schedExec = setTimeout(_syncDB, refreshTime);
                    checkForSlowRefresh();
                }
            );
        }
    };
    
    var needData = true;
    for (var i = 0; i < _addQueue.length; i++)
    {
        if (variableNames.length > 1 && _addQueue.length > 0 && _addQueue[0].length > 0)
        {
            needData = false;
            UI.HTTPRequest(false, "php/_addSharedPlotBatchData.php",
                "c=" + classCode + "&d1=" + JSON.stringify(_addQueue[0]) + "&d2=" + JSON.stringify(_addQueue[1]),
                function(responseText) {
                    if (responseText.length > 0)
                        console.log("Unexpected batch result: " + responseText);
                    getData();
                },
                function() {
                    console.log("Could not connect for batch add");
                    getData();
                },
                function(xhttp) {
                    console.log("Server error " + xhttp.status + " on batch add:  " + xhttp.statusText);
                    getData();
                }
            );
            _addQueue[0] = [];
            _addQueue[1] = [];
        }
        else if (_addQueue.length > 0)
        {
            var attachPoint = -1;
            for (var i = 0; i < _addQueue.length; i++)
            {
                if (_addQueue[i].length > 0)
                {
                    needData = false;
                    attachPoint = i;
                }
            }
            for (var i = 0; i < _addQueue.length; i++)
            {
                if (_addQueue[i].length > 0)
                {
                    var fnsucc = (i == attachPoint ?                     function(responseText) {
                            if (responseText.length > 0)
                            console.log("Unexpected batch result: " + responseText);
                            getData();
                        } :
                        function(responseText) {
                        if (responseText.length > 0)
                            console.log("Unexpected batch result: " + responseText);
                        });
                UI.HTTPRequest(false, "php/_addSharedPlotBatchData.php",
                    "c=" + classCode + "&g=" + (i + 1) + "&d1=" + JSON.stringify(_addQueue[i]),
                    fnsucc,
                    function() {
                        console.log("Could not connect for batch add");
                        getData();
                    },
                    function(xhttp) {
                        console.log("Server error " + xhttp.status + " on batch add:  " + xhttp.statusText);
                        getData();
                    }
                );
                }
                _addQueue[i] = [];
            }
        }
    }
    
    if (needData) getData();
}

function autoDisablePlot()
{ 
    _disableExec = null;
    setEnablePlot(false);
}

function autoDisableWarning()
{
    _disableWarningExec = null;
    UI.overlayWarning("divOverlayWarning", "Data collection is about to be paused. Click here to extend it for another 5 minutes, or use the teacher panel.", 5000, renewDataCollection);
}

function checkUIEnabled(status, bAdminInitiated)
{
    var isRedundant = (status == plotEnabled);
    
    plotEnabled = status;
    if (plotEnabled)
    {
        if (adminCode && (!isRedundant || bAdminInitiated))
        {
            if (_disableExec)
                clearTimeout(_disableExec);
            if (_disableWarningExec)
                clearTimeout(_disableWarningExec);
            _disableExec = setTimeout(autoDisablePlot, _disableTimeout);
            _disableWarningExec = setTimeout(autoDisableWarning, _disableTimeout - _disableWarningWindow);
        }
        if (bAdminInitiated || !isRedundant)
            UI.overlayWarning("divOverlayWarning", "Data collection has been enabled for the next 5 minutes.", 3000);        
        UI.setProperty("btnPauseStudent", "value", _pauseBtnPauseValue);
        UI.setStyleProperty("spnRenewBtn", "display", "inline");
        fnStudentEnabled();
    }
    else
    {
        if (!(adminCode || isRedundant))
            UI.overlayWarning("divOverlayWarning", "Data collection has been paused.", 3000);
        UI.setProperty("btnPauseStudent", "value", _pauseBtnEnableValue);
        UI.setStyleProperty("spnRenewBtn", "display", "none");
        fnStudentDisabled();
    }
}

function setEnablePlot(bEnabled, bAdminInitiated)
{
    if (!adminCode) return;

    UI.HTTPRequest(
        false, "php/_setEnabledSharedPlot.php",
        "c=" + classCode + "&a=" + adminCode + "&e=" + (bEnabled ? "1" : "0"),
        function(responseText) {
            if (responseText.length == 0)
            {
                checkUIEnabled(bEnabled, bAdminInitiated);
                ignoreNextRefresh = true;
            }
        },
        function () {
            console.log("Trouble connecting to network while pausing or enabling the class.");
        },
        function (xhttp) {
            console.log("Server returned status " + xhttp.status + " [" + xhttp.statusText + "] while pausing or enabling the class.");
        }        
    );
}

function toggleEnabled()
{
    resetIdle();
    setEnablePlot(!plotEnabled, true);
}

function renewDataCollection()
{
    resetIdle();
    setEnablePlot(true, true);
}

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

function refreshData(bIgnoreRequest)
{
    // There's no point in making a database call if there's an unfulfilled request out
    if (!classCode) return;
    if (!bIgnoreRequest && UI.activeHTTPRequests) return;
    if (_schedExec)
    {
        clearTimeout(_schedExec);
        _schedExec = null;
    }
    refreshTime = defaultRefreshTime;
    _syncDB();
}

function setClassCode(code)
{
    classCode = code;
    adminCode = null;
    UI.setProperty("btnEnterAdminCode","disabled",false);
    if (_schedExec) clearTimeout(_schedExec);
    UI.setProperty("spnClassCode","innerHTML",code);
    UI.setProperty("spnAdminCode","innerHTML","{none}");
    UI.setStyleProperty("divGraphAdmin","display","block");
    checkForSlowRefresh(true);
    resetIdle();
    fnClassCodeSet();
    refreshData();
}

function newClassCode(numVar, numGroups)
{
    numVar = numVar || 1;
    numGroups = numGroups || 1;
    UI.setProperty("btnNewClassCode", "disabled", true);
    UI.setProperty("btnEnterClassCode", "disabled", true);
    UI.setProperty("btnNewClassCode", "value", "Loading...");
    
    UI.HTTPRequest(false, "php/_createSharedPlot.php",
        "q=1&v=" + numVar + "&g=" + numGroups,
        function(result) {
            if (result.length === 10)
            {
                var ccode = result.substring(0,6);
                var acode = result.substring(6);
                clearClassCode();
                setClassCode(ccode);
                adminCode = acode;
                defaultRefreshTime = _defaultAdminRefreshTime;
                refreshTime = defaultRefreshTime;
                resetIdle();
                UI.setProperty("spnAdminCode", "innerHTML", acode);
                UI.setStyleProperty("divGraphAdminOptions","display","block");
                UI.setStyleProperty("btnEnterAdminCode", "display", "none");
                fnAdminCodeSet();
                
                alert("The class was created successfully and will expire in 72 hours.\nTo begin data collection, click the 'Enable Data Collection' button in the Teacher Panel at the bottom of the page.\n\nClass code (for everyone): " + ccode + "\nAdmin code (for you): " + acode + "\n\nPlease write down these codes.\n" + "You will not be able to access the Teacher Panel without the admin code.");
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
                    checkUIEnabled(info[3] == "1");
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
            {
                adminCode = code;
                defaultRefreshTime = _defaultAdminRefreshTime;
                refreshTime = defaultRefreshTime;
                resetIdle();
                UI.setProperty("spnAdminCode", "innerHTML", code);
                UI.setStyleProperty("divGraphAdminOptions","display","block");
                UI.setStyleProperty("btnEnterAdminCode", "display", "none");
                fnAdminCodeSet();
            }
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

function adminChangeVariableName(name, varnum, spnErrId, fnCallback)
{
    resetIdle();
    if (spnErrId) UI.setProperty(spnErrId, "innerHTML", "");
    if (name.length > 50)
    {
        if (spnErrId)
            UI.tempSetMessage(spnErrId, "The variable name must be 50 characters or less.", 3000, true);
        else
            alert("The variable name must be 50 characters or less.");
        return false;
    }
    else
    {
        varnum = (varnum ? varnum : "1");
        variableNames[varnum - 1] = name;
        UI.HTTPRequest(false, "php/_editSharedPlotVarName.php",
            "c=" + classCode + "&v=" + varnum + "&n=" + name,
            function(responseText) {
                if (responseText.length > 0)
                {
                    if (spnErrId)
                        UI.tempSetMessage(spnErrId, "The server was not able to change the variable name. Please try again later.", 3000, true);
                    if (fnCallback) fnCallback(false);
                }
                else
                {
                    UI.tempSetMessage(spnErrId, "Operation successful.", 2000);
                    if (fnCallback) fnCallback(true);
                    ignoreNextRefresh = true;
                }
            },
            UI.defaultAsyncFailHandler("variable name change"),
            UI.defaultAsyncErrorHandler("variable name change")
        );
    }
}

function adminChangeGroupName(name, groupnum, spnErrId, fnCallback)
{
    resetIdle();
    if (spnErrId) UI.setProperty(spnErrId, "innerHTML", "");
    if (name.length > 50)
    {
        if (spnErrId)
            UI.tempSetMessage(spnErrId, "The group name must be 50 characters or less.", 3000);
        else
            alert("The group name must be 50 characters or less.");
        return false;
    }
    else
    {
        groupnum = (groupnum ? groupnum : "1");
        groupNames[groupnum - 1] = name;
        UI.HTTPRequest(false, "php/_editSharedPlotGroup.php",
            "c=" + classCode + "&a=" + adminCode + "&g=" + groupnum + "&n=" + name,
            function(responseText) {
                if (responseText.length > 0)
                {
                    if (spnErrId)
                        UI.tempSetMessage(spnErrId, "The server was not able to change the group name. Please try again later.", 3000, true);
                    if (fnCallback) fnCallback(false);
                }
                else
                {
                    UI.tempSetMessage(spnErrId, "Operation successful.", 2000);
                    if (fnCallback) fnCallback(true);
                    ignoreNextRefresh = true;
                }
            },
            UI.defaultAsyncFailHandler("group name change"),
            UI.defaultAsyncErrorHandler("group name change")
        );
    }
}

function adminDeleteGroup(groupnum, spnErrId, fnCallback)
{
    resetIdle();
    if (spnErrId) UI.setProperty(spnErrId, "innerHTML", "");

    UI.HTTPRequest(false, "php/_deleteSharedPlotGroup.php",
        "c=" + classCode + "&a=" + adminCode + "&g=" + groupnum,
        function(responseText) {
            if (responseText.length > 0)
            {
                if (spnErrId)
                    UI.tempSetMessage(spnErrId, "The server was not able to delete the group. Please try again later.", 3000, true);
                if (fnCallback) fnCallback(false);
            }
            else
            {
                UI.tempSetMessage(spnErrId, "Operation successful.", 2000);
                if (fnCallback) fnCallback(true);
                ignoreNextRefresh = true;
            }
        },
        UI.defaultAsyncFailHandler("delete group"),
        UI.defaultAsyncErrorHandler("delete group")
    );
}

function adminAddGroup(name, spnErrId, fnCallback)
{
    resetIdle();
    if (spnErrId) UI.setProperty(spnErrId, "innerHTML", "");
    if (name.length > 50)
    {
        if (spnErrId)
            UI.tempSetMessage(spnErrId, "The group name must be 50 characters or less.", 3000);
        else
            alert("The group name must be 50 characters or less.");
        return false;
    }
    else
    {
        UI.HTTPRequest(false, "php/_editSharedPlotGroup.php",
            "c=" + classCode + "&a=" + adminCode + "&n=" + name,
            function(responseText) {
                if (responseText.length > 0)
                {
                    if (spnErrId)
                        UI.tempSetMessage(spnErrId, "The server was not able to add the new group. Please try again later.", 3000, true);
                    if (fnCallback) fnCallback(false);
                }
                else
                {
                    UI.tempSetMessage(spnErrId, "Operation successful.", 2000);
                    if (fnCallback) fnCallback(true);
                    ignoreNextRefresh = true;
                }
            },
            UI.defaultAsyncFailHandler("group add"),
            UI.defaultAsyncErrorHandler("group add")
        );
    }    
}

function resetClassExpiration()
{
    resetIdle();
    UI.HTTPRequest(false, "php/_extendSharedPlot.php",
        "c=" + classCode,
        function(responseText) {
            UI.overlayWarning("divOverlayWarning", "Class expiration reset successfully.\nThe class will reset 72 hours from now.", 3000);
        },
        function() {
            UI.overlayWarning("divOverlayWarning", "Contact with the server failed. Please try again later.", 3000);
        },
        function(xhttp) {
            UI.overlayWarning("divOverlayWarning", "The server returned an error. Please try again later.", 3000);
        }
    );
}

function adminSingleDataDelete1Var(val, spnMsgId, groupNum, fnCallback)
{
    resetIdle();
    groupNum = groupNum || 1;
    if (spnMsgId) UI.setProperty(spnMsgId, "innerHTML", "");  

    UI.HTTPRequest(false, "php/_deleteSharedPlotSingleData.php",
        "c=" + classCode + "&g=" + groupNum + "&v1=" + val,
        function (responseText) {
            if (responseText.length > 0)
            {
                UI.tempSetMessage(spnMsgId, responseText, 3000);
                if (fnCallback) fnCallback(false);
            }
            else
            {
                UI.tempSetMessage(spnMsgId, "Operation successful.", 2000);
                if (fnCallback) fnCallback(true);
                ignoreNextRefresh = true;
            }
        },
        UI.defaultAsyncFailHandler("deleting value " + val),
        UI.defaultAsyncErrorHandler("deleting value " + val)
    );
}

function adminSingleDataDelete2Var(delX, delY, spnMsgId, fnCallback)
{
    resetIdle();
    if (spnMsgId) UI.setProperty(spnMsgId, "innerHTML", "");  

    UI.HTTPRequest(false, "php/_deleteSharedPlotSingleData.php",
        "c=" + classCode + "&v1=" + delX + "&v2=" + delY,
        function (responseText) {
            if (responseText.length > 0)
            {
                UI.tempSetMessage(spnMsgId, responseText, 3000);
                if (fnCallback) fnCallback(false);
            }
            else
            {
                UI.tempSetMessage(spnMsgId, "Operation successful.", 2000);
                if (fnCallback) fnCallback(true);
                ignoreNextRefresh = true;
            }
        },
        UI.defaultAsyncFailHandler("deleting data"),
        UI.defaultAsyncErrorHandler("deleting data")
    );
}

function adminDeleteGroupData(groupNum, spnMsgId, fnCallback)
{
    resetIdle();
    if (spnMsgId) UI.setProperty(spnMsgId, "innerHTML", "");  

    UI.HTTPRequest(false, "php/_deleteSharedPlotGroupData.php",
        "c=" + classCode + "&g=" + groupNum + "&a=" + adminCode,
        function(responseText) {
            if (responseText.length > 0)
            {
                alert("An unknown error occurred. Please try again later.");
                if (fnCallback) fnCallback(false);
            }
            else
            {
                if (spnMsgId) UI.tempSetMessage(spnMsgId, "Operation successful.", 2000);
                if (fnCallback) fnCallback(true);
                ignoreNextRefresh = true;
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

function adminDeleteAllData(spnMsgId, fnCallback)
{
    resetIdle();
    if (spnMsgId) UI.setProperty(spnMsgId, "innerHTML", "");  

    UI.HTTPRequest(false, "php/_deleteSharedPlotAllData.php",
        "c=" + classCode + "&a=" + adminCode,
        function (responseText) {
            if (responseText.length > 0)
            {
                alert("An unknown error occurred. Please try again later.");
                if (fnCallback) fnCallback(false);
            }
            else
            {
                if (spnMsgId) UI.tempSetMessage(spnMsgId, "Operation successful.", 2000);
                if (fnCallback) fnCallback(true);
                ignoreNextRefresh = true;
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

var _adminEditCtlId = null;
var _adminEditCtlOldValue = null;
var _adminEditCtlFinalValue = null;

// On each page's codebehind, set the adminEditControlsArray to make use of this
function disableAdminEditing(ctlHighlightId, ctlTempValue, ctlFinalValue)
{
    if (ctlHighlightId)
    {
        _adminEditCtlId = ctlHighlightId;
        _adminEditCtlOldValue = UI.getProperty(ctlHighlightId, "value");
        if (ctlTempValue)
            UI.setProperty(ctlHighlightId, "value", ctlTempValue);
        _adminEditCtlFinalValue = ctlFinalValue;
    }
    else
    {
        _adminEditCtlId = null;
        _adminEditCtlOldValue = null;
        _adminEditCtlFinalValue = null;
    }
    if (adminEditControls)
        UI.batchSetProperty(adminEditControls, "disabled", true);
}

function reenableAdminEditing()
{
    if (adminEditControls)
        UI.batchSetProperty(adminEditControls, "disabled", false);
    if (_adminEditCtlId)
    {
        UI.setProperty(_adminEditCtlId, "value",
            (_adminEditCtlFinalValue
                ? _adminEditCtlFinalValue : _adminEditCtlOldValue )
        );
    }
    _adminEditCtlId = null;
    _adminEditCtlOldValue = null;
    _adminEditCtlFinalValue = null;
}

STAP.UIHandlers.setOnLoad(initializePage);