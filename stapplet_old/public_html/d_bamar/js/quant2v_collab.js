var scatterplot = null;
var residualPlot = null;
var residualDotplot = null;
var lastRegressionFn = null;

fnInitializeBegin = function()
{
    UI.batchSetStyleProperty(["divGraphBasicOptions",
            "divDisplayScatterplot", "divSummaryStatistics",
            "txtGraphDataCSV", "divResidualPlot",  
            "divResidualDotplot"], "display", "none");
    UI.batchSetProperty(["spnModelResults","spnModelMsg"],"innerHTML","");
    UI.batchSetProperty(["btnUndoLastAdd","btnToggleRegression","btnToggleResidualPlot","btnToggleResidualDotplot"],"disabled",true);
    UI.setProperty("selModel","selectedIndex",0);
    lastAdd = null;
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
};

fnVariableNameChanged = function()
{
    UI.setProperty("txtExplanatoryName", "value", getVariableName(1));
    UI.setProperty("txtResponseName", "value", getVariableName(2));
    updateModel();
};

fnDataSyncSuccess = function(bChanged)
{
    if (bChanged)
    {
        updateModel();
        UI.setProperty("txtGraphDataCSV", "value", getRawDataCSVString());
    }
    UI.setProperty("spnLastUpdate", "innerHTML", 
        "Last update successful on " + lastUpdateDate.toLocaleString());
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

fnClassCodeSet = function()
{
    UI.batchSetStyleProperty(["divGraphBasicOptions",
            "divDisplayScatterplot", "divSummaryStatistics"],
            "display", "block");
};

var ctlAddIds = ["txtDataAddX", "txtDataAddY", "btnDataAdd"];

fnStudentEnabled = function()
{
    UI.batchSetProperty(ctlAddIds, "disabled", false);
    if (lastAdd)
        UI.setProperty("btnUndoLastAdd", "disabled", false);
    else
        UI.setProperty("btnUndoLastAdd", "disabled", true);
};

fnStudentDisabled = function()
{
    UI.batchSetProperty(ctlAddIds, "disabled", true);
    UI.setProperty("btnUndoLastAdd", "disabled", true);
};

function handleExplanatoryNameChange()
{
    adminChangeVariableName(UI.getProperty("txtExplanatoryName", "value"), 1);
    updateModel();
}

function handleResponseNameChange()
{
    adminChangeVariableName(UI.getProperty("txtResponseName", "value"), 2);
    updateModel();
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
    lastAdd = {x: parseFloat(valXText), y: parseFloat(valYText)};
    queueForAdd2Var([lastAdd.x],[lastAdd.y]);
    rawData[0].push(lastAdd.x);
    rawData[1].push(lastAdd.y);
    UI.batchSetProperty(["btnDataAdd", "btnUndoLastAdd"],"disabled", false);
    UI.setProperty("btnUndoLastAdd", "value", "Undo add of (" + valXText + ", " + valYText + ")");
    UI.batchSetProperty(["txtDataAddX", "txtDataAddY"], "value", "");
    tempSetMessage("spnDataAddMsg", "Data added successfully.", 2000);
    updateModel();
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
        var xDataArr = util.splitStringGetArray(document.getElementById("txtDataBatchAddX").value);
        var yDataArr = util.splitStringGetArray(document.getElementById("txtDataBatchAddY").value);
        if (xDataArr.length !== yDataArr.length)
        {
            UI.setProperty("spnDataBatchAddMsg", "innerHTML",
                           "The number of observations in each group must be the same.");
            valid = false;
        }
    }
    return valid;
}

