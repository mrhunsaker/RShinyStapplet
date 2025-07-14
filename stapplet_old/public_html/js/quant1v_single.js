var pageActive = false;
var dataArr = null;
var graphDataArr = null;
var graph = null;
var stem = null;
var simGraph = null;
var simulationResults = [];
var simGraphDataArr = null;
var optionSim1 = null;
var optionDiffSim1 = null;
var optionSign = null;
var optionMedianSign = null;
var optionWilcoxon = null;
var optionMedianWilcoxon = null;
var selectSim1 = null;
var sideBoxplot = null;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

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

function simpleBatchValidate(inputIDarr, spnID, param, parseFn)
{
    for (var i = 0; i < inputIDarr.length; i++)
        if (!simpleValidate(inputIDarr[i], spnID, param, parseFn)) return false;
    return true;
}

function validateInput()
{
    UI.setProperty("spnGroup1InputMsg", "innerHTML", "");
    var inputType = UI.getProperty("selInputType", "value");
    if (inputType == "data")
    {
        if (selectSim1.length < 10)
        {
            selectSim1.add(optionSim1, 0);
            selectSim1.add(optionDiffSim1, 0);
            selectSim1.add(optionSign, 6);
            selectSim1.add(optionMedianSign, 7);
            selectSim1.add(optionWilcoxon, 8);
            selectSim1.add(optionMedianWilcoxon, 9);
        }
        
        return IV.validateInputFloatArray("txtGroup1Data", "spnGroup1InputMsg", "Group 1");
    }
    else if (inputType == "meanstats")
    {
        while (selectSim1.length > 8) selectSim1.remove(0);
        while (selectSim1.length > 4) selectSim1.remove(4);
        
        var groupValidate = function(n)
        {
            if (util.trimString(UI.getProperty("txtGroup" + n + "Mean", "value") )==="")
                UI.setProperty("txtGroup" + n + "Mean", "value", "0");
            else if (!simpleValidate("txtGroup" + n + "Mean", "spnGroup" + n + "InputMsg", "Mean")) return false;
            if (!simpleValidate("txtGroup" + n + "SD", "spnGroup" + n + "InputMsg", "SD")) return false;
            if (!simpleValidate("txtGroup" + n + "N", "spnGroup" + n + "InputMsg", "n", parseInt)) return false;
            if (parseFloat(UI.getProperty("txtGroup" + n + "SD", "value")) < 0)
            {
                UI.setProperty("spnGroup" + n + "InputMsg", "innerHTML", "SD must be non-negative.");
                return false;
            }
            if (parseInt(UI.getProperty("txtGroup" + n + "N", "value")) <= 0)
            {
                UI.setProperty("spnGroup" + n + "InputMsg", "innerHTML", "Number of observations must be positive.");
                return false;
            }
            return true;                
        }

        return groupValidate(1);
    }
    else // median stats -- don't care about inference option reset
    {
        var groupValidate = function(n)
        {
            if (!simpleBatchValidate(["txtGroup" + n + "Min", "txtGroup" + n + "Q1", "txtGroup" + n + "Median", "txtGroup" + n + "Q3", "txtGroup" + n + "Max"],
                                      "spnGroup" + n + "InputMsg", "Each five-number summary value")) return false;
            var min = parseFloat(UI.getProperty("txtGroup" + n + "Min", "value"));
            var Q1 = parseFloat(UI.getProperty("txtGroup" + n + "Q1", "value"));
            var median = parseFloat(UI.getProperty("txtGroup" + n + "Median", "value"));
            var Q3 = parseFloat(UI.getProperty("txtGroup" + n + "Q3", "value"));
            var max = parseFloat(UI.getProperty("txtGroup" + n + "Max", "value"));
            if ((min > Q1) || (Q1 > median) || (median > Q3) || (Q3 > max))
            {
                UI.setProperty("spnGroup" + n + "InputMsg", "innerHTML", "Five-number summary values are out of order.")
                return false;
            }
            return true;
        }

        return groupValidate(1);
    }
}

