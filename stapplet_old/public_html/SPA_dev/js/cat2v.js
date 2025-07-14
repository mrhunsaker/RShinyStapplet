var pageActive = false;

var UI = SPAApplet.UIHandlers;
var stat = SPAApplet.Statistics;
var IV = SPAApplet.InputValidation;
var util = SPAApplet.Utility;
var format = SPAApplet.Format;
var file = SPAApplet.FileIO;
var safenum = SPAApplet.SafeNumber;

var analysisVG = UI.makeVisibilityGroup("divSummaryStatistics",
                                        "divDisplayGraph", "divInference");
var data = new SPAApplet.CategoricalData2Var();
var graphContainer = null;

var responseName = "";
var explanatoryName = "";

// table has a rows collection, but not a columns collection -- so I need to track
// this variable separately.
var numDataColumns = 2;

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
    row.insertCell(0).innerHTML = '<TD><INPUT TYPE="text" CLASS="rowName" onChange="return deactivatePage(this)" onFocus="handleTableEntryFocus(this)" onBlur="handleTableEntryBlur(this,\'[row name]\')" VALUE="[row name]" SIZE="15"></TD>';
    for (var i = 0; i < numDataColumns; i++)
        row.insertCell(i + 1).innerHTML = '<TD><INPUT TYPE="text" CLASS="data" onChange="return deactivatePage(this)" onFocus="handleTableEntryFocus(this)" onBlur="handleTableEntryBlur(this,\'[count]\')" VALUE="[count]" SIZE="15"></TD>';

    // Fix the two rowspans                       
    document.getElementById("tdRowspanOuter").rowSpan++;
    document.getElementById("tdRowspanInner").rowSpan++;
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
    table.rows[1].insertCell(numDataColumns + 1).innerHTML = '<TD><INPUT TYPE="text" CLASS="colName" onChange="return deactivatePage(this)" onFocus="handleTableEntryFocus(this)" onBlur="handleTableEntryBlur(this,\'[column name]\')"  VALUE="[column name]" SIZE="15"></TD>';
    
    // In each of the next rows, add another data cell
    for (var i = 2; i < table.rows.length - 1; i++)
        table.rows[i].insertCell(numDataColumns + 1).innerHTML = '<TD><INPUT TYPE="text" CLASS="data" onChange="return deactivatePage(this)"  onFocus="handleTableEntryFocus(this)" onBlur="handleTableEntryBlur(this,\'[count]\')" VALUE="[count]" SIZE="15"></TD>';
        
    // Fix the two colspans
    numDataColumns++;
    document.getElementById("tdColspanUpper").colSpan++;
    document.getElementById("tdColspanLower").colSpan++;
}

