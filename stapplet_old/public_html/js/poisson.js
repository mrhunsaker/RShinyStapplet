var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;
var pref = STAP.Preferences;

function calculatePoissonX()
{
    UI.batchSetProperty(["spnPoissonMsg", "spnPoissonXResult"], "innerHTML", "");

    if (util.trimString(UI.getProperty("txtPoissonX", "value")) == "") return;

    var mean = util.parseFloatOrFraction(UI.getProperty("txtPoissonMean", "value"));
    if (isNaN(mean) || (mean<0))
    {
        UI.setProperty("spnPoissonMsg", "innerHTML", "The mean must be a non-negative number.");
        return;
    }
    if (!IV.validateInputInt("txtPoissonX", 0, Number.POSITIVE_INFINITY, false,
        "spnPoissonMsg", "The number of successes", "must be a non-negative integer.")) return;
    var x = parseInt(UI.getProperty("txtPoissonX", "value"));
    
    var type = UI.getProperty("selPoissonX", "value");
    var result = 0;
    if (type == "lt")
    {
        if (x < 1)
        {
            UI.setProperty("spnPoissonMsg", "innerHTML", "There cannot be fewer than 0 successes.");
            return;
        }
    }

    if (type == "lt")
        result = jStat.poisson.cdf(x - 1, mean);
    else if (type == "le")
        result = jStat.poisson.cdf(x, mean);
    else if (type == "eq")
        result = jStat.poisson.pdf(x, mean);
    else if (type == "ge")
        result = 1 - jStat.poisson.cdf(x - 1, mean); // works even if x = 0
    else // type is "gt"
        result = 1 - jStat.poisson.cdf(x, mean);

	UI.setProperty("spnPoissonXResult", "innerHTML",
	    util.probabilityHTML("P(X " +
            (type == "eq" ? "= " : "&" + type + "; ") + x + ")", result)
    );
}

function calculatePoissonCdf()
{
    UI.batchSetProperty(["spnPoissonMsg", "spnPoissonCdfResult"], "innerHTML", "");
    
    if (util.trimString(UI.getProperty("txtPoissonCdfLeft", "value")) == "") return;
    if (util.trimString(UI.getProperty("txtPoissonCdfRight", "value")) == "") return;
    
    var mean = util.parseFloatOrFraction(UI.getProperty("txtPoissonMean", "value"));
    if (isNaN(mean) || (mean<0))
    {
        UI.setProperty("spnPoissonMsg", "innerHTML", "The mean must be a non-negative number.");
        return;
    }
    
    if (!IV.validateInputInt("txtPoissonCdfLeft", 0, Number.POSITIVE_INFINITY, false,
        "spnPoissonMsg", "The number of successes", "must be a non-negative integer.")) return;
    if (util.trimString(UI.getProperty("txtPoissonCdfRight", "value")).length == 0)
    {
    	document.getElementById("txtPoissonCdfRight").focus();
    	return;
    }
    if (!IV.validateInputInt("txtPoissonCdfRight", 0, Number.POSITIVE_INFINITY, false,
        "spnPoissonMsg", "The number of successes", "must be a non-negative integer.")) return;

    var leftBound = parseInt(UI.getProperty("txtPoissonCdfLeft", "value"));
    var rightBound = parseInt(UI.getProperty("txtPoissonCdfRight", "value"));
    if (rightBound <= leftBound)
    {
        UI.setProperty("spnPoissonMsg", "innerHTML", "Right bound must be greater than left bound.");
        return;
    }
    
    var result = jStat.poisson.cdf(rightBound, mean) - jStat.poisson.cdf(leftBound - 1, mean);  // works even if leftBound = 0

    UI.setProperty("spnPoissonCdfResult","innerHTML",
        util.probabilityHTML("P(" + leftBound + " &le; X &le; " + rightBound + ")", result));
}

function initializePage()
{
	UI.writeLinkColorOriginRules();
}

STAP.UIHandlers.setOnLoad(initializePage);