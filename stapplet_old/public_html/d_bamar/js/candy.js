var pageActive = false;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;
var pref = STAP.Preferences;

var data = new STAP.CategoricalData1Var();
var simGraph = null;
var simDataGraph = null;
var graph = null;
var simulationGraphContainer = null;
var simulationResults = [];

var expectedFreq = {};
expectedFreq["MM"] = [0.125,0.125,0.125,0.125,0.25,0.25];
expectedFreq["SK"] = [0.2,0.2,0.2,0.2,0.2];

var categories = {};
categories["MM"] = ["Brown", "Red", "Yellow", "Green", "Orange", "Blue"];
categories["SK"] = ["Red", "Orange", "Yellow", "Green", "Purple"];

var candyTypes = ["MM", "SK"];

function initializePage()
{
    simGraph = new STAP.SVGGraph("divSimGraph");
    simDataGraph = new STAP.SVGGraph("divSimDataGraph", 400, 200);
    graph = new STAP.SVGGraph("divPlot");
    UI.batchSetStyleProperty(["divAnalysis", "divSK"], "display", "none");
    UI.batchSetProperty(["btnChangeInputs"], "disabled", true);
    UI.setProperty("selSimulationDotplotCountDir", "selectedIndex", 1);
    UI.setProperty("spnSimX2", "innerHTML", "");
    UI.writeLinkColorOriginRules();
}

function clearTables()
{
    for(var i = 0; i < candyTypes.length; i++)
        for(var j = 0; j < categories[candyTypes[i]].length; j++)
            UI.setProperty("txt" + candyTypes[i] + "Data" + (j+1), "value", "");
}

function augmentWithColors(dataArr)
{
    dataArr.forEach(function(d)
    {
        var color = d["Color"];
        if (color == "Brown")
            color = "SaddleBrown";
        else if (color == "Yellow")
            color = "Gold";
        d["barColor"] = color;
    });
    return dataArr;
}

function clearSimulationResults()
{
    simulationResults = [];
    simGraph.clearGraph();
    simDataGraph.clearGraph();
    UI.setProperty("spnSimX2", "innerHTML", "");
	clearSimulationDotplotCount();
}

function extractCountsTableRow(i, candyType, parseFn)
{
    var table = document.getElementById("tbl" + candyType);
    var nameVal = categories[candyType][i-1];
    var dataVal = UI.extractElementClassValue(table.rows[i].cells[1], "data", true);
    parseFn = parseFn || parseInt;
    
    return {
        valid: (nameVal.length != 0 && !isNaN(parseFn(dataVal)) && parseFn(dataVal) >= 0),
        blank: (nameVal.length == 0 && dataVal.length == 0),
        name: nameVal,
        data: parseFn(dataVal)
    };
}

function validateInputBuildData()
{
    var candyType = UI.getProperty("selCandyType", "value");
    var tblID = "tbl" + candyType;
    var rows = UI.getProperty(tblID, "rows");
    UI.setProperty("spnDataMsg", "innerHTML", "");
    var tempData = new STAP.CategoricalData1Var();

    var errRows = [];

    // in each row, cell index 1 is the category name and cell index 2 is the input data
    for (var i = 1; i < rows.length; i++)
    {
        var rowData = extractCountsTableRow(i, candyType);

        if (rowData.valid)
            tempData.addFrequencyFor(rowData.name, rowData.data);
        else if (!rowData.blank)
            errRows.push(i);
    }
    if (errRows.length > 0)
    {
        var errmsg = "Data entry errors in the following rows: ";
        for (var i = 0; i < errRows.length; i++)
        {
            errmsg += errRows[i];
            if (i < errRows.length - 1)
                errmsg += ", ";
        }
        UI.setProperty("spnDataMsg", "innerHTML", errmsg);
        return false;
    }

    // Must be valid -- go ahead and hold on to this data instead.
    data = tempData;

    return true;
}

