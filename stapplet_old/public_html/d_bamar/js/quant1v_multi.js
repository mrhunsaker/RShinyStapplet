var pageActive = false;
var numGroups = 0;
var graph = null;
var simGraph = null;
var dataArr = [];
var simulationResults = [];
var optionSim2 = null;
var optionSim2Med = null;
var optionSim2SD = null;
var optionStemplot = null;
var option2Interval = null;
var option2Test = null;
var selectSim2 = null;
var selectGraph = null;
var stem = null;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;

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

function appendInputRow()
{
	numGroups++;
	
	// raw data row				
	var row = d3.select("#tblGroups")
		.append("tr")
			.attr("class", "tblrow")
			.attr("id", "tblGroupsRow" + numGroups);
			
	row.append("th")
		.attr("id", "tblGroupsRowNum" + numGroups)
		.html("" + numGroups);
	
	row.append("th")
		.append("input")
			.attr("class", "ctl editor")
			.attr("type", "text")
			.attr("id", "txtGroup" + numGroups + "Name")
			.attr("size", 10)
			.on("change", function(d) { inputsChanged(); });

	row.append("th")
		.attr("class", "tblGroupsRaw")
		.append("input")
			.attr("class", "ctl editor")
			.attr("type", "text")
			.attr("id", "txtGroup" + numGroups + "Data")
			.attr("size", 40)
			.on("change", function(d) { inputsChanged(this); });

	row.append("th")
		.attr("class", "tblGroupsMean")
		.append("input")
			.attr("class", "ctl editor")
			.attr("type", "number")
			.attr("step", 0.1)
			.attr("id", "txtGroup" + numGroups + "Mean")
			.style("width", "80px")
			.on("change", function(d) { inputsChanged(this); });

	row.append("th")
		.attr("class", "tblGroupsMean")
		.append("input")
			.attr("class", "ctl editor")
			.attr("type", "number")
			.attr("min", 0)
			.attr("step", 0.1)
			.attr("id", "txtGroup" + numGroups + "SD")
			.style("width", "80px")
			.on("change", function(d) { inputsChanged(this); });

	row.append("th")
		.attr("class", "tblGroupsMean")
		.append("input")
			.attr("class", "ctl editor")
			.attr("type", "number")
			.attr("min", 1)
			.attr("step", 1)
			.attr("id", "txtGroup" + numGroups + "N")
			.style("width", "80px")
			.on("change", function(d) { inputsChanged(this); });

	row.append("th")
		.attr("class", "tblGroupsMedian")
		.append("input")
			.attr("class", "ctl editor")
			.attr("type", "number")
			.attr("step", 0.1)
			.attr("id", "txtGroup" + numGroups + "Min")
			.style("width", "80px")
			.on("change", function(d) { inputsChanged(this); });

	row.append("th")
		.attr("class", "tblGroupsMedian")
		.append("input")
			.attr("class", "ctl editor")
			.attr("type", "number")
			.attr("step", 0.1)
			.attr("id", "txtGroup" + numGroups + "Q1")
			.style("width", "80px")
			.on("change", function(d) { inputsChanged(this); });

	row.append("th")
		.attr("class", "tblGroupsMedian")
		.append("input")
			.attr("class", "ctl editor")
			.attr("type", "number")
			.attr("step", 0.1)
			.attr("id", "txtGroup" + numGroups + "Median")
			.style("width", "80px")
			.on("change", function(d) { inputsChanged(this); });

	row.append("th")
		.attr("class", "tblGroupsMedian")
		.append("input")
			.attr("class", "ctl editor")
			.attr("type", "number")
			.attr("step", 0.1)
			.attr("id", "txtGroup" + numGroups + "Q3")
			.style("width", "80px")
			.on("change", function(d) { inputsChanged(this); });

	row.append("th")
		.attr("class", "tblGroupsMedian")
		.append("input")
			.attr("class", "ctl editor")
			.attr("type", "number")
			.attr("step", 0.1)
			.attr("id", "txtGroup" + numGroups + "Max")
			.style("width", "80px")
			.on("change", function(d) { inputsChanged(this); });

	if (numGroups > 2)
	{
		var g = numGroups;
		row.append("td")
			.attr("id", "tdbtnDeleteRow" + g)
			.append("input")
				.attr("id", "btnDeleteRow" + g)
				.attr("class", "editor")
				.attr("type", "button")
				.attr("value", "-")
				.attr("onclick", "deleteInputRow(" + g + ")");
	}
	else
		row.append("td");
			
	handleInputTypeChange();
}

