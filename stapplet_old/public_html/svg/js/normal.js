var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var pageActive = false;

function initializePage()
{
	UI.batchSetStyleProperty(["divAnalysis", "divNormalCdfSingleInput", "divPlot", "spnNormalCdf", "spnNormalInv"], "display", "none");
	trialData = [];
	graph = new STAP.SVGGraph("divPlot", null, 250);
	UI.writeLinkColorOriginRules();
}

function setPageActive(bActive)
{
    pageActive = bActive;
    if (bActive)
        UI.batchSetStyleProperty(["spnCDFLabels", "spnInvLabels"], "display", "inline");
    else
        UI.batchSetStyleProperty(["spnCDFLabels", "spnInvLabels"], "display", "none");
}

function handleParamsChange()
{
    var op = UI.getProperty("selNormalType", "value");
    if (!pageActive)
    {
        if (UI.getStyleProperty(op, "display") == "inline")
            plotNormalCurve();
    }
    else if (op == "spnNormalCdf")
        calculateNormalCdf();
    else
        calculateNormalInv();
}

function handleNormChange()
{
    plotNormalCurve();
	UI.batchSetStyleProperty(["spnNormalInv", "spnNormalCdf"], "display", "none");
	UI.setStyleProperty(UI.getProperty("selNormalType", "value"), "display", "inline");
	UI.batchSetProperty(["spnNormalMsg", "spnNormalBoundMsg", "spnNormalResult"], "innerHTML", "");
}

function plotNormalCurve(bCheckBounds)
{
    setPageActive(false);
	UI.batchSetProperty(["spnNormalMsg", "spnNormalBoundMsg", "spnNormalResult", "spnLeftZ", "spnRightZ", "spnSingleZ"], "innerHTML", "");
	var mean = parseFloat(UI.getProperty("txtNormalMean", "value"));
	if (isNaN(mean))
	{
		UI.setProperty("spnNormalMsg", "innerHTML", "Mean must be numeric.");
		return false;
	}
	var stdev = parseFloat(UI.getProperty("txtNormalStdev", "value"));
	if (isNaN(stdev) || safenum.compareToWithinTolerance(stdev, 0) <= 0)
	{
		UI.setProperty("spnNormalMsg", "innerHTML", "Standard deviation must be a positive number.");
		return false;
	}

    UI.setStyleProperty("divPlot", "display", "block");
	UI.setStyleProperty(UI.getProperty("selNormalType", "value"), "display", "inline");
	if (!bCheckBounds)
	{
		graph.normalDiagram(mean, stdev);
		UI.setProperty("btnExport", "disabled", false);
		UI.setStyleProperty("divAnalysis", "display", "block");
		return true;
	}
	
	if (UI.getProperty("selNormalType", "value") == "spnNormalCdf")
	{
		var left = parseFloat(UI.getProperty("txtNormalCdfLeft", "value"));
		var right = parseFloat(UI.getProperty("txtNormalCdfRight", "value"));
		var value = parseFloat(UI.getProperty("txtNormalCdfSingle", "value"));
		var type = UI.getProperty("selNormalCdfType", "value");
	
		var bBetween = (type != "outside");
		
		if (type == "between" || type == "outside")
		{
			if (isNaN(left) || isNaN(right))
			{
				UI.setProperty("spnNormalBoundMsg", "innerHTML", "Region bounds must be numeric.");
				return false;
			}
			
			if (left > right)
			{
				UI.setProperty("spnNormalBoundMsg", "innerHTML", "Left bound must be less than right bound.");
				return false;
			}
		}
		else
		{
			if (isNaN(value))
			{
				UI.setProperty("spnNormalBoundMsg", "innerHTML", "Value must be numeric.");
				return false;
			}
			if (type == "left")
			{
				right = value;
				left = null;
			}
			else
			{
				left = value;
				right = null;
			}
		}
		
        setPageActive(true);
		graph.normalDiagram(mean, stdev, left, right, bBetween,
		    (UI.getProperty("chkCDFLabels", "checked")));
		UI.setStyleProperty("divAnalysis", "display", "block");
		UI.setProperty("btnExport", "disabled", false);
		return true;
	}
	else // inverse
	{
	    var area = parseFloat(UI.getProperty("txtNormalInvArea", "value"));
	    if (isNaN(area))
		{
			UI.setProperty("spnNormalBoundMsg", "innerHTML", "Area must be numeric.");
			return false;
		}
	    if (area > 1 || area < 0)
		{
			UI.setProperty("spnNormalBoundMsg", "innerHTML", "Area must be between 0 and 1.");
			return false;
		}

        setPageActive(true);
	    var type = UI.getProperty("selNormalInvType", "value");
	    
	    var value = jStat.normal.inv(
	    			(type == "left" ? area :
	    				(type == "right" ? (1 - area) : (1 - area) / 2)
	    			), mean, stdev);
        var labels = UI.getProperty("chkInvLabels", "checked");
	    if (type == "left")	    			
	    	graph.normalDiagram(mean, stdev, null, value, true, labels);
	    else if (type == "right")
	    	graph.normalDiagram(mean, stdev, value, null, true, labels);
	    else
	    	graph.normalDiagram(mean, stdev, value, 2 * mean - value, true, labels);
	    	
	    UI.setStyleProperty("divAnalysis", "display", "block");
	    UI.setProperty("btnExport", "disabled", false);
	    return true;
	}
}

