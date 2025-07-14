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
const MAX_GRAPH_DF = 1000;

/* Do not generate &asymp; if you are doing a right or left side condition and the user has selected zero */
util.approxSymbolOverrideConditions = [
    function() {
        return (UI.getProperty("selFCdfType","value") !== "between" &&
            safenum.isZeroWithinTolerance(
                parseFloat(UI.getProperty("txtFCdfSingle", "value"))
            )
        );
    }
];

function initializePage()
{
	UI.batchSetStyleProperty(["divAnalysis", "spnFCdfRegionInput", "spnFInv", "spnCdfLabels", "spnInvLabels", "spnFCdf", "divPlot"], "display", "none");
	graph = new STAP.SVGGraph("divPlot", null, 250);
	UI.writeLinkColorOriginRules();
}

function handleDFChange()
{
    var dfFunc = function(id)
    {
        var df = parseFloat(UI.getProperty(id,"value"));
        if (df < 1) UI.setProperty(id, "value", "1");
    };

    dfFunc("txtNumDF");
    dfFunc("txtDenomDF");

    if (pageActive)
    {
        if (!plotFCurve(true, true))
        {
            plotFCurve();
        	UI.batchSetProperty(["spnFBoundMsg", "spnFResult"], "innerHTML", "");
        }
        else if (opActive)
        {
        	if (UI.getProperty("selFType", "value") == "spnFCdf")
        	    calculateFCdf();
        	else
        	    calculateFInv();
        }
    }
}

function handleFChange()
{
    opActive = false;
    plotFCurve();
	UI.batchSetStyleProperty(["spnFInv", "spnFCdf", "spnCdfLabels", "spnInvLabels"], "display", "none");
	UI.setStyleProperty(UI.getProperty("selFType", "value"), "display", "inline");
	UI.batchSetProperty(["spnFBoundMsg", "spnFResult"], "innerHTML", "");
}

