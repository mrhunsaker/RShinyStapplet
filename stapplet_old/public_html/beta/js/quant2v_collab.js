var scatterplot = null;
var residualPlot = null;
var residualDotplot = null;
var lastRegressionFn = null;

fnInitializeBegin = function()
{
    UI.batchSetStyleProperty(["divGraphBasicOptions",
            "divDisplayScatterplot", "divRegression",
            "txtGraphDataCSV", "divResidualPlot", "spnCorrelationResults",
            "divResidualDotplot", "spnLSRLComputerOutput"], "display", "none");
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
//    updateModel();
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
            "divDisplayScatterplot", "divRegression"],
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

function handleVariableNameChange(varNum)
{
    var spnId = (varNum == 1 ? "txtExplanatoryName" : "txtResponseName");
    var varname = UI.getProperty(spnId, "value");
    disableAdminEditing(
        (varNum == 1 ? "btnExplanatoryName" : "btnResponseName"),
        "Updating..."
    );
    adminChangeVariableName(UI.getProperty(spnId, "value"), varNum, "spnVariableNameMsg",
        function(b)
        {
            if (b)
            {
                variableNames[varNum - 1] = varname;
                updateModel();
            }
            reenableAdminEditing();
        }
    );
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
    UI.tempSetMessage("spnDataAddMsg", "Data added successfully.", 2000);
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
        UI.tempSetMessage("spnDataBatchAddMsg", "Operation successful.", 2000);
        for (var i = 0; i < arrX.length; i++)
        {
            rawData[0].push(arrX[i]);
            rawData[1].push(arrY[i]);
        }
        updateModel();
    }
}

function handleSingleDataDelete(bX)
{
    if (validatePointEntry("Delete", bX))
    {
        var x = parseFloat(UI.getProperty("txtDataDeleteX", "value"));
        var y = parseFloat(UI.getProperty("txtDataDeleteY", "value"));
        disableAdminEditing("btnDataDelete", "Deleting...")
        adminSingleDataDelete2Var(x, y, "spnDataDeleteMsg",
            function (b)
            {
                if (b)
                {
                    var i = 0;
                    while ((rawData[0][i] != x || rawData[1][i] != y) && i < rawData[0].length) i++;
                    if (i < rawData[0].length)
                    {
                        rawData[0].splice(i, 1);
                        rawData[1].splice(i, 1);
                        updateModel();
                    }
                    UI.batchSetProperty(["txtDataDeleteX", "txtDataDeleteY"], "value", "");                    
                }
                reenableAdminEditing();
            }
        );
    }
}

function undoLastAdd()
{
    if (lastAdd)
    {
        var curBtnVal = UI.getProperty("btnUndoLastAdd", "value");
        UI.setProperty("btnUndoLastAdd", "value", "Undoing...");
        UI.setProperty("btnUndoLastAdd", "disabled", true);
        disableAdminEditing();
        adminSingleDataDelete2Var(lastAdd.x, lastAdd.y, "spnDataAddMsg", function(b) {
                if (b)
                {
                    UI.setProperty("btnUndoLastAdd", "value", "Undo last add");
                    var index = rawData[0].indexOf(lastAdd.x);
                    if (index > -1)
                    {
                        rawData[0].splice(index, 1);
                        rawData[1].splice(index, 1);
                        updateModel();
                    }
                    lastAdd = null;
                }
                else
                {
                    UI.setProperty("btnUndoLastAdd", "value", curBtnVal);
                    UI.setProperty("btnUndoLastAdd", "disabled", false);
                }
                reenableAdminEditing();
            }
        );
    }
}

