var pageActive = false;

var UI = SPAApplet.UIHandlers;
var stat = SPAApplet.Statistics;
var IV = SPAApplet.InputValidation;
var util = SPAApplet.Utility;
var format = SPAApplet.Format;
var file = SPAApplet.FileIO;
var safenum = SPAApplet.SafeNumber;
var pref = SPAApplet.Preferences;

var numTableDataRows = 2;

var discreteProbDist = null;
var probGraphContainer = null;

var normGraph = new SPAApplet.NormalDiagram();
var normGraphContainer = null;

var binomGraphContainer = null;

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

    discreteProbDist = new SPAApplet.DiscreteProbabilityDistribution(values, probs);
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
        probGraphContainer.removeAllGraphs();
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
    probGraphContainer.removeAllGraphs();
    probGraphContainer.setVariableName(UI.getProperty("txtVariableName", "value"), true);
    probGraphContainer.addGraph(new SPAApplet.ProbabilityHistogram(discreteProbDist));
}

function exportProbabilityPlot()
{
    file.saveCanvas("cnvProbPlot", "probability_histogram");
}

function exportBinomialGraph()
{
    file.saveCanvas("cnvBinomPlot", "binom_probability_histogram");
}

function exportNormalGraph()
{
    file.saveCanvas("cnvGaussPlot", "normal_cdf");
}

function handleCalcChange()
{
    UI.batchSetStyleProperty(["divDiscrete",
                "divCounting", "divNormal", "divBinomial"], "display", "none");
    UI.setStyleProperty(UI.getProperty("selCalculatorType", "value"), "display", "block");
}

function calculateFactorial()
{
    UI.setProperty("spnCountingResult", "innerHTML", "");
    if (!IV.validateInputInt("txtCountingN", 0, Number.POSITIVE_INFINITY, false,
        "spnCountingMsg", "n", "must be a non-negative integer.")) return;

    var n = parseInt(UI.getProperty("txtCountingN", "value"));
    UI.setProperty("spnCountingResult", "innerHTML", n + "! = " + util.factorial(n));
    UI.setProperty("spnCountingMsg", "innerHTML", "");
}

function calculatePermutations()
{
    calculateNRFunc("P", function(n, r) {
        return Math.round(util.factorial(n) / util.factorial(n - r));
    });
}

function calculateCombinations()
{
    calculateNRFunc("C", function(n, r) {
       return Math.round(util.factorial(n) / util.factorial(r) / util.factorial(n - r));
    });
}

function calculateNRFunc(label, fn)
{
    UI.setProperty("spnCountingResult", "innerHTML", "");
    if (!IV.validateInputInt("txtCountingN", 0, Number.POSITIVE_INFINITY, false,
        "spnCountingMsg", "n", "must be a non-negative integer.")) return;
    if (!IV.validateInputInt("txtCountingR", 0, Number.POSITIVE_INFINITY, false,
        "spnCountingMsg", "r", "must be a non-negative integer.")) return;

    var n = parseInt(UI.getProperty("txtCountingN", "value"));
    var r = parseInt(UI.getProperty("txtCountingR", "value"));

    if (r > n)
        UI.setProperty("spnCountingMsg", "innerHTML", "r cannot be greater than n.");
    else
    {
        UI.setProperty("spnCountingResult", "innerHTML", "<SUB>" + n + "</SUB>" + label + 
                                                         "<SUB>" + r + "</SUB> = "+ fn(n, r));
        UI.setProperty("spnCountingMsg", "innerHTML", "");
    }
}

function handleNormChange()
{
    UI.batchSetStyleProperty(["divNormalCdf", "divNormalInv"], "display", "none");
    UI.batchSetProperty(["txtNormalCdfLeft", "txtNormalCdfRight", "txtNormalInvArea"], "value", "");
    UI.batchSetProperty(["spnNormalMsg", "spnNormalResult"], "innerHTML", "");
    UI.setStyleProperty(UI.getProperty("selNormalType", "value"), "display", "block");
    normGraph.clearSelection();
}

