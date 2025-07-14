var pageActive = false;
var xDataArr = null;
var yDataArr = null;
var graphDataArr = null;
var simGraphDataArr = null;

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
var bShowingLinear = false;

var residualPlotVG = UI.makeVisibilityGroup("btnToggleResidualPlot",
                                            "btnToggleResidualDotplot",
                                            "btnToggleRegression", "divResidualPlot", "divResidualDotplot");
var simulationResults = [];

function validateInput()
{
    var valid = IV.validateInputFloatArray("txtExplanatoryData", "spnExplanatoryMsg", "Explanatory data ");
    valid = IV.validateInputFloatArray("txtResponseData", "spnResponseMsg", "Response data ") && valid;

    // Also validate the number of observations here
    if (valid)
    {
        xDataArr = util.splitStringGetArray(document.getElementById("txtExplanatoryData").value);
        yDataArr = util.splitStringGetArray(document.getElementById("txtResponseData").value);
        if (xDataArr.length !== yDataArr.length)
        {
            UI.setProperty("spnExplanatoryMsg", "innerHTML",
                           "The number of observations in each group must be the same.");
            xDataArr = null;
            yDataArr = null;
            valid = false;
        }
    }
    return valid;
}

function resetApplet()
{
    if (confirm("Are you sure? All data and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        deactivatePage();
        UI.batchSetProperty(["txtExplanatoryData", "txtResponseData", "txtExplanatoryName",
                             "txtResponseName", "txtSimulationDotplotCountBound"], "value","");
        UI.batchSetProperty(["selSimulationDotplotCountDir", "selSimulationDotplotCountType"], "selectedIndex", 0);
        UI.setProperty("numCLevel", "value", "95");
        xDataArr = null;
        yDataArr = null;
        UI.clearInputStates();
    }
}

function deactivatePage()
{
    UI.batchSetProperty(["spnExplanatoryMsg", "spnResponseMsg", "spnInferenceResults",
                         "spnLSRLResults", "spnHigherOrderResults", "spnCorrelationResults", "spnLSRLComputerOutput"],
                         "innerHTML", "");
    UI.batchSetStyleProperty(["divDisplayScatterplot", "divSummaryStatistics", "divInference", "cnvResidualDotplot"],
                        "display", "none");
    UI.setProperty("chkLSRLComputerOutput", "checked", false);
    UI.setStyleProperty("spnLSRLComputerOutput", "display", "none");
    scatterplot.clearGraph();
    lastRegressionFn = null;
    residualPlotVG.hide();
    pageActive = false;
    clearSimulationResults();
    UI.setProperty("btnChangeInputs", "disabled", true);
}

function inputsChanged(obj)
{
    if (pageActive)
    {
        if (obj && !confirm("Are you sure? The entries will remain, but any unsaved output will be lost."))
        {
            UI.resetInputState(obj.id);
            return;
        }
        deactivatePage();
    }
}

function explanatoryVariableName()
{
	var varname = util.trimString(UI.getProperty("txtExplanatoryName", "value"));
	return (varname.length == 0) ? "Explanatory" : varname;
}

function responseVariableName()
{
	var varname = util.trimString(UI.getProperty("txtResponseName", "value"));
	return (varname.length == 0) ? "Response" : varname;
}

function beginAnalysis()
{
    // If you're already analyzing, don't do anything.
    if (pageActive) return;

    if (validateInput())
    {
        pageActive = true;
        UI.batchSetStyleProperty(["divDisplayScatterplot", "divSummaryStatistics", "divInference"],
                        "display", "inline");
        UI.recordInputStates(["txtExplanatoryData", "txtResponseData",
                              "txtExplanatoryName", "txtResponseName"]);
    	graphDataArr = util.arraysTo2DGraphData(xDataArr, yDataArr,
    		explanatoryVariableName(),
    		responseVariableName());
    	updateScatterplot();
        UI.setProperty("btnChangeInputs", "disabled", false);
        var queryString = UI.getQueryString();
        if (queryString["inf"])
        	UI.setProperty("selInference", "value", queryString["inf"]);
        handleInferenceChange();
    }
}

function updateResidualPlot(stats)
{
    residualPlotVG.show();
    residualPlot.clearGraph();
    safenum.cleanArray(stats.residuals);
    residualPlot.scatterplot(util.arraysTo2DGraphData(xDataArr, stats.residuals,
                    explanatoryVariableName(), "Residual"),
		    explanatoryVariableName(), "Residual");
    residualPlot.plotTopCurve(function(x) { return 0; });    
    residualDotplot.clearGraph();
    residualDotplot.dotplot(util.arrayToGraphData(stats.residuals, "Residual"), "Residual");
    if (UI.getProperty("btnToggleResidualDotplot", "value") == "Hide dotplot of residuals")
        UI.setStyleProperty("divResidualDotplot", "display", "inline");
    else
        UI.setStyleProperty("divResidualDotplot", "display", "none");
}

function handleComputerOutputChange()
{
    UI.setStyleProperty("spnLSRLComputerOutput", "display",
        UI.getProperty("chkLSRLComputerOutput", "checked") ? "inline" : "none");
}

function updateLSRL()
{
    var stat1 = stat.polynomialRegression(xDataArr, yDataArr, 1);

    // Render a table programmatically
    var tableHTML = "<BR><TABLE CLASS='results'><TR>";
    tableHTML += "<TH>Equation</TH><TH><EM>n</EM></TH><TH><EM>s</EM></TH><TH><EM>r</EM><SUP>2</SUP></TH></TR><TR>";
    tableHTML += "<TD><em>y&#770;</em> = " + util.polynomialRegEQDisplayHTML(stat1.coeffs) + "</TD><TD>"
        + xDataArr.length + "</TD><TD>"
        + format.formatNumber(stat1.S) + "</TD><TD>"
        + format.formatNumber(stat1.rSquared) + "</TD></TR></TABLE>";
    UI.setProperty("spnLSRLResults", "innerHTML", tableHTML);

    var compHTML = "<BR><TABLE CLASS='results'><TR>";
    compHTML += "<TH>Predictor</TH><TH>Coef</TH><TH>SE Coef</TH><TH>T</TH><TH>P</TH></TR><TR>";
    compHTML += "<TD>Constant</TD><TD>" + format.formatNumber(stat1.coeffs[0]) + "</TD><TD>" + format.formatNumber(stat1.SEintercept) + "</TD><TD>" + format.formatNumber(stat1.Tintercept) + "</TD><TD>" + format.formatPValueHTML(stat1.Pintercept) + "</TD></TR><TR>";
    compHTML += "<TD>" + explanatoryVariableName() + "</TD><TD>" + format.formatNumber(stat1.coeffs[1]) + "</TD><TD>" + format.formatNumber(stat1.SEslope) + "</TD><TD>" + format.formatNumber(stat1.Tslope) + "</TD><TD>" + format.formatPValueHTML(stat1.Pslope) + "</TD></TR></TABLE>";
    UI.setProperty("spnLSRLComputerOutput", "innerHTML", compHTML);

    updateResidualPlot(stat1);
    lastRegressionFn = stat1.fn;
    UI.setProperty("btnToggleRegression", "value", "Hide regression");
    bShowingLinear = true;
    updateScatterplot();
}

function updateHigherOrderModel()
{
    UI.batchSetProperty(["spnHigherOrderMsg", "spnHigherOrderResults"], "innerHTML", "");
    var modelType = UI.getProperty("selHigherOrderModel", "value");
    
    if (modelType == "quadratic" && xDataArr.length < 3)
    {
        UI.setProperty("spnHigherOrderMsg", "innerHTML", "Three observations are required for a quadratic regression.");
        return;
    }
    if (modelType == "exponential")
    {
        for (var i = 0; i < yDataArr.length; i++)
        {
            if (yDataArr[i] <= 0)
            {
                UI.setProperty("spnHigherOrderMsg", "innerHTML", "Cannot perform an exponential regression with negative or zero response values.");
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
    UI.setProperty("spnHigherOrderResults", "innerHTML", tableHTML);
    updateResidualPlot(stat1);
    lastRegressionFn = stat1.fn;
    UI.setProperty("btnToggleRegression", "value", "Hide regression");
    bShowingLinear = false;
    updateScatterplot();
}

function updateScatterplot()
{
    var bPlotRegression = (lastRegressionFn && UI.getProperty("btnToggleRegression", "value") == "Hide regression");
    var bUpdateBounds = false;
    var bPlotIntervalCurves = false, fnLower, fnUpper, fLow, fHigh;

    if (!bShowingLinear && lastRegressionFn)
        UI.setProperty("chkYIntervalCurves", "checked", false);
    
    if (bShowingLinear && UI.getProperty("chkYIntervalCurves", "checked"))
    {
        if (UI.getProperty("selInference", "value") == "yintervalpred")
        {
            bPlotIntervalCurves = true;
            fnLower = function(x)
            {
                return stat.linRegYPredictionInterval(xDataArr, yDataArr, x, 
                    parseFloat(UI.getProperty("numYCLevel", "value"))/100).lowerBound;
            };
            fnUpper = function(x)
            {
                return stat.linRegYPredictionInterval(xDataArr, yDataArr, x, 
                    parseFloat(UI.getProperty("numYCLevel", "value"))/100).upperBound;
            };
        }
        if (UI.getProperty("selInference", "value") == "yintervalmean")
        {
            bPlotIntervalCurves = true;
            fnLower = function(x)
            {
                return stat.linRegMeanYInterval(xDataArr, yDataArr, x, 
                    parseFloat(UI.getProperty("numYCLevel", "value"))/100).lowerBound;
            };
            fnUpper = function(x)
            {
                return stat.linRegMeanYInterval(xDataArr, yDataArr, x, 
                    parseFloat(UI.getProperty("numYCLevel", "value"))/100).upperBound;
            };
        }
        if (fnLower)
        {
            var xmin = jStat.min(xDataArr), xmax = jStat.max(xDataArr), ymin = jStat.min(yDataArr), ymax = jStat.max(yDataArr);
            fLow = jStat.min([fnLower(xmin), fnLower(xmax), ymin]);
            fHigh = jStat.max([fnUpper(xmin), fnUpper(xmax), ymax]);
        }
    }

    var clevelsel = document.getElementById("numYCLevel");
    if (bPlotIntervalCurves)
        clevelsel.onchange = function(){updateScatterplot()};
    else    
        clevelsel.onchange = null;

	scatterplot.scatterplot(graphDataArr, explanatoryVariableName(), responseVariableName(), null, null, null, (fLow ? [fLow,fHigh] : null));
    if (bPlotRegression) scatterplot.plotTopCurve(lastRegressionFn);
    if (bPlotIntervalCurves)
    {
        scatterplot.plotTopCurve(fnLower, 10, "#006600", true, true);
        scatterplot.plotTopCurve(fnUpper, 10, "#006600", true, true);
    }
}


function toggleRegression()
{
    if (UI.getProperty("btnToggleRegression", "value") == "Hide regression")
        UI.setProperty("btnToggleRegression", "value", "Show regression");
    else
        UI.setProperty("btnToggleRegression", "value", "Hide regression");
    updateScatterplot();
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

function handleInferenceChange()
{
    var sel = document.getElementById("selInference");
    if (simulationResults.length > 0 && !confirm("Are you sure? All simulation results will be lost.")) return;

    clearSimulationResults();
    UI.batchSetStyleProperty(["spnSimulationResults", "spnInferenceResults"], "display", "none");
    if (sel.value == "interval")
    {
        UI.setStyleProperty("spnInferenceIntervalOptions", "display", "inline");
        UI.setStyleProperty("spnYPredictionIntervalOptions", "display", "none");
        UI.setStyleProperty("spnInferenceTestOptions", "display", "none");
        UI.setStyleProperty("spnSimulationOptions", "display", "none");                
    }
    else if (sel.value == "test")
    {
        UI.setStyleProperty("spnInferenceIntervalOptions", "display", "none");
        UI.setStyleProperty("spnYPredictionIntervalOptions", "display", "none");
        UI.setStyleProperty("spnInferenceTestOptions", "display", "inline");
        UI.setStyleProperty("spnSimulationOptions", "display", "none"); 
    }
    else if (sel.value.indexOf("yinterval") > -1)
    {
        UI.setStyleProperty("spnInferenceIntervalOptions", "display", "none");
        UI.setStyleProperty("spnYPredictionIntervalOptions", "display", "inline");
        UI.setStyleProperty("spnInferenceTestOptions", "display", "none");
        UI.setStyleProperty("spnSimulationOptions", "display", "none");
        updateLSRL();
    }
    else // simulation
    {
        UI.setStyleProperty("spnInferenceIntervalOptions", "display", "none");
        UI.setStyleProperty("spnYPredictionIntervalOptions", "display", "none");
        UI.setStyleProperty("spnInferenceTestOptions", "display", "none");
        UI.setProperty("spnSimType", "innerHTML", (sel.value == "simslope" ? "slope" : "correlation"));
        UI.setStyleProperty("spnSimulationOptions", "display", "inline");
    }

}

function updateCorrelation()
{
    UI.setProperty("spnCorrelationResults", "innerHTML", "<em>r</em> = " +
                        format.formatNumber(jStat.corrcoeff(xDataArr, yDataArr)));
}

function updateInference()
{
    var inferenceType = UI.getProperty("selInference", "value");

    if (inferenceType == "interval")
    {
        UI.setStyleProperty("spnInferenceResults", "display", "inline");
        UI.setStyleProperty("spnSimulationResults", "display", "none");                
        var results = stat.linRegTInterval(xDataArr, yDataArr,
                        parseFloat(UI.getProperty("numCLevel", "value"))/100);

        // Render a table programmatically
        var tableHTML = "<TABLE><TR>";
        tableHTML += "<TH>Lower Bound</TH><TH>Upper Bound</TH><TH>df</TH></TR><TR>";
        tableHTML += "<TD>" + format.formatNumber(results.lowerBound)
                + "</TD><TD>" + format.formatNumber(results.upperBound)
                + "</TD><TD>" + format.formatNumber(results.df)
                + "</TD></TR></TABLE>";
        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
    }
    else if (inferenceType == "test")
    {
        UI.setStyleProperty("spnInferenceResults", "display", "inline");
        UI.setStyleProperty("spnSimulationResults", "display", "none");                
        var results = stat.linRegTTest(xDataArr, yDataArr,
                    parseInt(UI.getProperty("selTTestSides", "value")));

        // Render a table programmatically
        var tableHTML = "<TABLE><TR>";
        tableHTML += "<TH>t</TH><TH>P-value</TH><TH>df</TH></TR><TR>"
        tableHTML += "<TD>" + format.formatNumber(results.t)
                + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                + "</TD><TD>" + format.formatNumber(results.df)
                + "</TD></TR></TABLE>"
        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
    }
    else if (inferenceType.indexOf("yinterval") > -1)
    {
        UI.setStyleProperty("spnInferenceResults", "display", "inline");
        UI.setStyleProperty("spnSimulationResults", "display", "none");                
        var results = (inferenceType == "yintervalpred" ?
            stat.linRegYPredictionInterval(xDataArr, yDataArr,
                parseFloat(UI.getProperty("numYPredictionX", "value")),
                parseFloat(UI.getProperty("numYCLevel", "value"))/100) :
            stat.linRegMeanYInterval(xDataArr, yDataArr,
                parseFloat(UI.getProperty("numYPredictionX", "value")),
                parseFloat(UI.getProperty("numYCLevel", "value"))/100));

        // Render a table programmatically
        var tableHTML = "<TABLE><TR>";
        tableHTML += "<TH>Lower Bound</TH><TH>Upper Bound</TH><TH>df</TH></TR><TR>";
        tableHTML += "<TD>" + format.formatNumber(results.lowerBound)
                + "</TD><TD>" + format.formatNumber(results.upperBound)
                + "</TD><TD>" + format.formatNumber(results.df)
                + "</TD></TR></TABLE>";
        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
        updateLSRL();
    }
    else // simulation
    {
        UI.setStyleProperty("spnInferenceResults", "display", "none");                
        UI.setStyleProperty("spnSimulationResults", "display", "inline");
        UI.setStyleProperty("spnSimulationErrorMsg", "innerHTML", "");
        if (IV.validateInputInt("txtNumSamples", 1,
            Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
        {
            if (inferenceType == "simslope")
	            Array.prototype.push.apply(simulationResults, stat.simulateSlopes(xDataArr, yDataArr, parseInt(UI.getProperty("txtNumSamples", "value"))));
	    else // correlation
	    	    Array.prototype.push.apply(simulationResults, stat.simulateCorrelations(xDataArr, yDataArr, parseInt(UI.getProperty("txtNumSamples", "value"))));

		var varname = "Simulated sample " + (inferenceType == "simslope" ? "slope" : "correlation");
		simGraphDataArray = util.arrayToGraphData(simulationResults, varname);
		simGraph.dotplot(simGraphDataArray, varname, null, true);
                UI.setProperty("spnNumTrials", "innerHTML", format.formatNumber(simulationResults.length));
		UI.setProperty("spnRecentResult", "innerHTML", format.formatNumber(simulationResults[simulationResults.length - 1]));
		var resultStats = stat.getOneVariableStatistics(simulationResults);
		UI.setProperty("spnSimMean", "innerHTML", format.formatNumber(resultStats.mean));
		UI.setProperty("spnSimSD", "innerHTML", format.formatNumber(resultStats.Sx));
		
            if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
                handleSimulationDotplotCount();
        } 
    }
}

function initializePage()
{
	scatterplot = new STAP.SVGGraph("divScatterplot");
	residualPlot = new STAP.SVGGraph("divResidualPlot", null, 200);
	residualDotplot = new STAP.SVGGraph("divResidualDotplot", null, 200);
	simGraph = new STAP.SVGGraph("divSimGraph");

    UI.batchSetStyleProperty(["divDisplayScatterplot", "divSummaryStatistics", "divInference", "spnYPredictionIntervalOptions",
            "spnSimulationResults", "spnInferenceTestOptions", "spnInferenceIntervalOptions",
            "divResidualDotplot"],
            "display", "none");
    residualPlotVG.hide();
    UI.setProperty("btnChangeInputs", "disabled", true);
    UI.setStyleProperty("spnLSRLComputerOutput", "display", "none");
    UI.writeLinkColorOriginRules();

    if (UI.getQueryString()["t"])
    {
        var transferData = STAP.Storage.getPageTransferData();
        if (transferData)
        {
            UI.setProperty("txtExplanatoryName", "value", transferData.keys[0]);
            UI.setProperty("txtResponseName", "value", transferData.keys[1]);

            var arrX = transferData.dataMap[transferData.keys[0]];
            var arrY = transferData.dataMap[transferData.keys[1]];
            util.sortArrayAscendingByKeys(arrY, arrX);
            UI.setProperty("txtExplanatoryData", "value", util.unsplitString(arrX));
            UI.setProperty("txtResponseData", "value", util.unsplitString(arrY));
        }
    }
}

function handleSimulationDotplotCount()
{
    UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");
    if ( (UI.getProperty("txtSimulationDotplotCountBound", "value").length > 0)
              && IV.validateInputFloat("txtSimulationDotplotCountBound", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spnSimulationDotplotCountErrorMsg", "Bound"))
    {
	var sel = UI.getProperty("selSimulationDotplotCountDir", "value");
	var bound = parseFloat(UI.getProperty("txtSimulationDotplotCountBound", "value"));
	if (sel == "left")
		simGraph.forceSelectionRectangle(null, bound);
	else
		simGraph.forceSelectionRectangle(bound, null);
    }
}

function clearSimulationDotplotCount()
{
    UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");
    UI.setProperty("txtSimulationDotplotCountBound", "value", "");
    simGraph.clearSelectionRectangle();
}

function clearSimulationResults()
{
    simulationResults = [];
    UI.setStyleProperty("spnSimulationResults", "display", "none");
    clearSimulationDotplotCount();
}

STAP.UIHandlers.setOnLoad(initializePage);