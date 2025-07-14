var pageActive = false;
var numGroups = 1;
var graphContainer = null;
var simulationGraphContainer = null;
var dataArr1 = null;
var dataArr2 = null;
var dataArr3 = null;
var graphs = [];
var simulationResults = [];
var optionSim1 = null;
var optionDiffSim1 = null;
var optionSim2 = null;
var selectSim1 = null;
var selectSim2 = null;

var UI = SPAApplet.UIHandlers;
var stat = SPAApplet.Statistics;
var IV = SPAApplet.InputValidation;
var util = SPAApplet.Utility;
var format = SPAApplet.Format;
var file = SPAApplet.FileIO;

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
    UI.batchSetProperty(["spnGroup1InputMsg", "spnGroup2InputMsg", "spnGroup3InputMsg"], "innerHTML", "");
    var inputType = UI.getProperty("selInputType", "value");
    if (inputType == "data")
    {
        if (selectSim1.length < 4)
        {
            selectSim1.add(optionSim1);
            selectSim1.add(optionDiffSim1);
        }
        if (selectSim2.length < 3) selectSim2.add(optionSim2);
        
        if (!IV.validateInputFloatArray("txtGroup1Data", "spnGroup1InputMsg", "Group 1")) return false;
        if (numGroups > 1)
            if (!IV.validateInputFloatArray("txtGroup2Data", "spnGroup2InputMsg", "Group 2")) return false;
        if (numGroups > 2)
            if (!IV.validateInputFloatArray("txtGroup3Data", "spnGroup3InputMsg", "Group 3")) return false;
        return true;
    }
    else if (inputType == "meanstats")
    {
        while (selectSim1.length > 2) selectSim1.remove(2);
        while (selectSim2.length > 2) selectSim2.remove(2);
        var groupValidate = function(n)
        {
            if (!simpleValidate("txtGroup" + n + "Mean", "spnGroup" + n + "InputMsg", "Mean")) return false;
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

        if (!groupValidate(1)) return false;                
        if (numGroups > 1)
            if (!groupValidate(2)) return false;
        if (numGroups > 2)
            if (!groupValidate(3)) return false;
        return true;
    }
    else // median stats
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

        if (!groupValidate(1)) return false;                
        if (numGroups > 1)
            if (!groupValidate(2)) return false;
        if (numGroups > 2)
            if (!groupValidate(3)) return false;
        return true;
    }
}

