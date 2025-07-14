var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var pageActive = false;
var opActive = false;

const POS_INF = Math.pow(10, 9);
const NEG_INF = -POS_INF;

function initializePage()
{
	UI.batchSetStyleProperty(["divAnalysis", "spnTCdfSingleInput", "spnTInv", "spnTCdf", "divPlot", "spnCdfLabels", "spnInvLabels"], "display", "none");
	graph = new STAP.SVGGraph("divPlot", null, 250);
	UI.writeLinkColorOriginRules();
}

function handleDFChange()
{
    var df = parseFloat(UI.getProperty("txtTDF","value"));
    if (df <= 0) UI.setProperty("txtTDF", "value", "1");
    else if (df > 300) UI.setProperty("txtTDF", "value", "300");

    if (pageActive)
    {
        if (!plotTCurve(true, true))
        {
            plotTCurve();
        	UI.batchSetProperty(["spnTMsg", "spnTBoundMsg", "spnTResult"], "innerHTML", "");
        }
        else if (opActive)
        {
        	if (UI.getProperty("selTType", "value") == "spnTCdf")
        	    calculateTCdf();
        	else
        	    calculateTInv();
        }
    }
}

function handleTChange()
{
    opActive = false;
    plotTCurve();
	UI.batchSetStyleProperty(["spnCdfLabels", "spnInvLabels", "spnTInv", "spnTCdf"], "display", "none");
	UI.setStyleProperty(UI.getProperty("selTType", "value"), "display", "inline");
	UI.batchSetProperty(["spnTMsg", "spnTBoundMsg", "spnTResult"], "innerHTML", "");
}

