var pageActive = false;
var xDataArr = null;
var yDataArr = null;

var UI = SPAApplet.UIHandlers;
var stat = SPAApplet.Statistics;
var IV = SPAApplet.InputValidation;
var util = SPAApplet.Utility;
var format = SPAApplet.Format;
var file = SPAApplet.FileIO;
var safenum = SPAApplet.SafeNumber;

var scatterplot = null;
var residualPlot = null;
var residualDotplot = null;
var lastRegressionFn = null;
var scatterplotContainer = null;
var residualPlotContainer = null;
var residualDotplotContainer = null;
var residualPlotVG = UI.makeVisibilityGroup("btnExportResidualPlot", "btnToggleResidualPlot",
                                            "btnExportResidualDotplot", "btnToggleResidualDotplot",
                                            "btnToggleRegression", "cnvResidualPlot");
var simulationGraphContainer = null;
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
        UI.setProperty("spnSimulationDotplotCountResult", "innerHTML", "");
        xDataArr = null;
        yDataArr = null;
        UI.clearInputStates();
    }
}

function deactivatePage()
{
    UI.batchSetProperty(["spnExplanatoryMsg", "spnResponseMsg", "spnInferenceResults",
                         "spnLSRLResults", "spnHigherOrderResults", "spnCorrelationResults"],
                         "innerHTML", "");
    UI.batchSetStyleProperty(["divDisplayScatterplot", "divSummaryStatistics", "divInference", "cnvResidualDotplot"],
                        "display", "none");
    scatterplotContainer.removeAllGraphs();
    residualPlotContainer.removeAllGraphs();
    residualDotplotContainer.removeAllGraphs();
    scatterplot = null;
    residualPlot = null;
    residualDotplot = null;
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
        scatterplot = new SPAApplet.Scatterplot(xDataArr, yDataArr,
                    UI.getProperty("txtExplanatoryName", "value"),
                    UI.getProperty("txtResponseName", "value"), scatterplotContainer);
        UI.setProperty("btnChangeInputs", "disabled", false);
    }
}

function updateResidualPlot(stats)
{
    residualPlotVG.show();
    residualPlotContainer.removeAllGraphs();
    safenum.cleanArray(stats.residuals);
    residualPlot = new SPAApplet.Scatterplot(xDataArr, stats.residuals,
                    UI.getProperty("txtExplanatoryName", "value"),
                    "Residual", residualPlotContainer);
    residualDotplotContainer.removeAllGraphs();
    residualDotplot = new SPAApplet.Dotplot(stats.residuals, "", residualDotplotContainer);
    if (UI.getProperty("btnToggleResidualDotplot", "value") == "Hide dotplot of residuals")
        UI.setStyleProperty("cnvResidualDotplot", "display", "inline");
    else
        UI.setStyleProperty("cnvResidualDotplot", "display", "none");
}

function updateLSRL()
{
    var stat1 = stat.polynomialRegression(xDataArr, yDataArr, 1);

    // Render a table programmatically
    var tableHTML = "<BR><TABLE CLASS='results'><TR>";
    tableHTML += "<TH>Equation</TH><TH>n</TH><TH><EM>s</EM></TH><TH><EM>r</EM><SUP>2</SUP></TH></TR><TR>";
    tableHTML += "<TD><em>y&#770;</em> = " + util.polynomialRegEQDisplayHTML(stat1.coeffs) + "</TD><TD>"
        + xDataArr.length + "</TD><TD>"
        + format.formatNumber(stat1.S) + "</TD><TD>"
        + format.formatNumber(stat1.rSquared) + "</TD></TR></TABLE>";
    UI.setProperty("spnLSRLResults", "innerHTML", tableHTML);
    updateResidualPlot(stat1);
    scatterplot.setRegression(stat1.fn);
    lastRegressionFn = stat1.fn;
    UI.setProperty("btnToggleRegression", "value", "Hide regression");
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
    tableHTML += "<TH>Equation</TH><TH>n</TH><TH><EM>s</EM></TH><TH><EM>r</EM><SUP>2</SUP></TH></TR>"
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
    scatterplot.setRegression(stat1.fn);
    lastRegressionFn = stat1.fn;
    UI.setProperty("btnToggleRegression", "value", "Hide regression");
}

