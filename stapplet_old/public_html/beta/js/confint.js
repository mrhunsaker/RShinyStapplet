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
var confIntGraph = null;
var popType = null;
var randFcn = null;
var popMean = null;
var popProp = null;
var popSD = null;
var sampleSize = null;
var intervalData = [];
var lastSample = null;
var statSymbol = null;
var cLevel = null;
var popSymbol = null;
var redoRecompute = false;

const samplePlotHeight = 120;

function initializePage()
{
	UI.batchSetStyleProperty(["divStep1CatOptions", "divStep1Results", "divStep2", "divStep2Results", "divStep3", "divConfIntPlot", "divStep3Model"], "display", "none");
	popGraph = new STAP.SVGGraph("divPopPlot", 600, 200);
	oneSampleGraph = new STAP.SVGGraph("divOneSamplePlot", 600, samplePlotHeight);
	UI.setStyleProperty("divOneSamplePlot", "height", samplePlotHeight + "px");
	confIntGraph = new STAP.SVGGraph("divConfIntPlot", 600, 400);
	UI.recordInputState("selPop");
	UI.writeLinkColorOriginRules();
	step1();
}

function resetAll()
{
    if (!confirm("Are you sure?\nThis will clear all data and start the activity over."))
    {
    	UI.resetInputState("selPop");
        return;
    }
    
    pageActive = false;
	UI.batchSetStyleProperty(["divStep1CatOptions", "divStep1Results", "divStep2", "divStep2Results", "divStep3", "divStep3Model", "divConfIntPlot"], "display", "none");
	UI.setStyleProperty("btn2", "display", "inline");
    UI.batchSetProperty(["spnPopParams", "spnStep1ErrorMsg", "spnLastGroupStats", "spnConfIntStats"], "innerHTML", "");
    UI.setProperty("selSampDist", "selectedIndex", 0);
    intervalData = [];
    popMean = null;
    popProp = null;
    popSymbol = null;
    popSD = null;
    statSymbol = null;
    redoRecompute = false;
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
        confIntGraph.clearGraph();
//        UI.setStyleProperty("divConfIntPlot", "display", "none");
        intervalData = [];
        UI.batchSetProperty(["spnStep2ErrorMsg", "spnLastGroupStats", "spnConfIntStats"], "innerHTML", "");
        redoRecompute = false;
        if (!bKeepSample)
            step2(true);
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
            UI.setStyleProperty("spnStep2Opt", "display", "none");
            UI.setProperty("spnStep1ErrorMsg", "innerHTML", "");
            var p = parseFloat(UI.getProperty("txtCategoricalP", "value"));
            randFcn = function() {
                return (Math.random() < p ? 1 : 0);
            };
            popMean = null;
            popSD = null;
            popProp = p;
            var dist = new STAP.CategoricalData1Var();
            dist.addFrequencyFor("Success", p);
            dist.addFrequencyFor("Failure", 1 - p);
            popGraph.barChart(dist.toDataArray("Outcome"), "Outcome", true, " ", 4);
            UI.setProperty("spnPopParams", "innerHTML", "p = " + p);
            statSymbol = "p&#770;";
            popSymbol = "p";
        }
    }
    else
    {
        popProp = null;
        popSymbol = "&mu;";
        statSymbol = "x&#772;";
        UI.setStyleProperty("spnStep2Opt", "display", "inline");
        if (popType == "normal")
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
    }
    
    if (popType != "categorical")
        UI.setProperty("spnPopParams", "innerHTML", "&mu; = " + format.formatNumber(popMean) + ", &sigma; = " + format.formatNumber(popSD));
    
    UI.setProperty("spnStep2Symbol", "innerHTML", popSymbol);
    UI.batchSetStyleProperty(["divStep1Results", "divStep2"], "display", "block");

	UI.recordInputState("selPop");
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
    if (!bSkipValidate && !IV.validateInputInt("txtSampleSize", 1, Number.POSITIVE_INFINITY, false, "spnStep2ErrorMsg", "Sample size", "must be a positive integer.") && !IV.validateInputFloat("txtCLevel", 0, 100, true, "spnStep2ErrorMsg", "Confidence level", "must be strictly between 0% and 100%."))
            return;

    pageActive = true;

    sampleSize = getSampleSize();
    cLevel = getCLevel();
    populateConfIntDiagram(true);

    UI.setStyleProperty("btn2", "display", "none");
    UI.batchSetStyleProperty(["divStep2Results", "divStep3", "divConfIntPlot"], "display", "block");
}

