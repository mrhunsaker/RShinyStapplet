var pageActive1Grp = false;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;
var pref = STAP.Preferences;

var data1Grp = new STAP.CategoricalData1Var();
var dataGraph = null;
var simGraph = null;

var simulation1GrpGraphContainer = null;
var simulation1GrpResults = [];

function initializePage1Grp()
{
    dataGraph = new STAP.SVGGraph("divDataGraph");
    simGraph = new STAP.SVGGraph("divSimGraph");
    UI.batchSetStyleProperty(["txtSummaryStatistics1GrpCSV", "divInputRawData1Grp", 
                    "spnZTest1GrpOptions", "spnChiSquaredTest1GrpOptions", "divSummaryStatistics1Grp",
                    "divDisplayGraph1Grp", "divInference1Grp", "spnZInterval1GrpOptions", "spnSimulation1GrpResults"], "display", "none");
    UI.setProperty("btnChangeInputs1Grp", "disabled", true);
    UI.writeLinkColorOriginRules();
}

function clearSimulation1GrpResults()
{
    simulation1GrpResults = [];
    UI.setStyleProperty("spnSimulation1GrpResults", "display", "none");
    UI.setProperty("spnSimulation1GrpErrorMsg", "innerHTML", "");
	clearSimulation1GrpDotplotCount();
}

function addNewCountsRow1Grp()
{
    if (pageActive1Grp)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
            return;
        deactivatePage1Grp();
    }
    
    UI.setProperty("spnData1GrpMsg", "innerHTML", "");
    var table = document.getElementById("tblInputCounts1Grp");
    var row = table.insertRow(table.rows.length - 1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var currentRows = (table.rows.length - 2);
    cell1.innerHTML = '<LABEL FOR="txtInputCounts1GrpName' + currentRows + '">' + currentRows + '</LABEL>';
    cell2.innerHTML = '<INPUT TYPE="text" CLASS="name" ID="txtInputCounts1GrpName' + currentRows + '" SIZE="10" onChange="return deactivatePage1Grp(this)">';
    cell3.innerHTML = '<INPUT TYPE="text" TITLE="Frequency" CLASS="data" ID="txtInputCounts1GrpData' + currentRows + '" SIZE="10" onChange="return deactivatePage1Grp(this)">';
    cell4.innerHTML = '<INPUT TYPE="button" VALUE="-" CLASS="ctl" ID="txtInputCounts1GrpCtl' + currentRows + '" onClick="removeCountsTableRow1Grp(this)">';          
}

function fixCountsTableRowNumbers1Grp()
{
    var table = document.getElementById("tblInputCounts1Grp");
    // Fix all the row indicators and control IDs now
    for (var i = 1; i < (table.rows.length - 1); i++)
    {
        table.rows[i].cells[0].innerHTML = '<LABEL FOR="txtInputCounts1GrpName' + i + '">' + i + '</LABEL>';
        UI.extractElement(table.rows[i].cells[1], "name").id = "txtInputCounts1GrpName" + i;
        UI.extractElement(table.rows[i].cells[2], "data").id = "txtInputCounts1GrpData" + i;
        UI.extractElement(table.rows[i].cells[3], "ctl").id = "txtInputCounts1GrpCtl" + i;
    }
}

function extractCountsTableRow1Grp(i, parseFn)
{
    var table = document.getElementById("tblInputCounts1Grp");
    var nameVal = UI.extractElementClassValue(table.rows[i].cells[1], "name", true);
    var dataVal = UI.extractElementClassValue(table.rows[i].cells[2], "data", true);
    parseFn = parseFn || parseInt;
    
    return {
        valid: (nameVal.length != 0 && !isNaN(parseFn(dataVal))),
        blank: (nameVal.length == 0 && dataVal.length == 0),
        name: nameVal,
        data: parseFn(dataVal)
    };
}