function resetApplet()
{
    if (confirm("Are you sure? All data and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        deactivatePage();
        UI.batchSetProperty(["txtGroup1Data", "txtGroup1Max", "txtGroup1Mean", "txtGroup1Median",
                             "txtGroup1Min", "txtGroup1Name", "txtGroup1N", "txtGroup1Q1",
                             "txtGroup1Q3", "txtGroup1SD",
                             "txtGroup2Data", "txtGroup2Max", "txtGroup2Mean", "txtGroup2Median",
                             "txtGroup2Min", "txtGroup2Name", "txtGroup2N", "txtGroup2Q1",
                             "txtGroup2Q3", "txtGroup2SD",
                             "txtGroup3Data", "txtGroup3Max", "txtGroup3Mean", "txtGroup3Median",
                             "txtGroup3Min", "txtGroup3Name", "txtGroup3N", "txtGroup3Q1",
                             "txtGroup3Q3", "txtGroup3SD",
                             "txtVariableName", "txtHistogramBinWidth", "txtHistogramBinAlignment",
                             "txtSimulationDotplotCountBound", "txtNumSamples"],
                             "value","");
        UI.batchSetProperty(["spnGroup1InputMsg", "spnGroup2InputMsg", "spnGroup3InputMsg", "spnSimulationDotplotCountResult"],
                             "innerHTML", "");
        UI.batchSetProperty(["selNumGroups", "selInputType", "selSimulationDotplotCountType", "selSimulationDotplotCountDir"], "selectedIndex", 0);
        UI.setProperty("selInputType", "disabled", false);
        numGroups = 1;
        dataArr1 = null;
        dataArr2 = null;
        dataArr3 = null;
        UI.clearInputStates();
        handleGroupsChange(document.getElementById("selNumGroups"));
        handleInputTypeChange(document.getElementById("selInputType"));
    }
}

function deactivatePage()
{
    UI.setProperty("txtSummaryStatisticsCSV", "value", "");
    UI.batchSetStyleProperty(["divSummaryStatistics", "divGraphDistributions", "divInference",
                         "divInference1Group", "divInference2Groups", "divSimulationOptions",
                         "spnInference1GroupTestOptions", "spnInference2GroupTestOptions",
                         "spnSimulationDotplotCountingOptions"],
                         "display", "none");
    UI.batchSetProperty(["spnSummaryStatistics", "spnInferenceResults"],
                         "innerHTML", "");
    UI.batchSetProperty(["selGraphType1or2Groups", "selGraphType3Groups", "selSplitStems",
                         "selInference1Group", "selInference2Group", "sel1SampTTestSides",
                         "sel2SampTTestSides"], "selectedIndex", 0);
    handle1GroupInferenceChange(document.getElementById("selInference1Group"));
    handle2GroupInferenceChange(document.getElementById("selInference2Group"));
    UI.setProperty("btnChangeInputs", "disabled", true);
    pageActive = false;
}

function clearSimulationResults(clearDots)
{
    simulationResults = [];
    UI.setStyleProperty("spnSimulationResults", "display", "none");
    if (clearDots) clearSimulationDotplotCount();
}

function handleGroupsChange(sel)
{
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
        {
            UI.resetInputState("selNumGroups");
            return;                    
        }
    }
    UI.recordInputState(sel.id);
    numGroups = parseInt(sel.value);
    clearSimulationResults();
    
    // Set inputs correctly
    if (numGroups === 1)
    {
        UI.batchSetStyleProperty(["spnGroup1Name", "divGroup2Input", "divGroup3Input"], "display", "none");
        UI.setProperty("selHistogramLabel", "selectedIndex", 0);
        UI.setProperty("selInputType", "disabled", false);
    }
    else if (numGroups === 2)
    {
        UI.setStyleProperty("spnGroup1Name", "display", "inline");
        UI.setStyleProperty("divGroup2Input", "display", "block");
        UI.setStyleProperty("divGroup3Input", "display", "none");
        UI.setProperty("selHistogramLabel", "selectedIndex", 1);
        UI.setProperty("selInputType", "disabled", false);
    }
    else
    {
        UI.setStyleProperty("spnGroup1Name", "display", "inline");
        UI.batchSetStyleProperty(["divGroup2Input", "divGroup3Input"], "display", "block");
        UI.setProperty("selHistogramLabel", "selectedIndex", 1);
        UI.setProperty("selInputType", "selectedIndex", 0);
        UI.setProperty("selInputType", "disabled", true);

        // Logic copied from input type handler
        UI.batchSetStyleProperty(["spnGroup1Data", "spnGroup2Data", "spnGroup3Data"], "display", "inline");
        UI.batchSetStyleProperty(["spnGroup1MeanStats", "spnGroup2MeanStats", "spnGroup3MeanStats",
                                  "spnGroup1MedianStats", "spnGroup2MedianStats", "spnGroup3MedianStats"], "display", "none");
    }
    deactivatePage();
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

function beginAnalysis()
{
    if (validateInput())
    {
        pageActive = true;
        UI.setProperty("btnChangeInputs", "disabled", false);
        var inputType = UI.getProperty("selInputType", "value");
        UI.setStyleProperty("divGraphDistributions", "display", (inputType != "meanstats" ? "block" : "none"));
        UI.setStyleProperty("divSummaryStatistics", "display", (inputType == "data" ? "block" : "none"));
        
        if ((inputType != "medianstats") && (numGroups < 3))
        {
            UI.setStyleProperty("divInference", "display", "block");
            if (numGroups === 2)
            {
                UI.setStyleProperty("divInference1Group", "display", "none");
                UI.setStyleProperty("divInference2Groups", "display", "block");
            }
            else
            {
                UI.setStyleProperty("divInference1Group", "display", "block");
                UI.setStyleProperty("divInference2Groups", "display", "none");
            }
        }
        else                                    
            UI.setStyleProperty("divInference", "display", "none");

        UI.recordInputStates(["txtGroup1Name", "txtGroup2Name", "txtGroup3Name",
                              "selInputType", "selNumGroups"]);
        var inputType = UI.getProperty("selInputType", "value");
        if (inputType == "data")
        {              
            UI.recordInputStates(["txtGroup1Data", "txtGroup2Data", "txtGroup3Data"]);
            dataArr1 = util.splitStringGetArray(document.getElementById("txtGroup1Data").value);
            if (numGroups > 1)
                dataArr2 = util.splitStringGetArray(document.getElementById("txtGroup2Data").value);
            if (numGroups > 2)
                dataArr3 = util.splitStringGetArray(document.getElementById("txtGroup3Data").value);
            updateSummaryStatistics();
            updateGraphDistributions();
        }               
        else if (inputType == "meanstats")
        {
            UI.recordInputStates(["txtGroup1Mean", "txtGroup1SD", "txtGroup1N",
                                  "txtGroup2Mean", "txtGroup2SD", "txtGroup2N",
                                  "txtGroup3Mean", "txtGroup3SD", "txtGroup3N",]);
        }
        else // median stats
        {
            UI.recordInputStates(["txtGroup1Min", "txtGroup1Q1", "txtGroup1Median", "txtGroup1Q3", "txtGroup1Max",
                                  "txtGroup2Min", "txtGroup2Q1", "txtGroup2Median", "txtGroup2Q3", "txtGroup2Max",
                                  "txtGroup3Min", "txtGroup3Q1", "txtGroup3Median", "txtGroup3Q3", "txtGroup3Max"]);
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

            dataArr1 = makeArr(1);
            if (numGroups > 1)
                dataArr2 = makeArr(2);
            if (numGroups > 2)
                dataArr3 = makeArr(3);
            updateGraphDistributions();
        }
    }
}

function updateSummaryStatistics()
{
    var stat1 = stat.getOneVariableStatistics(dataArr1);
    var stat2 = null;
    var stat3 = null;
    if (numGroups > 1)
        stat2 = stat.getOneVariableStatistics(dataArr2);
    if (numGroups > 2)
        stat3 = stat.getOneVariableStatistics(dataArr3);
    
    // Group names
    var grp1Name = UI.getProperty("txtGroup1Name", "value");
    var grp2Name = UI.getProperty("txtGroup2Name", "value");
    var grp3Name = UI.getProperty("txtGroup3Name", "value");
    if (grp1Name.length == 0) grp1Name = "(unnamed)";
    if (grp2Name.length == 0) grp2Name = "(unnamed)";
    if (grp3Name.length == 0) grp3Name = "(unnamed)";
    
    // Render a table programmatically
    var tableHTML = "<TABLE><TR>";
    if (numGroups > 1) tableHTML += "<TH>Group Name</TH>";
    tableHTML += "<TH>n</TH><TH>mean</TH><TH>SD</TH><TH>min</TH><TH>Q<sub>1</sub></TH><TH>med</TH><TH>Q<sub>3</sub></TH><TH>max</TH></TR><TR>"
    tableHTML += (numGroups > 1 ? "<TR><TD>1: " + grp1Name + "</TD>" : "")
        + "<TD>" + stat1.n + "</TD><TD>" + format.formatNumber(stat1.mean) + "</TD><TD>" +
        + format.formatNumber(stat1.Sx) + "</TD><TD>"
        + format.formatNumber(stat1.min) + "</TD><TD>" + format.formatNumber(stat1.Q1) + "</TD><TD>"
        + format.formatNumber(stat1.median) + "</TD><TD>" + format.formatNumber(stat1.Q3)
        + "</TD><TD>" + format.formatNumber(stat1.max) + "</TD></TR>";
    if (numGroups > 1)
        tableHTML += "<TR><TD>2: " + grp2Name + "</TD>"
        + "<TD>" + stat2.n + "</TD><TD>" + format.formatNumber(stat2.mean) + "</TD><TD>" +
        + format.formatNumber(stat2.Sx) + "</TD><TD>"
        + format.formatNumber(stat2.min) + "</TD><TD>" + format.formatNumber(stat2.Q1) + "</TD><TD>"
        + format.formatNumber(stat2.median) + "</TD><TD>" + format.formatNumber(stat2.Q3)
        + "</TD><TD>" + format.formatNumber(stat2.max) + "</TD></TR>";
    if (numGroups > 2)
        tableHTML += "<TR><TD>3: " + grp3Name + "</TD>"
        + "<TD>" + stat3.n + "</TD><TD>" + format.formatNumber(stat3.mean) + "</TD><TD>" +
        + format.formatNumber(stat3.Sx) + "</TD><TD>"
        + format.formatNumber(stat3.min) + "</TD><TD>" + format.formatNumber(stat3.Q1) + "</TD><TD>"
        + format.formatNumber(stat3.median) + "</TD><TD>" + format.formatNumber(stat3.Q3)
        + "</TD><TD>" + format.formatNumber(stat3.max) + "</TD></TR>";
    tableHTML += "</TABLE>"
    UI.setStyleProperty("spnSummaryStatistics", "display", "inline");
    UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);

    // Also render a CSV and store it in the hidden textarea
    var resultsCSV = (numGroups > 1 ? "Group Name," : "") + "n,mean,SD,min,Q1,med,Q3,max\r\n";
    resultsCSV += (numGroups > 1 ? UI.getProperty("txtGroup1Name", "value") + "," : "")
        + stat1.n + "," + format.formatNumber(stat1.mean) + "," + format.formatNumber(stat1.Sx)
        + "," + format.formatNumber(stat1.min) + "," + format.formatNumber(stat1.Q1) + ","
        + format.formatNumber(stat1.median) + "," + format.formatNumber(stat1.Q3) + ","
        + format.formatNumber(stat1.max) + "\r\n";
    if (numGroups > 1)
        resultsCSV += UI.getProperty("txtGroup2Name", "value")
        + "," + stat2.n + "," + format.formatNumber(stat2.mean) + "," + format.formatNumber(stat2.Sx)
        + "," + format.formatNumber(stat2.min) + "," + format.formatNumber(stat2.Q1) + ","
        + format.formatNumber(stat2.median) + "," + format.formatNumber(stat2.Q3) + ","
        + format.formatNumber(stat2.max) + "\r\n";
    if (numGroups > 2)
        resultsCSV += UI.getProperty("txtGroup3Name", "value")
        + "," + stat3.n + "," + format.formatNumber(stat3.mean) + "," + format.formatNumber(stat3.Sx)
        + "," + format.formatNumber(stat3.min) + "," + format.formatNumber(stat3.Q1) + ","
        + format.formatNumber(stat3.median) + "," + format.formatNumber(stat3.Q3) + ","
        + format.formatNumber(stat3.max) + "\r\n";
    UI.setProperty("txtSummaryStatisticsCSV", "value", resultsCSV);
}

