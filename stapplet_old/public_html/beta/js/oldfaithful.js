var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var pageActive = false;
var popGraph = null;
var approxDistGraph = null;
var sampleSize = null;
var samplingDistData = [];
var lastSample = null;

var expName = "Duration (min)";
var respName = "Wait time (min)";

var durations = [1.5,1.5,1.55,1.583,1.6,1.633,1.633,1.633,1.65,1.65,1.667,1.667,1.667,1.667,1.683,1.7,1.7,1.733,1.75,1.75,1.75,1.75,1.75,1.767,1.767,1.767,1.767,1.783,1.8,1.8,1.817,1.833,1.833,1.833,1.833,1.833,1.833,1.85,1.85,1.867,1.867,1.867,1.867,1.883,1.883,1.883,1.9,1.9,1.9,1.9,1.9,1.917,1.917,1.917,1.917,1.917,1.933,1.933,1.95,1.95,1.95,1.967,1.967,1.983,1.983,2,2,2,2.017,2.017,2.033,2.033,2.033,2.033,2.033,2.05,2.067,2.067,2.083,2.083,2.1,2.117,2.117,2.117,2.117,2.117,2.133,2.15,2.15,2.2,2.2,2.2,2.217,2.217,2.233,2.25,2.25,2.25,2.3,2.35,2.5,2.5,2.567,2.567,2.583,2.75,2.783,2.833,2.967,3.167,3.267,3.35,3.367,3.4,3.567,3.667,3.7,3.7,3.717,3.833,3.833,3.833,3.867,3.883,3.883,3.917,3.95,3.967,3.967,3.983,4,4,4,4,4,4.017,4.033,4.033,4.033,4.033,4.033,4.05,4.05,4.05,4.05,4.083,4.083,4.083,4.1,4.1,4.117,4.117,4.117,4.117,4.117,4.133,4.15,4.167,4.167,4.167,4.183,4.2,4.217,4.217,4.233,4.233,4.25,4.25,4.25,4.25,4.267,4.267,4.267,4.283,4.283,4.283,4.3,4.3,4.3,4.317,4.317,4.333,4.333,4.333,4.333,4.333,4.35,4.35,4.367,4.367,4.367,4.383,4.383,4.383,4.383,4.383,4.4,4.4,4.417,4.417,4.417,4.417,4.433,4.433,4.433,4.433,4.433,4.45,4.45,4.45,4.45,4.467,4.467,4.467,4.467,4.467,4.467,4.483,4.483,4.5,4.5,4.5,4.5,4.5,4.5,4.517,4.517,4.517,4.533,4.533,4.533,4.533,4.533,4.533,4.533,4.533,4.533,4.533,4.55,4.567,4.583,4.583,4.583,4.6,4.6,4.617,4.617,4.617,4.633,4.633,4.633,4.633,4.633,4.667,4.667,4.683,4.7,4.733,4.75,4.75,4.767,4.833,5];
var waitTimes = [58,64,62,51,74,60,62,62,57,59,52,53,56,57,54,54,54,59,53,56,62,64,65,50,52,59,62,58,61,64,62,47,48,52,53,61,64,53,56,52,53,60,61,52,53,54,54,58,58,59,60,53,56,58,62,63,52,63,48,53,56,51,52,58,59,50,54,59,54,55,51,61,66,68,68,49,59,62,52,57,61,55,57,65,65,75,60,63,64,56,68,73,63,68,68,53,58,66,67,58,47,61,67,76,61,69,79,80,78,83,75,83,90,75,80,85,93,98,84,76,84,84,79,87,90,79,85,83,89,83,77,79,91,94,98,76,77,88,88,91,95,82,85,94,96,80,82,87,94,98,86,89,89,94,113,86,100,88,94,99,85,92,86,87,95,103,87,89,91,92,83,86,97,89,89,104,93,101,112,88,92,80,88,90,90,95,93,93,90,91,99,91,93,93,95,96,83,94,87,87,93,99,89,91,92,103,103,90,92,94,94,86,87,91,92,94,106,94,102,85,86,90,91,92,97,86,90,94,76,85,86,89,90,91,93,98,100,101,87,85,89,100,107,90,94,87,88,93,82,88,94,94,98,83,99,96,92,93,96,96,91,90,92];