function removeCountsTableRow1Grp(btn)
{
    var table = document.getElementById("tblInputCounts1Grp");
    if (table.rows.length == 4)    // There must be at least two categories for this page to work
    {
        UI.setProperty("spnData1GrpMsg", "innerHTML", "At least two categories are required.");
        return;
    }
    else
        UI.setProperty("spnData1GrpMsg", "innerHTML", "");
    
    if (pageActive1Grp)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
            return;
        deactivatePage1Grp();
    }
    
    // The parent of the parent should be the <TR>
    var rowIndex = btn.parentNode.parentNode.rowIndex;
    table.deleteRow(rowIndex);

    fixCountsTableRowNumbers1Grp();
}

function validateInputBuildData1Grp()
{
    var rows = UI.getProperty("tblInputCounts1Grp", "rows");
    UI.setProperty("spnData1GrpMsg", "innerHTML", "");
    var tempData = new STAP.CategoricalData1Var();
    if (UI.getProperty("selInputType1Grp", "value") == "counts")
    {
        var errRows = [];

        // in each row, cell index 1 is the category name and cell index 2 is the input data
        for (var i = 1; i < (rows.length - 1); i++)
        {
            var rowData = extractCountsTableRow1Grp(i);

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
            UI.setProperty("spnData1GrpMsg", "innerHTML", errmsg);
            return false;
        }
        if (tempData.categories.length < 2)
        {
            UI.setProperty("spnData1GrpMsg", "innerHTML", "At least two categories are required.");
            return false;
        }
    }
    else
    {
        tempData.addDataString(UI.getProperty("txtInputRawData1Grp", "value"));
        if (tempData.categories.length < 2)
        {
            UI.setProperty("spnData1GrpMsg", "innerHTML", "At least two categories are required.");
            return false;
        }
    }
    
    // Must be valid -- go ahead and hold on to this data instead.
    data1Grp = tempData;
    
    // Rebuild the success category dropdown and category table
    // in the inference section and show the correct set of options
    var sel = document.getElementById("selCatSuccess1Grp");
    var tblInference = document.getElementById("tblChiSquaredExpected1Grp");

    for (var i = 0; i < data1Grp.categories.length; i++)
    {
        var cat = data1Grp.categories[i];
        var option = document.createElement("option");
        option.text = cat;
        option.value = cat;
        sel.add(option);
    }
    while (tblInference.rows.length > 1)
        tblInference.deleteRow(1);
    for (var i = 0; i < data1Grp.categories.length; i++)
    {
        var cat = data1Grp.categories[i];
        
        // append new row
        var row = tblInference.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        
        cell1.innerHTML = '<LABEL FOR="txtGOFObs' + (1 + i) + '">' + cat + '</LABEL>';
        cell2.innerHTML = '<LABEL FOR="txtGOFObs' + (1 + i) + '">' + data1Grp.frequencies[cat] + '</LABEL>';
        cell3.innerHTML = '<INPUT TYPE="text" ID="txtGOFObs' + (1 + i) + '" CLASS="data" SIZE="5">';
    }
    return true;
}

function rebuildTable1Grp()
{
    // Remove all rows except the first and last one.
    var table = document.getElementById("tblInputCounts1Grp");
    while (table.rows.length > 2)
        table.deleteRow(1); // the first and last rows are essential to the table structure.  Row index 1
                            // is always the first row that is data entry.

    // Add two blank rows to the table
    for (var i = 0; i < 2; i++)
    {
        var row = table.insertRow(1 + i);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        cell1.innerHTML = '<LABEL FOR="txtInputCounts1GrpName' + (1 + i) + '">' + (1 + i) + '</LABEL>';
        cell2.innerHTML = '<INPUT TYPE="text" CLASS="name" ID="txtInputCounts1GrpName' + (1 + i) + '" SIZE="10" onChange="return deactivatePage1Grp(this)">';
        cell3.innerHTML = '<INPUT TYPE="text" TITLE="Frequency" CLASS="data" ID="txtInputCounts1GrpData' + (1 + i) + '" SIZE="10" onChange="return deactivatePage1Grp(this)">';
        cell4.innerHTML = '<INPUT TYPE="button" CLASS="ctl" ID="txtInputCounts1GrpCtl' + (1 + i) + '" VALUE="-" onClick="removeCountsTableRow1Grp(this)">';          
    }
}