function toggleRegression()
{
    if (UI.getProperty("btnToggleRegression", "value") == "Hide regression")
    {
        UI.setProperty("btnToggleRegression", "value", "Show regression");
        scatterplot.setRegression(null);
    }
    else
    {
        UI.setProperty("btnToggleRegression", "value", "Hide regression");
        scatterplot.setRegression(lastRegressionFn);
    }
}

function toggleResidualPlot()
{
    if (UI.getProperty("btnToggleResidualPlot", "value") == "Hide residual plot")
    {
        UI.setProperty("btnToggleResidualPlot", "value", "Show residual plot");
        UI.setProperty("btnExportResidualPlot", "disabled", true);
        UI.setStyleProperty("cnvResidualPlot", "display", "none");
    }
    else
    {
        UI.setProperty("btnToggleResidualPlot", "value", "Hide residual plot");
        UI.setProperty("btnExportResidualPlot", "disabled", false);
        UI.setStyleProperty("cnvResidualPlot", "display", "inline");
    }
}

function toggleResidualDotplot()
{
    if (UI.getProperty("btnToggleResidualDotplot", "value") == "Hide dotplot of residuals")
    {
        UI.setProperty("btnToggleResidualDotplot", "value", "Show dotplot of residuals");
        UI.setProperty("btnExportResidualDotplot", "disabled", true);
        UI.setStyleProperty("cnvResidualDotplot", "display", "none");
    }
    else
    {
        UI.setProperty("btnToggleResidualDotplot", "value", "Hide dotplot of residuals");
        UI.setProperty("btnExportResidualDotplot", "disabled", false);
        UI.setStyleProperty("cnvResidualDotplot", "display", "inline");
    }
}