function plotTCurve(bCheckBounds, bSilent)
{
    pageActive = true;
	UI.batchSetProperty(["spnTMsg", "spnTBoundMsg"], "innerHTML", "");
	var df = parseFloat(UI.getProperty("txtTDF","value"));
	var plotNormal = UI.getProperty("chkNormal","checked");

	UI.setStyleProperty(UI.getProperty("selTType", "value"), "display", "inline");
	UI.setStyleProperty("divPlot", "display", "block");
		
	if (!bCheckBounds)
	{
		graph.TDiagram(df, null, null, null, plotNormal);
		UI.setProperty("btnExport", "disabled", false);
		UI.setStyleProperty("divAnalysis", "display", "block");
		return true;
	}

	if (UI.getProperty("selTType", "value") == "spnTCdf")
	{
		var left = parseFloat(UI.getProperty("txtTCdfLeft", "value"));
		var right = parseFloat(UI.getProperty("txtTCdfRight", "value"));
		var value = parseFloat(UI.getProperty("txtTCdfSingle", "value"));
		var type = UI.getProperty("selTCdfType", "value");
	
		var bBetween = (type != "outside");
		
		if (type == "between" || type == "outside")
		{
			if (isNaN(left) || isNaN(right))
			{
				if (!bSilent) UI.setProperty("spnTBoundMsg", "innerHTML", "Region bounds must be numeric.");
				return false;
			}
			
			if (left > right)
			{
				if (!bSilent) UI.setProperty("spnTBoundMsg", "innerHTML", "Left bound must be less than right bound.");
				return false;
			}
		}
		else
		{
			if (isNaN(value))
			{
				if (!bSilent) UI.setProperty("spnTBoundMsg", "innerHTML", "Value must be numeric.");
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
		
		opActive = true;
		graph.TDiagram(df, left, right, bBetween, plotNormal,
		    UI.getProperty("chkCdfLabels", "checked"));
		UI.setStyleProperty("divAnalysis", "display", "block");
		UI.setProperty("btnExport", "disabled", false);
		return true;
	}
	else // inverse
	{
	    var area = parseFloat(UI.getProperty("txtTInvArea", "value"));
	    if (isNaN(area))
		{
			if (!bSilent) UI.setProperty("spnTBoundMsg", "innerHTML", "Area must be numeric.");
			return false;
		}
	    if (area > 1 || area < 0)
		{
			if (!bSilent) UI.setProperty("spnTBoundMsg", "innerHTML", "Area must be between 0 and 1.");
			return false;
		}

	    var type = UI.getProperty("selTInvType", "value");
	    
	    var value = jStat.studentt.inv(
	    			(type == "left" ? area :
	    				(type == "right" ? (1 - area) : (1 - area) / 2)
	    			), df);

        opActive = true;
        var bLabels = UI.getProperty("chkInvLabels", "checked");
	    if (type == "left")	    			
	    	graph.TDiagram(df, null, value, true, plotNormal, bLabels);
	    else if (type == "right")
	    	graph.TDiagram(df, value, null, true, plotNormal, bLabels);
	    else
	    	graph.TDiagram(df, value, -value, true, plotNormal, bLabels);
	    	
	    UI.setStyleProperty("divAnalysis", "display", "block");
	    UI.setProperty("btnExport", "disabled", false);
	    return true;
	}
}

function handleTCdfChange()
{
	plotTCurve();
	UI.setProperty("spnTResult", "innerHTML", "");
	var normtype = UI.getProperty("selTCdfType", "value");
	if (normtype == "left" || normtype == "right")
	{
		UI.setStyleProperty("spnTCdfRegionInput", "display", "none");
		UI.setStyleProperty("spnTCdfSingleInput", "display", "inline");

		if (UI.getProperty("txtTCdfSingle", "value").length)
		    calculateTCdf();
	}
	else
	{
		UI.setStyleProperty("spnTCdfSingleInput", "display", "none");
		UI.setStyleProperty("spnTCdfRegionInput", "display", "inline");

		if (UI.getProperty("txtTCdfLeft", "value").length &&
		    UI.getProperty("txtTCdfRight", "value").length)
		    calculateTCdf();
	}
}

function calculateTCdf()
{
	var type = UI.getProperty("selTCdfType", "value");

    if (type == "between")
    {
		if (!UI.getProperty("txtTCdfLeft", "value").length ||
		    !UI.getProperty("txtTCdfRight", "value").length)
            return;        
    }
    
	UI.setProperty("spnTResult", "innerHTML", "");
	if (plotTCurve(true))
	{
	    UI.setStyleProperty("spnCdfLabels", "display", "inline");
	    var df = parseFloat(UI.getProperty("txtTDF", "value"));
		var left = parseFloat(UI.getProperty("txtTCdfLeft", "value"));
		var right = parseFloat(UI.getProperty("txtTCdfRight", "value"));
		var value = parseFloat(UI.getProperty("txtTCdfSingle", "value"));

		if (type == "left") { left = NEG_INF; right = value; }	
		else if (type == "right") { right = POS_INF; left = value; }

	    var area = jStat.studentt.cdf(right, df) - jStat.studentt.cdf(left, df);
	    if (type == "outside") area = (1 - area);

	    UI.setProperty("spnTResult", "innerHTML",
	        util.probabilityHTML("Area", area)
	    );
	}
}

function calculateTInv()
{
	UI.setProperty("spnTResult", "innerHTML", "");
	if (plotTCurve(true))
	{
	    UI.setStyleProperty("spnInvLabels", "display", "inline");
	    var df = parseFloat(UI.getProperty("txtTDF", "value"));
	    var area = parseFloat(UI.getProperty("txtTInvArea", "value"));
	    var type = UI.getProperty("selTInvType", "value");
	    var value;
	    if (safenum.isZeroWithinTolerance(area - 1))
	    {
		    UI.setProperty("spnTResult", "innerHTML", 
		    	(type == "center" ? ("Range = -&infin; &le; t &le; &infin;")
		    		: ("Value = " +
		    			(type == "left" ? "" : "-") + "&infin;"		    			  
		    		)
		    	)
		    );
	    }
	    else
	    {
		    var value = jStat.studentt.inv(
		    			(type == "left" ? area :
		    				(type == "right" ? (1 - area) : (1 - area) / 2)
		    			), df);
		    
		    UI.setProperty("spnTResult", "innerHTML", 
		    	(type == "center" ? ("Range = " + format.formatNumber(value) + " &le; t &le; " +
		    						format.formatNumber(-value))
		    			  : ("Value = " + format.formatNumber(value))
		    	)
		    );
	    }
	}
}

UI.setOnLoad(initializePage);