function resetApplet1Grp()
{
    if (confirm("Are you sure? All data and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        deactivatePage1Grp();
        rebuildTable1Grp();
        dataGraph.clearGraph();
        simGraph.clearGraph();
        UI.setStyleProperty("divInputRawData1Grp","display","none");
        UI.setStyleProperty("divInputCounts1Grp","display","inline");
        UI.batchSetProperty(["selInputType1Grp", "selSimulation1GrpDotplotCountDir", "selSimulation1GrpDotplotCountType"],"selectedIndex",0);
        UI.batchSetProperty(["txtInputRawData1Grp", "txtSimulation1GrpDotplotCountBound", "txtVariableName",
                             "txtSimulation1GrpHypProportion", "txtHypothesizedProp1Grp", "txtSimulation1GrpDotplotCountBound"], "value", "");
	UI.setProperty("numCLevel1Grp", "value", "95");
        UI.clearInputStates();
    }
}

function deactivatePage1Grp(obj)
{
    if (pageActive1Grp)
    {
        if (obj && !confirm("Are you sure? The entries will remain, but any unsaved output will be lost."))
        {
            if (obj.value && obj.defaultValue && obj.defaultValue.length > 0)
                obj.value = obj.defaultValue;
            return false;
        }
        
        data1Grp.clear();
        var sel = document.getElementById("selCatSuccess1Grp");
        var tblInference = document.getElementById("tblChiSquaredExpected1Grp");
        while (tblInference.rows.length > 1)
            tblInference.deleteRow(1);
        for (var i = sel.options.length - 1; i >= 0; i--)
            sel.remove(i);

        UI.batchSetStyleProperty(["txtSummaryStatistics1GrpCSV", "spnZTest1GrpOptions",
                        "spnChiSquaredTest1GrpOptions", "spnZInterval1GrpOptions",
                        "divSummaryStatistics1Grp", "divDisplayGraph1Grp",
                        "divInference1Grp", "spnSimulation1GrpDotplotCountingOptions"], "display", "none");
        UI.batchSetProperty(["selInference1GrpType", "selGraphType1Grp"],"selectedIndex",0);
        handleInference1GrpChange(document.getElementById("selInference1GrpType"));
        UI.batchSetProperty(["spnInference1GrpResults", "spnSummaryStatistics1Grp", "spnData1GrpMsg", "spnInference1GrpMsg",
                             "spnSimulation1GrpErrorMsg"], "innerHTML", "");
        UI.setProperty("btnChangeInputs1Grp", "disabled", true);
                             
        clearSimulation1GrpResults();
        clearSimulation1GrpDotplotCount();

        pageActive1Grp = false;
        return true;
    }
}

function beginAnalysis1Grp()
{
    if (validateInputBuildData1Grp())
    {
        pageActive1Grp = true;
        UI.batchSetStyleProperty(["divSummaryStatistics1Grp","divDisplayGraph1Grp", "divInference1Grp"],
                                "display", "block");
        updateSummaryStatistics1Grp();
        updateGraph1Grp();
        UI.setProperty("btnChangeInputs1Grp", "disabled", false);
        
        var queryString = UI.getQueryString();
        if (queryString["inf"])
        	UI.setProperty("selInference1GrpType", "value", queryString["inf"]);

       	handleInference1GrpChange(document.getElementById("selInference1GrpType"));
    }
}

function handleInput1GrpChange(sel)
{
    if (pageActive1Grp)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
        {
            UI.resetInputState(sel.id);
            return false;
        }
        deactivatePage1Grp();
    }
    
    UI.recordInputState(sel.id);            
    UI.setProperty("spnData1GrpMsg", "innerHTML", "");
    if (sel.value == "counts")
    {
        UI.setStyleProperty("divInputCounts1Grp", "display", "inline");
        UI.setStyleProperty("divInputRawData1Grp", "display", "none");
    }
    else
    {
        UI.setStyleProperty("divInputCounts1Grp", "display", "none");
        UI.setStyleProperty("divInputRawData1Grp", "display", "inline");
    }
}

