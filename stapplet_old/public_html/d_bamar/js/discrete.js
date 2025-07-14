var pageActive = false;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;
var pref = STAP.Preferences;

var numTableDataRows = 2;

var discreteProbDist = null;
var graph = null;

function addNewCountsRow()
{
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
            return;
        deactivatePage();
    }
    
    UI.setProperty("spnDataMsg", "innerHTML", "");
    var row = document.getElementById("tblInputCounts").insertRow(++numTableDataRows);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    cell1.innerHTML = '<LABEL FOR="txtDiscName' + numTableDataRows + '">' + numTableDataRows + '</LABEL>';
    cell2.innerHTML = '<INPUT TYPE="text" CLASS="name" ID="txtDiscName' + numTableDataRows + '" SIZE="10" onChange="return deactivatePage(this)">';
    cell3.innerHTML = '<INPUT TYPE="text" TITLE="Probability" CLASS="data" ID="txtDiscData' + numTableDataRows + '" SIZE="10" onChange="return deactivatePage(this)">';
    cell4.innerHTML = '<INPUT TYPE="button" VALUE="-" CLASS="ctl" ID="txtDiscCtl' + numTableDataRows + '" onClick="removeCountsTableRow(this)">';          
}

function extractCountsTableRow(i, parseNameFn, parseDataFn)
{
    var table = document.getElementById("tblInputCounts");
    var nameVal = UI.extractElementClassValue(table.rows[i].cells[1], "name", true);
    var dataVal = UI.extractElementClassValue(table.rows[i].cells[2], "data", true);
    parseNameFn = parseNameFn || parseFloat;
    parseDataFn = parseDataFn || parseFloat;
    
    return {
        valid: (!isNaN(parseNameFn(nameVal)) != 0 && !isNaN(parseDataFn(dataVal))),
        blank: (nameVal.length == 0 && dataVal.length == 0),
        value: parseNameFn(nameVal),
        probability: parseDataFn(dataVal)
    };
}

function fixCountsTableRowNumbers()
{
    var table = document.getElementById("tblInputCounts");
    // Fix all the row indicators now
    for (var i = 1; i <= numTableDataRows; i++)
    {
        table.rows[i].cells[0].innerHTML = '<LABEL FOR="txtDiscName' + i + '">' + i + '</LABEL>';
        UI.extractElement(table.rows[i].cells[1], "name").id = "txtDiscName" + i;
        UI.extractElement(table.rows[i].cells[2], "data").id = "txtDiscData" + i;
        UI.extractElement(table.rows[i].cells[3], "ctl").id = "txtDiscCtl" + i;
    }
}

function removeCountsTableRow(btn)
{
    if (numTableDataRows === 2)    // There must be at least two values for this page to work
    {
        UI.setProperty("spnDataMsg", "innerHTML", "At least two values are required.");
        return;
    }
    else
        UI.setProperty("spnDataMsg", "innerHTML", "");
    
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
            return;
        deactivatePage();
    }
    
    // The parent of the parent should be the <TR>
    var table = document.getElementById("tblInputCounts");
    var rowIndex = btn.parentNode.parentNode.rowIndex;
    table.deleteRow(rowIndex);
    numTableDataRows--;
    
    fixCountsTableRowNumbers();
}

function validateInputBuildData()
{
    var errRows = [];
    var values = [];
    var probs = [];
    
    // in each row, cell index 1 is the category name and cell index 2 is the input data
    var rows = UI.getProperty("tblInputCounts", "rows");
    for (var i = 1; i < numTableDataRows + 1; i++)
    {
        var rowData = extractCountsTableRow(i, parseFloat, util.parseFloatOrFraction);

        if (rowData.valid)
        {
            values.push(rowData.value);
            probs.push(rowData.probability);
        }
        else if (!rowData.blank)
            errRows.push(i);
    }
    if (errRows.length > 0)
    {
        var errmsg = "Non-numeric entries in the following rows: ";
        for (var i = 0; i < errRows.length; i++)
        {
            errmsg += errRows[i];
            if (i < errRows.length - 1)
                errmsg += ", ";
        }
        UI.setProperty("spnDataMsg", "innerHTML", errmsg);
        return false;
    }
    if (values.length < 2)
    {
        UI.setProperty("spnDataMsg", "innerHTML", "At least two values are required.");
        return false;
    }

    discreteProbDist = new STAP.DiscreteProbabilityDistribution(values, probs);
    if (!discreteProbDist.isValid())
    {
        discreteProbDist = null;
        UI.setProperty("spnDataMsg", "innerHTML", "The provided probabilities are invalid.");
        return false;
    }                
    
    UI.setProperty("spnDataMsg", "innerHTML", "");
    return true;
}