function plotNormal()
{
    UI.setProperty("spnNormalResult", "innerHTML", "");
    if (!IV.validateInputFloat("txtNormalMean", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
        "spnNormalMsg", "Mean")) return;
    if (!IV.validateInputFloat("txtNormalStdev", 0, Number.POSITIVE_INFINITY, true,
        "spnNormalMsg", "SD", "must be positive.")) return;
    var mean = parseFloat(UI.getProperty("txtNormalMean", "value"));
    var stdev = parseFloat(UI.getProperty("txtNormalStdev", "value"));

    normGraphContainer.removeAllGraphs();
    normGraph.setParameters(mean, stdev);
    normGraphContainer.addGraph(normGraph);
}

function handleNormCdfChange()
{
    var type = UI.getProperty("selNormalCdfType", "value");
    if ((type == "between") || (type == "outside"))
    {
        UI.batchSetStyleProperty(["spnNormalCdfLeftInput", "spnNormalCdfRightInput"], "display", "inline");
        UI.setStyleProperty("spnNormalCdfSingleInput", "display", "none");
    }
    else
    {
        UI.batchSetStyleProperty(["spnNormalCdfLeftInput", "spnNormalCdfRightInput"], "display", "none");
        UI.setStyleProperty("spnNormalCdfSingleInput", "display", "inline");
    }
}

function calculateNormalCdf()
{
    UI.setProperty("spnNormalResult", "innerHTML", "");
    if (!IV.validateInputFloat("txtNormalMean", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
        "spnNormalMsg", "Mean")) return;
    if (!IV.validateInputFloat("txtNormalStdev", 0, Number.POSITIVE_INFINITY, true,
        "spnNormalMsg", "SD", "must be positive.")) return;
    var mean = parseFloat(UI.getProperty("txtNormalMean", "value"));
    var stdev = parseFloat(UI.getProperty("txtNormalStdev", "value"));
    var type = UI.getProperty("selNormalCdfType", "value");
    
    var leftBound = Number.NEGATIVE_INFINITY;
    var rightBound = Number.POSITIVE_INFINITY;
    
    if ((type == "between") || (type == "outside"))
    {
        if (!IV.validateInputFloat("txtNormalCdfLeft", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
            "spnNormalBoundMsg", "Left bound")) return;
        leftBound = parseFloat(UI.getProperty("txtNormalCdfLeft", "value"));

        if (!IV.validateInputFloat("txtNormalCdfRight", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
            "spnNormalBoundMsg", "Right bound")) return;
        rightBound = parseFloat(UI.getProperty("txtNormalCdfRight", "value"));

        if (rightBound < leftBound)
        {
            UI.setProperty("spnNormalBoundMsg", "innerHTML", "Right bound must be greater than left bound.");
            return;
        }
    }
    else
    {
        if (!IV.validateInputFloat("txtNormalCdfSingle", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
            "spnNormalBoundMsg", "Value")) return;
        var value = parseFloat(UI.getProperty("txtNormalCdfSingle", "value"));
        if (type == "left")
            rightBound = value;
        else
            leftBound = value;
    }

    var area = jStat.normal.cdf(rightBound, mean, stdev) - jStat.normal.cdf(leftBound, mean, stdev);
    if (type == "outside") area = (1 - area);
    
    UI.setProperty("spnNormalResult", "innerHTML", "Area = " + format.formatProportion(area, 4));

    normGraphContainer.removeAllGraphs();
    normGraph.setParameters(mean, stdev, leftBound, rightBound, ((type == "outside") ? true : false));
    normGraphContainer.addGraph(normGraph);
}