function resetApplet()
{
    if (confirm("Are you sure? All data and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        UI.clearInputStates();
        deactivatePage();
        clearTables();
        graph.clearGraph();
        UI.batchSetProperty(["selSimulationDotplotCountDir", "selSimulationDotplotCountType"],"selectedIndex",1);
        UI.batchSetProperty(["txtSimulation1DotplotCountBound"], "value", "");
        UI.setProperty("txtNumSamples", "value", "1");
        UI.setProperty("chkX2", "checked", false);
    }
}

function setTableEnabledState(bEnabled)
{
    var candyType = UI.getProperty("selCandyType", "value");
    for (var i = 0; i < categories[candyType].length; i++)
        UI.setProperty("txt" + candyType + "Data" + (i + 1), "disabled", !bEnabled);
}

function deactivatePage(obj)
{
    if (pageActive)
    {
        if (obj && !confirm("Are you sure? The entries will remain, but any unsaved output will be lost."))
        {
            if (obj.value && obj.defaultValue && obj.defaultValue.length > 0)
                obj.value = obj.defaultValue;
            return false;
        }
        
        data.clear();

        UI.batchSetStyleProperty(["divAnalysis"], "display", "none");
        UI.batchSetProperty(["spnSummaryStatistics", "spnDataMsg",
                             "spnSimulationErrorMsg"], "innerHTML", "");
        UI.setProperty("btnChangeInputs", "disabled", true);
        UI.setProperty("btnBeginAnalysis", "disabled", false);
                             
        clearSimulationResults();
        clearSimulationDotplotCount();
        setTableEnabledState(true);
        UI.setProperty("selCandyType", "disabled", false);

        pageActive = false;
        return true;
    }
}

function beginAnalysis()
{
    if (validateInputBuildData())
    {
        pageActive = true;
        UI.batchSetStyleProperty(["divAnalysis"],
                                "display", "block");
        graph.barChart(augmentWithColors(data.toDataArray("Color")), "Color");
        updateSummaryStatistics();
        UI.setProperty("selCandyType", "disabled", true);
        setTableEnabledState(false);
        UI.setProperty("btnChangeInputs", "disabled", false);
        UI.setProperty("btnBeginAnalysis", "disabled", true);
    }
}

var divIds = ["divMM", "divSK"];

function handleCandyChange()
{
    var candyType = UI.getProperty("selCandyType", "value");
    UI.batchSetStyleProperty(divIds, "display", "none");
    UI.setStyleProperty("div" + candyType, "display", "block");
}

var expectedData = new STAP.CategoricalData1Var();

function updateSummaryStatistics()
{
    var candyType = UI.getProperty("selCandyType", "value");
    var expectedCounts = expectedFreq[candyType].map(
        function(x) { return x * data.getTotalFrequency(); }
    );

    var cats = categories[candyType];
    
    expectedData = new STAP.CategoricalData1Var();
    for (var i = 0; i < cats.length; i++)
        expectedData.addFrequencyFor(cats[i], expectedCounts[i]);

    var results = stat.chiSquaredGOFTest(data, expectedData);
    // Render a table programmatically
    var cntrb = results.contributions;
    tableHTML = "<TABLE><TR><TH>Color</TH><TH>Observed Frequency</TH><TH>Expected Frequency</TH><TH>Contribution</TH></TR>";

    for (var cat in expectedData.frequencies)
        tableHTML += "<TR><TD>" + cat +
            "</TD><TD>" + data.frequencies[cat] +
            "</TD><TD>" + format.formatNumber(expectedData.frequencies[cat]) +
            "</TD><TD>" + format.formatNumber(cntrb[cat]) +
            "</TD></TR>";
            
    tableHTML += "<TR><TD COLSPAN='3' STYLE='text-align: right;'>&chi;<SUP>2</SUP> = </TD><TD STYLE='font-weight: bold;'>" + format.formatNumber(results.x2) + "</TD></TABLE>";
    UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);
}