function deleteInputRow(n)
{
	var row = d3.select("#tblGroupsRow" + n);
	if (row.empty()) return;
	
	row.remove();
	n++;
	var suffixes = ["Name", "Data", "Mean", "SD", "N", "Min", "Q1", "Median", "Q3", "Max"];
	while (n <= numGroups)
	{
		var nn = n - 1;
		d3.select("#tblGroupsRowNum" + n)
			.attr("id", "tblGroupsRowNum" + nn)
			.html("" + nn);
		row = d3.select("#tblGroupsRow" + n);
		row.attr("id", "tblGroupsRow" + nn);
		suffixes.forEach(function(s) { d3.select("#txtGroup" + n + s).attr("id", "txtGroup" + nn + s); });		
		d3.select("#btnDeleteRow" + n).remove();
		d3.select("#tdbtnDeleteRow" + n)
			.attr("id", "tdbtnDeleteRow" + nn)
			.append("input")
				.attr("id", "btnDeleteRow" + nn)
				.attr("class", "editor")
				.attr("type", "button")
				.attr("value", "-")
				.attr("onclick", "deleteInputRow(" + nn + ")");
		n++;
	}
	numGroups--;
}

function clearSelectSimOptions()
{
    while (selectSim2.length > 0) selectSim2.remove(0);
}

function validateInput()
{
    UI.batchSetProperty(["spnGroup1InputMsg", "spnGroup2InputMsg", "spnGroup3InputMsg"], "innerHTML", "");
    var inputType = UI.getProperty("selInputType", "value");
    if (inputType == "data")
    {
        // I used to fiddle with the select here. Do I need to do it here? 

        for (var i = 1; i <= numGroups; i++)
	        if (!IV.validateInputFloatArray("txtGroup" + i + "Data", "spnInputMsg", "Group " + i)) return false;

        return true;
    }
    else if (inputType == "meanstats")
    {
        // I used to fiddle with the select here. Do I need to do it here?
        var groupValidate = function(n)
        {
            if (!simpleValidate("txtGroup" + n + "Mean", "spnGroup" + n + "InputMsg", "Mean")) return false;
            if (!simpleValidate("txtGroup" + n + "SD", "spnGroup" + n + "InputMsg", "SD")) return false;
            if (!simpleValidate("txtGroup" + n + "N", "spnGroup" + n + "InputMsg", "n", parseInt)) return false;
            if (parseFloat(UI.getProperty("txtGroup" + n + "SD", "value")) < 0)
            {
                UI.setProperty("spnInputMsg", "innerHTML", "Group " + n + " SD must be non-negative.");
                return false;
            }
            if (parseInt(UI.getProperty("txtGroup" + n + "N", "value")) <= 0)
            {
                UI.setProperty("spnInputMsg", "innerHTML", "Group " + n + " number of observations must be positive.");
                return false;
            }
            return true;                
        }

        for (var i = 1; i <= numGroups; i++)
	        if (!groupValidate(i)) return false;

        return true;
    }
    else // median stats
    {
        var groupValidate = function(n)
        {
            if (!simpleBatchValidate(["txtGroup" + n + "Min", "txtGroup" + n + "Q1", "txtGroup" + n + "Median", "txtGroup" + n + "Q3", "txtGroup" + n + "Max"],
                                      "spnInputMsg", "Group " + n + " five-number summary values")) return false;
            var min = parseFloat(UI.getProperty("txtGroup" + n + "Min", "value"));
            var Q1 = parseFloat(UI.getProperty("txtGroup" + n + "Q1", "value"));
            var median = parseFloat(UI.getProperty("txtGroup" + n + "Median", "value"));
            var Q3 = parseFloat(UI.getProperty("txtGroup" + n + "Q3", "value"));
            var max = parseFloat(UI.getProperty("txtGroup" + n + "Max", "value"));
            if ((min > Q1) || (Q1 > median) || (median > Q3) || (Q3 > max))
            {
                UI.setProperty("spnInputMsg", "innerHTML", "Group " + n + " five-number summary values are out of order.")
                return false;
            }
            return true;
        }

        for (var i = 1; i <= numGroups; i++)
	        if (!groupValidate(i)) return false;

        return true;
    }
}

