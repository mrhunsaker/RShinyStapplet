var pageActive1Grp = false;

var UI = SPAApplet.UIHandlers;
var stat = SPAApplet.Statistics;
var IV = SPAApplet.InputValidation;
var util = SPAApplet.Utility;
var format = SPAApplet.Format;
var file = SPAApplet.FileIO;
var safenum = SPAApplet.SafeNumber;

var data1Grp = new SPAApplet.CategoricalData1Var();
var graphContainer1Grp = null;

var simulation1GrpGraphContainer = null;
var simulation1GrpResults = [];

function initializePage1Grp()
{
    graphContainer1Grp = new SPAApplet.CategoricalGraphContainer("cnvPlot1Grp");
    UI.batchSetStyleProperty(["txtSummaryStatistics1GrpCSV", "divInputRawData1Grp", 
                    "spnZTest1GrpOptions", "spnChiSquaredTest1GrpOptions", "divSummaryStatistics1Grp",
                    "divDisplayGraph1Grp", "divInference1Grp", "spnSimulation1GrpOptions", "spnSimulation1GrpResults"], "display", "none");
    UI.setProperty("btnChangeInputs1Grp", "disabled", true);
}

function clearSimulation1GrpResults()
{
    simulation1GrpResults = [];
    UI.setStyleProperty("spnSimulation1GrpResults", "display", "none");
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
    var tempData = new SPAApplet.CategoricalData1Var();
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
        graphContainer1Grp.removeGraph();
        UI.setStyleProperty("divInputRawData1Grp","display","none");
        UI.setStyleProperty("divInputCounts1Grp","display","inline");
        UI.batchSetProperty(["selInputType1Grp", "selSimulation1GrpDotplotCountDir", "selSimulation1GrpDotplotCountType"],"selectedIndex",0);
        UI.batchSetProperty(["txtInputRawData1Grp", "txtSimulation1GrpDotplotCountBound", "txtVariableName",
                             "txtSimulation1GrpHypProportion", "txtHypothesizedProp1Grp", "txtSimulation1GrpDotplotCountBound"], "value", "");
        UI.setProperty("spnSimulation1GrpDotplotCountResult", "innerHTML", "");
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
                        "spnChiSquaredTest1GrpOptions", "spnSimulation1GrpOptions",
                        "divSummaryStatistics1Grp", "divDisplayGraph1Grp",
                        "divInference1Grp", "spnSimulation1GrpDotplotCountingOptions"], "display", "none");
        UI.batchSetProperty(["selInference1GrpType", "selGraphType1Grp"],"selectedIndex",0);
        handleInference1GrpChange(document.getElementById("selInference1GrpType"));
        UI.batchSetProperty(["spnInference1GrpResults", "spnSummaryStatistics1Grp", "spnData1GrpMsg", "spnInference1GrpMsg",
                             "spnSimulation1GrpDotplotCountResult", "spnSimulation1GrpErrorMsg"], "innerHTML", "");
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
    tableHTML += "<TR><TD><EM>Totals</EM></TD><TD><EM>" + total + "</EM></TD><TD><EM>"
                    + format.formatProportion(relTotal) + "</EM></TD></TR>";
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
        UI.setProperty("spnSimulation1GrpMeasure", "innerHTML", (sel.value == "simprop" ? "proportion" : "count"));
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

function updateGraph1Grp()
{
    var graphType = UI.getProperty("selGraphType1Grp", "value");
    if (graphType == "bar")
    {
        UI.setStyleProperty("spnBarGraph1GrpOptions", "display", "inline");
        graphContainer1Grp.setRelativeScale(UI.getProperty("selBarGraph1GrpFreq", "value") == "rel", true);
        graphContainer1Grp.setGraph(new SPAApplet.BarGraph(data1Grp, UI.getProperty("txtVariableName", "value")));
    }
    else
    {
        UI.setStyleProperty("spnBarGraph1GrpOptions", "display", "none");
        graphContainer1Grp.setGraph(new SPAApplet.PieGraph(data1Grp));
    }
}

