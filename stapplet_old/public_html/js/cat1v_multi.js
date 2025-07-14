var pageActive = false;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;
var pref = STAP.Preferences;

var analysisVG = UI.makeVisibilityGroup("divSummaryStatistics",
                                        "divDisplayGraph", "divInference");
var data = new STAP.CategoricalData2Var();
var graph = null;
var simGraph = null;

// counts table has a rows collection, but not a columns collection -- so I need to track
// this variable separately.
var numDataColumns = 2;

var simulationResults = [];

function addNewRawDataTableRow()
{
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
            return;
        deactivatePage();
    }
    
    UI.setProperty("spnDataMsg", "innerHTML", "");
    var table = document.getElementById("tblRawDataMultiGrp");
    var row = table.insertRow(table.rows.length - 1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);

    var currentRows = table.rows.length - 2;
    cell1.innerHTML = '<LABEL FOR="txtRawTblName' + currentRows + '">' + currentRows + '</LABEL>';
    cell2.innerHTML = '<INPUT TYPE="text" CLASS="name" ID="txtRawTblName' + currentRows + '" SIZE="10" onChange="return deactivatePage(this)">';
    cell3.innerHTML = '<INPUT TYPE="text" CLASS="data" ID="txtRawTblData' + currentRows + '" SIZE="10" onChange="return deactivatePage(this)">';
    cell4.innerHTML = '<INPUT TYPE="button" CLASS="ctl" ID="txtRawTblCtl' + currentRows + '" VALUE="-" onClick="removeRawDataTableRow(this)">';          
}

function fixRawDataTableRowNumbers()
{
    var table = document.getElementById("tblRawDataMultiGrp");
    // Fix all the row indicators and control IDs now
    for (var i = 1; i < (table.rows.length - 1); i++)
    {
        table.rows[i].cells[0].innerHTML = '<LABEL FOR="txtRawTblName' + i + '">' + i + '</LABEL>';
        UI.extractElement(table.rows[i].cells[1], "name").id = "txtRawTblName" + i;
        UI.extractElement(table.rows[i].cells[2], "data").id = "txtRawTblData" + i;
        UI.extractElement(table.rows[i].cells[3], "ctl").id = "txtRawTblCtl" + i;
    }
}

function extractRawDataTableRow(i)
{
    var table = document.getElementById("tblRawDataMultiGrp");
    var nameVal = UI.extractElementClassValue(table.rows[i].cells[1], "name", true);
    var dataVal = UI.extractElementClassValue(table.rows[i].cells[2], "data", true);

    return {
        valid: (nameVal.length > 0 && dataVal.length > 0),
        blank: (nameVal.length == 0 && dataVal.length == 0),
        name: nameVal,
        dataString: dataVal
    };
}

function removeRawDataTableRow(btn)
{
    var table = document.getElementById("tblRawDataMultiGrp");
    if (table.rows.length == 4)    // There must be at least two categories for this page to work
    {
        UI.setProperty("spnDataMsg", "innerHTML", "At least two groups are required.  Use Single Group mode if you only have one group.");
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
    var rowIndex = btn.parentNode.parentNode.rowIndex;
    table.deleteRow(rowIndex);

    fixRawDataTableRowNumbers();
}

function rebuildRawDataTable()
{
    // Remove all rows except the first and last one.
    var table = document.getElementById("tblRawDataMultiGrp");
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
        cell1.innerHTML = '<LABEL FOR="txtRawTblName' + (1 + i) + '">' + (1 + i) + '</LABEL>';
        cell2.innerHTML = '<INPUT TYPE="text" CLASS="name" ID="txtRawTblName' + (1 + i) + '" SIZE="10" onChange="return deactivatePage(this)">';
        cell3.innerHTML = '<INPUT TYPE="text" Title="Data" CLASS="data" ID="txtRawTblData' + (1 + i) + '" SIZE="10" onChange="return deactivatePage(this)">';
        cell4.innerHTML = '<INPUT TYPE="button" CLASS="ctl" ID="txtRawTblCtl' + (1 + i) + '" VALUE="-" onClick="removeRawDataTableRow(this)">';          
    }
}