function updateGraphDistributions()
{
    if (!graphContainer)
        graphContainer = new SPAApplet.QuantitativeGraphContainer("cnvPlot",
                            UI.getProperty("txtVariableName", "value"));
    else
    {
        graphContainer.removeAllGraphs();
        graphs = [];
        graphContainer.setVariableName(UI.getProperty("txtVariableName", "value"), true);
    }
    var inputType = UI.getProperty("selInputType", "value");
    if (inputType == "data")
    {
        UI.setStyleProperty("spnGraphOptions1or2Groups", "display", (numGroups > 2 ? "none" : "inline"));
        UI.setStyleProperty("spnGraphOptions3Groups", "display", (numGroups < 3 ? "none" : "inline"));
    }
    else
        UI.batchSetStyleProperty(["spnGraphOptions1or2Groups", "spnGraphOptions3Groups"], "display", "none");
        
    var graphType = (inputType == "medianstats" ? "boxplot" :
                        (numGroups > 2 ? UI.getProperty("selGraphType3Groups", "value") :
                                         UI.getProperty("selGraphType1or2Groups", "value")));
    if (graphType == "stemplot")
    {
        if (numGroups === 2)
            graphs.push(new SPAApplet.Stemplot(dataArr2, UI.getProperty("txtGroup2Name", "value"),
                                              dataArr1, UI.getProperty("txtGroup1Name", "value")));
        else
            graphs.push(new SPAApplet.Stemplot(dataArr1, UI.getProperty("txtGroup1Name", "value")));
        UI.setStyleProperty("spnStemplotOptions", "display", "inline");
        UI.setStyleProperty("spnHistogramOptions", "display", "none");
        handleStemSplitBasis(document.getElementById("selSplitStems"));
    }
    else
    {
        var ctorFunc = (graphType == "histogram" ? SPAApplet.Histogram :
                            (graphType == "boxplot" ? SPAApplet.Boxplot : SPAApplet.Dotplot));
        
        if (numGroups > 2)       
            graphs.push(new ctorFunc(dataArr3, UI.getProperty("txtGroup3Name", "value")));
        if (numGroups > 1)
            graphs.push(new ctorFunc(dataArr2, UI.getProperty("txtGroup2Name", "value")));
        graphs.push(new ctorFunc(dataArr1, UI.getProperty("txtGroup1Name", "value")));
        UI.setStyleProperty("spnStemplotOptions", "display", "none");
        UI.setStyleProperty("spnHistogramOptions", "display", (graphType == "histogram" ? "inline" : "none"));
        graphContainer.setRelativeScale((graphType != "histogram") ||
                                    (UI.getProperty("selHistogramLabel", "value") == "rel"))
    }
    graphContainer.addGraphs(graphs);
    if (graphType == "stemplot")
        updateStemplotWarnings();
}