function handleBarGraph1GrpFreq(sel)
{
    graphContainer1Grp.setRelativeScale(UI.getProperty("selBarGraph1GrpFreq", "value") == "rel");
}

function validateForInference1Grp()
{
    var inferenceType = UI.getProperty("selInference1GrpType", "value");
    if (inferenceType == "test" && !IV.validateInputFloat("txtHypothesizedProp1Grp", 0, 1, false,
                            "spnInference1GrpMsg", "Hypothesized proportion",
                            "must be a decimal between 0 and 1 inclusive."))
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
        if (UI.getProperty("selSimulation1GrpType", "value") == "hyp" && !IV.validateInputFloat("txtSimulation1GrpHypProportion", 0, 1, false,
                            "spnSimulation1GrpErrorMsg", "Hypothesized proportion",
                            "must be a decimal between 0 and 1 inclusive.")) return false;
    }
    
    UI.batchSetProperty(["spnInference1GrpMsg", "spnSimulation1GrpErrorMsg"], "innerHTML", "");
    return true;
}

function updateInference1Grp()
{
    UI.setProperty("spnSimulation1GrpTable", "innerHTML", "");
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
                    parseFloat(UI.getProperty("selCLevel1Grp", "value")));
            
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
            var p0 = util.parseFloatOrFraction(UI.getProperty("txtHypothesizedProp1Grp", "value"));
            var results = stat.onePropZTest(data1Grp.frequencies[successCat], n, p0,
                            parseInt(UI.getProperty("selZTestSides1Grp", "value")));
            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>z</TH><TH>P-value</TH></TR><TR>"
            tableHTML += "<TD>" + format.formatNumber(results.z)
                    + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                    + "</TD></TR></TABLE>"
            UI.setProperty("spnInference1GrpResults", "innerHTML", tableHTML);
            if ((n * Math.min(p0, 1 - p0)) < 10)
                UI.setProperty("spnInference1GrpMsg", "innerHTML",
                "WARNING: Fewer than 10 successes/failures in hypothesized distribution.");
            UI.setStyleProperty("spnInference1GrpResults", "display", "inline");
        }
        else if (inferenceType == "GOF")
        {
            var expectedData = new SPAApplet.CategoricalData1Var();
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
            // Allow a roundoff error in the hundredths place; probably won't harm anything.
            if (SPAApplet.SafeNumber.compareToWithinTolerance(expectedData.getTotalFrequency(),
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
                        + "</TD></TR></TABLE>"
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
            var simmeasure = ((inferenceType == "simprop") ? "proportion" : "count");
            var simprop = (simtype == "hyp"
                                ? parseFloat(UI.getProperty("txtSimulation1GrpHypProportion", "value"))
                                : data1Grp.frequencies[successCat] / data1Grp.getTotalFrequency());
            var fnStat = (simmeasure == "proportion" ? stat.simulationProportions : stat.simulationCounts);
            Array.prototype.push.apply(simulation1GrpResults, fnStat(simprop, data1Grp.getTotalFrequency(),
                                                                parseInt(UI.getProperty("txtNumSamples1Grp", "value"))));

            if (!simulation1GrpGraphContainer)
                simulation1GrpGraphContainer = new SPAApplet.QuantitativeGraphContainer("cnvSimulation1GrpPlot",
                                    "Simulated sample " + simmeasure + (successCat.length > 0 ? " of " + successCat : ""));
            else
                simulation1GrpGraphContainer.setVariableName("Simulated sample " + simmeasure + (successCat.length > 0 ? " of " + successCat : ""));
                
            simulation1GrpGraphContainer.removeAllGraphs();
            simulation1GrpGraphContainer.addGraph(new SPAApplet.Dotplot(simulation1GrpResults, ""));

            if (simtype == "hyp")
                UI.setProperty("spnSimulation1GrpTable", "innerHTML",
                    "<TABLE><TR><TH># samples</TH></TR><TR><TD>" + format.formatNumber(simulation1GrpResults.length) + "</TD></TR></TABLE>");                        
            else
            {
                var resultStats = stat.getOneVariableStatistics(simulation1GrpResults);

                UI.setProperty("spnSimulation1GrpTable", "innerHTML",
                "<TABLE><TR><TH COLSPAN='3'>Distribution of simulated " + simmeasure + "</TH></TR>" +
                "<TR><TH># samples</TH><TH>mean</TH><TH>SD</TH></TR>" +
                "<TR><TD>" + format.formatNumber(simulation1GrpResults.length) +
                "</TD><TD>" + format.formatNumber(resultStats.mean) + 
                "</TD><TD>" + format.formatNumber(resultStats.Sx) + "</TD></TR></TABLE>");
            }

            if (util.trimString(UI.getProperty("txtSimulation1GrpDotplotCountBound", "value")).length > 0)
                handleSimulation1GrpDotplotCount();
            UI.setStyleProperty("spnSimulation1GrpResults", "display", "inline");
        }
    }
}