function resetApplet()
{
    if (confirm("Are you sure? All data and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        deactivatePage();
        d3.selectAll(".ctl").attr("value", "");
        UI.batchSetProperty(["selNumGroups", "selInputType", "selSimulationDotplotCountType", "selSimulationDotplotCountDir", "selStemplotStems"], "selectedIndex", 0);
        UI.setProperty("numSigAdj", "value", 0);
        UI.setProperty("selInputType", "disabled", false);

	d3.selectAll(".tblrow").remove();
	numGroups = 0;
		
    // Start with two rows in the table
    appendInputRow();
    appendInputRow();

        dataArr = [];
        handleInputTypeChange(document.getElementById("selInputType"));
    }
}

function deactivatePage()
{
    UI.setProperty("txtSummaryStatisticsCSV", "value", "");
    UI.batchSetStyleProperty(["divSummaryStatistics", "divGraphDistributions", "divInference",
                         "divInference2Groups", "divInferenceManyGroups", "divSimulationOptions",
                         "spnInference1GroupTestOptions", "spnInference2GroupTestOptions",
                         "spnSimulationDotplotCountingOptions"],
                         "display", "none");
    UI.batchSetProperty(["spnSummaryStatistics", "spnInferenceResults", "spnANOVA"],
                         "innerHTML", "");
    UI.batchSetProperty(["selGraphType1or2Groups", "selGraphType3Groups", "selSplitStems",
                         "selInference1Group", "selInference2Group", "sel1SampTTestSides",
                         "sel2SampTTestSides"], "selectedIndex", 0);
    handle2GroupInferenceChange(document.getElementById("selInference2Group"));
    UI.setProperty("btnChangeInputs", "disabled", true);

    d3.selectAll(".editor").attr("disabled", null);
    pageActive = false;
}

function clearSimulationResults(clearDots)
{
    simulationResults = [];
    UI.setStyleProperty("spnSimulationResults", "display", "none");
    if (clearDots) clearSimulationDotplotCount();
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
        dataArr = [];
        d3.selectAll(".editor").attr("disabled", true);

        UI.setProperty("btnChangeInputs", "disabled", false);
        var inputType = UI.getProperty("selInputType", "value");
        UI.setStyleProperty("divGraphDistributions", "display", (inputType != "meanstats" ? "block" : "none"));
        UI.setStyleProperty("divSummaryStatistics", "display", (inputType == "data" ? "block" : "none"));
        clearSelectSimOptions();
        
        var inputType = UI.getProperty("selInputType", "value");
        if (inputType == "data")
        {              
            for (var i = 1; i <= numGroups; i++)
            {
            	UI.recordInputState("txtGroup" + i + "Data");
            	dataArr.push(util.splitStringGetArray(document.getElementById("txtGroup" + i + "Data").value));
                
            }
            
            updateSummaryStatistics();
            if (numGroups === 2)
            {
                if (selectGraph.options.length < 4)
                    selectGraph.add(optionStemplot);
                selectSim2.add(optionSim2);
                selectSim2.add(optionSim2Med);
                selectSim2.add(optionSim2SD);
                selectSim2.add(option2Interval);
                selectSim2.add(option2Test);
                selectSim2.selectedIndex = "0";
            }
            else
            {
                while (selectGraph.options.length > 3)
                    selectGraph.remove(3);
            }

            updateGraphDistributions();
        }               
        else if (inputType == "medianstats")
        {
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

    	    dataArr = [];
    	    for (var i = 1; i <= numGroups; i++) dataArr.push(makeArr(i));
                updateGraphDistributions();
        }
        else // meanstats
        {
            if (numGroups === 2)
            {
                selectSim2.add(option2Interval);
                selectSim2.add(option2Test);
                selectSim2.selectedIndex = "0";
            }
        }

        var queryString = UI.getQueryString();
        if (queryString["inf"])
        	UI.setProperty("selInference2Group", "value", queryString["inf"]);

       	handle2GroupInferenceChange(document.getElementById("selInference2Group"));

        if (inputType != "medianstats")
        {
            UI.setStyleProperty("divInference", "display", "block");
            if (numGroups === 2)
            {
                UI.setStyleProperty("divInference2Groups", "display", "block");
                UI.setStyleProperty("divInferenceManyGroups", "display", "none");
            }
            else
            {
                UI.setStyleProperty("divInference2Groups", "display", "none");
                UI.setStyleProperty("divInferenceManyGroups", "display", "block");
            }
        }
        else                                    
            UI.setStyleProperty("divInference", "display", "none");

     }
}