function updateStemplotWarnings()
{
    var warningString = "WARNING: ";
    var displayWarning = false;
    // Check for errors
    if (graphs[0].reroundedWarning)
    {
        displayWarning = true;
        warningString += "data rounded to have 1-digit leaves";
        if (graphs[0].leavesTooWideWarning)
            warningString += "; ";
    }
    if (graphs[0].leavesTooWideWarning)
    {
        displayWarning = true;
        warningString += "split stems or use histogram";
    }
    UI.setProperty("spnStemplotWarningMsg", "innerHTML",
        (displayWarning ? warningString : ""));
}

function handleStemSplitBasis(sel)
{
    // You know there's a stemplot in graphs[0]
    graphs[0].setStemSplitBasis(parseInt(sel.value));
    updateStemplotWarnings();
}

function handleHistogramLabelChange(sel)
{
    graphContainer.setRelativeScale(sel.value == "rel");
}

function handleHistogramBinAlignment(input)
{
    // Fail silently if the input is blank
    if (input.value.length === 0) return;

    if (IV.validateInputFloat(input.id, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
            "spnHistogramOptionsErrorMsg", "Bin alignment"))
    {
        graphs[0].setBinAlignment(parseFloat(input.value));
        graphContainer.renderGraphs();
        UI.setProperty("txtHistogramBinAlignment", "value", "");
    }
}