function addCountsTableRow()
{
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
            return;
        deactivatePage();
    }

    var table = document.getElementById("tblInputCounts");
    UI.setProperty("spnDataMsg", "innerHTML", "");
    var row = table.insertRow(table.rows.length - 1);
    row.insertCell(0).innerHTML = '<TD><INPUT TYPE="text" TITLE="Row Name" CLASS="rowName" ID="txtCountsTblRowName'
    + (table.rows.length - 2) + '" PLACEHOLDER="Category ' + (table.rows.length - 2) + '" SIZE="15"></TD>';
    for (var i = 0; i < numDataColumns; i++)
        row.insertCell(i + 1).innerHTML = '<TD><INPUT TYPE="text" TITLE="Data" CLASS="data" ID="txtCountsTblData'
    + (table.rows.length - 2) + '_' + (i + 1) + '" onChange="return deactivatePage(this)" SIZE="15"></TD>';

    // Fix the rowspan of the leftmost and rightmost columns
    document.getElementById("tdRowspanInner").rowSpan++;
    document.getElementById("tdRowspanOuter").rowSpan++;
}

function addCountsTableColumn()
{
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
            return;
        deactivatePage();
    }

    var table = document.getElementById("tblInputCounts");
    UI.setProperty("spnDataMsg", "innerHTML", "");
    
    // In the header row, add another column name cell
    table.rows[0].insertCell(numDataColumns + 2).innerHTML = '<TD><INPUT TYPE="text" TITLE="Column Name" CLASS="colName" ID="txtCountsTblColName'
        + (numDataColumns + 1) + '" onChange="return deactivatePage(this)" PLACEHOLDER="Group ' + (numDataColumns + 1) + '" SIZE="15"></TD>';
    
    // In each of the next rows, add another data cell
    for (var i = 1; i < table.rows.length - 1; i++)
        table.rows[i].insertCell(numDataColumns + 1).innerHTML = '<TD><INPUT TYPE="text" TITLE="Data" CLASS="data" ID="txtCountsTblData'
        + i + '_' + (numDataColumns + 1) + '" onChange="return deactivatePage(this)" SIZE="15"></TD>';
        
    // Fix the colspan
    numDataColumns++;
    document.getElementById("tdColspanLower").colSpan++;
}

