var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var pageActive = false;
var graph = null;
var graph = null;

function initializePage()
{
    UI.batchSetStyleProperty(["divMean", "divPlot"], "display", "none");
	graph = new STAP.SVGGraph("divPlot", null, 250);
	UI.writeLinkColorOriginRules();
}

function handleTypeChange()
{
    pageActive = false;
    if (UI.getProperty("selType", "value") == "Prop")
    {
        UI.setStyleProperty("divMean", "display", "none");
        UI.setStyleProperty("divProp", "display", "block");
    }
    else
    {
        UI.setStyleProperty("divProp", "display", "none");
        UI.setStyleProperty("divMean", "display", "block");
    }
    UI.setStyleProperty("divPlot", "display", "none");
	UI.batchSetProperty(["spnErrorMsg", "spnResult"], "innerHTML", "");
    UI.batchSetProperty(["txtHypMean", "txtTrueMean", "txtStdev", "txtHypProp", "txtTrueProp", "txtN"], "value", "");
    UI.setProperty("chkShowFail", "checked", false);
    UI.batchSetProperty(["selMeanAlt", "selPropAlt", "selPlot"], "selectedIndex", 0);
}

function checkRanges()
{
    var check = function(id, lo, hi, name, msg, bExcl)
    {
        var val = parseFloat(UI.getProperty(id, "value"));
        if (!safenum.isBetween(val, lo, hi, bExcl))
        {
            UI.setProperty("spnErrorMsg", "innerHTML", name + " must be " +
                (msg ? msg : "between " + lo + " and " + hi) + ".");
            return false;
        }
        else
            return true;
    };

    if (UI.getProperty("selType", "value") == "Prop")
    {
        if (!check("txtHypProp", 0, 1, "Null proportion")) return false;
        if (!check("txtTrueProp", 0, 1, "True proportion")) return false;
    }
    else
        if (!check("txtStdev", 0, Number.POSITIVE_INFINITY, "Standard deviation", "non-negative")) return false;

    if (!check("txtN", 0, Number.POSITIVE_INFINITY, "Sample size", "positive", true)) return false;
    if (!check("txtAlpha", 0, 1, "Significance level &alpha;")) return false;

    return true;
}

function doAnalysis()
{
	UI.batchSetProperty(["spnErrorMsg", "spnResult"], "innerHTML", "");
    if (!checkRanges()) return;
    pageActive = true;
    var type = UI.getProperty("selType", "value");
    var nullParam = parseFloat(UI.getProperty("txtHyp" + type, "value"));
    var trueParam = parseFloat(UI.getProperty("txtTrue" + type, "value"));
    var alpha = parseFloat(UI.getProperty("txtAlpha", "value")); 
    var n = parseInt(UI.getProperty("txtN", "value"));
	UI.batchSetProperty(["spn" + type + "ErrorMsg",
	    "spn" + type + "Result"], "innerHTML", "");
    var alt = parseInt(UI.getProperty("sel" + type + "Alt", "value")); 
    var plot = parseInt(UI.getProperty("selPlot", "value"));
    var area = 
        (type == "Prop"
        ? graph.powerDiagramProportion(nullParam, trueParam, n, alpha, alt, plot, UI.getProperty("chkShowFail", "checked"))
        : graph.powerDiagramMean(nullParam, trueParam,
            parseFloat(UI.getProperty("txtStdev", "value")), n, alpha, alt, plot, UI.getProperty("chkShowFail", "checked"))
        );

    UI.setProperty("spnResult", "innerHTML", "The null sampling distribution is shown with a dashed line.<BR>The true sampling distribution is shown with a solid line.<BR><B>" +
        (plot == 1 ? "&alpha; = " + format.formatProportion(parseFloat(UI.getProperty("txtAlpha", "value"))) :
        (plot == 2 ? "&beta; = " : "Power = ") + format.formatProportion(area)) + "</B>");
    UI.setStyleProperty("divPlot", "display", "block");
}

function handleChange()
{
    if (pageActive) doAnalysis();
}

UI.setOnLoad(initializePage);