function handleDeleteAllData()
{
    if (confirm("Are you sure? This cannot be undone."))
    {
        disableAdminEditing("btnDataDeleteAll", "Deleting...");
        adminDeleteAllData("spnDataDeleteMsg",
            function(b) {
                if (b)
                {
                    rawData[0] = [];
                    rawData[1] = [];
                    lastAdd = null;
                    UI.setProperty("btnUndoLastAdd", "value", "Undo last add");
                    updateModel();
                }
                else
                {
                    UI.setProperty("btnUndoLastAdd", "disabled", false);
                }
                reenableAdminEditing();
            }
        );
    }
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

function toggleCorrelation()
{
    if (UI.getProperty("btnCorrelation", "value") == "Show correlation")
    {
        UI.setProperty("btnCorrelation", "value", "Hide correlation");
        UI.setStyleProperty("spnCorrelationResults", "display", "inline");
    }
    else
    {
        UI.setProperty("btnCorrelation", "value", "Show correlation");
        UI.setStyleProperty("spnCorrelationResults", "display", "none");
    }
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
        UI.setProperty("spnCorrelationResults", "innerHTML", "<em>r</em> = " +
                        format.formatNumber(jStat.corrcoeff(rawData[0], rawData[1])));        
        
        UI.batchSetStyleProperty(["divDisplayScatterplot", "divRegression"], "display", "block");
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
            {
                handleComputerOutputChange();
                updateLSRL();
            }
            else
            {
                UI.setStyleProperty("spnLSRLComputerOutput", "display", "none");
                updateHigherOrderModel();
            }
    	}
    }
    else
        UI.batchSetStyleProperty(["divDisplayScatterplot", "divRegression"], "display", "none");
}

function updateLSRL()
{
    UI.setStyleProperty("spnLinearDetail", "display", "inline");

    var stat1 = stat.polynomialRegression(rawData[0], rawData[1], 1);

    // Render a table programmatically
    var tableHTML = "<BR><TABLE CLASS='results'><TR>";
    tableHTML += "<TH>Equation</TH><TH><EM>n</EM></TH><TH><EM>s</EM></TH><TH><EM>r</EM><SUP>2</SUP></TH></TR><TR>";
    tableHTML += "<TD><em>y&#770;</em> = " + util.polynomialRegEQDisplayHTML(stat1.coeffs) + "</TD><TD>"
        + rawData[0].length + "</TD><TD>"
        + format.formatNumber(stat1.S) + "</TD><TD>"
        + format.formatNumber(stat1.rSquared) + "</TD></TR></TABLE>";
    UI.setProperty("spnModelResults", "innerHTML", tableHTML);

    var compHTML = "<BR><TABLE CLASS='results'><TR>";
    compHTML += "<TH>Predictor</TH><TH>Coef</TH><TH>SE Coef</TH><TH>T</TH><TH>P</TH></TR><TR>";
    compHTML += "<TD>Constant</TD><TD>" + format.formatNumber(stat1.coeffs[0]) + "</TD><TD>" + format.formatNumber(stat1.SEintercept) + "</TD><TD>" + format.formatNumber(stat1.Tintercept) + "</TD><TD>" + format.formatPValueHTML(stat1.Pintercept) + "</TD></TR><TR>";
    compHTML += "<TD>" + variableNames[0] + "</TD><TD>" + format.formatNumber(stat1.coeffs[1]) + "</TD><TD>" + format.formatNumber(stat1.SEslope) + "</TD><TD>" + format.formatNumber(stat1.Tslope) + "</TD><TD>" + format.formatPValueHTML(stat1.Pslope) + "</TD></TR></TABLE>";
    UI.setProperty("spnLSRLComputerOutput", "innerHTML", compHTML);

    updateResidualPlot(stat1);
    enableRegression(stat1.fn);
}

function handleComputerOutputChange()
{
    UI.setStyleProperty("spnLSRLComputerOutput", "display",
        (UI.getProperty("chkLSRLComputerOutput", "checked") ? "inline" : "none")
    );
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
    UI.setStyleProperty("spnLinearDetail", "display", "none");
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

function transferDataNC()
{
    if (!rawData[0].length || !confirm("This will leave the current page.\nDo you want to continue?")) return;
    
    STAP.Storage.setPageTransferData(variableNames, rawData);
    window.location.href = "./quant2v.html?t=1";
}

adminEditControls = ["btnPauseStudent", "btnRenew", "txtExplanatoryName", "btnExplanatoryName", "txtResponseName", "btnResponseName", "txtDataBatchAddX", "txtDataBatchAddY", "btnDataBatchAdd", "txtDataDeleteX", "txtDataDeleteY", "btnDataDelete", "btnDataDeleteAll", "btnExtend"];