function handleHistogramBinWidth(input)
{
    // Fail silently if the input is blank
    if (input.value.length === 0) return;

    if (IV.validateInputFloat(input.id, 0, Number.MAX_VALUE, true, "spnHistogramOptionsErrorMsg", "Bin width", "should be a positive number."))
    {
        graphs[0].setBinIncrement(parseFloat(input.value));
        graphContainer.renderGraphs();
        UI.setProperty("txtHistogramBinWidth", "value", "");
    }
}

function setHistogramDefaultBins()
{
    graphs[0].restoreDefaultBinning();
    graphContainer.renderGraphs();
}

function handle1GroupInferenceChange(sel)
{
    UI.batchSetStyleProperty(["spnSimulationResults", "spnInferenceResults"], "display", "none");
    UI.setStyleProperty("spnInference1GroupTestOptions", "display", (sel.value == "test" ? "inline" : "none"));
    UI.setStyleProperty("spnInference1GroupIntervalOptions", "display", (sel.value == "interval" ? "inline" : "none"));
    UI.setStyleProperty("divSimulationOptions", "display", ((sel.value == "simulation" || sel.value == "simulationDiff") ? "block" : "none"));
    if (sel.value == "simulation")
    {
        clearSimulationResults(true);
        UI.setProperty("spnSimulationDescription", "innerHTML",
        "Simulates the distribution of the sample mean when selecting samples of the original size <EM>with replacement</EM> from the original sample.<BR>");
        UI.setStyleProperty("spnSimulationDotplotCountingOptions", "display", "none");
    }
    else if (sel.value == "simulationDiff")
    {
        clearSimulationResults(true);
        UI.setProperty("spnSimulationDescription", "innerHTML",
        "Simulates the distribution of the mean difference when randomly shuffling the outcomes and calculating the difference for each pair.<BR>");
        UI.setStyleProperty("spnSimulationDotplotCountingOptions", "display", "inline");
    }
}