function updateSummaryStatistics1Grp()
{
    // Render a table programmatically
    var tableHTML = "<TABLE><TR><TH>Category Name</TH><TH>Frequency</TH><TH>Relative Frequency</TH></TR>";
    var total = data1Grp.getTotalFrequency();
    var relTotal = 0;
    for (var i = 0; i < data1Grp.categories.length; i++)
    {   
        var cat = data1Grp.categories[i];
        tableHTML += "<TR><TD>" + cat + "</TD><TD>" + data1Grp.frequencies[cat] + "</TD><TD>" +
            format.formatProportion(data1Grp.frequencies[cat] / total) + "</TD></TR>";
        relTotal += data1Grp.frequencies[cat] / total;
    }
    tableHTML += "<TR><TD>Total</TD><TD>" + total + "</TD><TD>"
                    + format.formatProportion(relTotal) + "</TD></TR>";
    tableHTML += "</TABLE>"
    UI.setProperty("spnSummaryStatistics1Grp", "innerHTML", tableHTML);

    // Also render a CSV and store it in the hidden textarea
    var resultsCSV = "Category Name,Frequency,Relative Frequency\r\n";
    for (var i = 0; i < data1Grp.categories.length; i++)
    {   
        var cat = data1Grp.categories[i];
        resultsCSV += cat + "," + data1Grp.frequencies[cat] + ","
            + format.formatProportion(data1Grp.frequencies[cat] / total) + "\r\n";
    }
    resultsCSV += "Totals," + total + "," + format.formatProportion(relTotal) + "\r\n";
    UI.setProperty("txtSummaryStatistics1GrpCSV", "value", resultsCSV);            
}

function handleInference1GrpChange(sel)
{
    UI.batchSetStyleProperty(["spnInference1GrpResults", "spnSimulation1GrpResults"], "display", "none");
    var propdisp = pref.getPreference(pref.keys.proportion.display_type);
    d3.selectAll("span.fillPropPct")
      .html(propdisp);
    UI.setProperty("optSimProp", "text", "Simulate sample " + propdisp);
    if (sel.value == "interval")
    {
        UI.setStyleProperty("spnZInterval1GrpOptions", "display", "inline");
        UI.setStyleProperty("spnZTest1GrpOptions", "display", "none");
        UI.setStyleProperty("spnChiSquaredTest1GrpOptions", "display", "none");
        UI.setStyleProperty("spnSimulation1GrpOptions", "display", "none");
        UI.setStyleProperty("spnCatSuccess1Grp", "display", "inline");
    }
    else if (sel.value == "test")
    {
        UI.setStyleProperty("spnZInterval1GrpOptions", "display", "none");
        UI.setStyleProperty("spnZTest1GrpOptions", "display", "inline");
        UI.setStyleProperty("spnChiSquaredTest1GrpOptions", "display", "none");
        UI.setStyleProperty("spnSimulation1GrpOptions", "display", "none");
        UI.setStyleProperty("spnCatSuccess1Grp", "display", "inline");
    }
    else if (sel.value == "GOF")
    {
        UI.setStyleProperty("spnZInterval1GrpOptions", "display", "none");
        UI.setStyleProperty("spnZTest1GrpOptions", "display", "none");
        UI.setStyleProperty("spnChiSquaredTest1GrpOptions", "display", "inline");
        UI.setStyleProperty("spnSimulation1GrpOptions", "display", "none");
        UI.setStyleProperty("spnCatSuccess1Grp", "display", "none");
    }
    else // simulation of either type
    {
        clearSimulation1GrpDotplotCount();
        clearSimulation1GrpResults();
        UI.setProperty("spnSimulation1GrpMeasure", "innerHTML",
        	(sel.value == "simprop" ? propdisp : "count"));
        UI.setStyleProperty("spnZInterval1GrpOptions", "display", "none");
        UI.setStyleProperty("spnZTest1GrpOptions", "display", "none");
        UI.setStyleProperty("spnChiSquaredTest1GrpOptions", "display", "none");
        UI.setStyleProperty("spnSimulation1GrpOptions", "display", "inline");
        UI.setStyleProperty("spnCatSuccess1Grp", "display", "inline");
    }
}