function resetApplet()
{
    if (confirm("Are you sure? All data and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        deactivatePage();
        UI.batchSetProperty(["txtGroup1Data", "txtGroup1Max", "txtGroup1Mean", "txtGroup1Median",
                             "txtGroup1Min", "txtGroup1N", "txtGroup1Q1",
                             "txtGroup1Q3", "txtGroup1SD",
                             "txtVariableName", "txtHistogramBinWidth", "txtHistogramBinAlignment",
                             "txtSimulationDotplotCountBound", "txtSimulationDotplotMiddlePct", "txtNumSamples"],
                             "value","");
        UI.batchSetProperty(["spnGroup1InputMsg", "divStemplotPlot"],
                             "innerHTML", "");
        UI.batchSetProperty(["selInputType", "selSimulationDotplotCountType", "selSimulationDotplotCountDir", "selStemplotStems"], "selectedIndex", 0);
        UI.setProperty("chkSideBoxplot", "checked", false);
        UI.batchSetStyleProperty(["divSideBoxplotOption", "divStemplot"], "display", "none");
        UI.setProperty("selInputType", "disabled", false);
        UI.setProperty("numSigAdj", "value", 0);
	clearSimulationResults();
	UI.setProperty("num1CLevel", "value", "95");
        dataArr = null;
        handleInputTypeChange(document.getElementById("selInputType"));
    }
}

function deactivatePage()
{
    UI.setProperty("txtSummaryStatisticsCSV", "value", "");
    UI.batchSetStyleProperty(["divSummaryStatistics", "divGraphDistributions", "divInference",
                         "divInference1Group", "divSimulationOptions",
                         "spnInference1GroupTestOptions",
                         "spnInference1GroupSDIntervalOptions",
                         "spnInference1GroupSDTestOptions"], 
                         "display", "none");
    UI.batchSetProperty(["spnSummaryStatistics", "spnInferenceResults"],
                         "innerHTML", "");
    UI.batchSetProperty(["selGraphType1or2Groups",
                         "selInference1Group", "sel1SampTTestSides"], "selectedIndex", 0);
    handle1GroupInferenceChange(document.getElementById("selInference1Group"));
    UI.setProperty("btnChangeInputs", "disabled", true);
    pageActive = false;
}

function clearSimulationResults()
{
    simulationResults = [];
    simGraph.clearGraph();
    UI.batchSetProperty(["spnNumTrials", "spnRecentResult", "spnSimMean", "spnSimSD"], "innerHTML", "");
    clearSimulationDotplotCount();
}

function inputsChanged(obj)
{
    if (pageActive)
    {
        if (obj && validateInput() && !confirm("Are you sure? The entries will remain, but any unsaved output will be lost."))
        {
            UI.resetInputState(obj.id);
            return;
        }
        deactivatePage();
    }
}

function variableName()
{
    var name = util.trimString(UI.getProperty("txtVariableName", "value"));
    if (name == "") name = "Variable";
    return name;
}

function beginAnalysis()
{
    if (validateInput())
    {
        pageActive = true;
        UI.setProperty("btnChangeInputs", "disabled", false);
        var inputType = UI.getProperty("selInputType", "value");
        UI.setStyleProperty("divGraphDistributions", "display", (inputType != "meanstats" ? "block" : "none"));
        UI.setStyleProperty("divSummaryStatistics", "display", (inputType == "data" ? "block" : "none"));
        handle1GroupInferenceChange(document.getElementById("selInference1Group"));
        
        if (inputType != "medianstats")
        {
            UI.setStyleProperty("divInference", "display", "block");
            UI.setStyleProperty("divInference1Group", "display", "block");
        }
        else                                    
            UI.setStyleProperty("divInference", "display", "none");

        UI.recordInputStates(["selInputType"]);
        var inputType = UI.getProperty("selInputType", "value");
        if (inputType == "data")
        {              
            UI.recordInputStates(["txtGroup1Data"]);
            dataArr = util.splitStringGetArray(document.getElementById("txtGroup1Data").value);
            updateSummaryStatistics();
            updateGraphDistributions();
        }               
        else if (inputType == "meanstats")
        {
            UI.recordInputStates(["txtGroup1Mean", "txtGroup1SD", "txtGroup1N"]);
        }
        else // median stats
        {
            UI.recordInputStates(["txtGroup1Min", "txtGroup1Q1", "txtGroup1Median", "txtGroup1Q3", "txtGroup1Max"]);
            var makeArr = function(n)
            {
                // Notice that Q1 and Q3 appear twice to properly fake out the boxplot / quartile algorithm
                return [parseFloat(UI.getProperty("txtGroup" + n + "Min", "value")),
                        parseFloat(UI.getProperty("txtGroup" + n + "Q1", "value")),
                        parseFloat(UI.getProperty("txtGroup" + n + "Q1", "value")),
                        parseFloat(UI.getProperty("txtGroup" + n + "Median", "value")),
                        parseFloat(UI.getProperty("txtGroup" + n + "Q3", "value")),
                        parseFloat(UI.getProperty("txtGroup" + n + "Q3", "value")),
                        parseFloat(UI.getProperty("txtGroup" + n + "Max", "value"))]
            };

            dataArr = makeArr(1);
            graphDataArr = util.arrayToGraphData(dataArr, variableName());
            updateGraphDistributions();
        }

        var queryString = UI.getQueryString();
        if (queryString["inf"])
        {
        	UI.setProperty("selInference1Group", "value", queryString["inf"]);
        	handle1GroupInferenceChange(document.getElementById("selInference1Group"));
        }
    }
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
    graph.setTitle(variableName());
    graphDataArr = util.arrayToGraphData(dataArr, variableName());

    var inputType = UI.getProperty("selInputType", "value");
    if (inputType == "data")
        UI.setStyleProperty("spnGraphOptions1or2Groups", "display", "inline");
    else
        UI.setStyleProperty("spnGraphOptions1or2Groups", "display", "none");
        
    var graphType = (inputType == "medianstats" ? "boxplot" :
                                         UI.getProperty("selGraphType1or2Groups", "value"));

    var doSideBoxplot = function(adjust)
    {
        adjust = adjust || 0;
        UI.setProperty("divSideBoxplot", "innerHTML", "");
        delete sideBoxplot;
        sideBoxplot = new STAP.SVGGraph("divSideBoxplot", graph.width + graph.margin.left + graph.margin.right + adjust, 100);
        sideBoxplot.boxplot(util.arrayToGraphData(dataArr, variableName()), variableName(), graph);
    };
    
    if (graphType == "histogram")
    {
    	UI.setStyleProperty("spnHistogramOptions", "display", "inline");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divStemplot", "display", "none");
    	UI.setStyleProperty("divSideBoxplotOption", "display", "block");
    	replotHistogram();
    	doSideBoxplot();
        UI.setStyleProperty("divSideBoxplot", "display", 
            (UI.getProperty("chkSideBoxplot", "checked") ? "block" : "none")
        );
    }
    else if (graphType == "boxplot")
    {
    	UI.setStyleProperty("spnHistogramOptions", "display", "none");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divSideBoxplotOption", "display", "none");
    	UI.setStyleProperty("divStemplot", "display", "none");
        graph.boxplot(graphDataArr, variableName());
    }
    else if (graphType == "dotplot")
    {
    	UI.setStyleProperty("spnHistogramOptions", "display", "none");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divStemplot", "display", "none");
    	UI.setStyleProperty("divSideBoxplotOption", "display", "block");
        graph.dotplot(graphDataArr, variableName());

        UI.setStyleProperty("divSideBoxplot", "display", "none");
    	doSideBoxplot();
        UI.setStyleProperty("divSideBoxplot", "display", 
            (UI.getProperty("chkSideBoxplot", "checked") ? "block" : "none")
        );
    }
    else if (graphType == "stemplot")
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
    	UI.setStyleProperty("divSideBoxplotOption", "display", "none");
    	stem.stemplot(dataArr, null, variableName(),
    	    parseInt(UI.getProperty("selStemplotStems", "value")),
    	    parseInt(UI.getProperty("numSigAdj", "value")),
    	    gap);
    }
    else // Normal Prob Plot
    {
        var yCaption = "Expected z-score";
    	UI.setStyleProperty("divSideBoxplotOption", "display", "block");
    	UI.setStyleProperty("spnHistogramOptions", "display", "none");
    	UI.setStyleProperty("divPlot", "display", "block");
    	UI.setStyleProperty("divStemplot", "display", "none");
        var sArr = dataArr.slice(0);
        util.sortArrayAscending(sArr);
        graphDataArr = util.arraysTo2DGraphData(sArr, util.NPPZ(sArr.length),
		    variableName(), yCaption);
        graph.scatterplot(graphDataArr, variableName(), yCaption);
        var statsX = stat.getOneVariableStatistics(dataArr);
        // Plot a line that passes through (xbar, 0) and (xbar + sd, 1)
        graph.plotTopCurve(function(x)
            {
                return 1 / statsX.Sx * (x - statsX.mean);
            }
        );
        UI.setStyleProperty("divSideBoxplot", "display", 
            (UI.getProperty("chkSideBoxplot", "checked") ? "block" : "none")
        );
    	doSideBoxplot(-15); // this is a kludge; something happens in the 2D plots with the axis
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

    	graph.histogram(graphDataArr, variableName(),
                            (UI.getProperty("selHistogramLabel", "value") == "rel"),
			width, align);
}

function resetHistogramOptions()
{
	UI.setProperty("txtHistogramBinAlignment", "value", "");
	UI.setProperty("txtHistogramBinWidth", "value", "");
	replotHistogram();
}

function handle1GroupInferenceChange(sel)
{
    UI.batchSetStyleProperty(["spnInferenceResults", "spnSimulationResults"], "display", "none");
    UI.setStyleProperty("spnInference1GroupTestOptions", "display", (sel.value == "test" ? "inline" : "none"));
    UI.setStyleProperty("spnInference1GroupIntervalOptions", "display", (sel.value == "interval" ? "inline" : "none"));
    UI.setStyleProperty("spnInference1GroupSDTestOptions", "display", (sel.value == "SDtest" ? "inline" : "none"));
    UI.setStyleProperty("spnInference1GroupSDIntervalOptions", "display", (sel.value == "SDinterval" ? "inline" : "none"));
    UI.setStyleProperty("spnInference1GroupPairedTestOptions", "display", (sel.value == "sign" || sel.value == "wilcoxon" ? "inline" : "none"));
    UI.setStyleProperty("spnInference1GroupMedianTestOptions", "display", (sel.value == "medsign" || sel.value == "medwilcoxon" ? "inline" : "none"));
    UI.setStyleProperty("divSimulationOptions", "display", ((sel.value == "simulation" || sel.value == "simulationDiff") ? "block" : "none"));
    if (sel.value == "simulation")
    {
        clearSimulationResults();
        UI.setProperty("spnSimulationDescription", "innerHTML",
        "Simulates the distribution of the sample mean when selecting samples of the original size <EM>with replacement</EM> from the original sample.<BR>");
    }
    else if (sel.value == "simulationDiff")
    {
        clearSimulationResults();
        UI.setProperty("spnSimulationDescription", "innerHTML",
        "Applet assumes data values are differences from paired data. This procedure simulates the distribution of the mean difference when randomly shuffling the outcomes within each pair and calculating the difference for each pair.<BR>");
    }
}

function updateInference()
{
    var inferenceType = UI.getProperty("selInference1Group", "value");
    var inputType = UI.getProperty("selInputType", "value");

        if (inferenceType == "interval")
        {
            var cLevel = parseFloat(UI.getProperty("num1CLevel", "value")) / 100;
            var results = (inputType == "data") ? stat.oneSampTIntervalMean(dataArr, cLevel) :
                            stat.oneSampTIntervalMeanStats(parseFloat(UI.getProperty("txtGroup1Mean", "value")),
                                                           parseFloat(UI.getProperty("txtGroup1SD", "value")),
                                                           parseInt(UI.getProperty("txtGroup1N", "value")), cLevel);
            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>Lower Bound</TH><TH>Upper Bound</TH><TH>df</TH></TR><TR>"
            tableHTML += "<TD>" + format.formatNumber(results.lowerBound)
                    + "</TD><TD>" + format.formatNumber(results.upperBound)
                    + "</TD><TD>" + format.formatNumber(results.df)
                    + "</TD></TR></TABLE>"
            UI.setStyleProperty("spnSimulationResults", "display", "none");
            UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
            UI.setStyleProperty("spnInferenceResults", "display", "inline");
        }
        else if (inferenceType == "test")
        {
            if (IV.validateInputFloat("txt1SampTTestHypothesizedMean", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spn1SampTTestOptionsErrorMsg", "Hypothesized mean"))
            {
                var mean = parseFloat(UI.getProperty("txt1SampTTestHypothesizedMean", "value"));
                var sides = parseInt(UI.getProperty("sel1SampTTestSides", "value"));
                
                var results = (inputType == "data") ? stat.oneSampTTestMean(dataArr, mean, sides) :
                            stat.oneSampTTestMeanStats(parseFloat(UI.getProperty("txtGroup1Mean", "value")),
                                                       parseFloat(UI.getProperty("txtGroup1SD", "value")),
                                                       parseInt(UI.getProperty("txtGroup1N", "value")),
                                                       mean, sides);

                // Render a table programmatically
                var tableHTML = "<TABLE><TR>";
                tableHTML += "<TH>t</TH><TH>P-value</TH><TH>df</TH></TR><TR>"
                tableHTML += "<TD>" + format.formatNumber(results.t)
                        + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                        + "</TD><TD>" + format.formatNumber(results.df)
                        + "</TD></TR></TABLE>"
	        UI.setStyleProperty("spnSimulationResults", "display", "none");
	        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
	        UI.setStyleProperty("spnInferenceResults", "display", "inline");
            }
        }
        else if (inferenceType == "SDinterval")
        {
            var cLevel = parseFloat(UI.getProperty("num1SDCLevel", "value")) / 100;
            var results = (inputType == "data") ? stat.oneSampX2IntervalSD(dataArr, cLevel) :
                            stat.oneSampX2IntervalSDStats(parseFloat(UI.getProperty("txtGroup1SD", "value")),
                                                           parseInt(UI.getProperty("txtGroup1N", "value")), cLevel);
            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>Lower Bound</TH><TH>Upper Bound</TH><TH>df</TH></TR><TR>"
            tableHTML += "<TD>" + format.formatNumber(results.lowerBound)
                    + "</TD><TD>" + format.formatNumber(results.upperBound)
                    + "</TD><TD>" + format.formatNumber(results.df)
                    + "</TD></TR></TABLE>"
            UI.setStyleProperty("spnSimulationResults", "display", "none");
            UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
            UI.setStyleProperty("spnInferenceResults", "display", "inline");
        }
        else if (inferenceType == "SDtest")
        {
            if (IV.validateInputFloat("txt1SampSDTestHypothesizedSD", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spn1SampSDTestOptionsErrorMsg", "Hypothesized standard deviation"))
            {
                var SD = parseFloat(UI.getProperty("txt1SampSDTestHypothesizedSD", "value"));
                var sides = parseInt(UI.getProperty("sel1SampSDTestSides", "value"));
                
                var results = (inputType == "data") ? stat.oneSampX2TestSD(dataArr, SD, sides) :
                            stat.oneSampX2TestSDStats(parseFloat(UI.getProperty("txtGroup1SD", "value")),
                                                       parseInt(UI.getProperty("txtGroup1N", "value")),
                                                       SD, sides);

                // Render a table programmatically
                var tableHTML = "<TABLE><TR>";
                tableHTML += "<TH>&chi;&sup2;</TH><TH>P-value</TH><TH>df</TH></TR><TR>"
                tableHTML += "<TD>" + format.formatNumber(results.X2)
                        + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                        + "</TD><TD>" + format.formatNumber(results.df)
                        + "</TD></TR></TABLE>"
	        UI.setStyleProperty("spnSimulationResults", "display", "none");
	        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
	        UI.setStyleProperty("spnInferenceResults", "display", "inline");
            }
        }
        else if (inferenceType == "simulation")
        {
            UI.setProperty("spnSimulationErrorMsg", "innerHTML", "");
            if (IV.validateInputInt("txtNumSamples", 1,
                Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
            {
                Array.prototype.push.apply(simulationResults, stat.simulationMeans(dataArr, parseInt(UI.getProperty("txtNumSamples", "value"))));
                util.sortArrayAscending(simulationResults);
                
		var varname = "Simulated sample mean " + variableName();
		simGraphDataArray = util.arrayToGraphData(simulationResults, varname);

            UI.setStyleProperty("spnSimulationResults", "display", "inline");
            UI.setProperty("spnInferenceResults", "innerHTML", "");
            UI.setStyleProperty("spnInferenceResults", "display", "none");

		simGraph.dotplot(simGraphDataArray, varname, null, true);
                UI.setProperty("spnNumTrials", "innerHTML", format.formatNumber(simulationResults.length));
		UI.setProperty("spnRecentResult", "innerHTML", format.formatNumber(simulationResults[simulationResults.length - 1]));
                var resultStats = stat.getOneVariableStatistics(simulationResults);
		UI.setProperty("spnSimMean", "innerHTML", format.formatNumber(resultStats.mean));
		UI.setProperty("spnSimSD", "innerHTML", format.formatNumber(resultStats.Sx));

                if (simGraph.selectionRect.element)
                    handleSimulationDotplotCount(UI.getProperty("txtSimulationDotplotMiddlePct", "value").length > 0);
            }
        }
        else if (inferenceType == "simulationDiff")
        {
            UI.setProperty("spnSimulationErrorMsg", "innerHTML", "");
            if (IV.validateInputInt("txtNumSamples", 1,
                Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
            {
                Array.prototype.push.apply(simulationResults, stat.simulationMeanDiff(dataArr, parseInt(UI.getProperty("txtNumSamples", "value"))));
                util.sortArrayAscending(simulationResults);

		var varname = "Simulated mean difference";
					// removed: in " + variableName();
		simGraphDataArray = util.arrayToGraphData(simulationResults, varname);

	        UI.setStyleProperty("spnSimulationResults", "display", "inline");
	        UI.setProperty("spnInferenceResults", "innerHTML", "");
	        UI.setStyleProperty("spnInferenceResults", "display", "none");

		simGraph.dotplot(simGraphDataArray, varname, null, true);
                UI.setProperty("spnNumTrials", "innerHTML", format.formatNumber(simulationResults.length));
		UI.setProperty("spnRecentResult", "innerHTML", format.formatNumber(simulationResults[simulationResults.length - 1]));
                var resultStats = stat.getOneVariableStatistics(simulationResults);
		UI.setProperty("spnSimMean", "innerHTML", format.formatNumber(resultStats.mean));
		UI.setProperty("spnSimSD", "innerHTML", format.formatNumber(resultStats.Sx));

                if (simGraph.selectionRect.element)
                    handleSimulationDotplotCount();
            }
        }
        else if (inferenceType == "sign")
        {
            var sides = parseInt(UI.getProperty("sel1SampPairedTestSides", "value"));
                
            var results = stat.signTest(dataArr, sides);

            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>X</TH><TH>P-value</TH></TR><TR>"
            tableHTML += "<TD>" + format.formatNumber(results.X)
                        + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                        + "</TD></TR></TABLE>"
	        UI.setStyleProperty("spnSimulationResults", "display", "none");
	        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
	        UI.setStyleProperty("spnInferenceResults", "display", "inline");
        }
        else if (inferenceType == "medsign")
        {
            if (IV.validateInputFloat("txt1SampMedianTestHypothesizedMedian", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spn1SampMedianTestOptionsErrorMsg", "Hypothesized median"))
            {
                var median = parseFloat(UI.getProperty("txt1SampMedianTestHypothesizedMedian", "value"));
                var sides = parseInt(UI.getProperty("sel1SampMedianTestSides", "value"));
                
                var results = stat.medianSignTest(dataArr, median, sides);

                // Render a table programmatically
                var tableHTML = "<TABLE><TR>";
                tableHTML += "<TH>X</TH><TH>P-value</TH></TR><TR>"
                tableHTML += "<TD>" + format.formatNumber(results.X)
                        + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                        + "</TD></TR></TABLE>"
	        UI.setStyleProperty("spnSimulationResults", "display", "none");
	        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
	        UI.setStyleProperty("spnInferenceResults", "display", "inline");
            }
        }
        else if (inferenceType == "wilcoxon")
        {
            var sides = parseInt(UI.getProperty("sel1SampPairedTestSides", "value"));
                
            var results = stat.wilcoxonSignedRankTest(dataArr, sides);

            if ((sides == stat.ONE_SIDED_LT && results.Wminus < results.Wplus) || (sides == stat.ONE_SIDED_GT && results.Wminus > results.Wplus))
    	        UI.setProperty("spnInferenceResults", "innerHTML", "These data do not support the alternative hypothesis.");
            else
            {
                // Render a table programmatically
                var tableHTML = "<TABLE><TR>";
                tableHTML += "<TH>W</TH><TH>P-value</TH></TR><TR>"
                tableHTML += "<TD>" + format.formatNumber(results.W)
                            + "</TD><TD>" + results.pValueHTML
                            + "</TD></TR></TABLE>"
    	        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
            }
	        UI.setStyleProperty("spnSimulationResults", "display", "none");
	        UI.setStyleProperty("spnInferenceResults", "display", "inline");
        }
        else if (inferenceType == "medwilcoxon")
        {
            if (IV.validateInputFloat("txt1SampMedianTestHypothesizedMedian", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spn1SampMedianTestOptionsErrorMsg", "Hypothesized median"))
            {
                var median = parseFloat(UI.getProperty("txt1SampMedianTestHypothesizedMedian", "value"));
                var sides = parseInt(UI.getProperty("sel1SampMedianTestSides", "value"));
                
                var results = stat.medianWilcoxonSignedRankTest(dataArr, median, sides);
                
                if ((sides == stat.ONE_SIDED_LT && results.Wminus < results.Wplus) || (sides == stat.ONE_SIDED_GT && results.Wminus > results.Wplus))
        	        UI.setProperty("spnInferenceResults", "innerHTML", "These data do not support the alternative hypothesis.");
                else
                {
                    // Render a table programmatically
                    var tableHTML = "<TABLE><TR>";
                    tableHTML += "<TH>W</TH><TH>P-value</TH></TR><TR>"
                    tableHTML += "<TD>" + format.formatNumber(results.W)
                                + "</TD><TD>" + results.pValueHTML
                                + "</TD></TR></TABLE>"
        	        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
                }
    	        UI.setStyleProperty("spnSimulationResults", "display", "none");
    	        UI.setStyleProperty("spnInferenceResults", "display", "inline");
            }
        }
}

function exportSummaryStatistics()
{
    var variableName = UI.getProperty("txtVariableName", "value");
    file.saveCSV("txtSummaryStatisticsCSV", "summary_statistics" + (variableName.length > 0 ? "_" + variableName : ""));
}

function initializePage()
{
    UI.batchSetStyleProperty(["spnGroup1Name", "divGraphDistributions",
            "divInference", "divSummaryStatistics", "spnGroup1MeanStats", "spnGroup1MedianStats", "divSideBoxplotOption",
            "txtSummaryStatisticsCSV", "spnInference1GroupTestOptions",
            "spnInference1GroupPairedTestOptions",
            "spnInference1GroupMedianTestOptions",
            "spnSimulationResults", "divSimulationOptions", "divPlot", "divStemplot", "divSideBoxplot"],
            	"display", "none");
    UI.setProperty("btnChangeInputs", "disabled", true);
    optionSim1 = document.getElementById("opt1GroupSimulation");
    optionDiffSim1 = document.getElementById("opt1GroupDiffSimulation");
    optionSign = document.getElementById("opt1GroupSign");
    optionMedianSign = document.getElementById("opt1GroupMedianSign");
    optionWilcoxon = document.getElementById("opt1Wilcoxon");
    optionMedianWilcoxon = document.getElementById("opt1MedianWilcoxon");
    selectSim1 = document.getElementById("selInference1Group");
    graph = new STAP.SVGGraph("divPlot");
    simGraph = new STAP.SVGGraph("divSimulationPlot");
    sideBoxplot = new STAP.SVGGraph("divSideBoxplot", null, 100);
    stem = new STAP.HTMLStemplot("divStemplotPlot");
    UI.writeLinkColorOriginRules();
    if (UI.getQueryString()["t"])
    {
        var transferData = STAP.Storage.getPageTransferData();
        if (transferData && transferData.keys.length)
        {
            var arr = transferData.dataMap[transferData.keys[0]];
            util.sortArrayAscending(arr);
            UI.setProperty("txtGroup1Data", "value", util.unsplitString(arr));
            if (transferData.variableName)
                UI.setProperty("txtVariableName", "value", transferData.variableName)
        }
    }    
}

function handleInputTypeChange(sel)
{
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
        {
            UI.resetInputState("selInputType");
            return;                    
        }
    }
    UI.recordInputState(sel.id);
    var inputType = sel.value;
    
    // Set inputs correctly
    if (inputType == "data")
    {
        UI.batchSetStyleProperty(["spnInputInstructions", "spnGroup1Data"], "display", "inline");
        UI.batchSetStyleProperty(["spnGroup1MeanStats", "spnGroup1MedianStats"], "display", "none");
    }
    else if (inputType == "meanstats")
    {
        UI.setStyleProperty("spnGroup1MeanStats", "display", "inline");
        UI.batchSetStyleProperty(["spnInputInstructions", "spnGroup1Data",
                                  "spnGroup1MedianStats"], "display", "none");
    }
    else // median stats
    {
        UI.setStyleProperty("spnGroup1MedianStats", "display", "inline");
        UI.batchSetStyleProperty(["spnInputInstructions", "spnGroup1Data", "spnGroup1MeanStats"], "display", "none");
    }
    deactivatePage();
}

var bDotplotCallback = false;

function handleSimulationDotplotCount(bCI)
{
    if (bDotplotCallback) { bDotplotCallback = false; return; }
    
    UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");
    if ( !bCI && IV.validateInputFloat("txtSimulationDotplotCountBound", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spnSimulationDotplotCountErrorMsg", "Bound"))
    {
        bDotplotCallback = true;
        UI.setProperty("txtSimulationDotplotMiddlePct", "value", "");
        simGraph.fnCountHTML = null;
        bDotplotCallback = false;
    	var sel = UI.getProperty("selSimulationDotplotCountDir", "value");
    	var bound = parseFloat(UI.getProperty("txtSimulationDotplotCountBound", "value"));
    
    	if (sel == "left")
    		simGraph.forceSelectionRectangle(null, bound);
    	else
    		simGraph.forceSelectionRectangle(bound, null);
    }
    else if ( (UI.getProperty("txtSimulationDotplotMiddlePct", "value").length > 0)
              && IV.validateInputFloat("txtSimulationDotplotMiddlePct", 0, 100, true, "spnSimulationDotplotCountErrorMsg", "Percentage", "must be strictly between 0% and 100%."))
    {
        bDotplotCallback = true;
        UI.setProperty("txtSimulationDotplotCountBound", "value", "");
        bDotplotCallback = false;

    	var pct = parseFloat(UI.getProperty("txtSimulationDotplotMiddlePct", "value"))/100;
    	var lowP = (1 - pct)/2;
    	
    	var regionSize = Math.floor(safenum.roundToPow10(simulationResults.length * lowP, -2)),
    	    lowIndex = regionSize,
            highIndex = simulationResults.length - regionSize - 1,
            lowDatum = simulationResults[lowIndex],
            highDatum = simulationResults[highIndex];
            
        simGraph.fnCountHTML = function()
        {
            return "Middle " + UI.getProperty("txtSimulationDotplotMiddlePct", "value") + "%: (" + format.formatNumber(lowDatum) + ", " + format.formatNumber(highDatum) + ")";
        };
    	
    	simGraph.forceSelectionRectangle(lowDatum, highDatum);
    }
}

function clearSimulationDotplotCount()
{
    UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");
    UI.setProperty("txtSimulationDotplotCountBound", "value", "");
    UI.setProperty("txtSimulationDotplotMiddlePct", "value", "");
    simGraph.clearSelectionRectangle();
}

STAP.UIHandlers.setOnLoad(initializePage);