function removeCountsTableRow()
{
    var table = document.getElementById("tblInputCounts");
    if (table.rows.length - 3 == 2)    // There must be at least two categories for this page to work
    {
        UI.setProperty("spnDataMsg", "innerHTML", "At least two categories are required per variable.");
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
    
    // Fix the two rowspans
    document.getElementById("tdRowspanOuter").rowSpan--;
    document.getElementById("tdRowspanInner").rowSpan--;
}

function removeCountsTableColumn()
{
    var table = document.getElementById("tblInputCounts");
    if (numDataColumns == 2)    // There must be at least two categories for this page to work
    {
        UI.setProperty("spnDataMsg", "innerHTML", "At least two categories are required per variable.");
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
    table.rows[1].deleteCell(numDataColumns);

    // In each of the next rows, delete the last data cell
    for (var i = 2; i < table.rows.length - 1; i++)
        table.rows[i].deleteCell(numDataColumns);

    // Fix the two colspans
    numDataColumns--;
    document.getElementById("tdColspanUpper").colSpan--;
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
        for (var i = 1; i < rows[1].cells.length - 1; i++)               
            columnNames.push(UI.extractElementClassValue(rows[1].cells[i], "colName", true));

        // Starting at the third row of the table and going until the penultimate row,
        // extract the frequencies one by one.
        // In each row, cell index 0 is the category name
        for (var i = 2; i < rows.length - 1; i++)
        {
            var rowName = UI.extractElementClassValue(rows[i].cells[0], "rowName", true);
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

        explanatoryName = UI.getProperty("txtCountsExplanatoryName", "value");
        responseName = UI.getProperty("txtCountsResponseName", "value");
    }
    else
    {
        var expDataArr = util.splitString(UI.getProperty("txtRawExplanatoryData", "value"));
        var resDataArr = util.splitString(UI.getProperty("txtRawResponseData", "value"));
        if (expDataArr.length !== resDataArr.length)
        {
            UI.setProperty("spnDataMsg", "innerHTML",
                           "The number of observations in each group must be the same.");
            return false;
        }

        // Add a frequency to the data for each one
        for (var i = 0; i < expDataArr.length; i++)
            data.addFrequencyFor(resDataArr[i], expDataArr[i]);

        explanatoryName = UI.getProperty("txtRawExplanatoryName", "value");
        responseName = UI.getProperty("txtRawResponseName", "value");
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
    while (table.rows.length > 5)
        table.deleteRow(2); // the first and last rows are essential to the table structure.  Row index 1
                            // is always the first row that is data entry.

    // Fix the contents of all cells
    table.rows[1].cells[1].getElementsByTagName("input")[0].value = "[column name]";
    table.rows[1].cells[2].getElementsByTagName("input")[0].value = "[column name]";
    while (table.rows[1].cells.length > 4) table.rows[1].deleteCell(3);
    table.rows[2].cells[0].getElementsByTagName("input")[0].value = "[row name]";
    table.rows[2].cells[1].getElementsByTagName("input")[0].value = "[count]";
    table.rows[2].cells[2].getElementsByTagName("input")[0].value = "[count]";
    while (table.rows[2].cells.length > 3) table.rows[2].deleteCell(3);
    table.rows[3].cells[0].getElementsByTagName("input")[0].value = "[row name]";
    table.rows[3].cells[1].getElementsByTagName("input")[0].value = "[count]";
    table.rows[3].cells[2].getElementsByTagName("input")[0].value = "[count]";
    while (table.rows[3].cells.length > 3) table.rows[3].deleteCell(3);

    UI.batchSetProperty(["txtCountsResponseName", "txtCountsExplanatoryName"], "value", "");
    UI.batchSetProperty(["tdColspanUpper", "tdColspanLower"], "colSpan", 4);
    UI.setProperty("tdRowspanOuter", "rowSpan", 5);
    UI.setProperty("tdRowspanInner", "rowSpan", 3);

    numDataColumns = 2;
}

function resetApplet()
{
    if (confirm("Are you sure? All data and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        deactivatePage();
        rebuildTable();
        graphContainer.removeGraph();
        UI.batchSetProperty(["txtRawResponseName", "txtRawExplanatoryName",
                            "txtRawResponseData", "txtRawExplanatoryData"], "value", "");
        UI.setStyleProperty("divInputRawData","display","none");
        UI.setStyleProperty("divInputCounts","display","inline");
        UI.setProperty("selInputType","selectedIndex",0);
        UI.setProperty("txtVariableName","value","");
        UI.clearInputStates();
    }
}

function deactivatePage(obj)
{
    if (!pageActive) return;
    if (obj && !confirm("Are you sure? The entries will remain, but any unsaved output will be lost."))
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
                    "spnCatSuccess", "spn2CatInferenceOptions", "spn3CatInferenceOptions"],
                    "display", "none");
    UI.batchSetProperty(["sel2CatInference", "selGraphType"],"selectedIndex",0);
    handle2CatInferenceChange(document.getElementById("sel2CatInference"));
    UI.batchSetProperty(["spnInferenceResults", "spnSummaryStatistics", "spnDataMsg", "spnInferenceMsg"], "innerHTML", "");
    UI.setProperty("btnChangeInputs", "disabled", true);
    pageActive = false;
}

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

function beginAnalysis()
{
    if (pageActive) return;
    if (validateInputBuildData())
    {
        UI.recordInputStates(["selInputType", "txtRawExplanatoryName", "txtRawExplanatoryData",
                                "txtRawResponseName", "txtRawResponseData"]);
        pageActive = true;
        analysisVG.show();
        updateSummaryStatistics();
        updateGraph();
        UI.setProperty("btnChangeInputs", "disabled", false);
    }
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

function updateSummaryStatistics()
{
    // Render a table and CSV programmatically
    var tableHTML = "<TABLE><TR><TD CLASS='tableUpperLeft'></TD></TH><TH COLSPAN='"
                + (data.columnCategories.length + 2) + "'>"
        + explanatoryName + "</TH></TR>";

    var resultsCSV = "";

    tableHTML += "<TR><TH ROWSPAN='" + (data.rowCategories.length + 1) + "'>"
        + responseName + "</TH><TD></TD>";
    var columnDistributions = {};
    for (var i = 0; i < data.columnCategories.length; i++)
    {
        tableHTML += "<TD><EM>" + (i+1) + ": " + data.columnCategories[i] + "</EM></TD>";
        resultsCSV += "," + data.columnCategories[i];
        columnDistributions[data.columnCategories[i]] =
            data.getColumnConditionalDistribution(data.columnCategories[i]);
    }
    tableHTML += "<TH>Total</TH></TR>";
    resultsCSV += ",Total\r\n";
    
    for (var i = 0; i < data.rowCategories.length; i++)
    {   
        tableHTML += "<TR><TD><EM>" + data.rowCategories[i] + "</EM></TD>";
        resultsCSV += data.rowCategories[i];
        for (var j = 0; j < data.columnCategories.length; j++)
        {
            var dist = columnDistributions[data.columnCategories[j]];
            tableHTML += "<TD>" + format.formatPercent(dist[i]) + "</TD>";
            resultsCSV += "," + format.formatPercent(dist[i]);
        }
        var total = data.rowTotals[i] / data.grandTotal;
        tableHTML += "<TD>" + format.formatPercent(total) + "</TD></TR>";
        resultsCSV += "," + format.formatPercent(total) + "\r\n";
    }
    tableHTML += "</TABLE>Percents in table show the conditional distribution of "
        + ((responseName && responseName.length > 0) ? responseName : "the response variable")
        + " for each category of "
        + ((explanatoryName && explanatoryName.length > 0) ? explanatoryName : "the explanatory variable") + ".";
    UI.setProperty("spnSummaryStatistics", "innerHTML", tableHTML);
    UI.setProperty("txtSummaryStatisticsCSV", "value", resultsCSV);            
}

function handle2CatInferenceChange(sel)
{
    if (sel.value == "interval")
    {
        UI.setStyleProperty("spnZIntervalOptions", "display", "inline");
        UI.setStyleProperty("spnZTestOptions", "display", "none");
        UI.setStyleProperty("spnSuccessCat", "display", "inline");
    }
    else if (sel.value == "test")
    {
        UI.setStyleProperty("spnZIntervalOptions", "display", "none");
        UI.setStyleProperty("spnZTestOptions", "display", "inline");
        UI.setStyleProperty("spnSuccessCat", "display", "inline");
    }
    else // chi-squared
        UI.batchSetStyleProperty(["spnZIntervalOptions", "spnZTestOptions", "spnSuccessCat"],
                    "display", "none");
}

function updateGraph()
{
    var graphType = UI.getProperty("selGraphType", "value");
    if (graphType == "side")
    {
        UI.setStyleProperty("spnSideBarGraphOptions", "display", "inline");
        graphContainer.setRelativeScale(UI.getProperty("selSideBarGraphFreq", "value") == "rel", true);
        graphContainer.setGraph(new SPAApplet.SideBySideBarGraph(data, explanatoryName));
    }
    else
    {
        UI.setStyleProperty("spnSideBarGraphOptions", "display", "none");
        graphContainer.setGraph(new SPAApplet.StackedBarGraph(data, explanatoryName));
    }
}

function handleBarGraphFreq(sel)
{
    graphContainer.setRelativeScale(UI.getProperty("selSideBarGraphFreq", "value") == "rel");
}

function updateInference()
{
    UI.batchSetProperty(["spnInferenceResults", "spnInferenceMsg"], "innerHTML", "");

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
                parseFloat(UI.getProperty("selCLevel", "value")));

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
                + (data.columnCategories.length + 2) + "'>"
        + explanatoryName + "</TH></TR>";
    tableHTML += "<TR><TH ROWSPAN='" + (data.rowCategories.length + 1) + "'>"
        + responseName + "</TH><TD></TD>";
    for (var i = 0; i < data.columnCategories.length; i++)
        tableHTML += "<TD><EM>" + data.columnCategories[i] + "</EM></TD>";
    tableHTML += "</TR>";
    for (var i = 0; i < data.rowCategories.length; i++)
    {   
        tableHTML += "<TR><TD><EM>" + data.rowCategories[i] + "</EM></TD>";
        for (var j = 0; j < data.columnCategories.length; j++)
            tableHTML += "<TD>" + format.formatNumber(exp[i][j]) + "</TD>";
        tableHTML += "</TR>";
    }
    tableHTML += "</TABLE>";

    UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
    if (results.lowCountWarning)
        UI.setProperty("spnInferenceMsg", "innerHTML",
        "WARNING: At least one expected count is less than 5.");
}

function exportSummaryStatistics()
{
    file.saveCSV("txtSummaryStatisticsCSV", "category_summary");
}

function exportGraph()
{
    var filename = UI.getProperty("selGraphType", "value") + "bar";
    file.saveCanvas("cnvPlot", filename);
}

function initializePage()
{
    graphContainer = new SPAApplet.CategoricalGraphContainer("cnvPlot");
    UI.batchSetStyleProperty(["txtSummaryStatisticsCSV", "divInputRawData", "txtSummaryStatisticsCSV",
                    "spnSideBarGraphOptions", "spnZIntervalOptions", "spnZTestOptions", "spnSuccessCat",
                    "spn2CatInferenceOptions", "spn3CatInferenceOptions"], "display", "none");
    UI.setProperty("btnChangeInputs", "disabled", true);
    analysisVG.hide();
}

SPAApplet.UIHandlers.setOnLoad(initializePage);