function handleInferenceChange(sel)
{
    UI.batchSetStyleProperty(["spnSimulationResults", "spnInferenceResults"], "display", "none");
    if (sel.value == "interval")
    {
        UI.setStyleProperty("spnInferenceIntervalOptions", "display", "inline");
        UI.setStyleProperty("spnInferenceTestOptions", "display", "none");
        UI.setStyleProperty("spnSimulationOptions", "display", "none");                
    }
    else if (sel.value == "test")
    {
        UI.setStyleProperty("spnInferenceIntervalOptions", "display", "none");
        UI.setStyleProperty("spnInferenceTestOptions", "display", "inline");
        UI.setStyleProperty("spnSimulationOptions", "display", "none");                
    }
    else // simulation
    {
        UI.setStyleProperty("spnInferenceIntervalOptions", "display", "none");
        UI.setStyleProperty("spnInferenceTestOptions", "display", "none");
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
                        parseFloat(UI.getProperty("selCLevel", "value")));

        // Render a table programmatically
        var tableHTML = "<TABLE><TR>";
        tableHTML += "<TH>Lower Bound</TH><TH>Upper Bound</TH><TH>df</TH></TR><TR>"
        tableHTML += "<TD>" + format.formatNumber(results.lowerBound)
                + "</TD><TD>" + format.formatNumber(results.upperBound)
                + "</TD><TD>" + format.formatNumber(results.df)
                + "</TD></TR></TABLE>"
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
    else // simulation
    {
        UI.setStyleProperty("spnInferenceResults", "display", "none");                
        UI.setStyleProperty("spnSimulationResults", "display", "inline");
        UI.setStyleProperty("spnSimulationErrorMsg", "innerHTML", "");
        if (IV.validateInputInt("txtNumSamples", 1,
            Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
        {
            var observedSlope = stat.polynomialRegression(xDataArr, yDataArr, 1).coeffs[1];
            var sidedness = parseInt(UI.getProperty("selTTestSides", "value"));
            Array.prototype.push.apply(simulationResults, stat.simulateSlopes(xDataArr, yDataArr, parseInt(UI.getProperty("txtNumSamples", "value"))));

            if (!simulationGraphContainer)
                simulationGraphContainer = new SPAApplet.QuantitativeGraphContainer("cnvSimulationPlot",
                                                                                   "Simulated sample slope");
            else
                simulationGraphContainer.removeAllGraphs();
            var simgraph = new SPAApplet.Dotplot(simulationResults, "");
            simgraph.preferXZeroSymmetry = true;
            simulationGraphContainer.addGraph(simgraph);

            UI.setProperty("spnSimulationTable", "innerHTML",
                "<TABLE><TR><TH># samples</TH></TR><TR><TD>" + format.formatNumber(simulationResults.length) + "</TD></TR></TABLE><BR>");                        
            if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
                handleSimulationDotplotCount();
        } 
    }
}

function exportPlot(canvasID, plotType)
{
    var xVariableName = UI.getProperty("txtExplanatoryName", "value");
    var yVariableName = UI.getProperty("txtResponseName", "value");
    var filename = plotType + (xVariableName.length > 0 ? "_" + xVariableName : "")
                                 + (yVariableName.length > 0 ? "_" + yVariableName : "");
    file.saveCanvas(canvasID, filename);
}

function exportSimulationGraph()
{
    file.saveCanvas('cnvSimulationPlot', 'simulation_slope');
}

function initializePage()
{
    scatterplotContainer = new SPAApplet.QuantitativeGraphContainer("cnvScatterplot");
    residualPlotContainer = new SPAApplet.QuantitativeGraphContainer("cnvResidualPlot");
    residualDotplotContainer = new SPAApplet.QuantitativeGraphContainer("cnvResidualDotplot", "Residual");
    UI.batchSetStyleProperty(["divDisplayScatterplot", "divSummaryStatistics", "divInference",
            "spnSimulationResults", "spnInferenceTestOptions", "spnSimulationOptions",
            "cnvResidualDotplot"],
            "display", "none");
    residualPlotVG.hide();
    UI.batchSetProperty(["btnChangeInputs", "btnExportResidualDotplot"], "disabled", true);
}

function handleSimulationDotplotCount()
{
    var graph = simulationGraphContainer.graphs[0];
    UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");
    if (graph && (UI.getProperty("txtSimulationDotplotCountBound", "value").length > 0)
            && IV.validateInputFloat("txtSimulationDotplotCountBound", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spnSimulationDotplotCountErrorMsg", "Bound"))
    {
        graph.setCountingRegion(parseFloat(UI.getProperty("txtSimulationDotplotCountBound", "value")),
                                parseInt(UI.getProperty("selSimulationDotplotCountDir", "value")));
        var count = graph.dotCount;
        if (UI.getProperty("selSimulationDotplotCountType", "value") == "number")
            UI.setProperty("spnSimulationDotplotCountResult", "innerHTML", count +
                            ((count === 1) ? " dot is " : " dots are ") + "in the specified region.");
        else // percent
            UI.setProperty("spnSimulationDotplotCountResult", "innerHTML", format.formatPercent(count / simulationResults.length)
                                + " of the dots are in the specified region.");
    }            
}

function clearSimulationDotplotCount()
{
    UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");
    UI.setProperty("spnSimulationDotplotCountResult", "innerHTML", "");
    UI.setProperty("txtSimulationDotplotCountBound", "value", "");
    var graph = simulationGraphContainer.graphs[0];
    if (graph)
        graph.clearCountingRegion();
} 

function clearSimulationResults()
{
    simulationResults = [];
    UI.setStyleProperty("spnSimulationResults", "display", "none");
}

SPAApplet.UIHandlers.setOnLoadWithPreload(initializePage);