function handleSimulation1GrpTypeChange(sel)
{
    clearSimulation1GrpDotplotCount();
    clearSimulation1GrpResults();
    UI.setStyleProperty("spnSimulation1GrpHypOptions", "display", (sel.value == "hyp" ? "inline" : "none"));
}

function getVariableName(defaultName)
{
	var attrName = util.trimString(UI.getProperty("txtVariableName", "value"));
	if (attrName.length === 0)
		return defaultName;
	else
		return attrName;
}

function updateGraph1Grp()
{
    var graphType = UI.getProperty("selGraphType1Grp", "value");
    if (graphType == "bar")
    {
        UI.setStyleProperty("spnBarGraph1GrpOptions", "display", "inline");
	handleBarGraph1GrpFreq();
    }
    else
    {
        UI.setStyleProperty("spnBarGraph1GrpOptions", "display", "none");
	var attrName = getVariableName("Category");
	if (graphType == "seg")
	{
		var freq = [];
		var tot = data1Grp.getTotalFrequency();
		for (var i = 0; i < data1Grp.categories.length; i++)
			freq.push(data1Grp.frequencies[data1Grp.categories[i]]/tot);
		var data = {
			columnCategories: [attrName],
			rowCategories: data1Grp.categories,
			getColumnConditionalDistribution: function(d) { return freq; }
		};
		dataGraph.stackedBarChart(data, attrName);
	}
	else // pie chart
		dataGraph.pieChart(data1Grp.toDataArray(attrName), attrName);
    }
}

function exportSVG(divId,desc)
{
    file.saveSVG(document.getElementById("svg_" + divId), "cat1v" + desc);
}

function handleBarGraph1GrpFreq()
{
	var attrName = getVariableName("Category");
        dataGraph.barChart(data1Grp.toDataArray(attrName), attrName,
		(UI.getProperty("selBarGraph1GrpFreq", "value") == "rel"));
}

function validateForInference1Grp()
{
    var inferenceType = UI.getProperty("selInference1GrpType", "value");
    if (inferenceType == "test" && !IV.validateInputProportion("txtHypothesizedProp1Grp", true,
                            "spnInference1GrpMsg", "Hypothesized proportion"))
        return false;
    else if (inferenceType == "GOF")
    {
        var tblInference = document.getElementById("tblChiSquaredExpected1Grp");
        var errRows = [];
        for (var i = 1; i < tblInference.rows.length; i++)
        {
            var row = tblInference.rows[i];
            var cat = row.cells[0].innerHTML;
            var dataVal = "";
            for (var j = 0; j < row.cells[2].children.length; j++)
            {
                var child = row.cells[2].children[j];
                if (child.className == "data")
                    dataVal = child.value;
            }
            var freq = util.parseFloatOrFraction(dataVal);
            if (isNaN(freq) || freq <= 0)
                errRows.push(i);
        }
        if (errRows.length > 0)
        {
            var errmsg = "Non-numeric or non-positive entries in the following rows: ";
            for (var i = 0; i < errRows.length; i++)
            {
                errmsg += errRows[i];
                if (i < errRows.length - 1)
                    errmsg += ", ";
            }
            UI.setProperty("spnInference1GrpMsg", "innerHTML", errmsg);
            return false;
        }
    }
    else if ((inferenceType == "simprop") || (inferenceType == "simcount"))
    {
        if (!IV.validateInputInt("txtNumSamples1Grp", 1, Number.POSITIVE_INFINITY, false,
                            "spnSimulation1GrpErrorMsg", "Number of samples",
                            "must be a positive integer.")) return false;
        if (UI.getProperty("selSimulation1GrpType", "value") == "hyp" && !IV.validateInputProportion("txtSimulation1GrpHypProportion", true,
                            "spnSimulation1GrpErrorMsg", "Hypothesized proportion")) return false;
    }
    
    UI.batchSetProperty(["spnInference1GrpMsg", "spnSimulation1GrpErrorMsg"], "innerHTML", "");
    return true;
}

