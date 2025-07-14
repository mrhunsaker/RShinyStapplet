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
expectedFreq["MT"] = [0.124,0.131,0.135,0.198,0.205,0.207];
expectedFreq["SK"] = [0.2,0.2,0.2,0.2,0.2];
expectedFreq["FL"] = [1/6,1/6,1/6,1/6,1/6,1/6];
var categories = {};
categories["MM"] = ["Brown", "Red", "Yellow", "Green", "Orange", "Blue"];
categories["MT"] = ["Brown", "Red", "Yellow", "Green", "Orange", "Blue"];
categories["SK"] = ["Red", "Orange", "Yellow", "Green", "Purple"];
categories["FL"] = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"];
var descriptions = {};
descriptions["MM"] = "<P>Mars, Inc., is famous for its milk chocolate candies. \ Here’s what the company’s Consumer Affairs Department says about the \ distribution of color for M&M’S® Milk Chocolate Candies produced at its \ Hackettstown, New Jersey factory:</P><UL><LI>Brown: 12.5%\
    <LI>Red: 12.5%<LI>Yellow: 12.5%<LI>Green: 12.5%<LI>Orange: 25%\
    <LI>Blue: 25%</UL><P>The purpose of this activity is to investigate if the \ distribution of color in your large bag of M&amp;M’S Milk Chocolate \ Candies differs from the claimed distribution.</P>";
descriptions["MT"] = "<P>Mars, Inc., is famous for its milk chocolate candies. \ Here’s what the company’s Consumer Affairs Department says about the \ distribution of color for M&M’S® Milk Chocolate Candies produced at its \ Cleveland, Tennessee factory:</P><UL><LI>Brown: 12.4%<LI>Red: 13.1% \
    <LI>Yellow: 13.5%<LI>Green: 19.8%<LI>Orange: 20.5%<LI>Blue: 20.7% \
    </UL><P>The purpose of this activity is to investigate if the distribution \ of color in your large bag of M&amp;M’S Milk Chocolate Candies differs \ from the claimed distribution.</P>"
descriptions["SK"] = "<P>The regular variety of Skittles candies is claimed to \ contain equal percentages (20% each) of red, orange, yellow, green, and \ purple candies by the manufacturer.</P> \
    <P>The purpose of this activity is to investigate if the distribution of \ color in your large bag of Skittles candies differs from the claimed \ distribution.</P>"
descriptions["FL"] = "<P>The manufacturer of regular Froot Loops cereal claims \ that it contains equal percentages (approximately 16.67% each) of red, \ orange, yellow, green, blue, and purple loops.</P> \
    <P>The purpose of this activity is to investigate if the distribution of \ color in your box of Froot Loops differs from the claimed \
        distribution.</P>"

var candyTypes = ["MM", "MT", "SK", "FL"];

function initializePage()
{
    simGraph = new STAP.SVGGraph("divSimGraph");
    simDataGraph = new STAP.SVGGraph("divSimDataGraph", 400, 200);
    graph = new STAP.SVGGraph("divPlot");
    UI.batchSetStyleProperty(["divSimulationResults", "divAnalysis"], "display", "none");
    handleCandyChange();
    UI.batchSetProperty(["btnChangeInputs"], "disabled", true);
    UI.setProperty("selSimulationDotplotCountDir", "selectedIndex", 1);
    UI.setProperty("spnSimX2", "innerHTML", "");
    UI.writeLinkColorOriginRules();
}

function clearTable()
{
    for(var i = 0; i < 6; i++)
        UI.setProperty("txtData" + (i+1), "value", "");
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

function populateSample()
{
    if (!pageActive || deactivatePage(this))
    {
        var candyType = UI.getProperty("selCandyType", "value");
        var sampleSize = parseInt(UI.getProperty("txtSampleSize", "value"));
        if (isNaN(sampleSize) || (sampleSize < 1)) return;
        
        var cumulFreq = expectedFreq[candyType].slice();
        for (var i = 1; i < cumulFreq.length; i++)
            cumulFreq[i] += cumulFreq[i - 1];
    
        var sample = Array(cumulFreq.length).fill(0);
        for (var n = 0; n < sampleSize; n++)
        {
            var randnum = Math.random();
            for (var k = 0; k < cumulFreq.length; k++)
                if ((randnum < cumulFreq[k]) || (k == cumulFreq.length - 1))
                {
                    sample[k]++;
                    break;
                }
        }
        
        for (var k = 0; k < sample.length; k++)
            UI.setProperty("txtData" + (k + 1), "value", "" + sample[k]);
    }
}

function clearSimulationResults()
{
    UI.setStyleProperty("divSimulationResults", "display", "none");
    simulationResults = [];
    simGraph.clearGraph();
    simDataGraph.clearGraph();
    UI.setProperty("spnSimX2", "innerHTML", "");
    UI.setProperty("spnNumTrials", "innerHTML", "");
	clearSimulationDotplotCount();
}

function extractCountsTableRow(i, candyType, parseFn)
{
    var table = document.getElementById("tblData");
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
    var numRows = expectedFreq[candyType].length + 1;
    UI.setProperty("spnDataMsg", "innerHTML", "");
    var tempData = new STAP.CategoricalData1Var();

    var errRows = [];

    // in each row, cell index 1 is the category name and cell index 2 is the input data
    for (var i = 1; i < numRows; i++)
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
        clearTable();
        graph.clearGraph();
        UI.batchSetProperty(["selSimulationDotplotCountDir", "selSimulationDotplotCountType"],"selectedIndex",1);
        UI.batchSetProperty(["txtSimulation1DotplotCountBound"], "value", "");
        UI.setProperty("txtNumSamples", "value", "1");
        UI.setProperty("chkX2", "checked", false);
    }
}

function setTableEnabledState(bEnabled)
{
    for (var i = 0; i < 6; i++)
        UI.setProperty("txtData" + (i + 1), "disabled", !bEnabled);
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
        UI.setProperty("btnGenerateSample", "disabled", false);
                             
        clearSimulationResults();
        clearSimulationDotplotCount();
        setTableEnabledState(true);
        UI.setProperty("selCandyType", "disabled", false);
        UI.setProperty("txtSampleSize", "disabled", false);

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
        graph.barChart(augmentWithColors(data.toDataArray("Color")), "Color",false,"Count");
        updateSummaryStatistics();
        UI.setProperty("selCandyType", "disabled", true);
        UI.setProperty("txtSampleSize", "disabled", true);
        setTableEnabledState(false);
        UI.setProperty("btnChangeInputs", "disabled", false);
        UI.setProperty("btnBeginAnalysis", "disabled", true);
        UI.setProperty("btnGenerateSample", "disabled", true);
    }
}

function handleCandyChange()
{
    clearTable();
    var candyType = UI.getProperty("selCandyType", "value");
    UI.setProperty("divDesc", "innerHTML", descriptions[candyType]);
    var colors = categories[candyType];
    for (var i = 0; i < colors.length; i++)
        UI.setProperty("tdColor" + (i + 1), "innerHTML", colors[i]);
    if (colors.length < 6)
        UI.setStyleProperty("trRow6", "display", "none");
    else
        UI.setStyleProperty("trRow6", "display", "table-row");
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
    tableHTML = "<TABLE><TR><TH>Color</TH><TH>Observed Count</TH><TH>Expected Count</TH><TH>Contribution</TH></TR>";

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
    simDataGraph.barChart(augmentWithColors(simulatedData.toDataArray("Color")), "Color",false,"Count");
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

    UI.setProperty("spnNumTrials", "innerHTML", simulationResults.length);
    UI.setStyleProperty("divSimulationResults", "display", "block");
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