function exportSummaryStatistics1Grp()
{
    file.saveCSV("txtSummaryStatistics1GrpCSV", "category_summary");
}

function export1GrpGraph()
{
    var filename = UI.getProperty("selGraphType1Grp", "value");
    file.saveCanvas("cnvPlot1Grp", filename);
}

function exportSimulation1GrpGraph()
{
    var filename = "simulation_" + UI.getProperty("selInference1GrpType", "value").slice(3);
    file.saveCanvas("cnvSimulation1GrpPlot", filename);
}

function handleSimulation1GrpDotplotCount()
{
    var graph = simulation1GrpGraphContainer.graphs[0];
    UI.setProperty("spnSimulation1GrpDotplotCountErrorMsg", "innerHTML", "");
    if (graph && (UI.getProperty("txtSimulation1GrpDotplotCountBound", "value").length > 0)
              && IV.validateInputFloat("txtSimulation1GrpDotplotCountBound", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spnSimulation1GrpDotplotCountErrorMsg", "Bound"))
    {
        graph.setCountingRegion(parseFloat(UI.getProperty("txtSimulation1GrpDotplotCountBound", "value")),
                                parseInt(UI.getProperty("selSimulation1GrpDotplotCountDir", "value")));
        var count = graph.dotCount;
        if (UI.getProperty("selSimulation1GrpDotplotCountType", "value") == "number")
            UI.setProperty("spnSimulation1GrpDotplotCountResult", "innerHTML", count +
                            ((count === 1) ? " dot is " : " dots are ") + "in the specified region.");
        else // percent
            UI.setProperty("spnSimulation1GrpDotplotCountResult", "innerHTML", format.formatPercent(count / simulation1GrpResults.length)
                                + " of the dots are in the specified region.");
    }            
}

function clearSimulation1GrpDotplotCount()
{
    UI.setProperty("spnSimulation1GrpDotplotCountErrorMsg", "innerHTML", "");
    UI.setProperty("spnSimulation1GrpDotplotCountResult", "innerHTML", "");
    UI.setProperty("txtSimulation1GrpDotplotCountBound", "value", "");
    var graph = (simulation1GrpGraphContainer ? simulation1GrpGraphContainer.graphs[0] : null);
    if (graph)
        graph.clearCountingRegion();
}

function initializePage()
{
    initializePage1Grp();
    initializePageMultiGrp();
    UI.setStyleProperty("div1GrpPage", "display", "block");
    UI.setStyleProperty("divMultiGrpPage", "display", "none");
}

function handleGroupsChange(sel)
{
    if (pageActive || pageActive1Grp)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
        {
            UI.resetInputState("selNumGroups");
            return;                    
        }
    }
    UI.recordInputState(sel.id);

    deactivatePage1Grp();
    deactivatePage();
    
    if (UI.getProperty("selNumGroups", "value") == "single")
    {
        UI.setStyleProperty("div1GrpPage", "display", "block");
        UI.setStyleProperty("divMultiGrpPage", "display", "none");
    }
    else
    {
        UI.setStyleProperty("div1GrpPage", "display", "none");
        UI.setStyleProperty("divMultiGrpPage", "display", "block");
    }
}

SPAApplet.UIHandlers.setOnLoadWithPreload(initializePage);