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
var fromCallback = false;
var pageActive = false;

/* Do not generate &asymp; if any of the following are true:
1) p = 0 or 1
2) the left bound is zero and the right bound is n
*/
util.approxSymbolOverrideConditions = [
    function() {
        var p = parseFloat(UI.getProperty("txtBinomialP", "value"));
        return (safenum.isZeroWithinTolerance(p) ||
                safenum.isZeroWithinTolerance(p - 1));
    },
    function() {
        return (UI.getProperty("txtBinomialCdfLeft", "value").length &&
            parseInt(UI.getProperty("txtBinomialCdfLeft", "value")) == 0 &&
            parseInt(UI.getProperty("txtBinomialCdfRight", "value")) == parseInt(UI.getProperty("txtBinomialN", "value"))
        );
    }
];

function _setfn(ctlid, val)
{
    fromCallback = true;
    UI.setProperty(ctlid, "value", val);
}

var bOperationLive = false;

function selectionCallback(min, max, prob)
{
    if (bOperationLive) return;
    
    UI.batchSetProperty(["spnBinomialMsg", "spnBinomialBoundMsg"], "innerHTML", "");
    
	var numtext = (safenum.isZeroWithinTolerance(prob, 4) ? "&asymp; 0"			
				: " = " + format.formatProportion(prob, 4));
    if (safenum.isZeroWithinTolerance(min + 1))
    {
        _setfn("txtBinomialX", "");
        _setfn("txtBinomialCdfLeft", "");
        _setfn("txtBinomialCdfRight", "");
		UI.setProperty("spnPdfResult", "innerHTML", "");
		UI.setProperty("spnCdfResult", "innerHTML", "");
    }
	else
	{
	    var pstr = util.probabilityHTML(min == max ? "P(X = " + min + ")" :
	        "P("+min+" &le; X &le; "+max+")", prob);

	    if (max == min)
    	{
            _setfn("txtBinomialX", "" + min);
            _setfn("txtBinomialCdfLeft", "");
            _setfn("txtBinomialCdfRight", "");
    	    UI.setProperty("spnCdfResult", "innerHTML", "");
    		UI.setProperty("spnPdfResult", "innerHTML", pstr);
    	}
	    else
    	{
	        _setfn("txtBinomialX", "");
	        _setfn("txtBinomialCdfLeft", "" + min);
    	    _setfn("txtBinomialCdfRight", "" + max);
    	    UI.setProperty("spnPdfResult", "innerHTML", "");
    		UI.setProperty("spnCdfResult", "innerHTML", pstr);
    	}
	}
	fromCallback = false;
}

function calculateBinomialX()
{
    if (fromCallback) { fromCallback = false; return true; }
    bOperationLive = true;
    
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

    var xupd = function(min, max, prob)
    {
        var pstr = util.probabilityHTML(min == max ? "P(X = " + min + ")" :
            "P("+min+" &le; X &le; "+max+")", prob);
    
        _setfn("txtBinomialCdfLeft", "");
        _setfn("txtBinomialCdfRight", "");
        UI.setProperty("spnCdfResult", "innerHTML", "");
    	
    	fromCallback = false;
    };

    if (type == "lt")
    {
        graph.forceSelectionRectangle(0, x - 1);
    	UI.setProperty("spnPdfResult", "innerHTML",
            util.probabilityHTML("P(X &lt; " + x + ")", 
                jStat.binomial.cdf(x - 1, n, p)));
    }
    else if (type == "le")
    {
        graph.forceSelectionRectangle(0, x);
    	UI.setProperty("spnPdfResult", "innerHTML",
            util.probabilityHTML("P(X &le; " + x + ")", 
                jStat.binomial.cdf(x, n, p)));
    }
    else if (type == "eq")
    {
        graph.forceSelectionRectangle(x, x);
    	UI.setProperty("spnPdfResult", "innerHTML",
            util.probabilityHTML("P(X = " + x + ")", 
                jStat.binomial.pdf(x, n, p)));
    }
    else if (type == "ge")
    {
        graph.forceSelectionRectangle(x, n);
    	UI.setProperty("spnPdfResult", "innerHTML",
            util.probabilityHTML("P(X &ge; " + x + ")", 
                1 - jStat.binomial.cdf(x - 1, n, p)));
    }
    else // type is "gt"
    {
        graph.forceSelectionRectangle(x + 1, n);
    	UI.setProperty("spnPdfResult", "innerHTML",
            util.probabilityHTML("P(X &gt; " + x + ")", 
                1 - jStat.binomial.cdf(x, n, p)));
    }
    UI.setProperty("spnCdfResult", "innerHTML", "");
    bOperationLive = false;
}

function calculateBinomialCdf()
{
    if (fromCallback) { fromCallback = false; return true; }

    bOperationLive = true;
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

    var leftBound = parseInt(UI.getProperty("txtBinomialCdfLeft", "value"));
    var rightBound = parseInt(UI.getProperty("txtBinomialCdfRight", "value"));
    if (rightBound <= leftBound)
    {
        UI.setProperty("spnBinomialBoundMsg", "innerHTML", "Right bound must be greater than left bound.");
        return;
    }

    graph.forceSelectionRectangle(leftBound, rightBound);
    UI.setProperty("spnPdfResult", "innerHTML", "");
    UI.setProperty("spnCdfResult", "innerHTML",
        util.probabilityHTML("P(" + leftBound + " &le; X &le; " + rightBound +  ")",
            jStat.binomial.cdf(rightBound, n, p) -
            jStat.binomial.cdf(leftBound - 1, n, p)));
    bOperationLive = false;
}

function handleXTypeChange()
{
    // If there is a current result displayed in the single entry spot, go ahead and recalculate the probability; otherwise, ignore
    if (UI.getProperty("spnPdfResult", "innerHTML").length)
        calculateBinomialX();
}

function beginAnalysis()
{
    pageActive = true;
	UI.setStyleProperty("btnNormal", "display", "inline");
    plotBinomial();
}

function plotBinomial(bToggle)
{
    if (!pageActive) return;
    
    if (!IV.validateInputInt("txtBinomialN", 0, Number.POSITIVE_INFINITY, true,
        "spnBinomialMsg", "n", "must be positive.")) return false;

    var n = parseInt(UI.getProperty("txtBinomialN", "value"));
    var p = util.parseFloatOrFraction(UI.getProperty("txtBinomialP", "value"));
    if (isNaN(p) || (p<0) || (p>1))
    {
        UI.setProperty("spnBinomialMsg", "innerHTML", "p must be a number between 0 and 1.");
        return false;
    }

    UI.batchSetProperty(["txtBinomialX", "txtBinomialCdfLeft", "txtBinomialCdfRight"], "max", "" + n);
	graph.binomialHistogram(n, p, selectionCallback);
	
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
	UI.setStyleProperty("btnNormal", "display", "none");
	UI.writeLinkColorOriginRules();
}

STAP.UIHandlers.setOnLoad(initializePage);