function handleSimHypPropChange()
{
    if (simulation1GrpResults.length > 0 && confirm("This will clear all simulation results. Do you want to proceed?"))
        clearSimulation1GrpResults();
}

function updateInference1Grp()
{
    UI.setProperty("spnSimulation1GrpTable", "innerHTML", "");
    UI.setProperty("spnInference1GrpMsg", "innerHTML", "");
    if (validateForInference1Grp())
    {
        UI.batchSetProperty(["spnInference1GrpResults", "spnInference1GrpMsg", "spnSimulation1GrpErrorMsg"], "innerHTML", "");
        UI.batchSetStyleProperty(["spnInference1GrpResults", "spnSimulation1GrpResults"], "display", "none");
        var inferenceType = UI.getProperty("selInference1GrpType", "value");
        var successCat = UI.getProperty("selCatSuccess1Grp", "value");

        if (inferenceType == "interval")
        {
            var x = data1Grp.frequencies[successCat];
            var n = data1Grp.getTotalFrequency();
            var results = stat.onePropZInterval(x, n, 
                    parseFloat(UI.getProperty("numCLevel1Grp", "value")/100));
            
            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>Lower Bound</TH><TH>Upper Bound</TH></TR><TR>"
            tableHTML += "<TD>" + format.formatProportion(results.lowerBound)
                    + "</TD><TD>" + format.formatProportion(results.upperBound)
                    + "</TD></TR></TABLE>"
            UI.setProperty("spnInference1GrpResults", "innerHTML", tableHTML);
            if (Math.min(n - x, x) < 10)
                UI.setProperty("spnInference1GrpMsg", "innerHTML",
                "WARNING: Fewer than 10 successes/failures.");
            UI.setStyleProperty("spnInference1GrpResults", "display", "inline");
        }
        else if (inferenceType == "test")
        {
            var n = data1Grp.getTotalFrequency();
            var p0 = IV.validateInputProportion("txtHypothesizedProp1Grp", true,
                            "spnSimulation1GrpErrorMsg", "Hypothesized proportion").parsedProportion;
            var results = stat.onePropZTest(data1Grp.frequencies[successCat], n, p0,
                            parseInt(UI.getProperty("selZTestSides1Grp", "value")));
            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>z</TH><TH>P-value</TH></TR><TR>"
            tableHTML += "<TD>" + format.formatNumber(results.z)
                    + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                    + "</TD></TR></TABLE>"
            UI.setProperty("spnInference1GrpResults", "innerHTML", tableHTML);
            if (safenum.roundWithinTolerance(n * Math.min(p0, 1 - p0)) < 10)
                UI.setProperty("spnInference1GrpMsg", "innerHTML",
                "WARNING: Fewer than 10 successes/failures in hypothesized distribution.");
            UI.setStyleProperty("spnInference1GrpResults", "display", "inline");
        }
        else if (inferenceType == "GOF")
        {
            var expectedData = new STAP.CategoricalData1Var();
            var tblInference = document.getElementById("tblChiSquaredExpected1Grp");
            var cellCountWarning = false;
            for (var i = 1; i < tblInference.rows.length; i++)
            {
                var row = tblInference.rows[i];
                var cat = row.cells[0].children[0].innerHTML; // since this is inside a label now
                var dataVal = "";
                for (var j = 0; j < row.cells[2].children.length; j++)
                {
                    var child = row.cells[2].children[j];
                    if (child.className == "data")
                        dataVal = child.value;
                }
                var freq = util.parseFloatOrFraction(dataVal);
                expectedData.addFrequencyFor(cat, freq);
                if (freq < 5)
                    cellCountWarning = true;
            }
            // Allow a roundoff error in the hundredths place; probably will not harm anything.
            if (STAP.SafeNumber.compareToWithinTolerance(expectedData.getTotalFrequency(),
                    data1Grp.getTotalFrequency(), 1) != 0)
            {
                UI.setProperty("spnInference1GrpMsg", "innerHTML",
                "The total expected counts must equal the total observed counts.");
            }
            else
            {
                var results = stat.chiSquaredGOFTest(data1Grp, expectedData);
                // Render a table programmatically
                var tableHTML = "<TABLE><TR>";
                tableHTML += "<TH>&chi;<SUP>2</SUP></TH><TH>P-value</TH><TH>df</TH></TR><TR>"
                tableHTML += "<TD>" + format.formatNumber(results.x2)
                        + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                        + "</TD><TD>" + format.formatNumber(results.df)
                        + "</TD></TR></TABLE><BR>"

		    // Contributions part
		    var cntrb = results.contributions;
		    tableHTML += "<TABLE><TR><TH>Category</TH><TH>Contribution</TH></TR>";
		
		    for (var cat in expectedData.frequencies)
		        tableHTML += "<TR><TD>" + cat + "</TD><TD>" + format.formatNumber(cntrb[cat]) + "</TD></TR>";
		    tableHTML += "</TABLE>";
	                        
                UI.setProperty("spnInference1GrpResults", "innerHTML", tableHTML);
                if (cellCountWarning)
                    UI.setProperty("spnInference1GrpMsg", "innerHTML",
                    "WARNING: At least one expected count is less than 5.");
                UI.setStyleProperty("spnInference1GrpResults", "display", "inline");
            }
        }
        else // simulation of either type
        {
            var simtype = UI.getProperty("selSimulation1GrpType", "value");
            var simmeasure = ((inferenceType == "simprop") ?
				(pref.getPreference(pref.keys.proportion.display_type) == "percent" ? "percent" : "proportion")
            			: "count");
            var simprop = (simtype == "hyp"
                                ? IV.validateInputProportion("txtSimulation1GrpHypProportion", true,
                            		"spnSimulation1GrpErrorMsg", "Hypothesized proportion").parsedProportion
                                : data1Grp.frequencies[successCat] / data1Grp.getTotalFrequency());
            var isProp = (simmeasure != "count");
            var fnStat = (isProp ? stat.simulationProportions : stat.simulationCounts);
            Array.prototype.push.apply(simulation1GrpResults, fnStat(simprop, data1Grp.getTotalFrequency(),
                                                                parseInt(UI.getProperty("txtNumSamples1Grp", "value"))));
                util.sortArrayAscending(simulation1GrpResults);

	var attrName = "Simulated sample " + simmeasure + (successCat.length > 0 ? " of " + successCat : "");
            UI.setStyleProperty("spnSimulation1GrpResults", "display", "inline");
	simGraph.dotplot(util.arrayToGraphData(simulation1GrpResults, attrName), attrName, null, true, isProp);
                var resultStats = stat.getOneVariableStatistics(simulation1GrpResults);
                var formatter = (isProp ? format.formatProportion : format.formatNumber);
                UI.setProperty("spnNumTrials", "innerHTML", format.formatNumber(simulation1GrpResults.length));
		UI.setProperty("spnRecentResult", "innerHTML", formatter(simulation1GrpResults[simulation1GrpResults.length - 1]));
		UI.setProperty("spnSimMean", "innerHTML", formatter(resultStats.mean));
		UI.setProperty("spnSimSD", "innerHTML", formatter(resultStats.Sx));
		
            if (simGraph.selectionRect.element)
                handleSimulation1GrpDotplotCount(UI.getProperty("txtSimulationDotplotMiddlePct", "value").length > 0);
        }
    }
}