function updateSummaryStatistics()
{
    var stats = [];
    for (var i = 0; i < numGroups; i++)
    	stats.push(stat.getOneVariableStatistics(dataArr[i]));
    	
    // Group names
    var groupname = function(i)
    {
    	var name = UI.getProperty("txtGroup" + i + "Name", "value");
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
    tableHTML += "</TABLE>"
    UI.setStyleProperty("spnSummaryStatistics", "display", "inline");
    UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);
    UI.setProperty("txtSummaryStatisticsCSV", "value", resultsCSV);
}

function updateGraphDistributions()
{
    var inputType = UI.getProperty("selInputType", "value");
    if (inputType == "data")
        UI.setStyleProperty("spnGraphOptions", "display", "inline");
    else
        UI.setStyleProperty("spnGraphOptions", "display", "none");

    var varname = util.trimString(UI.getProperty("txtVariableName", "value"));
    if (varname.length == 0) varname = "Variable";

    var graphType = (inputType == "medianstats" ? "boxplot" :
                        	   UI.getProperty("selGraphType", "value"));

    var graphdatas = [];
    dataArr.forEach(function(arr) { graphdatas.push(util.arrayToGraphData(arr, varname)); });
    var xattrs = [];
    for (var i = 1; i <= numGroups; i++) xattrs.push(UI.getProperty("txtGroup" + i + "Name", "value"));
    	
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

function setHistogramDefaultBins()
{
	UI.setProperty("txtHistogramBinWidth", "value", "");
	UI.setProperty("txtHistogramBinAlignment", "value", "");
	updateGraphDistributions();
}

function handle2GroupInferenceChange(sel)
{
    UI.batchSetStyleProperty(["spnSimulationResults", "spnInferenceResults"], "display", "none");
    UI.setStyleProperty("spnInference2GroupTestOptions", "display", (sel.value == "test" ? "inline" : "none"));
    UI.setStyleProperty("spnInference2GroupIntervalOptions", "display", (sel.value == "interval" ? "inline" : "none"));
    UI.setStyleProperty("divSimulationOptions", "display", (sel.value.indexOf("simulation") == 0 ? "block" : "none"));
    UI.setStyleProperty("spnInference2GroupConservativeDFOptions", "display", (sel.value.indexOf("simulation") < 0 ? "inline" : "none"));
    if (sel.value.indexOf("simulation") == 0)
    {
        clearSimulationResults(true);
        UI.setProperty("spnSimulationDescription", "innerHTML",
        "Simulates the distribution of the difference in sample " +
        (sel.value == "simulation" ? "means when the observations" :
        	(sel.value == "simulationMed" ? "medians when the observations" : "standard deviations when the deviations from the group means")
        ) + " are combined, shuffled, and redistributed into two groups that match the sizes of the original groups.<BR>");
        UI.setStyleProperty("spnSimulationDotplotCountingOptions", "display", "inline");
    }
}

function updateInference()
{
	var inferenceType = (numGroups === 2 ? UI.getProperty("selInference2Group", "value") : "anova");
	var inputType = UI.getProperty("selInputType", "value");
	var variableName = UI.getProperty("txtVariableName", "value");
	UI.batchSetStyleProperty(["spnInferenceResults", "spnSimulationResults"], "display", "none");
	UI.setProperty("spnSimulationTable", "innerHTML", "");
	
        var conservativeDF = parseInt(UI.getProperty("sel2SampTDF", "value"));
        if (inferenceType == "interval")
        {
            var cLevel = parseFloat(UI.getProperty("sel2CLevel", "value") / 100);
            var results = (inputType == "data") ? stat.twoSampTIntervalDiffMean(dataArr[0], dataArr[1],
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
            var results = (inputType == "data") ? stat.twoSampTTestDiffMean(dataArr[0], dataArr[1], sides, conservativeDF)
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
                Array.prototype.push.apply(simulationResults, stat.simulationDiffMeans(dataArr[0], dataArr[1], parseInt(UI.getProperty("txtNumSamples", "value"))));

                var varname = "Simulated difference in means";
                UI.setStyleProperty("spnSimulationResults", "display", "inline");
		simGraph.dotplot(util.arrayToGraphData(simulationResults, varname), varname, null, true);
                UI.setProperty("spnNumTrials", "innerHTML", format.formatNumber(simulationResults.length));
		UI.setProperty("spnRecentResult", "innerHTML", format.formatNumber(simulationResults[simulationResults.length - 1]));
		var resultStats = stat.getOneVariableStatistics(simulationResults);
		UI.setProperty("spnSimMean", "innerHTML", format.formatNumber(resultStats.mean));
		UI.setProperty("spnSimSD", "innerHTML", format.formatNumber(resultStats.Sx));
                
                if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
                    handleSimulationDotplotCount();
            }
        }
        else if (inferenceType == "simulationMed")
        {
            UI.setStyleProperty("spnSimulationErrorMsg", "innerHTML", "");
            if (IV.validateInputInt("txtNumSamples", 1,
                Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
            {
                Array.prototype.push.apply(simulationResults, stat.simulationDiffMedians(dataArr[0], dataArr[1], parseInt(UI.getProperty("txtNumSamples", "value"))));

                var varname = "Simulated difference in medians";
                UI.setStyleProperty("spnSimulationResults", "display", "inline");
		simGraph.dotplot(util.arrayToGraphData(simulationResults, varname), varname, null, true);
                UI.setProperty("spnNumTrials", "innerHTML", format.formatNumber(simulationResults.length));
		UI.setProperty("spnRecentResult", "innerHTML", format.formatNumber(simulationResults[simulationResults.length - 1]));
		var resultStats = stat.getOneVariableStatistics(simulationResults);
		UI.setProperty("spnSimMean", "innerHTML", format.formatNumber(resultStats.mean));
		UI.setProperty("spnSimSD", "innerHTML", format.formatNumber(resultStats.Sx));
                
                if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
                    handleSimulationDotplotCount();
            }
        }
        else if (inferenceType == "simulationSD")
        {
            UI.setStyleProperty("spnSimulationErrorMsg", "innerHTML", "");
            if (IV.validateInputInt("txtNumSamples", 1,
                Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
            {
                Array.prototype.push.apply(simulationResults, stat.simulationDiffSDs(dataArr[0], dataArr[1], parseInt(UI.getProperty("txtNumSamples", "value"))));

                var varname = "Simulated difference in standard deviations";
                UI.setStyleProperty("spnSimulationResults", "display", "inline");                
		simGraph.dotplot(util.arrayToGraphData(simulationResults, varname), varname, null, true);
                UI.setProperty("spnNumTrials", "innerHTML", format.formatNumber(simulationResults.length));
		UI.setProperty("spnRecentResult", "innerHTML", format.formatNumber(simulationResults[simulationResults.length - 1]));
		var resultStats = stat.getOneVariableStatistics(simulationResults);
		UI.setProperty("spnSimMean", "innerHTML", format.formatNumber(resultStats.mean));
		UI.setProperty("spnSimSD", "innerHTML", format.formatNumber(resultStats.Sx));

                if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
                    handleSimulationDotplotCount();
            }
        }
        else // ANOVA
        {
            var results = null;
            if (inputType == "data")
            	results = stat.oneWayANOVA(dataArr);
            else
            {
            	var means = [];
            	var SDs = [];
            	var ns = [];
            	
            	for (var i = 1; i <= numGroups; i++)
            	{
            		means.push(parseFloat(UI.getProperty("txtGroup" + i + "Mean", "value")));
            		SDs.push(parseFloat(UI.getProperty("txtGroup" + i + "SD", "value")));
            		ns.push(parseFloat(UI.getProperty("txtGroup" + i + "N", "value")));
            	}
            	
            	results = stat.oneWayANOVAStats(means, SDs, ns);
 	    }
 	    
            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>F</TH><TH>P-value</TH><TH>df<SUB>between</SUB></TH><TH>df<SUB>within</SUB></TH></TR><TR>"
            tableHTML += "<TD>" + format.formatNumber(results.F)
                    + "</TD><TD>" + format.formatNumber(results.pValue)
                    + "</TD><TD>" + format.formatNumber(results.dfb)
                    + "</TD><TD>" + format.formatNumber(results.dfw)
                    + "</TD></TR></TABLE>"
            UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
            UI.setStyleProperty("spnInferenceResults", "display", "inline");        
        }
}

function exportSummaryStatistics()
{
    var variableName = UI.getProperty("txtVariableName", "value");
    file.saveCSV("txtSummaryStatisticsCSV", "summary_statistics" + (variableName.length > 0 ? "_" + variableName : ""));
}

function exportGraph()
{
    var graphType = (UI.getProperty("selInputType", "value") == "medianstats" ? "boxplot" :
                        	   UI.getProperty("selGraphType", "value"));
    var variableName = UI.getProperty("txtVariableName", "value");
    file.saveSVG(graph.svgRoot, graphType + (variableName.length > 0 ? "_" + variableName : ""));
}

function exportSimulationGraph()
{
    file.saveSVG(simGraph.svgRoot, "simulation_meandiff");
}

function initializePage()
{
    UI.batchSetStyleProperty(["divGraphDistributions", "divInference", "divSummaryStatistics", "divInference2Groups", "divInferenceManyGroups",
            "txtSummaryStatisticsCSV", "spnInference1GroupTestOptions", "spnInference2GroupTestOptions",
            "divSimulationOptions", "spnSimulationResults", "spnSimulationDotplotCountingOptions", "divStemplot"],
            "display", "none");
    UI.setProperty("btnChangeInputs", "disabled", true);
    optionSim2 = document.getElementById("opt2GroupSimulation");
    optionSim2Med = document.getElementById("opt2GroupSimulationMed");
    optionSim2SD = document.getElementById("opt2GroupSimulationSD");
    optionStemplot = document.getElementById("optStemplot");
    option2Interval = document.getElementById("opt2GroupInterval");
    option2Test = document.getElementById("opt2GroupTest");
    selectSim2 = document.getElementById("selInference2Group");
    selectGraph = document.getElementById("selGraphType");
    
    graph = new STAP.SVGGraph("divPlot");
    simGraph = new STAP.SVGGraph("divSimulationPlot");
    stem = new STAP.HTMLStemplot("divStemplotPlot");
    
    // Start with two rows in the table
    appendInputRow();
    appendInputRow();
    numGroups = 2;
    
    // Set inputs correctly
    d3.selectAll(".tblGroupsRaw").style("display", null);
    d3.selectAll(".tblGroupsMean").style("display", "none");
    d3.selectAll(".tblGroupsMedian").style("display", "none");
    
    UI.writeLinkColorOriginRules();
}

function handleInputTypeChange()
{
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
        {
            UI.resetInputState("selInputType");
            return;                    
        }
    }
    var sel = document.getElementById("selInputType");
    UI.recordInputState("selInputType");
    var inputType = sel.value;
    
    // Set inputs correctly
    d3.selectAll(".tblGroupsRaw").style("display", (inputType == "data" ? null : "none"));
    d3.selectAll(".tblGroupsMean").style("display", (inputType == "meanstats" ? null : "none"));
    d3.selectAll(".tblGroupsMedian").style("display", (inputType == "medianstats" ? null : "none"));

    deactivatePage();
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
	simGraph.clearSelectionRectangle();
} 

function clearSimulationResults()
{
    simulationResults = [];
    UI.setStyleProperty("spnSimulationResults", "display", "none");
    clearSimulationDotplotCount();
}

STAP.UIHandlers.setOnLoad(initializePage);