function calculateNormalInv()
{
    UI.setProperty("spnNormalResult", "innerHTML", "");
    if (!IV.validateInputFloat("txtNormalMean", Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false,
        "spnNormalMsg", "Mean")) return;
    if (!IV.validateInputFloat("txtNormalStdev", 0, Number.POSITIVE_INFINITY, true,
        "spnNormalMsg", "SD", "must be positive.")) return;
    if (!IV.validateInputFloat("txtNormalInvArea", 0, 1, true,
        "spnNormalBoundMsg", "Area")) return;
    var mean = parseFloat(UI.getProperty("txtNormalMean", "value"));
    var stdev = parseFloat(UI.getProperty("txtNormalStdev", "value"));
    var area = parseFloat(UI.getProperty("txtNormalInvArea", "value"));
    
    var value = jStat.normal.inv(area, mean, stdev);

    // TODO: Maybe this should be the default behavior in formatting numbers throughout the app?       
    // Let's try to make a smart choice about the values -- if the parameters given are small, we should
    // try to go a couple of places beyond that
    var minPlaces = 2 - Math.min(safenum.getPow10(mean), safenum.getPow10(stdev));
    var defaultPlaces = pref.values.number.rounding_places[pref.values.number.rounding_type];
    minPlaces = ((minPlaces > defaultPlaces) ? minPlaces : undefined);
                
    UI.setProperty("spnNormalResult", "innerHTML", "Value = " + format.formatNumber(value, minPlaces));

    normGraphContainer.removeAllGraphs();
    normGraph.setParameters(mean, stdev, Number.NEGATIVE_INFINITY, value);
    normGraphContainer.addGraph(normGraph);
}

function calculateBinomialX()
{
    UI.batchSetProperty(["spnBinomialResult", "spnBinomialMsg", "spnBinomialBoundMsg"], "innerHTML", "");
    if (!IV.validateInputInt("txtBinomialN", 0, Number.POSITIVE_INFINITY, true,
        "spnBinomialMsg", "n", "must be positive.")) return;

    var n = parseInt(UI.getProperty("txtBinomialN", "value"));
    var p = util.parseFloatOrFraction(UI.getProperty("txtBinomialP", "value"));
    if (isNaN(p) || (p<0) || (p>1))
    {
        UI.setProperty("spnBinomialMsg", "innerHTML", "p must be a number between 0 and 1.");
        return;
    }
    if (!IV.validateInputInt("txtBinomialX", 0, n, false,
        "spnBinomialBoundMsg", "The number of successes", "must be between 0 and " + n + ".")) return;
    var x = parseInt(UI.getProperty("txtBinomialX", "value"));
    
    var type = UI.getProperty("selBinomialX", "value");
    var result = 0;
    var graph = 
        new SPAApplet.ProbabilityHistogram(SPAApplet.Statistics.binomialProbabilityDistribution(n, p));
    if (type == "lt")
    {
        if (x < 1)
        {
            UI.setProperty("spnBinomialMsg", "innerHTML", "There cannot be fewer than 0 successes.");
            return;
        }
        result = jStat.binomial.cdf(x - 1, n, p);
        graph.selectValues(0, x - 1);
    }
    else if (type == "le")
    {
        result = jStat.binomial.cdf(x, n, p);
        graph.selectValues(0, x);
    }
    else if (type == "eq")
    {
        result = jStat.binomial.pdf(x, n, p);
        graph.selectValues(x, x);
    }
    else if (type == "ge")
    {
        result = 1 - jStat.binomial.cdf(Math.max(0, x - 1), n, p);
        graph.selectValues(x, n);
    }
    else // type is "gt"
    {
        if (x >= n)
        {
            UI.setProperty("spnBinomialMsg", "innerHTML",
                "There cannot be more than " + n + " successes.");
            return;
        }
        result = 1 - jStat.binomial.cdf(x, n, p);
        graph.selectValues(x + 1, n);
    }
    
    UI.batchSetProperty(["txtBinomialCdfLeft", "txtBinomialCdfRight"], "value", "");
    UI.setProperty("spnBinomialResult", "innerHTML", "Probability = " + format.formatProportion(result, 4));
    binomGraphContainer.removeAllGraphs();
    binomGraphContainer.addGraph(graph);
}