function contains(intv, param)
{
    return (intv.lowerBound <= param && param <= intv.upperBound);
}

function plotIntervals()
{
    // If there's only one interval to update, replot with just the last one
    // Otherwise, send the last numSamples intervals for replotting
    // Beware to send them in the correct order
    var intervals = [];
    if (redoRecompute)
    {
        var numSamples = parseInt(UI.getProperty("txtNumSamples", "value"));
        for (var i = 0; i < numSamples; i++)
            intervals.push(intervalData[intervalData.length - numSamples + i].interval);
    }
    else
        intervals.push(intervalData[intervalData.length - 1].interval);
    
    var param = (popMean === null ? popProp : popMean);
    if (popMean === null)
        confIntGraph.confidenceIntervalPlot(intervals, popProp, [0, 1]);
    else
        confIntGraph.confidenceIntervalPlot(intervals, popMean, popGraph.xScale.domain());
    
    // Update running total stats for all intervals so far collected
    var cont = 0;
    for (var i = 0; i < intervalData.length; i++)
        if (contains(intervalData[i].interval, param)) cont++;
    UI.setProperty("spnConfIntStats", "innerHTML", 
        "Total intervals capturing " + popSymbol + ": " + cont + " out of " + intervalData.length + " (" + format.formatPercent(cont / intervalData.length) + ")"
    );
}

function getSampleSize()
{
    return parseInt(UI.getProperty("txtSampleSize", "value"));    
}

function getCLevel()
{
    return parseFloat(UI.getProperty("txtCLevel", "value"));
}

function getPopSD() { return popSD; }

function populateConfIntDiagram(bVerbose)
{
    lastSample = doSample();
    var item = null;
    if (popType == "categorical")
    {
        item = {
            x: lastSample.frequencies["Success"],
            updateInterval: function(obj) {
                obj.interval = stat.onePropZInterval(obj.x,
                    getSampleSize(),
                    getCLevel()/100
                );
            }
        };
        
        item.updateInterval(item);
        if (bVerbose)
        {
            oneSampleGraph.barChart(lastSample.toDataArray("Sample Outcomes"), "Sample Outcomes", true, " ", 3);
            UI.setProperty("spnOneSampleStats", "innerHTML", statSymbol + " = " + format.formatProportion(item.x / sampleSize) + ", confidence interval: (" +
                format.formatProportion(item.interval.lowerBound) + ", " +
                format.formatProportion(item.interval.upperBound) + ")"
            );
        }
    }
    else
    {
        var stats = stat.getOneVariableStatistics(lastSample);
        var type = UI.getProperty("selSampDist", "value");
        val = (type == "mean" ? stats.mean :
                    (type == "sd" ? stats.Sx : stats.Sx * stats.Sx));

        item = {
            xbar: stats.mean,
            Sx: stats.Sx,
            updateInterval: function(obj) {
                var type = UI.getProperty("selMeanIntType", "value");
                if (type == "t")
                    obj.interval = stat.oneSampTIntervalMeanStats(
                        obj.xbar, obj.Sx, getSampleSize(), getCLevel()/100
                    );                   
                else if (type == "z")
                    obj.interval = stat.oneSampZIntervalMeanStats(
                        obj.xbar, getPopSD(), getSampleSize(), getCLevel()/100
                    );
                else
                    obj.interval = stat.oneSampZIntervalMeanStats(
                        obj.xbar, obj.Sx, getSampleSize(), getCLevel()/100
                    );
            }
        };

        item.updateInterval(item);
        if (bVerbose)
        {
            oneSampleGraph.dotplot(util.arrayToGraphData(lastSample, "Sample Data"), "Sample Data", null, false, false, popGraph.xScale.domain());
            UI.setProperty("spnOneSampleStats", "innerHTML", statSymbol + " = " + format.formatNumber(item.xbar) + ", s<sub>x</sub> = " +
                format.formatNumber(item.Sx) + ", confidence interval: (" +
                format.formatNumber(item.interval.lowerBound) + ", " +
                format.formatNumber(item.interval.upperBound) + ")"
            );

            var topMargin = samplePlotHeight - UI.getProperty("svg_divOneSamplePlot", "height").baseVal.value;
            topMargin = Math.max(topMargin, 0);
            UI.setStyleProperty("divStep2Margin", "height", topMargin + (topMargin > 0 ? "px" : ""));
            UI.setStyleProperty("divOneSamplePlot", "height", samplePlotHeight - topMargin + "px");
        }        
    }

    intervalData.push(item);
    if (bVerbose) plotIntervals();
}

