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

/* Do not generate &asymp; if you are doing a right or left side condition and the user has selected zero */
util.approxSymbolOverrideConditions = [
    function() {
        return (UI.getProperty("selX2CdfType","value") !== "between" &&
            safenum.isZeroWithinTolerance(
                parseFloat(UI.getProperty("txtX2CdfSingle", "value"))
            )
        );
    }
];

function initializePage()
{
	UI.batchSetStyleProperty(["divAnalysis", "spnX2CdfRegionInput", "spnX2Inv", "spnCdfLabels", "spnInvLabels", "spnX2Cdf", "divPlot"], "display", "none");
	graph = new STAP.SVGGraph("divPlot", null, 250);
	UI.writeLinkColorOriginRules();
}

function handleDFChange()
{
    var df = parseFloat(UI.getProperty("txtDF","value"));
    if (df < 1) UI.setProperty("txtDF", "value", "1");
    else if (df > 300) UI.setProperty("txtDF", "value", "300");

    if (pageActive)
    {
        if (!plotX2Curve(true, true))
        {
            plotX2Curve();
        	UI.batchSetProperty(["spnX2BoundMsg", "spnX2Result"], "innerHTML", "");
        }
        else if (opActive)
        {
        	if (UI.getProperty("selX2Type", "value") == "spnX2Cdf")
        	    calculateX2Cdf();
        	else
        	    calculateX2Inv();
        }
    }
}

function handleX2Change()
{
    opActive = false;
    plotX2Curve();
	UI.batchSetStyleProperty(["spnX2Inv", "spnX2Cdf", "spnCdfLabels", "spnInvLabels"], "display", "none");
	UI.setStyleProperty(UI.getProperty("selX2Type", "value"), "display", "inline");
	UI.batchSetProperty(["spnX2BoundMsg", "spnX2Result"], "innerHTML", "");
//	handleDFChange();
}