function initializePage()
{
	UI.batchSetStyleProperty(["divStep2Results", "divStep3", "divApproxDistPlot"], "display", "none");
	popGraph = new STAP.SVGGraph("divPopPlot", 600, 400);
	approxDistGraph = new STAP.SVGGraph("divApproxDistPlot", 600, 300);
	UI.writeLinkColorOriginRules();
	drawBaseModel();
    drawPopulationLSRL();
}

function resetAll()
{
    if (!confirm("Are you sure?\nThis will clear all data and start the activity over.")) return;
    
    pageActive = false;
	UI.batchSetStyleProperty(["divStep2Results", "divStep3",  "divApproxDistPlot"], "display", "none");
	UI.setStyleProperty("btn2", "display", "inline");
    UI.setProperty("chkNormal", "checked", false);
    UI.setProperty("spnOneSampleStats", "innerHTML", "");
    UI.setProperty("spnStep1Legend", "innerHTML", "<B>Population</B>");
    lastSample = null;
    samplingDistData = [];
    approxDistGraph.clearGraph();
    drawBaseModel();
    drawPopulationLSRL();
}

function clearSamples(bKeepSample)
{
    if (pageActive)
    {
        if (!bKeepSample && !IV.validateInputInt("txtSampleSize", 5, 263, false, "spnStep2ErrorMsg", "Sample size", "must be between 5 and 263."))
            return;
                
        if (!bKeepSample) drawBaseModel();
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

function drawBaseModel()
{
    popGraph.scatterplot(util.arraysTo2DGraphData(durations, waitTimes, expName, respName), expName, respName);
}

function drawPopulationLSRL()
{
    popGraph.plotTopCurve(function(x) {
        return 33.34686862 + 13.28561842 * x;
    });
}

function doSample()
{
    var pts = [];
    for (var i = 0; i < 263; i++) pts.push(i);
    util.knuthShuffle(pts);
    var retval = pts.slice(0, sampleSize);
    util.sortArrayAscending(retval);
    return retval;
}

function step2(bSkipValidate)
{
    pageActive = true;
    UI.setProperty("spnStep1Legend", "innerHTML", "<B>Sample</B>");
    if (!bSkipValidate && !IV.validateInputInt("txtSampleSize", 5, 263, false, "spnStep2ErrorMsg", "Sample size", "must be between 5 and 263."))
            return;

    sampleSize = parseInt(UI.getProperty("txtSampleSize", "value"));
    populateSamplingDist(true);

    UI.setStyleProperty("btn2", "display", "none");
    UI.batchSetStyleProperty(["divStep2Results", "divStep3", "divApproxDistPlot"], "display", "block");
}

function plotSamplingDist()
{
    UI.setStyleProperty("divApproxDistPlot", "display", "block");
    approxDistGraph.dotplot(util.arrayToGraphData(samplingDistData, "Sampling Distribution" ), "Sampling Distribution",
        null, false, false, null, false, "#000000");

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

    if (lastSample)
    {
        popGraph.svg.selectAll("circle")
        .filter(function(d, i) {
            return (lastSample.indexOf(i) == -1);
        })
        .style("opacity", "0.1");
    }
}

function populateSamplingDist(bVerbose, bUseLast)
{
    var data = (bUseLast ? lastSample : lastSample = doSample());

    var graphX = [];
    var graphY = [];
    for (var i = 0; i < sampleSize; i++)
    {
        graphX.push(durations[data[i]]);
        graphY.push(waitTimes[data[i]]);
    }

    var stats = stat.polynomialRegression(graphX, graphY);
    var val = stats.coeffs[1];
    samplingDistData.push(val);

    if (bVerbose)
    {
        drawBaseModel();
        drawPopulationLSRL();
        popGraph.plotTopCurve(stats.fn, 10, "#000000", true, true);
        UI.setProperty("spnOneSampleStats", "innerHTML", "Sample slope = " + format.formatNumber(val));
        plotSamplingDist();
    }
}

function step3()
{
    if (!IV.validateInputInt("txtSampleSize", 5, 263, false, "spnStep2ErrorMsg", "Sample size", "must be between 5 and 263."))
        return;
    var numSamples = parseInt(UI.getProperty("txtNumSamples", "value"));
    for (var i = 0; i < numSamples; i++)
        populateSamplingDist((i == numSamples - 1));
}

UI.setOnLoad(initializePage);