function handle2GroupInferenceChange(sel)
{
    UI.batchSetStyleProperty(["spnSimulationResults", "spnInferenceResults"], "display", "none");
    UI.setStyleProperty("spnInference2GroupTestOptions", "display", (sel.value == "test" ? "inline" : "none"));
    UI.setStyleProperty("spnInference2GroupIntervalOptions", "display", (sel.value == "interval" ? "inline" : "none"));
    UI.setStyleProperty("divSimulationOptions", "display", (sel.value == "simulation" ? "block" : "none"));
    UI.setStyleProperty("spnInference2GroupConservativeDFOptions", "display", (sel.value != "simulation" ? "inline" : "none"));
    if (sel.value == "simulation")
    {
        clearSimulationResults(true);
        UI.setProperty("spnSimulationDescription", "innerHTML",
        "Simulates the distribution of the difference in sample means when the observations are "
        + "combined, shuffled, and redistributed into two groups that match the sizes of the original groups.<BR>");
        UI.setStyleProperty("spnSimulationDotplotCountingOptions", "display", "inline");
    }
}

function updateInference()
{
    var inferenceType = (numGroups === 1 ? UI.getProperty("selInference1Group", "value")
                                         : UI.getProperty("selInference2Group", "value"));
    var inputType = UI.getProperty("selInputType", "value");
    var variableName = UI.getProperty("txtVariableName", "value");
    UI.batchSetStyleProperty(["spnInferenceResults", "spnSimulationResults"], "display", "none");
    UI.setProperty("spnSimulationTable", "innerHTML", "");
    if (numGroups === 1)
    {
        if (inferenceType == "interval")
        {
            var cLevel = parseFloat(UI.getProperty("sel1CLevel", "value"));
            var results = (inputType == "data") ? stat.oneSampTIntervalMean(dataArr1, cLevel) :
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
                
                var results = (inputType == "data") ? stat.oneSampTTestMean(dataArr1, mean, sides) :
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
                UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
                UI.setStyleProperty("spnInferenceResults", "display", "inline");
            }
        }
        else if (inferenceType == "simulation")
        {
            UI.setStyleProperty("spnSimulationResults", "display", "inline");
            UI.setStyleProperty("spnSimulationErrorMsg", "innerHTML", "");
            if (IV.validateInputInt("txtNumSamples", 1,
                Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
            {
                Array.prototype.push.apply(simulationResults, stat.simulationMeans(dataArr1, parseInt(UI.getProperty("txtNumSamples", "value"))));

                var varname = UI.getProperty("txtVariableName", "value");
                if (!simulationGraphContainer)
                    simulationGraphContainer = new SPAApplet.QuantitativeGraphContainer("cnvSimulationPlot",
                                        "Simulated sample mean" + (varname.length > 0 ? " " + varname : ""));
                else
                {
                    simulationGraphContainer.setVariableName("Simulated sample mean" + (varname.length > 0 ? " " + varname : ""));
                    
                    simulationGraphContainer.removeAllGraphs();
                }
                simulationGraphContainer.addGraph(new SPAApplet.Dotplot(simulationResults, ""));
                
                var resultStats = stat.getOneVariableStatistics(simulationResults);
                UI.setProperty("spnSimulationTable", "innerHTML",
                    "<TABLE><TR><TH COLSPAN='3'>Distribution of Simulated Mean</TH></TR>" +
                    "<TR><TH># samples</TH><TH>mean</TH><TH>SD</TH></TR>" +
                    "<TR><TD>" + format.formatNumber(simulationResults.length) +
                    "</TD><TD>" + format.formatNumber(resultStats.mean) +
                    "</TD><TD>" + format.formatNumber(resultStats.Sx) + "</TD></TR></TABLE>");

                UI.setStyleProperty("spnSimulationResults", "display", "inline");
                UI.setStyleProperty("tblSimulatedDistribution", "display", "block");

                if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
                    handleSimulationDotplotCount();
            }
        }
        else if (inferenceType == "simulationDiff")
        {
            UI.setStyleProperty("spnSimulationResults", "display", "inline");
            UI.setStyleProperty("spnSimulationErrorMsg", "innerHTML", "");
            if (IV.validateInputInt("txtNumSamples", 1,
                Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
            {
                Array.prototype.push.apply(simulationResults, stat.simulationMeanDiff(dataArr1, parseInt(UI.getProperty("txtNumSamples", "value"))));

                var varname = UI.getProperty("txtVariableName", "value");
                if (!simulationGraphContainer)
                    simulationGraphContainer = new SPAApplet.QuantitativeGraphContainer("cnvSimulationPlot",
                                        "Simulated mean difference");
                else
                {
                    simulationGraphContainer.setVariableName("Simulated mean difference");
                    
                    simulationGraphContainer.removeAllGraphs();
                }
                var simgraph = new SPAApplet.Dotplot(simulationResults, "");
                simgraph.preferXZeroSymmetry = true;
                simulationGraphContainer.addGraph(simgraph);

                var resultStats = stat.getOneVariableStatistics(simulationResults);
                UI.setProperty("spnSimulationTable", "innerHTML",
                    "<TABLE><TR><TH># samples</TH></TR><TR><TD>" + format.formatNumber(simulationResults.length) + "</TD></TR></TABLE><BR>");                        

                UI.setStyleProperty("spnSimulationResults", "display", "inline");
                UI.setStyleProperty("tblSimulatedDistribution", "display", "block");

                if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
                    handleSimulationDotplotCount();
            }
        }
    }
    else
    {
        var conservativeDF = parseInt(UI.getProperty("sel2SampTDF", "value"));
        if (inferenceType == "interval")
        {
            var cLevel = parseFloat(UI.getProperty("sel2CLevel", "value"));
            var results = (inputType == "data") ? stat.twoSampTIntervalDiffMean(dataArr1, dataArr2,
                                                  cLevel, conservativeDF)
                    : stat.twoSampTIntervalDiffMeanStats(parseFloat(UI.getProperty("txtGroup1Mean", "value")),
                                                         parseFloat(UI.getProperty("txtGroup2Mean", "value")),
                                                         parseFloat(UI.getProperty("txtGroup1SD", "value")),
                                                         parseFloat(UI.getProperty("txtGroup2SD", "value")),
                                                         parseInt(UI.getProperty("txtGroup1N", "value")),
                                                         parseInt(UI.getProperty("txtGroup2N", "value")),
                                                         cLevel, conservativeDF);

            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>Lower Bound</TH><TH>Upper Bound</TH><TH>df</TH></TR><TR>"
            tableHTML += "<TD>" + format.formatNumber(results.lowerBound)
                    + "</TD><TD>" + format.formatNumber(results.upperBound)
                    + "</TD><TD>" + format.formatNumber(results.df)
                    + "</TD></TR></TABLE>"
            UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
            UI.setStyleProperty("spnInferenceResults", "display", "inline");
        }
        else if (inferenceType == "test")
        {
            var sides = parseInt(UI.getProperty("sel2SampTTestSides", "value"));
            var results = (inputType == "data") ? stat.twoSampTTestDiffMean(dataArr1, dataArr2, sides, conservativeDF)
                    : stat.twoSampTTestDiffMeanStats(parseFloat(UI.getProperty("txtGroup1Mean", "value")),
                                                     parseFloat(UI.getProperty("txtGroup2Mean", "value")),
                                                     parseFloat(UI.getProperty("txtGroup1SD", "value")),
                                                     parseFloat(UI.getProperty("txtGroup2SD", "value")),
                                                     parseInt(UI.getProperty("txtGroup1N", "value")),
                                                     parseInt(UI.getProperty("txtGroup2N", "value")),
                                                     sides, conservativeDF);

            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>t</TH><TH>P-value</TH><TH>df</TH></TR><TR>"
            tableHTML += "<TD>" + format.formatNumber(results.t)
                    + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                    + "</TD><TD>" + format.formatNumber(results.df)
                    + "</TD></TR></TABLE>"
            UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
            UI.setStyleProperty("spnInferenceResults", "display", "inline");
        }
        else if (inferenceType == "simulation")
        {
            UI.setStyleProperty("spnSimulationErrorMsg", "innerHTML", "");
            if (IV.validateInputInt("txtNumSamples", 1,
                Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
            {
                Array.prototype.push.apply(simulationResults, stat.simulationDiffMeans(dataArr1, dataArr2, parseInt(UI.getProperty("txtNumSamples", "value"))));

                var varname = UI.getProperty("txtVariableName", "value");
                if (!simulationGraphContainer)
                    simulationGraphContainer = new SPAApplet.QuantitativeGraphContainer("cnvSimulationPlot",
                                        "Simulated difference in mean" + (varname.length > 0 ? " " + varname : ""));
                else
                {
                    simulationGraphContainer.setVariableName("Simulated difference in mean" + (varname.length > 0 ? " " + varname : ""));
                    simulationGraphContainer.removeAllGraphs();
                }
                var simgraph = new SPAApplet.Dotplot(simulationResults, "");
                simgraph.preferXZeroSymmetry = true;
                simulationGraphContainer.addGraph(simgraph);

                UI.setProperty("spnSimulationTable", "innerHTML",
                    "<TABLE><TR><TH># samples</TH></TR><TR><TD>" + format.formatNumber(simulationResults.length) + "</TD></TR></TABLE><BR>");                        
                UI.setStyleProperty("spnSimulationResults", "display", "inline");
                UI.setStyleProperty("tblSimulatedDistribution", "display", "none");
                
                if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
                    handleSimulationDotplotCount();
            }
        }
    }
}

function exportSummaryStatistics()
{
    var variableName = UI.getProperty("txtVariableName", "value");
    file.saveCSV("txtSummaryStatisticsCSV", "summary_statistics" + (variableName.length > 0 ? "_" + variableName : ""));
}

function exportGraph()
{
    var graphType = (numGroups > 2 ? UI.getProperty("selGraphType3Groups", "value") :
                                     UI.getProperty("selGraphType1or2Groups", "value"));
    var variableName = UI.getProperty("txtVariableName", "value");
    file.saveCanvas('cnvPlot', graphType + (variableName.length > 0 ? "_" + variableName : ""));
}

function exportSimulationGraph()
{
    var graphType = (numGroups > 1 ? "simulation_meandiff" : "simulation_mean");
    file.saveCanvas('cnvSimulationPlot', graphType);
}

function initializePage()
{
    UI.batchSetStyleProperty(["spnGroup1Name", "divGroup2Input", "divGroup3Input", "divGraphDistributions",
            "divInference", "divSummaryStatistics", "spnGroup1MeanStats", "spnGroup1MedianStats",
            "spnGroup2MeanStats", "spnGroup2MedianStats", "spnGroup3MeanStats", "spnGroup3MedianStats",
            "txtSummaryStatisticsCSV", "spnInference1GroupTestOptions", "spnInference2GroupTestOptions",
            "divSimulationOptions", "spnSimulationResults", "spnSimulationDotplotCountingOptions", "tblSimulatedDistribution"],
            "display", "none");
    UI.setProperty("btnChangeInputs", "disabled", true);
    optionSim1 = document.getElementById("opt1GroupSimulation");
    optionDiffSim1 = document.getElementById("opt1GroupDiffSimulation");
    optionSim2 = document.getElementById("opt2GroupSimulation");
    selectSim1 = document.getElementById("selInference1Group");
    selectSim2 = document.getElementById("selInference2Group");
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
        UI.batchSetStyleProperty(["spnInputInstructions", "spnGroup1Data", "spnGroup2Data", "spnGroup3Data"], "display", "inline");
        UI.batchSetStyleProperty(["spnGroup1MeanStats", "spnGroup2MeanStats", "spnGroup3MeanStats",
                                  "spnGroup1MedianStats", "spnGroup2MedianStats", "spnGroup3MedianStats"], "display", "none");
    }
    else if (inputType == "meanstats")
    {
        UI.batchSetStyleProperty(["spnGroup1MeanStats", "spnGroup2MeanStats", "spnGroup3MeanStats"], "display", "inline");
        UI.batchSetStyleProperty(["spnInputInstructions", "spnGroup1Data", "spnGroup2Data", "spnGroup3Data",
                                  "spnGroup1MedianStats", "spnGroup2MedianStats", "spnGroup3MedianStats"], "display", "none");
    }
    else // median stats
    {
        UI.batchSetStyleProperty(["spnGroup1MedianStats", "spnGroup2MedianStats", "spnGroup3MedianStats"], "display", "inline");
        UI.batchSetStyleProperty(["spnInputInstructions", "spnGroup1Data", "spnGroup2Data", "spnGroup3Data",
                                  "spnGroup1MeanStats", "spnGroup2MeanStats", "spnGroup3MeanStats"], "display", "none");
    }
    deactivatePage();
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
    var graph = (simulationGraphContainer ? simulationGraphContainer.graphs[0] : null);
    if (graph)
        graph.clearCountingRegion();
}

SPAApplet.UIHandlers.setOnLoadWithPreload(initializePage);