function rebuildTable()
{
    // Remove all rows except the first and last one.
    var table = document.getElementById("tblInputCounts");
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
        cell1.innerHTML = '<LABEL FOR="txtDiscName' + (1 + i) + '">' + (1 + i) + '</LABEL>';
        cell2.innerHTML = '<INPUT TYPE="text" CLASS="name" ID="txtDiscName' + (1 + i) + '" SIZE="10" onChange="return deactivatePage(this)">';
        cell3.innerHTML = '<INPUT TYPE="text" TITLE="Probability" CLASS="data" ID="txtDiscData' + (1 + i) + '" SIZE="10" onChange="return deactivatePage(this)">';
        cell4.innerHTML = '<INPUT TYPE="button" VALUE="-" CLASS="ctl" ID="txtDiscCtl' + (1 + i) + '" onClick="removeCountsTableRow(this)">';          
    }
}

function resetApplet()
{
    if (confirm("Are you sure? All entries and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        deactivatePage();
        rebuildTable();
	graph.clearGraph();
        numTableDataRows = 2;
        UI.batchSetProperty(["spnBrowserMsg", "spnCountingMsg", "spnNormalMsg", "spnDataMsg",
                    "spnNormalBoundMsg", "spnBinomialMsg", "spnBinomialBoundMsg"],
                    "innerHTML", "");
    }
}

function deactivatePage(obj)
{
    if (pageActive)
    {
        if (obj && !confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
        {
            if (obj.value && obj.defaultValue && obj.defaultValue.length > 0)
                obj.value = obj.defaultValue;
            return false;
        }
        
        discreteProbDist = null;
        UI.batchSetStyleProperty(["divDiscreteGraph", "divDiscreteSummaryStatistics"], "display", "none");
        pageActive = false;
        UI.setProperty("btnChangeInputs", "disabled", true);
        return true;
    }
}

function beginAnalysis()
{
    if (validateInputBuildData())
    {
        pageActive = true;
        UI.batchSetStyleProperty(["divDiscreteSummaryStatistics","divDiscreteGraph"],
                                "display", "block");
        updateSummaryStatistics();
        updateProbabilityPlot();
        UI.setProperty("btnChangeInputs", "disabled", false);
    }
}

function updateSummaryStatistics()
{
    var stats = discreteProbDist.getStatistics();

    // Render a table programmatically
    var tableHTML = "<TABLE><TR><TH>Mean</TH><TH>SD</TH></TR>";
    tableHTML += "<TR><TD>" + format.formatNumber(stats.mean) + "</TD><TD>"
                            + format.formatNumber(stats.stdev) + "</TD></TR></TABLE>";
    UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);
}

function updateProbabilityPlot()
{
	graph.discreteProbabilityHistogram(discreteProbDist.getGraphData(),
			util.trimString(UI.getProperty("txtVariableName", "value")));
}

function exportProbabilityPlot()
{
	file.saveSVG(graph.svgRoot, "probability_histogram");
}

function initializePage()
{
	graph = new STAP.SVGGraph("divPlot");
    
    UI.batchSetStyleProperty(["divDiscreteGraph", "divDiscreteSummaryStatistics"], "display", "none");
    UI.setProperty("btnChangeInputs", "disabled", true);
    UI.writeLinkColorOriginRules();
}

STAP.UIHandlers.setOnLoad(initializePage);