function removeCountsTableRow()
{
    var table = document.getElementById("tblInputCounts");
    if (table.rows.length == 4)    // There must be at least two categories for this page to work
    {
        UI.setProperty("spnDataMsg", "innerHTML", "At least two categories are required per group.");
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

    table.deleteRow(table.rows.length - 2);
    
    // Fix the rowspans of the outer columns
    document.getElementById("tdRowspanInner").rowSpan--;
    document.getElementById("tdRowspanOuter").rowSpan--;
}

function removeCountsTableColumn()
{
    var table = document.getElementById("tblInputCounts");
    if (numDataColumns == 2)    // There must be at least two categories for this page to work
    {
        UI.setProperty("spnDataMsg", "innerHTML", "At least two groups are required.  Use Single Group mode if you have only one group.");
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

    // In the header row, delete the column name cell
    table.rows[0].deleteCell(numDataColumns + 1);

    // In each of the next rows, delete the last data cell
    for (var i = 1; i < table.rows.length - 1; i++)
        table.rows[i].deleteCell(numDataColumns);

    // Fix the colspan
    numDataColumns--;
    document.getElementById("tdColspanLower").colSpan--;
}

function validateInputBuildData()
{
    UI.setProperty("spnDataMsg", "innerHTML", "");
    if (UI.getProperty("selInputType", "value") == "counts")
    {
        var errRows = [];

        // in each row, cell index 1 is the category name and cell index 2 is the input data
        var rows = UI.getProperty("tblInputCounts", "rows");

        // Build column collection
        var columnNames = [];
        for (var i = 2; i < rows[0].cells.length - 1; i++)               
            columnNames.push(UI.extractElementClassValue(rows[0].cells[i], "colName", true, true));

        // Starting at the second row of the table and going until the penultimate row,
        // extract the frequencies one by one.
        // In each row, cell index 0 is the category name
        for (var i = 1; i < rows.length - 1; i++)
        {
            var rowName = UI.extractElementClassValue(rows[i].cells[0], "rowName", true, true);
            var err = false;
            
            for (var j = 1; j < rows[i].cells.length; j++)
            {
                var eltVal = UI.extractElementClassValue(rows[i].cells[j], "data", true);
                var value = parseInt(eltVal);
                var fValue = parseFloat(eltVal);
                
                if (isNaN(value) || (value < 0) || (safenum.compareToWithinTolerance(value, fValue) !== 0))
                {
                    err = true;
                    break;
                }
                
                data.addFrequencyFor(rowName, columnNames[j - 1], value);
            }
            
            if (err)
            {
                errRows.push(rowName);
                break;
            }
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
            data.clear();
            UI.setProperty("spnDataMsg", "innerHTML", errmsg);
            return false;
        }
    }
    else  // raw data
    {
        var errRows = [];

        // in each row, cell index 1 is the category name and cell index 2 is the input data
        var rows = UI.getProperty("tblRawDataMultiGrp", "rows");

        // in each row, cell index 1 is the category name and cell index 2 is the input data
        for (var i = 1; i < (rows.length - 1); i++)
        {
            var rowData = extractRawDataTableRow(i);

            if (rowData.valid)
            {
                var obs = util.splitString(rowData.dataString);
                for (var j = 0; j < obs.length; j++)
                    data.addFrequencyFor(obs[j], rowData.name);
            }
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
            data.clear();
            UI.setProperty("spnDataMsg", "innerHTML", errmsg);
            return false;
        }
        if (data.columnCategories.length < 2)
        {
            UI.setProperty("spnDataMsg", "innerHTML", "At least two categories are required.");
            data.clear();
            return false;
        }
        if (data.rowCategories.length < 2)
        {
            UI.setProperty("spnDataMsg", "innerHTML", "At least two groups are required.  Use Single Group mode if you have only one group.");
            data.clear();
            return false;
        }
    }
    
    // Rebuild the 2-category dropdown and category table
    // in the inference section and show the correct set of options
    var sel = document.getElementById("sel2CatSuccess");

    if (data.columnCategories.length == 2)
    {
        for (var i = 0; i < data.rowCategories.length; i++)
        {
            var cat = data.rowCategories[i];
            var option = document.createElement("option");
            option.text = cat;
            option.value = cat;
            sel.add(option);
        }

        UI.setStyleProperty("spn2CatInferenceOptions", "display", "inline");
        UI.setStyleProperty("spn3CatInferenceOptions", "display", "none");
    }
    else
    {
        for (var i = sel.options.length - 1; i >= 0; i--)
            sel.remove(i);

        UI.setStyleProperty("spn2CatInferenceOptions", "display", "none");
        UI.setStyleProperty("spn3CatInferenceOptions", "display", "inline");
    }

    return true;
}

function rebuildTable()
{
    // Remove all rows except the first and last one.
    var table = document.getElementById("tblInputCounts");
    while (table.rows.length > 4)
        table.deleteRow(1); // the first and last rows are essential to the table structure.  Row index 1
                            // is always the first row that is data entry.

    // Fix the contents of all cells
    table.rows[0].cells[2].getElementsByTagName("input")[0].value = "";
    table.rows[0].cells[2].getElementsByTagName("input")[0].placeholder = "Group 1";
    table.rows[0].cells[2].getElementsByTagName("input")[0].id = "txtCountsTblColName1";
    table.rows[0].cells[3].getElementsByTagName("input")[0].value = "";
    table.rows[0].cells[3].getElementsByTagName("input")[0].placeholder = "Group 2";
    table.rows[0].cells[3].getElementsByTagName("input")[0].id = "txtCountsTblColName2";
    while (table.rows[0].cells.length > 5) table.rows[0].deleteCell(4);
    table.rows[1].cells[0].getElementsByTagName("input")[0].value = "";
    table.rows[1].cells[0].getElementsByTagName("input")[0].placeholder = "Category 1";
    table.rows[1].cells[0].getElementsByTagName("input")[0].id = "txtCountsTblRowName1";
    table.rows[1].cells[1].getElementsByTagName("input")[0].value = "";
    table.rows[1].cells[1].getElementsByTagName("input")[0].id = "txtCountsTblData1_1";
    table.rows[1].cells[2].getElementsByTagName("input")[0].value = "";
    table.rows[1].cells[2].getElementsByTagName("input")[0].id = "txtCountsTblData1_2";
    while (table.rows[1].cells.length > 3) table.rows[1].deleteCell(3);
    table.rows[2].cells[0].getElementsByTagName("input")[0].value = "";
    table.rows[2].cells[0].getElementsByTagName("input")[0].placeholder = "Category 2";
    table.rows[2].cells[0].getElementsByTagName("input")[0].id = "txtCountsTblRowName2";
    table.rows[2].cells[1].getElementsByTagName("input")[0].value = ""; 
    table.rows[2].cells[1].getElementsByTagName("input")[0].id = "txtCountsTblData2_1";
    table.rows[2].cells[2].getElementsByTagName("input")[0].value = ""; 
    table.rows[2].cells[2].getElementsByTagName("input")[0].id = "txtCountsTblData2_2";
    while (table.rows[2].cells.length > 3) table.rows[2].deleteCell(3);

    UI.setProperty("tdColspanLower", "colSpan", 4);
    UI.setProperty("tdRowspanInner", "rowSpan", 3);
    UI.setProperty("tdRowspanOuter", "rowSpan", 4);

    numDataColumns = 2;
}

function resetApplet()
{
    if (confirm("Are you sure? All data and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        deactivatePage();
        rebuildTable();
        rebuildRawDataTable();
	graph.clearGraph();
	
        UI.setStyleProperty("divInputRawData","display","none");
        UI.setStyleProperty("divInputCounts","display","inline");
        UI.setProperty("selInputType","selectedIndex",0);
        UI.setProperty("txtVariableNameCounts","value","");
        UI.setProperty("txtVariableNameRawData","value","");
        UI.setProperty("numCLevel", "value", "95");
    }
}

function deactivatePage(obj)
{
    if (!pageActive) return;

    if (obj && !confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
    {
        if (obj.value && obj.defaultValue && obj.defaultValue.length > 0)
            obj.value = obj.defaultValue;
        return;
    }
    
    analysisVG.hide();
    data.clear();
    
    var sel = document.getElementById("sel2CatSuccess");
    for (var i = sel.options.length - 1; i >= 0; i--)
        sel.remove(i);

    UI.batchSetStyleProperty(["txtSummaryStatisticsCSV", "spnZTestOptions", "spnZIntervalOptions",
                    "spnSuccessCat", "spn2CatInferenceOptions", "spn3CatInferenceOptions"],
                    "display", "none");
    UI.batchSetProperty(["sel2CatInference", "selGraphType"],"selectedIndex",0);
    handle2CatInferenceChange(document.getElementById("sel2CatInference"));
    UI.batchSetProperty(["spnInferenceResults", "spnSummaryStatistics", "spnInferenceMsg", "spnDataMsg"], "innerHTML", "");
    UI.setProperty("btnChangeInputs", "disabled", true);

    clearSimulationResults();
    clearSimulationDotplotCount();

    pageActive = false;
}

/*
function handleTableEntryFocus(elt)
{
    if (elt.value.indexOf("[") > -1 && elt.value.indexOf("]") > -1)
        elt.value = "";
}

function handleTableEntryBlur(elt, defaultValue)
{
    if (util.trimString(elt.value).length == 0)
        elt.value = defaultValue;
}
*/

function beginAnalysis()
{
    if (pageActive) return;
    if (validateInputBuildData())
    {
        pageActive = true;
        analysisVG.show();
        updateSummaryStatistics();
        updateGraph();

        var queryString = UI.getQueryString();
        if (queryString["inf"])
        	UI.setProperty("sel2CatInference", "value", queryString["inf"]);
                
        handle2CatInferenceChange(document.getElementById("sel2CatInference"));
        UI.setProperty("btnChangeInputs", "disabled", false);
    }
    else
        data.clear();
}

function handleInputChange(sel)
{
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
        {
            UI.resetInputState(sel.id);
            return;
        }
        deactivatePage();
    }

    UI.recordInputState(sel.id);
    UI.setProperty("spnDataMsg", "innerHTML", "");
    if (sel.value == "counts")
    {
        UI.setStyleProperty("divInputCounts", "display", "inline");
        UI.setStyleProperty("divInputRawData", "display", "none");
    }
    else
    {
        UI.setStyleProperty("divInputCounts", "display", "none");
        UI.setStyleProperty("divInputRawData", "display", "inline");
    }
}

function variableName()
{
    var retval = ((UI.getProperty("selInputType", "value") == "counts") ?
	    UI.getProperty("txtVariableNameCounts", "value") :
        UI.getProperty("txtVariableNameRawData", "value"));
    if (!retval.length) retval = "Variable name";
    return retval;
}

function updateSummaryStatistics()
{
    var varname = variableName();

    // Render a table and CSV programmatically
    var tableHTML = "<TABLE><TR><TD CLASS='tableUpperLeft'></TD></TH><TH COLSPAN='"
                + (data.columnCategories.length + 2) + "'>Group</TH></TR>";

    var resultsCSV = "";

    tableHTML += "<TR><TH ROWSPAN='" + (data.rowCategories.length + 2) + "'>" + varname + "</TH><TD></TD>";

    var columnDistributions = {};
    for (var i = 0; i < data.columnCategories.length; i++)
    {
        tableHTML += "<TD>" + data.columnCategories[i] + "</TD>";
        resultsCSV += "," + data.columnCategories[i] + "(Count)," + data.columnCategories[i] + "(Percent)";
        columnDistributions[data.columnCategories[i]] =
            data.getColumnConditionalDistribution(data.columnCategories[i]);
    }
    tableHTML += "<TH>Total</TH></TR>";
    resultsCSV += ",Row Total,Row Percent\r\n";
    
    for (var i = 0; i < data.rowCategories.length; i++)
    {   
        tableHTML += "<TR><TD>" + data.rowCategories[i] + "</TD>";
        resultsCSV += data.rowCategories[i];
        for (var j = 0; j < data.columnCategories.length; j++)
        {
            var dist = columnDistributions[data.columnCategories[j]];
            tableHTML += "<TD>" + format.formatNumber(dist[i] * data.columnTotals[j], 0) + " (" + format.formatProportion(dist[i]) + ")</TD>";
            resultsCSV += "," + format.formatNumber(dist[i] * data.columnTotals[j], 0) + "," + format.formatProportion(dist[i]);
        }
        var total = data.rowTotals[i] / data.grandTotal;
        tableHTML += "<TD>" + data.rowTotals[i] + " (" + format.formatProportion(total) + ")</TD></TR>";
        resultsCSV += "," + data.rowTotals[i] + "," + format.formatProportion(total) + "\r\n";
    }

        tableHTML += "<TR><TH>Total</TH>";
        resultsCSV += "Total";
        for (var j = 0; j < data.columnCategories.length; j++)
        {
            tableHTML += "<TD>" + data.columnTotals[j] + " (" + format.formatProportion(1) + ")</TD>";
            resultsCSV += "," + data.columnTotals[j] + "," + format.formatProportion(1);
        }
        tableHTML += "<TH>" + data.grandTotal + " (" + format.formatProportion(1) + ")</TH></TR>";
        resultsCSV += ",,\r\n";
    
    tableHTML += "</TABLE><BR>" +
    (STAP.Preferences.getPreference(STAP.Preferences.keys.proportion.display_type) == "percent"
				? "Percents" 
				: "Proportions")
        + " in table show the distribution of " +
        (varname && varname.length > 0 ? varname : "the measured variable")
        + " for each group.";
    UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);
    UI.setProperty("txtSummaryStatisticsCSV", "value", resultsCSV);            
}

function handle2CatInferenceChange(sel)
{
    UI.batchSetProperty(["spnInferenceResults", "spnInferenceMsg"], "innerHTML", "");
    UI.batchSetStyleProperty(["spnInferenceResults", "spnSimulationResults"], "display", "none");
    var propdisp = pref.getPreference(pref.keys.proportion.display_type);
    d3.selectAll("span.fillPropPct").html(propdisp);
    UI.setProperty("optSimProp", "text", "Simulate difference in " + propdisp + "s");
    
    if (sel.value == "interval")
    {
        UI.setStyleProperty("spnTradButton", "display", "inline");
        UI.setStyleProperty("spnZIntervalOptions", "display", "inline");
        UI.setStyleProperty("spnZTestOptions", "display", "none");
        UI.setStyleProperty("spnSuccessCat", "display", "inline");
        UI.setStyleProperty("spnSimulationOptions", "display", "none");
    }
    else if (sel.value == "test")
    {
        UI.setStyleProperty("spnTradButton", "display", "inline");
        UI.setStyleProperty("spnZIntervalOptions", "display", "none");
        UI.setStyleProperty("spnZTestOptions", "display", "inline");
        UI.setStyleProperty("spnSuccessCat", "display", "inline");
        UI.setStyleProperty("spnSimulationOptions", "display", "none");
    }
    else if (sel.value == "simulation")
    {
        UI.setStyleProperty("spnTradButton", "display", "none");
        UI.setStyleProperty("spnZIntervalOptions", "display", "none");
        UI.setStyleProperty("spnZTestOptions", "display", "none");
        UI.setStyleProperty("spnSuccessCat", "display", "inline");
        UI.setStyleProperty("spnSimulationOptions", "display", "inline");
    }
    else // chi-squared
    {
        UI.batchSetStyleProperty(["spnZIntervalOptions", "spnZTestOptions", "spnSuccessCat", "spnSimulationOptions"],
                    "display", "none");
        UI.setStyleProperty("spnTradButton", "display", "inline");
    }                            
}

function updateGraph()
{
    var varname = variableName();
    var graphType = UI.getProperty("selGraphType", "value");
    if (graphType == "side")
    {
        UI.setStyleProperty("spnSideBarGraphOptions", "display", "inline");
	graph.sideBySideBarChart(data, "", (UI.getProperty("selSideBarGraphFreq", "value") == "rel"), varname);
    }
    else
    {
        UI.setStyleProperty("spnSideBarGraphOptions", "display", "none");
        if (graphType == "stacked")
        	graph.stackedBarChart(data, "", varname);
        else // mosaic plot fallthrough
            graph.mosaicPlot(data, "", varname);
    }
}

function updateInference()
{
    UI.batchSetProperty(["spnInferenceResults", "spnInferenceMsg"], "innerHTML", "");
    UI.batchSetStyleProperty(["spnInferenceResults", "spnSimulationResults"], "display", "none");
    if (data.columnCategories.length == 2)
    {
        var inferenceType = UI.getProperty("sel2CatInference", "value");
        var successCat = UI.getProperty("sel2CatSuccess", "value");
        var x1 = data.data[data.rowCategoryIndexMap[successCat]][0];
        var n1 = data.columnTotals[0];
        var x2 = data.data[data.rowCategoryIndexMap[successCat]][1];
        var n2 = data.columnTotals[1];

        if (inferenceType == "interval")
        {
            var results = stat.twoPropZInterval(x1, n1, x2, n2,
                parseFloat(UI.getProperty("numCLevel", "value"))/100);

            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>Lower Bound</TH><TH>Upper Bound</TH></TR><TR>"
            tableHTML += "<TD>" + format.formatProportion(results.lowerBound)
                    + "</TD><TD>" + format.formatProportion(results.upperBound)
                    + "</TD></TR></TABLE>"
            UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
            if ((Math.min(n1 - x1, x1) < 10) || (Math.min(n2 - x2, x2) < 10))
                UI.setProperty("spnInferenceMsg", "innerHTML",
                "WARNING: Fewer than 10 successes/failures in one or both samples.");
                
            UI.setStyleProperty("spnInferenceResults", "display", "inline");
            return;
        }
        else if (inferenceType == "test")
        {
            var results = stat.twoPropZTest(x1, n1, x2, n2,
                            parseInt(UI.getProperty("selZTestSides", "value")));

            // Render a table programmatically
            var tableHTML = "<TABLE><TR>";
            tableHTML += "<TH>z</TH><TH>P-value</TH></TR><TR>"
            tableHTML += "<TD>" + format.formatNumber(results.z)
                    + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                    + "</TD></TR></TABLE>"
            UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
            if ((Math.min(n1 - x1, x1) < 10) || (Math.min(n2 - x2, x2) < 10))
                UI.setProperty("spnInferenceMsg", "innerHTML",
                "WARNING: Fewer than 10 successes/failures in one or both samples.");
            UI.setStyleProperty("spnInferenceResults", "display", "inline");
            return;
        }
        else if (inferenceType == "simulation")
        {
            UI.setStyleProperty("spnSimulationErrorMsg", "innerHTML", "");
            if (IV.validateInputInt("txtNumSamples", 1,
                Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
            {
                Array.prototype.push.apply(simulationResults, stat.simulationDiffProportions(x1, n1, x2, n2,
                                parseInt(UI.getProperty("txtNumSamples", "value"))));

	        UI.setStyleProperty("spnSimulationResults", "display", "inline");
		var varname = "Simulated difference in sample " +
			(pref.getPreference(pref.keys.proportion.display_type) == "percent" ? "percent" : "proportion");
		simGraphDataArray = util.arrayToGraphData(simulationResults, varname);
		simGraph.dotplot(simGraphDataArray, varname, null, true, true);
                UI.setProperty("spnNumTrials", "innerHTML", format.formatNumber(simulationResults.length));
		UI.setProperty("spnRecentResult", "innerHTML", format.formatProportion(simulationResults[simulationResults.length - 1]));
		var resultStats = stat.getOneVariableStatistics(simulationResults);
		UI.setProperty("spnSimMean", "innerHTML", format.formatProportion(resultStats.mean));
		UI.setProperty("spnSimSD", "innerHTML", format.formatProportion(resultStats.Sx));
		
                if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
                    handleSimulationDotplotCount();
            }
            return;
        }
    }
    
    // If you are here,
    // either explanatory = 2 categories and chi-squared, or explanatory > 2 categories
    var results = stat.chiSquared2WayTest(data);

    // Render a table programmatically
    var tableHTML = "<TABLE><TR>";
    tableHTML += "<TH>&chi;<SUP>2</SUP></TH><TH>P-value</TH><TH>df</TH></TR><TR>"
    tableHTML += "<TD>" + format.formatNumber(results.x2)
            + "</TD><TD>" + format.formatPValueHTML(results.pValue)
            + "</TD><TD>" + format.formatNumber(results.df)
            + "</TD></TR></TABLE><BR>"

    // Expected counts part
    var exp = results.expectedCounts;
    tableHTML += "Expected counts:<TABLE><TR><TD CLASS='tableUpperLeft'></TD></TH><TH COLSPAN='"
                + (data.columnCategories.length + 2) + "'>Groups</TH></TR>";

    var varname = variableName();

    tableHTML += "<TR><TH ROWSPAN='" + (data.rowCategories.length + 1) + "'>" + varname + "</TH><TD></TD>";
    for (var i = 0; i < data.columnCategories.length; i++)
        tableHTML += "<TD>" + data.columnCategories[i] + "</TD>";
    tableHTML += "</TR>";
    for (var i = 0; i < data.rowCategories.length; i++)
    {   
        tableHTML += "<TR><TD>" + data.rowCategories[i] + "</TD>";
        for (var j = 0; j < data.columnCategories.length; j++)
            tableHTML += "<TD>" + format.formatNumber(exp[i][j]) + "</TD>";
        tableHTML += "</TR>";
    }
    tableHTML += "</TABLE><BR>";

    // Contributions part
    var cntrb = results.contributions;
    tableHTML += "Contributions:<TABLE><TR><TD CLASS='tableUpperLeft'></TD></TH><TH COLSPAN='"
                + (data.columnCategories.length + 2) + "'>Groups</TH></TR>";

    var varname = variableName();

    tableHTML += "<TR><TH ROWSPAN='" + (data.rowCategories.length + 1) + "'>" + varname + "</TH><TD></TD>";
    for (var i = 0; i < data.columnCategories.length; i++)
        tableHTML += "<TD>" + data.columnCategories[i] + "</TD>";
    tableHTML += "</TR>";
    for (var i = 0; i < data.rowCategories.length; i++)
    {   
        tableHTML += "<TR><TD>" + data.rowCategories[i] + "</TD>";
        for (var j = 0; j < data.columnCategories.length; j++)
            tableHTML += "<TD>" + format.formatNumber(cntrb[i][j]) + "</TD>";
        tableHTML += "</TR>";
    }
    tableHTML += "</TABLE>";

    UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
    if (results.lowCountWarning)
        UI.setProperty("spnInferenceMsg", "innerHTML",
        "WARNING: At least one expected count is less than 5.");
    UI.setStyleProperty("spnInferenceResults", "display", "inline");
}

function exportSummaryStatistics()
{
    file.saveCSV("txtSummaryStatisticsCSV", "category_summary");
}

function handleSimulationDotplotCount()
{
    UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");
    if ( (UI.getProperty("txtSimulationDotplotCountBound", "value").length > 0))
    {
	var parsed = IV.validateInputProportion("txtSimulationDotplotCountBound", false, "spnSimulationDotplotCountErrorMsg", "Bound")
	if (parsed)
	{
		var sel = UI.getProperty("selSimulationDotplotCountDir", "value");
		var bound = parsed.parsedProportion;
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
	UI.setProperty("spnSimulationDotplotCountResult", "innerHTML", "");
	simGraph.clearSelectionRectangle();
} 

function clearSimulationResults()
{
    simulationResults = [];
    UI.setStyleProperty("spnSimulationResults", "display", "none");
    clearSimulationDotplotCount();
}

function initializePage()
{
	graph = new STAP.SVGGraph("divGraph");
	simGraph = new STAP.SVGGraph("divSimGraph");
    UI.batchSetStyleProperty(["txtSummaryStatisticsCSV", "divInputRawData", "txtSummaryStatisticsCSV",
                    "spnSideBarGraphOptions", "spnZIntervalOptions", "spnZTestOptions", "spnSuccessCat", "spnSimulationOptions",
                    "spn2CatInferenceOptions", "spn3CatInferenceOptions", "spnSimulationResults", "spnInferenceResults"], "display", "none");
    UI.setProperty("btnChangeInputs", "disabled", true);
    analysisVG.hide();
    UI.writeLinkColorOriginRules();    
}

STAP.UIHandlers.setOnLoad(initializePage);