function redoIntervals()
{
    if (!pageActive || !IV.validateInputFloat("txtCLevel", 0, 100, true, "spnStep2ErrorMsg", "Confidence level", "must be strictly between 0% and 100%.")) return;

    for (var i = 0; i < intervalData.length; i++)
        intervalData[i].updateInterval(intervalData[i]);

    // Update the sample graph stats -- the sample being shown should always be the last item in the list
    var lastItem = intervalData[intervalData.length - 1];
    if (popType == "categorical")
        UI.setProperty("spnOneSampleStats", "innerHTML", statSymbol + " = " + format.formatProportion(lastItem.x / sampleSize) + ", confidence interval: (" +
                format.formatProportion(lastItem.interval.lowerBound) + ", " +
                format.formatProportion(lastItem.interval.upperBound) + ")"
            );
    else
        UI.setProperty("spnOneSampleStats", "innerHTML", statSymbol + " = " + format.formatNumber(lastItem.xbar) + ", s<sub>x</sub> = " +
                format.formatNumber(lastItem.Sx) + ", confidence interval: (" +
                format.formatNumber(lastItem.interval.lowerBound) + ", " +
                format.formatNumber(lastItem.interval.upperBound) + ")"
            );

    // Now, update the stats for the previously computed group, if there is one
    if (redoRecompute)
    {
        var numSamples = parseInt(UI.getProperty("txtNumSamples", "value"));
        var param = (popMean === null ? popProp : popMean);
        var cont = 0;
        for (var i = 1; i <= numSamples; i++)
            if (contains(intervalData[intervalData.length - i].interval, param)) cont++;

        UI.setProperty("spnLastGroupStats", "innerHTML", 
            "New intervals capturing " + popSymbol + ": " + cont + " out of " + numSamples + " (" + format.formatPercent(cont / numSamples) + ")"
        );
    }
    else
        UI.setProperty("spnLastGroupStats", "innerHTML", "");

    plotIntervals();
}

function step3()
{
    if (!IV.validateInputInt("txtNumSamples", 1, Number.POSITIVE_INFINITY, false, "spnStep2ErrorMsg", "Number of samples", "must be a positive integer."))
        return;
    var numSamples = parseInt(UI.getProperty("txtNumSamples", "value"));
    redoRecompute = true;
    var param = (popMean === null ? popProp : popMean);
    var cont = 0;
    for (var i = 0; i < numSamples; i++)
    {
        populateConfIntDiagram((i == numSamples - 1));
        if (contains(intervalData[intervalData.length - 1].interval, param)) cont++;
    }

    UI.setProperty("spnLastGroupStats", "innerHTML", 
        "New intervals capturing " + popSymbol + ": " + cont + " out of " + numSamples + " (" + format.formatPercent(cont / numSamples) + ")"
    );
}

UI.setOnLoad(initializePage);