var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var pageActive = false;
var popGraph = null;
var oneSampleGraph = null;
var approxDistGraph = null;
var popType = null;
var randFcn = null;
var popMean = null;
var popSD = null;
var sampleSize = null;
var samplingDistData = [];
var lastSample = null;

const uniformDist = new STAP.DiscreteProbabilityDistribution([1, 3, 5, 7, 9], [0.2, 0.2, 0.2, 0.2, 0.2]);

const samplePlotHeight = 120;

function initializePage()
{
	UI.batchSetStyleProperty(["divStep1CatOptions", "divStep1Results", "divStep2", "divStep2Results", "divStep3", "divApproxDistPlot", "divStep3Model"], "display", "none");
	popGraph = new STAP.SVGGraph("divPopPlot", 600, 200);
	oneSampleGraph = new STAP.SVGGraph("divOneSamplePlot", 600, samplePlotHeight);
	UI.setStyleProperty("divOneSamplePlot", "height", samplePlotHeight + "px");
	approxDistGraph = new STAP.SVGGraph("divApproxDistPlot", 600, 300);
	UI.writeLinkColorOriginRules();
	step1();
}

function resetAll()
{
    if (!confirm("Are you sure?\nThis will clear all data and start the activity over.")) return;
    
    pageActive = false;
	UI.batchSetStyleProperty(["divStep1CatOptions", "divStep1Results", "divStep2", "divStep2Results", "divStep3", "divStep3Model", "divApproxDistPlot"], "display", "none");
	UI.setStyleProperty("btn2", "display", "inline");
    UI.batchSetProperty(["spnPopParams", "spnStep1ErrorMsg"], "innerHTML", "");
    UI.setProperty("chkNormal", "checked", false);
    UI.setProperty("selSampDist", "selectedIndex", 0);
    samplingDistData = [];
    step1Change();
}

function step1PropChange()
{
    clearSamples();
    step1();
}

function clearSamples(bKeepSample)
{
    if (pageActive)
    {
        if (!bKeepSample && !IV.validateInputInt("txtSampleSize", 1, Number.POSITIVE_INFINITY, false, "spnStep2ErrorMsg", "Sample size", "must be a positive integer."))
            return;
                
        if (!bKeepSample) oneSampleGraph.clearGraph();
        approxDistGraph.clearGraph();
        UI.setStyleProperty("divApproxDistPlot", "display", "none");
        UI.setProperty("chkNormal", "checked", false);
        samplingDistData = [];
        if (!bKeepSample)
            step2(true);
        else
            populateSamplingDist(true, true);
        UI.batchSetProperty(["spnStep2ErrorMsg", "spnApproxDistStats"], "innerHTML", "");
    }
}

function step1Change()
{
    if (pageActive && !resetAll()) return;

    popType = UI.getProperty("selPop", "value");
    UI.setStyleProperty("divStep1CatOptions", "display",
        (popType == "categorical" ? "block" : "none"));
    step1();
}

function step1()
{
    popType = UI.getProperty("selPop", "value");
    if (popType == "categorical")
    {
        if (!IV.validateInputFloat("txtCategoricalP", 0, 1, false, "spnStep1ErrorMsg", "True proportion"))
            return;
        else
        {
            UI.setProperty("spnStep1ErrorMsg", "innerHTML", "");
            var p = parseFloat(UI.getProperty("txtCategoricalP", "value"));
            randFcn = function() {
                return (Math.random() < p ? 1 : 0);
            };
            popMean = null;
            popSD = null;
            var dist = new STAP.CategoricalData1Var();
            dist.addFrequencyFor("Success", p);
            dist.addFrequencyFor("Failure", 1 - p);
            popGraph.barChart(dist.toDataArray("Outcome"), "Outcome", true, " ", 4);
            UI.setProperty("spnPopParams", "innerHTML", "p = " + p);
        }
    }
    else if (popType == "normal")
    {
        randFcn = function() { return jStat.normal.sample(10, 2); };
        popMean = 10;
        popSD = 2;
        popGraph.normalDiagram(10, 2, 0, 20, true);
    }
    else if (popType == "uniform")
    {
        randFcn = function() { return jStat.uniform.sample(0, 10); };
        popMean = 5;
        popSD = Math.sqrt(100/12);
//        popGraph.discreteProbabilityHistogram(uniformDist.getGraphData(), "", true);
        popGraph.uniformDiagram(0, 10, 0, 10, true);
    }
    else if (popType == "skewed")
    {
        randFcn = function() { return jStat.chisquare.sample(3); };
        popMean = jStat.chisquare.mean(3);
        popSD = Math.sqrt(jStat.chisquare.variance(3));
        popGraph.X2Diagram(3, 0, 16, true);
    }
    else if (popType == "bimodal")
    {
        randFcn = function() {
            return jStat.normal.sample(10, 2) + (Math.random() < 0.5 ? 0 : 10);
        };
        popMean = 15;
        popSD = Math.sqrt(29); // Pythagorean Thm of Stat
        popGraph.bimodalDiagram(10, 2, 10);
    }
    
    if (popType != "categorical")
        UI.setProperty("spnPopParams", "innerHTML", "&mu; = " + format.formatNumber(popMean) + ", &sigma; = " + format.formatNumber(popSD));
    
    UI.batchSetStyleProperty(["divStep1Results", "divStep2"], "display", "block");
}