function plotFCurve(bCheckBounds, bSilent)
{
    pageActive = true;
	UI.batchSetProperty(["spnFMsg", "spnFBoundMsg"], "innerHTML", "");
	var numdf = parseFloat(UI.getProperty("txtNumDF","value"));
	var denomdf = parseFloat(UI.getProperty("txtDenomDF","value"));
    var gnumdf = Math.min(numdf, MAX_GRAPH_DF);
    var gdenomdf = Math.min(denomdf, MAX_GRAPH_DF);
    if (numdf > MAX_GRAPH_DF || denomdf > MAX_GRAPH_DF)
        UI.setProperty("spnFMsg", "innerHTML", "WARNING: Graph scale may be inaccurate for large df.");

	UI.setStyleProperty(UI.getProperty("selFType", "value"), "display", "inline");
	UI.setStyleProperty("divPlot", "display", "block");
	
	if (!bCheckBounds)
	{
		graph.FDiagram(gnumdf, gdenomdf, null, null, null);
		UI.setProperty("btnExport", "disabled", false);
		UI.setStyleProperty("divAnalysis", "display", "block");
		return true;
	}
	
	if (UI.getProperty("selFType", "value") == "spnFCdf")
	{
		var left = parseFloat(UI.getProperty("txtFCdfLeft", "value"));
		var right = parseFloat(UI.getProperty("txtFCdfRight", "value"));
		var value = parseFloat(UI.getProperty("txtFCdfSingle", "value"));
		var type = UI.getProperty("selFCdfType", "value");
	
		var bBetween = (type != "outside");
		
		if (type == "between" || type == "outside")
		{
			if (isNaN(left) || isNaN(right))
			{
				if (!bSilent) UI.setProperty("spnFBoundMsg", "innerHTML", "Region bounds must be numeric.");
				return false;
			}
			
			if (left > right)
			{
				if (!bSilent) UI.setProperty("spnFBoundMsg", "innerHTML", "Left bound must be less than right bound.");
				return false;
			}
		}
		else
		{
			if (isNaN(value))
			{
				if (!bSilent) UI.setProperty("spnFBoundMsg", "innerHTML", "Value must be numeric.");
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
		graph.FDiagram(gnumdf, gdenomdf, left, right, bBetween, UI.getProperty("chkCdfLabels", "checked"));
		UI.setStyleProperty("divAnalysis", "display", "block");
		UI.setProperty("btnExport", "disabled", false);
		return true;
	}
	else // inverse
	{
	    var area = parseFloat(UI.getProperty("txtFInvArea", "value"));
	    if (isNaN(area))
		{
			if (!bSilent) UI.setProperty("spnFBoundMsg", "innerHTML", "Area must be numeric.");
			return false;
		}
	    if (area > 1 || area < 0)
		{
			if (!bSilent) UI.setProperty("spnFBoundMsg", "innerHTML", "Area must be between 0 and 1.");
			return false;
		}

	    var type = UI.getProperty("selFInvType", "value");
	    
	    opActive = true;
	    var bLabels = UI.getProperty("chkInvLabels", "checked");
	    
	    if (type != "center")
	    {
    	    var value = jStat.centralF.inv(
	    			(type == "left" ? area : (1 - area)), numdf, denomdf);

    	    if (type == "left")	    			
    	    	graph.FDiagram(gnumdf, gdenomdf, null, value, true, bLabels);
    	    else
    	    	graph.FDiagram(gnumdf, gdenomdf, value, null, true, bLabels);
	    }
	    else
	    {
	        var leftVal = jStat.centralF.inv((1 - area) / 2, numdf, denomdf);
	        var rightVal = jStat.centralF.inv(1 - (1 - area) / 2, numdf, denomdf);
	    	graph.FDiagram(gnumdf, gdenomdf, leftVal, rightVal, true, bLabels);
	    }
	    
	    UI.setStyleProperty("divAnalysis", "display", "block");
	    UI.setProperty("btnExport", "disabled", false);
	    return true;
	}
}

function handleFCdfChange()
{
	plotFCurve();
	UI.setProperty("spnFResult", "innerHTML", "");
	var type = UI.getProperty("selFCdfType", "value");
	if (type == "left" || type == "right")
	{
		UI.setStyleProperty("spnFCdfRegionInput", "display", "none");
		UI.setStyleProperty("spnFCdfSingleInput", "display", "inline");
		
		if (UI.getProperty("txtFCdfSingle", "value").length)
		    calculateFCdf();
	}
	else
	{
		UI.setStyleProperty("spnFCdfSingleInput", "display", "none");
		UI.setStyleProperty("spnFCdfRegionInput", "display", "inline");

		if (UI.getProperty("txtFCdfLeft", "value").length &&
		    UI.getProperty("txtFCdfRight", "value").length)
		    calculateFCdf();
	}
}

function calculateFCdf()
{
	var type = UI.getProperty("selFCdfType", "value");

    if (type == "between")
    {
        if (!UI.getProperty("txtFCdfRight", "value").length ||
            !UI.getProperty("txtFCdfLeft", "value").length)
        return;
    }
    
	UI.batchSetProperty(["spnFBoundMsg", "spnFResult"], "innerHTML", "");
	if (plotFCurve(true))
	{
	    UI.setStyleProperty("spnCdfLabels", "display", "inline");
	    var numdf = parseFloat(UI.getProperty("txtNumDF", "value"));
	    var denomdf = parseFloat(UI.getProperty("txtDenomDF", "value"));
		var left = parseFloat(UI.getProperty("txtFCdfLeft", "value"));
		var right = parseFloat(UI.getProperty("txtFCdfRight", "value"));
		var value = parseFloat(UI.getProperty("txtFCdfSingle", "value"));

		if (type == "left") { left = 0; right = value; }	
		else if (type == "right") { right = POS_INF; left = value; }

	    var area = jStat.centralF.cdf(right, numdf, denomdf) - jStat.centralF.cdf(left, numdf, denomdf);

	    UI.setProperty("spnFResult", "innerHTML",
	        util.probabilityHTML("Area", area)
	    );
	}
}

function calculateFInv()
{
	UI.setProperty("spnFResult", "innerHTML", "");
	if (plotFCurve(true))
	{
	    UI.setStyleProperty("spnInvLabels", "display", "inline");
	    var numdf = parseFloat(UI.getProperty("txtNumDF", "value"));
	    var denomdf = parseFloat(UI.getProperty("txtDenomDF", "value"));
	    var area = parseFloat(UI.getProperty("txtFInvArea", "value"));
	    var type = UI.getProperty("selFInvType", "value");
	    if (safenum.isZeroWithinTolerance(area - 1))
	    {
		    UI.setProperty("spnFResult", "innerHTML", 
		    	(type == "center" ? ("Range = -&infin; &le; x &le; &infin;")
		    		: ("Value = " +
		    			(type == "left" ? "" : "-") + "&infin;"		    			  
		    		)
		    	)
		    );
	    }
	    else if (type != "center")
	    {
		    var value = jStat.centralF.inv(
		    			(type == "left" ? area : (1 - area)), numdf, denomdf);

		    UI.setProperty("spnFResult", "innerHTML", "Value = " + format.formatNumber(value));
	    }
	    else
	    {
	        var leftVal = jStat.centralF.inv((1 - area) / 2, numdf, denomdf);
	        var rightVal = jStat.centralF.inv(1 - (1 - area) / 2, numdf, denomdf);
		    UI.setProperty("spnFResult", "innerHTML", 
		    	"Range = " + format.formatNumber(leftVal) + " &le; x &le; " +
		    						format.formatNumber(rightVal));
	    }
	}
}

UI.setOnLoad(initializePage);