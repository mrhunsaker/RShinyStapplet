var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var xDataArrArr = [];
var yDataArr = null;

var pageActive = false;
var lastRegression = null;

function validateInput()
{
    xDataArrArr = [];
    yDataArr = null;
    document.getElementById("spnExplanatoryMsg").innerHTML = "";
    document.getElementById("spnResponseMsg").innerHTML = "";
    
    var tbl = document.getElementById("tblInputs");
    var numExpl = tbl.rows.length - 3;
    var valid = true;
    var countChecked = 0;
    for (var i = 1; i < tbl.rows.length - 2; i++)
    {
    	if (document.getElementById("chkExplanatory" + i).checked)
    	{
    		countChecked++;
	        valid = valid && IV.validateInputFloatArray("txtExplanatory" + i + "Data", "spnExplanatoryMsg", "Explanatory data ");
	}
    }
    
    if (valid)
	    valid = valid && IV.validateInputFloatArray("txtResponseData", "spnResponseMsg", "Response data ");

    // Also validate the number of observations here
    if (valid)
    {
        yDataArr = util.splitStringGetArray(document.getElementById("txtResponseData").value);
	for (var i = 1; i < tbl.rows.length - 2; i++)
	{
	    	if (document.getElementById("chkExplanatory" + i).checked)
	    	{
		        var arr = util.splitStringGetArray(document.getElementById("txtExplanatory" + i + "Data").value);
			if (arr.length !== yDataArr.length)
			{
		            UI.setProperty("spnExplanatoryMsg", "innerHTML",
	                           "The number of observations in each group must be the same.");
		            valid = false;
		            break;
	                }
	                else
	                	xDataArrArr.push(arr);
	        }
	 }
    }
    
    // Validate that the predictors are linearly independent
    if (valid && (countChecked > 0))
    {
	if (!stat.isLinearlyIndependent(xDataArrArr))
	{
	    UI.setProperty("spnExplanatoryMsg", "innerHTML",
	           "At least two of your explanatory variables are perfectly correlated.<BR>"
		+ "You must exclude all but one of these correlated variables from the model.");
	    valid = false;
	}
    }

    if (!valid)
    {
            xDataArrArr = [];
            yDataArr = null;
    }
    return valid;
};

function addTblInputRow()
{
	var tbl = document.getElementById("tblInputs");
	
	var newRowIndex = tbl.rows.length - 2;
	var row = tbl.insertRow(newRowIndex);
	var cellTitle = row.insertCell(0);
	var cellName = row.insertCell(1);
	var cellData = row.insertCell(2);
	var cellCheckbox = row.insertCell(3);
	var cellMinusButton = row.insertCell(4);
	
	cellTitle.innerHTML = '<LABEL FOR="txtExplanatory' + newRowIndex + 'Name">Explanatory ' + newRowIndex + '</LABEL>';
	cellName.innerHTML = '<INPUT TYPE="text" CLASS="name" ID="txtExplanatory' + newRowIndex + 'Name" SIZE="10"></INPUT>';
	cellData.innerHTML = '<INPUT TYPE="text" CLASS="data" ID="txtExplanatory' + newRowIndex + 'Data" SIZE="50"></INPUT>';
	cellCheckbox.innerHTML = '<INPUT TYPE="checkbox" CLASS="ctl" ID="chkExplanatory' + newRowIndex + '"></INPUT>';
	cellMinusButton.innerHTML = '<INPUT TYPE="button" CLASS="ctl" ID="btnDeleteExplanatory' + newRowIndex + '" VALUE="-" onClick="deleteTblInputRow(' + newRowIndex + ');"></INPUT>';
};

function deleteTblInputRow(index)
{
	var tbl = document.getElementById("tblInputs");

	if (tbl.rows.length < 5)
	{
		UI.setProperty("spnExplanatoryMsg", "innerHTML", "At least one explanatory variable is required.");
		return;
	}
	
	tbl.deleteRow(index);
	
	// Update control IDs
	// Neither the first row nor the last two rows require any fixing
	for (var i = 1; i < tbl.rows.length - 2; i++)
	{
		tbl.rows[i].cells[0].innerHTML = '<LABEL FOR="txtExplanatory' + i + 'Name">Explanatory ' + i + '</LABEL>';
		UI.extractElement(tbl.rows[i].cells[1], "name").id = "txtExplanatory" + i + "Name";
        	UI.extractElement(tbl.rows[i].cells[2], "data").id = "txtExplanatory" + i + "Data";
        	UI.extractElement(tbl.rows[i].cells[3], "ctl").id = "chkExplanatory" + i;
        	UI.extractElement(tbl.rows[i].cells[4], "ctl").id = "btnDeleteExplanatory" + i;
		UI.extractElement(tbl.rows[i].cells[4], "ctl").onClick = "deleteTblInputRow(" + i + ")";
	}
};

