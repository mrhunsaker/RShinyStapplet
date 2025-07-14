var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var pageActive = false;

const POS_INF = Math.pow(10, 9);
const NEG_INF = -POS_INF;

function initializePage()
{
	UI.batchSetStyleProperty(["divAnalysis", "spnTCdfSingleInput", "spnTInv"], "display", "none");
	graph = new STAP.SVGGraph("divPlot", null, 250);
	UI.writeLinkColorOriginRules();
}

function handleDFChange()
{
    var df = parseFloat(UI.getProperty("txtTDF","value"));
    if (df <= 0) UI.setProperty("txtTDF", "value", "1");
    else if (df > 300) UI.setProperty("txtTDF", "value", "300");

    var opActive = UI.getProperty("spnTResult", "innerHTML").length > 0; 
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
	UI.batchSetStyleProperty(["spnTInv", "spnTCdf"], "display", "none");
	UI.setStyleProperty(UI.getProperty("selTType", "value"), "display", "inline");
	UI.batchSetProperty(["spnTMsg", "spnTBoundMsg", "spnTResult"], "innerHTML", "");
}

function plotTCurve(bCheckBounds, bSilent)
{
    pageActive = true;
	UI.batchSetProperty(["spnTMsg", "spnTBoundMsg"], "innerHTML", "");
	var df = parseFloat(UI.getProperty("txtTDF","value"));
	var plotNormal = UI.getProperty("chkNormal","checked");
	
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
		
		graph.TDiagram(df, left, right, bBetween, plotNormal);
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

	    if (type == "left")	    			
	    	graph.TDiagram(df, null, value, true, plotNormal);
	    else if (type == "right")
	    	graph.TDiagram(df, value, null, true, plotNormal);
	    else
	    	graph.TDiagram(df, value, -value, true, plotNormal);
	    	
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
	}
	else
	{
		UI.setStyleProperty("spnTCdfSingleInput", "display", "none");
		UI.setStyleProperty("spnTCdfRegionInput", "display", "inline");
	}
}

function calculateTCdf()
{
	UI.setProperty("spnTResult", "innerHTML", "");
	if (plotTCurve(true))
	{
	    var df = parseFloat(UI.getProperty("txtTDF", "value"));
		var left = parseFloat(UI.getProperty("txtTCdfLeft", "value"));
		var right = parseFloat(UI.getProperty("txtTCdfRight", "value"));
		var value = parseFloat(UI.getProperty("txtTCdfSingle", "value"));
		var type = UI.getProperty("selTCdfType", "value");

		if (type == "left") { left = NEG_INF; right = value; }	
		else if (type == "right") { right = POS_INF; left = value; }

	    var area = jStat.studentt.cdf(right, df) - jStat.studentt.cdf(left, df);
	    if (type == "outside") area = (1 - area);
	    
	    UI.setProperty("spnTResult", "innerHTML", "Area = " + format.formatProportion(area, 4));				
	}
}

function calculateTInv()
{
	UI.setProperty("spnTResult", "innerHTML", "");
	if (plotTCurve(true))
	{
	    var df = parseFloat(UI.getProperty("txtTDF", "value"));
	    var area = parseFloat(UI.getProperty("txtTInvArea", "value"));
	    var type = UI.getProperty("selTInvType", "value");
	    var value;
	    if (safenum.isZeroWithinTolerance(area - 1))
	    {
		    UI.setProperty("spnTResult", "innerHTML", 
		    	(type == "center" ? ("Range = -&infin; &le; x &le; &infin;")
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
		    	(type == "center" ? ("Range = " + format.formatNumber(value) + " &le; x &le; " +
		    						format.formatNumber(-value))
		    			  : ("Value = " + format.formatNumber(value))
		    	)
		    );
	    }
	}
}

UI.setOnLoad(initializePage);