function simulateSamples()
{
    UI.setProperty("spnSimX2", "innerHTML", "");
    var numSamples = parseInt(UI.getProperty("txtNumSamples", "value"));
    var n = data.getTotalFrequency();
    var candyType = UI.getProperty("selCandyType", "value");
    var simulatedData = new STAP.CategoricalData1Var();
    // enforce category order
    categories[candyType].forEach(function(cat) {
        simulatedData.addFrequencyFor(cat, 0);
    });
    var sums = [];
    var sum = 0;
    for (var k = 0; k < expectedFreq[candyType].length; k++)
    {
        sum += expectedFreq[candyType][k];
        sums[k] = sum;
    }
    for (var i = 0; i < numSamples; i++)
    {
        simulatedData.clearFrequencies();
        for (var j = 0; j < n; j++)
        {
            var rand = Math.random();
            for (var k = 0; k < sums.length; k++)
                if (rand < sums[k])
                {
                    simulatedData.addFrequencyFor(categories[candyType][k]);
                    break;
                }
        }
        simulationResults.push(stat.chiSquaredGOFTest(simulatedData, expectedData).x2);
    }

    UI.setProperty("spnSimX2", "innerHTML", "&chi;<SUP>2</SUP> = " + format.formatNumber(simulationResults[simulationResults.length - 1]));
    simDataGraph.barChart(augmentWithColors(simulatedData.toDataArray("Color")), "Color");
    updateSimulationGraph();
}

function updateSimulationGraph()
{
    var attrName = "Simulated chi-square statistic";

	simGraph.dotplot(util.arrayToGraphData(simulationResults, attrName), attrName, null, true, false);
    if (UI.getProperty("chkX2", "checked"))
    {
        var df = categories[UI.getProperty("selCandyType", "value")].length - 1;
        /* Can this approach of comparing CDF work?
        var tol = 1;
		var sel = 0;
		simGraph.currentData.forEach(function(d){
			var x = d[attrName];
			if ((x <= df - 2 + tol) && (x >= df - 2 - tol)) sel++;
		});
        var empCDF = sel / simGraph.currentData.length;
        var theoCDF = jStat.chisquare.cdf(df - 2 + tol, df) - jStat.chisquare.cdf(df - 2 - tol, df);
		var maxFactor = simGraph.yScale.domain()[1] / jStat.chisquare.pdf(df - 2, df) * Math.min(theoCDF / empCDF, empCDF / theoCDF);

        simGraph.plotTopCurve(function(x) { return jStat.chisquare.pdf(x, df) * maxFactor;})
        */
        
        // scale height to 85% of max -- total guess
		var maxFactor = simGraph.yScale.domain()[1] / jStat.chisquare.pdf(df - 2, df) * 0.85;
        simGraph.plotTopCurve(function(x) { return jStat.chisquare.pdf(x, df) * maxFactor;})
    }        
    if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
        handleSimulationDotplotCount();    
}

function handleSimulationDotplotCount()
{
    UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");    
    if (UI.getProperty("txtSimulationDotplotCountBound", "value").length > 0)
    {
        var parsed = IV.validateInputFloat("txtSimulationDotplotCountBound", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spnSimulationDotplotCountErrorMsg", "Bound");
    	if (parsed)
    	{
    		var sel = UI.getProperty("selSimulationDotplotCountDir", "value");
    		var bound = 
    				parseFloat(UI.getProperty("txtSimulationDotplotCountBound", "value"));
    		if (sel == "left")
    			simGraph.forceSelectionRectangle(null, bound);
    		else
    			simGraph.forceSelectionRectangle(bound, null);
    	}
    }
}

function clearSimulationDotplotCount()
{
	UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");
	UI.setProperty("txtSimulationDotplotCountBound", "value", "");
	simGraph.clearSelectionRectangle();
}

STAP.UIHandlers.setOnLoad(initializePage);