function calculateBinomialCdf()
{
    UI.batchSetProperty(["spnBinomialResult", "spnBinomialMsg", "spnBinomialBoundMsg"], "innerHTML", "");
    if (!IV.validateInputInt("txtBinomialN", 0, Number.POSITIVE_INFINITY, true,
        "spnBinomialMsg", "n", "must be positive.")) return;
        
    var n = parseInt(UI.getProperty("txtBinomialN", "value"));
    if (!IV.validateInputInt("txtBinomialCdfLeft", 0, n, false,
        "spnBinomialBoundMsg", "The number of successes", "must be between 0 and " + n + ".")) return;
    if (!IV.validateInputInt("txtBinomialCdfRight", 0, n, false,
        "spnBinomialBoundMsg", "The number of successes", "must be between 0 and " + n + ".")) return;
    var p = util.parseFloatOrFraction(UI.getProperty("txtBinomialP", "value"));
    if (isNaN(p) || (p<0) || (p>1))
    {
        UI.setProperty("spnBinomialMsg", "innerHTML", "p must be a number between 0 and 1.");
        return;
    }

    var leftBound = parseInt(UI.getProperty("txtBinomialCdfLeft", "value"));
    var rightBound = parseInt(UI.getProperty("txtBinomialCdfRight", "value"));
    if (rightBound < leftBound)
    {
        UI.setProperty("spnBinomialBoundMsg", "innerHTML", "Right bound must be greater than left bound.");
        return;
    }
    
    var result = 0;
    var graph = 
        new SPAApplet.ProbabilityHistogram(SPAApplet.Statistics.binomialProbabilityDistribution(n, p));
    
    result = (leftBound > 0 ? jStat.binomial.cdf(rightBound, n, p) - jStat.binomial.cdf(leftBound - 1, n, p)
                            : jStat.binomial.cdf(rightBound, n, p));
    graph.selectValues(leftBound, rightBound);

    UI.setProperty("txtBinomialX", "value", "");
    UI.setProperty("spnBinomialResult", "innerHTML", "Probability = " + format.formatProportion(result, 4));
    binomGraphContainer.removeAllGraphs();
    binomGraphContainer.addGraph(graph);
}

function plotBinomial()
{
    UI.setProperty("spnBinomialResult", "innerHTML", "");
    if (!IV.validateInputInt("txtBinomialN", 0, Number.POSITIVE_INFINITY, true,
        "spnBinomialMsg", "n", "must be positive.")) return;

    var n = parseInt(UI.getProperty("txtBinomialN", "value"));
    var p = util.parseFloatOrFraction(UI.getProperty("txtBinomialP", "value"));
    if (isNaN(p) || (p<0) || (p>1))
    {
        UI.setProperty("spnBinomialMsg", "innerHTML", "p must be a number between 0 and 1.");
        return;
    }

    var graph = 
        new SPAApplet.ProbabilityHistogram(SPAApplet.Statistics.binomialProbabilityDistribution(n, p));
    binomGraphContainer.removeAllGraphs();
    binomGraphContainer.addGraph(graph);
}

function initializePage()
{
    probGraphContainer = new SPAApplet.QuantitativeGraphContainer("cnvProbPlot");
    normGraphContainer = new SPAApplet.QuantitativeGraphContainer("cnvGaussPlot");
    binomGraphContainer = new SPAApplet.QuantitativeGraphContainer("cnvBinomPlot");
    
    UI.batchSetStyleProperty(["divDiscrete", "divDiscreteGraph", "divDiscreteSummaryStatistics",
                "divCounting", "divNormal", "divNormalInv", "divBinomial", "spnNormalCdfSingleInput"], "display", "none");
    UI.setProperty("btnChangeInputs", "disabled", true);
}

SPAApplet.UIHandlers.setOnLoadWithPreload(initializePage);