function handleDataBatchAdd(bX)
{
    if (validateBatchInput(bX) && confirm("Are you sure? This operation cannot be undone."))
    {
        
        var arrX = 
            util.splitStringGetArray(
                UI.getProperty("txtDataBatchAddX", "value")
            );

        var arrY =
            util.splitStringGetArray(
                UI.getProperty("txtDataBatchAddY", "value")
            );

        queueForAdd2Var(arrX, arrY);
        UI.batchSetProperty(["txtDataBatchAddX", "txtDataBatchAddY"], "value", "");
        tempSetMessage("spnDataBatchAddMsg", "Operation successful.", 2000);
        refreshData();
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
    resetIdle();
    UI.setProperty(ctlID, "value", ctlNewValue);
    UI.setProperty(ctlID, "disabled", true);
    UI.HTTPRequest(false, "php/_deleteSharedPlotSingleData.php",
        "c=" + classCode + "&v1=" + val.x + "&v2=" + val.y,
        function (responseText) {
            UI.setProperty(ctlID, "value", ctlOldValue);
            UI.setProperty(ctlID, "disabled", false);
            if (responseText.length == 0)
            {
                tempSetMessage(msgID, "Operation successful.", 2000);
                if (fnSuccCallback) fnSuccCallback();
                refreshData();
            }
            else
                tempSetMessage(msgID, responseText, 2000, true);
        }
    );
}

function handleDeleteAll()
{
    lastAdd = null;
    UI.setProperty("btnUndoLastAdd","disabled",true);
    UI.setProperty("btnUndoLastAdd","value","Undo last add");
    graph.clearGraph();
}

function toggleRegression()
{
    resetIdle();
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
    resetIdle();
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
    resetIdle();
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
    residualPlot.scatterplot(util.arraysTo2DGraphData(rawData[0],
            stats.residuals, getVariableName(1), "Residual"),
		getVariableName(1), "Residual");
    residualPlot.plotTopCurve(function(x) { return 0; });    
    residualDotplot.clearGraph();
    residualDotplot.dotplot(util.arrayToGraphData(stats.residuals, "Residual"), "Residual");
}

function handleModelChange()
{
    resetIdle();
    UI.batchSetProperty(["spnModelMsg","spnModelResults"],"innerHTML","");
    updateModel();
}

function updateModel()
{
    if (rawData[0] && rawData[0].length > 0)
    {
        UI.batchSetStyleProperty(["divDisplayScatterplot", "divSummaryStatistics"], "display", "block");
        var graphDataArr = util.arraysTo2DGraphData(rawData[0], rawData[1],
            getVariableName(1), getVariableName(2));
    	scatterplot.clearGraph();
    	scatterplot.scatterplot(graphDataArr, getVariableName(1),
    	    getVariableName(2));
    	if (rawData[0].length < 2)
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
        UI.batchSetStyleProperty(["divDisplayScatterplot", "divSummaryStatistics"], "display", "none");
}

function updateLSRL()
{
    var stat1 = stat.polynomialRegression(rawData[0], rawData[1], 1);

    // Render a table programmatically
    var tableHTML = "<BR><TABLE CLASS='results'><TR>";
    tableHTML += "<TH>Equation</TH><TH><EM>n</EM></TH><TH><EM>s</EM></TH><TH><EM>r</EM></TH><TH><EM>r</EM><SUP>2</SUP></TH></TR><TR>";
    tableHTML += "<TD><em>y&#770;</em> = " + util.polynomialRegEQDisplayHTML(stat1.coeffs) + "</TD><TD>"
        + rawData[0].length + "</TD><TD>"
        + format.formatNumber(stat1.S) + "</TD><TD>"
        + format.formatNumber(jStat.corrcoeff(rawData[0], rawData[1])) + "</TD><TD>"
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
    
    if (modelType == "quadratic" && rawData[0].length < 3)
    {
        UI.setProperty("spnModelMsg", "innerHTML", "Three observations are required for a quadratic regression.");
        disableRegression();
        return;
    }
    if (modelType == "exponential")
    {
        for (var i = 0; i < rawData[1].length; i++)
        {
            if (rawData[1][i] <= 0)
            {
                UI.setProperty("spnModelMsg", "innerHTML", "Cannot perform an exponential regression with negative or zero response values.");
                disableRegression();
                return;
            }                        
        }
    }
    var stat1 = (modelType == "quadratic" ? stat.polynomialRegression(rawData[0], rawData[1], 2) :
        stat.exponentialRegression(rawData[0], rawData[1]));

    // Render a table programmatically
    var tableHTML = "<BR><TABLE CLASS='results'><TR>";
    tableHTML += "<TH>Equation</TH><TH><EM>n</EM></TH><TH><EM>s</EM></TH><TH><EM>r</EM><SUP>2</SUP></TH></TR>"
            + "<TR><TD><em>y&#770;</em> = ";
    if (modelType != "exponential")
        tableHTML += util.polynomialRegEQDisplayHTML(stat1.coeffs);
    else
        tableHTML += util.exponentialRegEQDisplayHTML(stat1.constant, stat1.base);
    tableHTML += "</TD><TD>" + rawData[0].length + "</TD><TD>"
        + format.formatNumber(stat1.S) + "</TD><TD>"
        + format.formatNumber(stat1.rSquared) + "</TD></TR></TABLE>";
    UI.setProperty("spnModelResults", "innerHTML", tableHTML);
    updateResidualPlot(stat1);
    enableRegression(stat1.fn);
}

function exportGraphData()
{
    resetIdle();
    file.saveCSV("txtGraphDataCSV", "data_" + classCode);
}