function exportSVG(divId,desc)
{
    file.saveSVG(document.getElementById("svg_divPlot"), "normal");
}

function handleNormCdfChange()
{
	plotNormalCurve();
	UI.setProperty("spnNormalResult", "innerHTML", "");
	var normtype = UI.getProperty("selNormalCdfType", "value");
	if (normtype == "left" || normtype == "right")
	{
		UI.setStyleProperty("divNormalCdfRegionInput", "display", "none");
		UI.setStyleProperty("divNormalCdfSingleInput", "display", "block");
	}
	else
	{
		UI.setStyleProperty("divNormalCdfSingleInput", "display", "none");
		UI.setStyleProperty("divNormalCdfRegionInput", "display", "block");
	}
}

function calculateNormalCdf()
{
	UI.batchSetProperty(["spnNormalResult", "spnSingleZ", "spnLeftZ", "spnRightZ"], "innerHTML", "");
	if (plotNormalCurve(true))
	{
		var mean = parseFloat(UI.getProperty("txtNormalMean", "value"));
		var stdev = parseFloat(UI.getProperty("txtNormalStdev", "value"));
		var left = parseFloat(UI.getProperty("txtNormalCdfLeft", "value"));
		var right = parseFloat(UI.getProperty("txtNormalCdfRight", "value"));
		var value = parseFloat(UI.getProperty("txtNormalCdfSingle", "value"));
		var type = UI.getProperty("selNormalCdfType", "value");

		if (type == "left") { left = Number.NEGATIVE_INFINITY; right = value; }	
		else if (type == "right") { right = Number.POSITIVE_INFINITY; left = value; }

	    var area = jStat.normal.cdf(right, mean, stdev) - jStat.normal.cdf(left, mean, stdev);
	    if (type == "outside") area = (1 - area);

	    UI.setProperty("spnNormalResult", "innerHTML",
	        util.probabilityHTML("Area", area)
	    );

	    var zscore = function(x) { return format.formatNumber((x - mean) / stdev); };
	    
	    if (type == "left" || type == "right")
	        UI.setProperty("spnSingleZ", "innerHTML", "z = " + zscore(value));
	    else
	    {
	        UI.setProperty("spnLeftZ", "innerHTML", "z = " + zscore(left));
	        UI.setProperty("spnRightZ", "innerHTML", "z = " + zscore(right));
	    }
	}
}

function calculateNormalInv()
{
	UI.setProperty("spnNormalResult", "innerHTML", "");
	if (plotNormalCurve(true))
	{
	    var mean = parseFloat(UI.getProperty("txtNormalMean", "value"));
	    var stdev = parseFloat(UI.getProperty("txtNormalStdev", "value"));
	    var area = parseFloat(UI.getProperty("txtNormalInvArea", "value"));
	    var type = UI.getProperty("selNormalInvType", "value");
	    var value;
	    if (safenum.isZeroWithinTolerance(area - 1))
	    {
		    UI.setProperty("spnNormalResult", "innerHTML", 
		    	(type == "center" ? ("Range = -&infin; &le; x &le; &infin;")
		    		: ("Value = " +
		    			(type == "left" ? "" : "-") + "&infin;"		    			  
		    		)
		    	)
		    );
	    }
	    else
	    {
		    var value = jStat.normal.inv(
		    			(type == "left" ? area :
		    				(type == "right" ? (1 - area) : (1 - area) / 2)
		    			), mean, stdev);
		    
		    var zRaw = (value - mean) / stdev;
		    var zAbs = format.formatNumber(Math.abs(zRaw));
		    UI.setProperty("spnNormalResult", "innerHTML", 
		    	(type == "center" ? ("Range = " + format.formatNumber(value) + " &le; x &le; " +
		    						format.formatNumber(2 * mean - value)
		    						+ " (-" + zAbs + " &le; z &le; " + zAbs + ")")
		    			  : ("Value = " + format.formatNumber(value) + " (z = " + format.formatNumber(zRaw) + ")")
		    	)
		    );
	    }
	}
}

function handleCDFLabelsChange()
{
    if (pageActive) calculateNormalCdf();
}

function handleInvLabelsChange()
{
    if (pageActive) calculateNormalInv();
}

UI.setOnLoad(initializePage);