function exportSummaryStatistics1Grp()
{
    file.saveCSV("txtSummaryStatistics1GrpCSV", "category_summary");
}

var bDotplotCallback = false;

function handleSimulation1GrpDotplotCount(bCI)
{
    if (bDotplotCallback) { bDotplotCallback = false; return; }
    
    UI.setProperty("spnSimulation1GrpDotplotCountErrorMsg", "innerHTML", "");
    
    var isProp = UI.getProperty("selInference1GrpType", "value") == "simprop";
    if (!bCI && UI.getProperty("txtSimulation1GrpDotplotCountBound", "value").length > 0)
    {
        var parsed = (isProp ?
    	IV.validateInputProportion("txtSimulation1GrpDotplotCountBound", true, "spnSimulation1GrpDotplotCountErrorMsg", "Bound") :
    	IV.validateInputFloat("txtSimulation1GrpDotplotCountBound", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spnSimulation1GrpDotplotCountErrorMsg", "Bound"));
    	if (parsed)
    	{
            bDotplotCallback = true;
            UI.setProperty("txtSimulationDotplotMiddlePct", "value", "");
            simGraph.fnCountHTML = null;
            bDotplotCallback = false;
    	    
    		var sel = UI.getProperty("selSimulation1GrpDotplotCountDir", "value");
    		var bound = (isProp ? parsed.parsedProportion :
    				parseFloat(UI.getProperty("txtSimulation1GrpDotplotCountBound", "value")));
    		if (sel == "left")
    			simGraph.forceSelectionRectangle(null, bound);
    		else
    			simGraph.forceSelectionRectangle(bound, null);
    	}            
    }
    else if ( (UI.getProperty("txtSimulationDotplotMiddlePct", "value").length > 0)
              && IV.validateInputFloat("txtSimulationDotplotMiddlePct", 0, 100, true, "spnSimulation1GrpDotplotCountErrorMsg", "Percentage", "must be strictly between 0% and 100%."))
    {
        bDotplotCallback = true;
        UI.setProperty("txtSimulation1GrpDotplotCountBound", "value", "");
        bDotplotCallback = false;

    	var pct = parseFloat(UI.getProperty("txtSimulationDotplotMiddlePct", "value"))/100;
    	var lowP = (1 - pct)/2;
    	
    	var regionSize = Math.floor(safenum.roundToPow10(simulation1GrpResults.length * lowP, -2)),
    	    lowIndex = regionSize,
            highIndex = simulation1GrpResults.length - regionSize - 1,
            lowDatum = simulation1GrpResults[lowIndex],
            highDatum = simulation1GrpResults[highIndex];
            
        simGraph.fnCountHTML = function()
        {
            return "Middle " + UI.getProperty("txtSimulationDotplotMiddlePct", "value") + "%: (" + format.formatNumber(lowDatum) + ", " + format.formatNumber(highDatum) + ")";
        };
    	
    	simGraph.forceSelectionRectangle(lowDatum, highDatum);
    }    
}

function clearSimulation1GrpDotplotCount()
{
	UI.setProperty("spnSimulation1GrpDotplotCountErrorMsg", "innerHTML", "");
	UI.setProperty("txtSimulation1GrpDotplotCountBound", "value", "");
	simGraph.clearSelectionRectangle();
}

STAP.UIHandlers.setOnLoad(initializePage1Grp);