function clearTable()
{
	var tbl = document.getElementById("tblInputs");
	while (tbl.rows.length > 5)
		tbl.deleteRow(3);
	
	document.getElementById("txtExplanatory1Name").value = "";
	document.getElementById("txtExplanatory1Data").value = "";
	document.getElementById("chkExplanatory1").checked = true;
	document.getElementById("txtExplanatory2Name").value = "";
	document.getElementById("txtExplanatory2Data").value = "";
	document.getElementById("chkExplanatory2").checked = false;
	document.getElementById("txtResponseName").value = "";
	document.getElementById("txtResponseData").value = "";
	document.getElementById("spnLSRLResults").innerHTML = "";
   	document.getElementById("spnExplanatoryMsg").innerHTML = "";
   	document.getElementById("spnResponseMsg").innerHTML = "";
};

function beginAnalysis()
{
    if (validateInput())
    {
	d3.selectAll("table input")
		.attr("disabled", "true");

        UI.recordInputStates(["txtResponseName", "txtResponseData"]);
	var tbl = document.getElementById("tblInputs");

	for (var i = 1; i <= (tbl.rows.length - 3); i++)
		if (UI.getProperty("chkExplanatory" + i, "checked"))
			UI.recordInputStates(["txtExplanatory" + i + "Name",
					      "txtExplanatory" + i + "Data"]);
        UI.setProperty("btnChangeInputs", "disabled", false);
	UI.setStyleProperty("divAnalysis", "display", "block");
	pageActive = true;
	handleRegression( );
    }
};