function plotX2Curve(bCheckBounds, bSilent)
{
    pageActive = true;
	UI.batchSetProperty(["spnX2Msg", "spnX2BoundMsg"], "innerHTML", "");
	var df = parseFloat(UI.getProperty("txtDF","value"));

	UI.setStyleProperty(UI.getProperty("selX2Type", "value"), "display", "inline");
	UI.setStyleProperty("divPlot", "display", "block");
	
	if (!bCheckBounds)
	{
		graph.X2Diagram(df, null, null, null);
		UI.setProperty("btnExport", "disabled", false);
		UI.setStyleProperty("divAnalysis", "display", "block");
		return true;
	}
	
	if (UI.getProperty("selX2Type", "value") == "spnX2Cdf")
	{
		var left = parseFloat(UI.getProperty("txtX2CdfLeft", "value"));
		var right = parseFloat(UI.getProperty("txtX2CdfRight", "value"));
		var value = parseFloat(UI.getProperty("txtX2CdfSingle", "value"));
		var type = UI.getProperty("selX2CdfType", "value");
	
		var bBetween = (type != "outside");
		
		if (type == "between" || type == "outside")
		{
			if (isNaN(left) || isNaN(right))
			{
				if (!bSilent) UI.setProperty("spnX2BoundMsg", "innerHTML", "Region bounds must be numeric.");
				return false;
			}
			
			if (left > right)
			{
				if (!bSilent) UI.setProperty("spnX2BoundMsg", "innerHTML", "Left bound must be less than right bound.");
				return false;
			}
		}
		else
		{
			if (isNaN(value))
			{
				if (!bSilent) UI.setProperty("spnX2BoundMsg", "innerHTML", "Value must be numeric.");
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
		graph.X2Diagram(df, left, right, bBetween, UI.getProperty("chkCdfLabels", "checked"));
		UI.setStyleProperty("divAnalysis", "display", "block");
		UI.setProperty("btnExport", "disabled", false);
		return true;
	}
	else // inverse
	{
	    var area = parseFloat(UI.getProperty("txtX2InvArea", "value"));
	    if (isNaN(area))
		{
			if (!bSilent) UI.setProperty("spnX2BoundMsg", "innerHTML", "Area must be numeric.");
			return false;
		}
	    if (area > 1 || area < 0)
		{
			if (!bSilent) UI.setProperty("spnX2BoundMsg", "innerHTML", "Area must be between 0 and 1.");
			return false;
		}

	    var type = UI.getProperty("selX2InvType", "value");
	    var bLabels = UI.getProperty("chkInvLabels", "checked");
	    opActive = true;
	    if (type != "center")
	    {
    	    var value = jStat.chisquare.inv(
	    			(type == "left" ? area : (1 - area)), df);

    	    if (type == "left")	    			
    	    	graph.X2Diagram(df, null, value, true, bLabels);
    	    else
    	    	graph.X2Diagram(df, value, null, true, bLabels);
	    }
	    else
	    {
	        var leftVal = jStat.chisquare.inv((1 - area) / 2, df);
	        var rightVal = jStat.chisquare.inv(1 - (1 - area) / 2, df);
	    	graph.X2Diagram(df, leftVal, rightVal, true, bLabels);
	    }
	    
	    UI.setStyleProperty("divAnalysis", "display", "block");
	    UI.setProperty("btnExport", "disabled", false);
	    return true;
	}
}

function handleX2CdfChange()
{
	plotX2Curve();
	UI.setProperty("spnX2Result", "innerHTML", "");
	var type = UI.getProperty("selX2CdfType", "value");
	if (type == "left" || type == "right")
	{
		UI.setStyleProperty("spnX2CdfRegionInput", "display", "none");
		UI.setStyleProperty("spnX2CdfSingleInput", "display", "inline");

		if (UI.getProperty("txtX2CdfSingle", "value").length)
		    calculateX2Cdf();
	}
	else
	{
		UI.setStyleProperty("spnX2CdfSingleInput", "display", "none");
		UI.setStyleProperty("spnX2CdfRegionInput", "display", "inline");

		if (UI.getProperty("txtX2CdfLeft", "value").length &&
		    UI.getProperty("txtX2CdfRight", "value").length)
		    calculateX2Cdf();
	}
}

function calculateX2Cdf()
{
	var type = UI.getProperty("selX2CdfType", "value");

    if (type == "between")
    {
        if (!UI.getProperty("txtX2CdfRight", "value").length ||
            !UI.getProperty("txtX2CdfLeft", "value").length)
        return;
    }

	UI.batchSetProperty(["spnX2BoundMsg", "spnX2Result"], "innerHTML", "");
	if (plotX2Curve(true))
	{
        UI.setStyleProperty("spnCdfLabels", "display", "inline");
	    var df = parseFloat(UI.getProperty("txtDF", "value"));
		var left = parseFloat(UI.getProperty("txtX2CdfLeft", "value"));
		var right = parseFloat(UI.getProperty("txtX2CdfRight", "value"));
		var value = parseFloat(UI.getProperty("txtX2CdfSingle", "value"));

		if (type == "left") { left = 0; right = value; }	
		else if (type == "right") { right = POS_INF; left = value; }

	    var area = jStat.chisquare.cdf(right, df) - jStat.chisquare.cdf(left, df);

	    UI.setProperty("spnX2Result", "innerHTML",
	        util.probabilityHTML("Area", area)
	    );
	}
}

function calculateX2Inv()
{
	UI.setProperty("spnX2Result", "innerHTML", "");
	if (plotX2Curve(true))
	{
	    UI.setStyleProperty("spnInvLabels", "display", "inline");
	    var df = parseFloat(UI.getProperty("txtDF", "value"));
	    var area = parseFloat(UI.getProperty("txtX2InvArea", "value"));
	    var type = UI.getProperty("selX2InvType", "value");
	    if (safenum.isZeroWithinTolerance(area - 1))
	    {
		    UI.setProperty("spnX2Result", "innerHTML", 
		    	(type == "center" ? ("Range = -&infin; &le; &chi;&sup2; &le; &infin;")
		    		: ("Value = " +
		    			(type == "left" ? "" : "-") + "&infin;"		    			  
		    		)
		    	)
		    );
	    }
	    else if (type != "center")
	    {
		    var value = jStat.chisquare.inv(
		    			(type == "left" ? area : (1 - area)), df);

		    UI.setProperty("spnX2Result", "innerHTML", "Value = " + format.formatNumber(value));
	    }
	    else
	    {
	        var leftVal = jStat.chisquare.inv((1 - area) / 2, df);
	        var rightVal = jStat.chisquare.inv(1 - (1 - area) / 2, df);
		    UI.setProperty("spnX2Result", "innerHTML", 
		    	"Range = " + format.formatNumber(leftVal) + " &le; &chi;&sup2; &le; " +
		    						format.formatNumber(rightVal));
	    }
	}
}

UI.setOnLoad(initializePage);