function doSample()
{
    if (popType == "categorical")
    {
        var dist = new STAP.CategoricalData1Var();
        // Enforce order of mapping and display
        dist.addFrequencyFor("Success", 0);
        dist.addFrequencyFor("Failure", 0);
        for (var i = 0; i < sampleSize; i++) dist.addFrequencyFor(
            (randFcn() ? "Success" : "Failure")
        );
        return dist;
    }
    else
    {
        var arr = [];
        for (var i = 0; i < sampleSize; i++) arr.push(randFcn());
        return arr;
    }
}

function step2(bSkipValidate)
{
    pageActive = true;
    if (!bSkipValidate && !IV.validateInputInt("txtSampleSize", 1, Number.POSITIVE_INFINITY, false, "spnStep2ErrorMsg", "Sample size", "must be a positive integer."))
            return;
    sampleSize = parseInt(UI.getProperty("txtSampleSize", "value"));
    populateSamplingDist(true);

    UI.setStyleProperty("btn2", "display", "none");
    if (popType == "categorical")
    {
        UI.setStyleProperty("spnStep3CatOpt", "display", "inline");
        UI.setStyleProperty("selSampDist", "display", "none");
    }
    else
    {
        UI.setStyleProperty("spnStep3CatOpt", "display", "none");
        UI.setStyleProperty("selSampDist", "display", "inline");
    }
    updateModelOption();
    UI.batchSetStyleProperty(["divStep2Results", "divStep3", "divApproxDistPlot"], "display", "block");
}

function plotSamplingDist()
{
    UI.setStyleProperty("divApproxDistPlot", "display", "block");
    var type = UI.getProperty("selSampDist", "value");
    approxDistGraph.dotplot(util.arrayToGraphData(samplingDistData, "Sampling Distribution" ), "Sampling Distribution",
        null, false, false,
        ((popType == "categorical" || type != "mean") ? null : popGraph.xScale.domain()), false, "#000000");

    var sdstats = stat.getOneVariableStatistics(samplingDistData);
    var mean = sdstats.mean;
    var SD = sdstats.Sx;

    if (UI.getProperty("chkNormal", "checked"))
        approxDistGraph.plotTopCurve(function(x){ return jStat.normal.pdf(x, mean, SD);}, 80, null, true, false, true);

    if (samplingDistData.length > 1)
    {
        UI.setProperty("spnApproxDistStats", "innerHTML", "Mean = " + format.formatNumber(mean) + ", SD = " + format.formatNumber(SD));
    }
    else
        UI.setProperty("spnApproxDistStats", "innerHTML", ""); 
}

function populateSamplingDist(bVerbose, bUseLast)
{
    var data = (bUseLast ? lastSample : lastSample = doSample());
    var val = null;
    var symbol = null;
    if (popType == "categorical")
    {
        val = data.frequencies["Success"] / data.getTotalFrequency();
        symbol = "p&#770;";
        if (bVerbose)
        {
            oneSampleGraph.barChart(data.toDataArray("Sample Outcomes"), "Sample Outcomes", true, " ", 3);
        }
    }
    else
    {
        var stats = stat.getOneVariableStatistics(data);
        var type = UI.getProperty("selSampDist", "value");
        val = (type == "mean" ? stats.mean :
                    (type == "sd" ? stats.Sx : stats.Sx * stats.Sx));
        symbol = (type == "mean" ? "x&#772;" :
                    (type == "sd" ? "s" : "s&sup2;"));
        if (bVerbose)
            oneSampleGraph.dotplot(util.arrayToGraphData(data, "Sample Data"), "Sample Data", null, false, false, popGraph.xScale.domain());
    }

    samplingDistData.push(val);
    if (bVerbose)
    {
        UI.setProperty("spnOneSampleStats", "innerHTML", symbol + " = " + format.formatNumber(val));
        
        var topMargin = samplePlotHeight - UI.getProperty("svg_divOneSamplePlot", "height").baseVal.value;
        topMargin = Math.max(topMargin, 0);
        UI.setStyleProperty("divStep2Margin", "height", topMargin + (topMargin > 0 ? "px" : ""));
        UI.setStyleProperty("divOneSamplePlot", "height", samplePlotHeight - topMargin + "px");
        plotSamplingDist();
    }
}

function updateModelOption()
{
    UI.setStyleProperty("divStep3Model", "display",
        (UI.getProperty("selSampDist", "value") == "mean" ? "block" : "none"));
}

function step3SampDistChange()
{
    updateModelOption();
    clearSamples(true);
}

function step3()
{
    if (!IV.validateInputInt("txtNumSamples", 1, Number.POSITIVE_INFINITY, false, "spnStep2ErrorMsg", "Number of samples", "must be a positive integer."))
        return;
    var numSamples = parseInt(UI.getProperty("txtNumSamples", "value"));
    for (var i = 0; i < numSamples; i++)
        populateSamplingDist((i == numSamples - 1));
}

UI.setOnLoad(initializePage);