function resetApplet()
{
    if (confirm("Are you sure? All data and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        deactivatePage();
	clearTable();
        UI.batchSetProperty(["txtResponseData", "txtResponseName"], "value","");
	UI.setStyleProperty("divAnalysis", "display", "none");
        xDataArrArr = [];
        yDataArr = null;
        UI.clearInputStates();
    }
}

function deactivatePage()
{
	d3.selectAll("table input")
		.attr("disabled", null);

    UI.batchSetProperty(["spnExplanatoryMsg", "spnResponseMsg", "spnInferenceResults", "spnLSRLResults",
			 "spnPredictionResult", "spnPredictionMsg"], "innerHTML", "");
    UI.batchSetStyleProperty(["divAnalysis"], "display", "none");
    residualPlot.clearGraph();
    residualDotplot.clearGraph();
    lastRegression = null;
    pageActive = false;
    UI.setProperty("btnChangeInputs", "disabled", true);
}

function getResponseName()
{
	var name = document.getElementById("txtResponseName").value;
	if (name.length > 0) return name;
	else return null;
}

function handleRegression()
{
	var lastFetch = null;
	var fnFetch = function(id) {
		var name = document.getElementById(id).value;
		if (name.length > 0)
		{ lastFetch = name; return true; }
		else { lastFetch = null; return false; }
	};
	var reg = stat.multipleRegression(xDataArrArr, yDataArr);
	d3.selectAll("#divPredictionCtl span").remove();
	
	var resultHTML = (fnFetch("txtResponseName") ? lastFetch : "<em>y&#770;</em>") + " = " + (+format.formatNumber(reg.coeffs[0], 6));
	var index = 1;
	for (var i = 1; i < reg.coeffs.length; i++)
	{
		while (!document.getElementById("chkExplanatory" + index).checked) index++;
		var caption = (fnFetch("txtExplanatory" + index + "Name") ? lastFetch : "x<SUB>" + index + "</SUB>");
		resultHTML += " + " + (+format.formatNumber(reg.coeffs[i], 6)) + "(" + caption + ")";
		var span = d3.select("#divPredictionCtl")
			.append("span")
			.attr("id", "spnPredictionVariable" + index)
			.html(caption + " = ");
		span.append("input")
			.attr("type", "text")
			.attr("size", "6");
		span.append("br");
		index++;
	}
	resultHTML += "<BR>r<SUP>2</SUP> = " + format.formatNumber(reg.rSquared) + "<BR>s = " + format.formatNumber(reg.S);
	document.getElementById("spnLSRLResults").innerHTML = resultHTML;

	var respname = getResponseName();
	if (!respname) respname = "Response";

	var xMap = [];
	for (var i = 0; i < yDataArr.length; i++)
	{
		var x = [];
		for (var j = 0; j < xDataArrArr.length; j++)
			x.push(xDataArrArr[j][i]);
		xMap.push(x);
	}
	var predictions = xMap.map(reg.prediction);
	residualPlot.scatterplot(util.arraysTo2DGraphData(predictions, reg.residuals, "Predicted " + respname, "Residual"),
				"Predicted " + respname, "Residual");
	residualPlot.plotTopCurve(function(x) { return 0; });
	
	residualDotplot.dotplot(util.arrayToGraphData(reg.residuals, "Residual"), "Residual");

	lastRegression = reg;	
}

function updatePrediction()
{
	UI.batchSetProperty(["spnPredictionResult", "spnPredictionMsg"], "innerHTML", "");
	var valid = true;

	// Validate all inputs
	d3.selectAll("#divPredictionCtl span input")
		.each(function(d, i)
			{
				if (util.trimString(this.value).length == 0) valid = false;
				if (isNaN(+this.value)) valid = false;
			});
	
	if (!valid)
	{
		UI.setProperty("spnPredictionMsg", "innerHTML", "All prediction variables must be numeric.");
		return;
	}

	var result = lastRegression.coeffs[0];
	d3.selectAll("#divPredictionCtl span input")
		.each(function(d, i)
			{
				result += (+this.value) * lastRegression.coeffs[i+1];
			});
	var respname = getResponseName();
	if (!respname)
		respname = "<em>y&#770;</em>";
	else
		respname = "Predicted value of " + respname;

	UI.setProperty("spnPredictionResult", "innerHTML", respname + " = " + STAP.Format.formatNumber(result));
}

function initializePage()
{
    residualPlot = new STAP.SVGGraph("divResidualPlot", 500, 300);
    residualDotplot = new STAP.SVGGraph("divResidualDotplot", 500, 300);
    UI.setStyleProperty("divAnalysis", "display", "none");
    UI.batchSetProperty(["btnChangeInputs"], "disabled", true);
    UI.writeLinkColorOriginRules();
}

STAP.UIHandlers.setOnLoad(initializePage);

/*

var scatterplot = null;
var residualPlot = null;
var residualDotplot = null;
var lastRegressionFn = null;
var scatterplotContainer = null;
var residualPlotContainer = null;
var residualDotplotContainer = null;
var residualPlotVG = UI.makeVisibilityGroup("btnExportResidualPlot", "btnToggleResidualPlot",
                                            "btnExportResidualDotplot", "btnToggleResidualDotplot",
                                            "btnToggleRegression", "cnvResidualPlot");
var simulationGraphContainer = null;
var simulationResults = [];

function inputsChanged(obj)
{
    if (pageActive)
    {
        if (obj && !confirm("Are you sure? The entries will remain, but any unsaved output will be lost."))
        {
            UI.resetInputState(obj.id);
            return;
        }
        deactivatePage();
    }
}

function updateResidualPlot(stats)
{
    residualPlotVG.show();
    residualPlotContainer.removeAllGraphs();
    safenum.cleanArray(stats.residuals);
    residualPlot = new SPAApplet.Scatterplot(xDataArr, stats.residuals,
                    UI.getProperty("txtExplanatoryName", "value"),
                    "Residual", residualPlotContainer);
    residualDotplotContainer.removeAllGraphs();
    residualDotplot = new SPAApplet.Dotplot(stats.residuals, "", residualDotplotContainer);
    if (UI.getProperty("btnToggleResidualDotplot", "value") == "Hide dotplot of residuals")
        UI.setStyleProperty("cnvResidualDotplot", "display", "inline");
    else
        UI.setStyleProperty("cnvResidualDotplot", "display", "none");
}

function updateLSRL()
{
    var stat1 = stat.polynomialRegression(xDataArr, yDataArr, 1);

    // Render a table programmatically
    var tableHTML = "<BR><TABLE CLASS='results'><TR>";
    tableHTML += "<TH>Equation</TH><TH>n</TH><TH><EM>s</EM></TH><TH><EM>r</EM><SUP>2</SUP></TH></TR><TR>";
    tableHTML += "<TD><em>y&#770;</em> = " + util.polynomialRegEQDisplayHTML(stat1.coeffs) + "</TD><TD>"
        + xDataArr.length + "</TD><TD>"
        + format.formatNumber(stat1.S) + "</TD><TD>"
        + format.formatNumber(stat1.rSquared) + "</TD></TR></TABLE>";
    UI.setProperty("spnLSRLResults", "innerHTML", tableHTML);
    updateResidualPlot(stat1);
    scatterplot.setRegression(stat1.fn);
    lastRegressionFn = stat1.fn;
    UI.setProperty("btnToggleRegression", "value", "Hide regression");
}

function updateHigherOrderModel()
{
    UI.batchSetProperty(["spnHigherOrderMsg", "spnHigherOrderResults"], "innerHTML", "");
    var modelType = UI.getProperty("selHigherOrderModel", "value");
    
    if (modelType == "quadratic" && xDataArr.length < 3)
    {
        UI.setProperty("spnHigherOrderMsg", "innerHTML", "Three observations are required for a quadratic regression.");
        return;
    }
    if (modelType == "exponential")
    {
        for (var i = 0; i < yDataArr.length; i++)
        {
            if (yDataArr[i] <= 0)
            {
                UI.setProperty("spnHigherOrderMsg", "innerHTML", "Cannot perform an exponential regression with negative or zero response values.");
                return;
            }                        
        }
    }
    var stat1 = (modelType == "quadratic" ? stat.polynomialRegression(xDataArr, yDataArr, 2) :
                        stat.exponentialRegression(xDataArr, yDataArr));
    // Render a table programmatically
    var tableHTML = "<BR><TABLE CLASS='results'><TR>";
    tableHTML += "<TH>Equation</TH><TH>n</TH><TH><EM>s</EM></TH><TH><EM>r</EM><SUP>2</SUP></TH></TR>"
            + "<TR><TD><em>y&#770;</em> = ";
    if (modelType != "exponential")
        tableHTML += util.polynomialRegEQDisplayHTML(stat1.coeffs);
    else
        tableHTML += util.exponentialRegEQDisplayHTML(stat1.constant, stat1.base);
    tableHTML += "</TD><TD>" + xDataArr.length + "</TD><TD>"
        + format.formatNumber(stat1.S) + "</TD><TD>"
        + format.formatNumber(stat1.rSquared) + "</TD></TR></TABLE>";
    UI.setProperty("spnHigherOrderResults", "innerHTML", tableHTML);
    updateResidualPlot(stat1);
    scatterplot.setRegression(stat1.fn);
    lastRegressionFn = stat1.fn;
    UI.setProperty("btnToggleRegression", "value", "Hide regression");
}

function toggleRegression()
{
    if (UI.getProperty("btnToggleRegression", "value") == "Hide regression")
    {
        UI.setProperty("btnToggleRegression", "value", "Show regression");
        scatterplot.setRegression(null);
    }
    else
    {
        UI.setProperty("btnToggleRegression", "value", "Hide regression");
        scatterplot.setRegression(lastRegressionFn);
    }
}

function toggleResidualPlot()
{
    if (UI.getProperty("btnToggleResidualPlot", "value") == "Hide residual plot")
    {
        UI.setProperty("btnToggleResidualPlot", "value", "Show residual plot");
        UI.setProperty("btnExportResidualPlot", "disabled", true);
        UI.setStyleProperty("cnvResidualPlot", "display", "none");
    }
    else
    {
        UI.setProperty("btnToggleResidualPlot", "value", "Hide residual plot");
        UI.setProperty("btnExportResidualPlot", "disabled", false);
        UI.setStyleProperty("cnvResidualPlot", "display", "inline");
    }
}

function toggleResidualDotplot()
{
    if (UI.getProperty("btnToggleResidualDotplot", "value") == "Hide dotplot of residuals")
    {
        UI.setProperty("btnToggleResidualDotplot", "value", "Show dotplot of residuals");
        UI.setProperty("btnExportResidualDotplot", "disabled", true);
        UI.setStyleProperty("cnvResidualDotplot", "display", "none");
    }
    else
    {
        UI.setProperty("btnToggleResidualDotplot", "value", "Hide dotplot of residuals");
        UI.setProperty("btnExportResidualDotplot", "disabled", false);
        UI.setStyleProperty("cnvResidualDotplot", "display", "inline");
    }
}

function handleInferenceChange(sel)
{
    UI.batchSetStyleProperty(["spnSimulationResults", "spnInferenceResults"], "display", "none");
    if (sel.value == "interval")
    {
        UI.setStyleProperty("spnInferenceIntervalOptions", "display", "inline");
        UI.setStyleProperty("spnInferenceTestOptions", "display", "none");
        UI.setStyleProperty("spnSimulationOptions", "display", "none");                
    }
    else if (sel.value == "test")
    {
        UI.setStyleProperty("spnInferenceIntervalOptions", "display", "none");
        UI.setStyleProperty("spnInferenceTestOptions", "display", "inline");
        UI.setStyleProperty("spnSimulationOptions", "display", "none");                
    }
    else // simulation
    {
        UI.setStyleProperty("spnInferenceIntervalOptions", "display", "none");
        UI.setStyleProperty("spnInferenceTestOptions", "display", "none");
        UI.setStyleProperty("spnSimulationOptions", "display", "inline");
    }
}

function updateCorrelation()
{
    UI.setProperty("spnCorrelationResults", "innerHTML", "<em>r</em> = " +
                        format.formatNumber(jStat.corrcoeff(xDataArr, yDataArr)));
}

function updateInference()
{
    var inferenceType = UI.getProperty("selInference", "value");

    if (inferenceType == "interval")
    {
        UI.setStyleProperty("spnInferenceResults", "display", "inline");
        UI.setStyleProperty("spnSimulationResults", "display", "none");                
        var results = stat.linRegTInterval(xDataArr, yDataArr,
                        parseFloat(UI.getProperty("selCLevel", "value")));

        // Render a table programmatically
        var tableHTML = "<TABLE><TR>";
        tableHTML += "<TH>Lower Bound</TH><TH>Upper Bound</TH><TH>df</TH></TR><TR>"
        tableHTML += "<TD>" + format.formatNumber(results.lowerBound)
                + "</TD><TD>" + format.formatNumber(results.upperBound)
                + "</TD><TD>" + format.formatNumber(results.df)
                + "</TD></TR></TABLE>"
        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
    }
    else if (inferenceType == "test")
    {
        UI.setStyleProperty("spnInferenceResults", "display", "inline");
        UI.setStyleProperty("spnSimulationResults", "display", "none");                
        var results = stat.linRegTTest(xDataArr, yDataArr,
                    parseInt(UI.getProperty("selTTestSides", "value")));

        // Render a table programmatically
        var tableHTML = "<TABLE><TR>";
        tableHTML += "<TH>t</TH><TH>P-value</TH><TH>df</TH></TR><TR>"
        tableHTML += "<TD>" + format.formatNumber(results.t)
                + "</TD><TD>" + format.formatPValueHTML(results.pValue)
                + "</TD><TD>" + format.formatNumber(results.df)
                + "</TD></TR></TABLE>"
        UI.setProperty("spnInferenceResults", "innerHTML", tableHTML);
    }
    else // simulation
    {
        UI.setStyleProperty("spnInferenceResults", "display", "none");                
        UI.setStyleProperty("spnSimulationResults", "display", "inline");
        UI.setStyleProperty("spnSimulationErrorMsg", "innerHTML", "");
        if (IV.validateInputInt("txtNumSamples", 1,
            Number.POSITIVE_INFINITY, false, "spnSimulationErrorMsg", "Number of samples", "must be positive."))
        {
            var observedSlope = stat.polynomialRegression(xDataArr, yDataArr, 1).coeffs[1];
            var sidedness = parseInt(UI.getProperty("selTTestSides", "value"));
            Array.prototype.push.apply(simulationResults, stat.simulateSlopes(xDataArr, yDataArr, parseInt(UI.getProperty("txtNumSamples", "value"))));

            if (!simulationGraphContainer)
                simulationGraphContainer = new SPAApplet.QuantitativeGraphContainer("cnvSimulationPlot",
                                                                                   "Simulated sample slope");
            else
                simulationGraphContainer.removeAllGraphs();
            var simgraph = new SPAApplet.Dotplot(simulationResults, "");
            simgraph.preferXZeroSymmetry = true;
            simulationGraphContainer.addGraph(simgraph);

            UI.setProperty("spnSimulationTable", "innerHTML",
                "<TABLE><TR><TH># samples</TH></TR><TR><TD>" + format.formatNumber(simulationResults.length) + "</TD></TR></TABLE><BR>");                        
            if (util.trimString(UI.getProperty("txtSimulationDotplotCountBound", "value")).length > 0)
                handleSimulationDotplotCount();
        } 
    }
}

function exportSimulationGraph()
{
    file.saveCanvas('cnvSimulationPlot', 'simulation_slope');
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
    var graph = simulationGraphContainer.graphs[0];
    if (graph)
        graph.clearCountingRegion();
} 

function clearSimulationResults()
{
    simulationResults = [];
    UI.setStyleProperty("spnSimulationResults", "display", "none");
}

STAP.UIHandlers.setOnLoadWithPreload(initializePage);
*/