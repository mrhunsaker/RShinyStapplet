var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;
var pref = STAP.Preferences;

var graph = null;
var plotNormal = false;

function calculateBinomialX()
{
    UI.batchSetProperty(["spnBinomialMsg", "spnBinomialBoundMsg"], "innerHTML", "");
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
    if (type == "lt")
    {
        if (x < 1)
        {
            UI.setProperty("spnBinomialMsg", "innerHTML", "There cannot be fewer than 0 successes.");
            return;
        }
    }
    else if (type == "gt")
    {
        if (x >= n)
        {
            UI.setProperty("spnBinomialMsg", "innerHTML",
                "There cannot be more than " + n + " successes.");
            return;
        }
    }

    if (!plotBinomial()) return;

    if (type == "lt")
    {
        result = jStat.binomial.cdf(x - 1, n, p);
        graph.forceSelectionRectangle(0, x - 1);
    }
    else if (type == "le")
    {
        result = jStat.binomial.cdf(x, n, p);
        graph.forceSelectionRectangle(0, x);
    }
    else if (type == "eq")
    {
        result = jStat.binomial.pdf(x, n, p);
        graph.forceSelectionRectangle(x, x);
    }
    else if (type == "ge")
    {
        result = 1 - jStat.binomial.cdf(Math.max(0, x - 1), n, p);
        graph.forceSelectionRectangle(x, n);
    }
    else // type is "gt"
    {
        result = 1 - jStat.binomial.cdf(x, n, p);
        graph.forceSelectionRectangle(x + 1, n);
    }
    
    UI.batchSetProperty(["txtBinomialCdfLeft", "txtBinomialCdfRight"], "value", "");
}

function calculateBinomialCdf()
{
    UI.batchSetProperty(["spnBinomialMsg", "spnBinomialBoundMsg"], "innerHTML", "");
    if (!IV.validateInputInt("txtBinomialN", 0, Number.POSITIVE_INFINITY, true,
        "spnBinomialMsg", "n", "must be positive.")) return;
        
    var n = parseInt(UI.getProperty("txtBinomialN", "value"));
    if (!IV.validateInputInt("txtBinomialCdfLeft", 0, n, false,
        "spnBinomialBoundMsg", "The number of successes", "must be between 0 and " + n + ".")) return;
    if (util.trimString(UI.getProperty("txtBinomialCdfRight", "value")).length == 0)
    {
    	document.getElementById("txtBinomialCdfRight").focus();
    	return;
    }
    if (!IV.validateInputInt("txtBinomialCdfRight", 0, n, false,
        "spnBinomialBoundMsg", "The number of successes", "must be between 0 and " + n + ".")) return;
    var p = util.parseFloatOrFraction(UI.getProperty("txtBinomialP", "value"));
    if (isNaN(p) || (p<0) || (p>1))
    {
        UI.setProperty("spnBinomialMsg", "innerHTML", "p must be a number between 0 and 1.");
        return;
    }

	if (!plotBinomial()) return;

    var leftBound = parseInt(UI.getProperty("txtBinomialCdfLeft", "value"));
    var rightBound = parseInt(UI.getProperty("txtBinomialCdfRight", "value"));
    if (rightBound < leftBound)
    {
        UI.setProperty("spnBinomialBoundMsg", "innerHTML", "Right bound must be greater than left bound.");
        return;
    }
    
    var result = 0;
    graph.forceSelectionRectangle(leftBound, rightBound);

    UI.setProperty("txtBinomialX", "value", "");
}

function plotBinomial(bToggle)
{
    if (!IV.validateInputInt("txtBinomialN", 0, Number.POSITIVE_INFINITY, true,
        "spnBinomialMsg", "n", "must be positive.")) return false;

    var n = parseInt(UI.getProperty("txtBinomialN", "value"));
    var p = util.parseFloatOrFraction(UI.getProperty("txtBinomialP", "value"));
    if (isNaN(p) || (p<0) || (p>1))
    {
        UI.setProperty("spnBinomialMsg", "innerHTML", "p must be a number between 0 and 1.");
        return false;
    }

	graph.binomialHistogram(n, p);
	
    // Render a table programmatically
    var tableHTML = "<TABLE><TR><TH>Mean</TH><TH>Standard Deviation</TH></TR>" +
    		"<TR><TD>" + format.formatNumber(n * p) + "</TD><TD>" +
    		format.formatNumber(Math.sqrt(n * p * (1 - p))) + "</TD></TR></TABLE>";
    UI.setProperty("spnTblParameters", "innerHTML", tableHTML);
	
	if (bToggle)
		plotNormal = !plotNormal;
	if (plotNormal)
	{
		graph.plotTopCurve(util.normalCurve(n * p, Math.sqrt(n * p * (1 - p))),n);
		UI.setProperty("btnNormal", "value", "Hide normal curve");
	}
	else
	{
		graph.clearTopCurve();
		UI.setProperty("btnNormal", "value", "Show normal curve");
	}
	return true;
}

function initializePage()
{
	graph = new STAP.SVGGraph("divPlot");
	UI.writeLinkColorOriginRules();
}

STAP.UIHandlers.setOnLoad(initializePage);