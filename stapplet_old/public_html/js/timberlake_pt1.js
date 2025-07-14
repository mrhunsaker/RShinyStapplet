// Group indices -- 0 = SRS, 1 = Stratify row, 2 = Stratify column
var meanSpanIds = ["spnMeanSRS", "spnMeanStratifyRow", "spnMeanStratifyColumn"];
var tblIds = ["tblSRS", "tblStratifyRow", "tblStratifyColumn"];
var graphDivIds = ["divSRSPlot", "divStratifyRowPlot", "divStratifyColumnPlot"];
var divIds = ["divSRS", "divStratifyRow", "divStratifyColumn"];
var btnIds = ["btnSRS", "btnStratifyRow", "btnStratifyColumn"];

function _stratRow()
{
    var retval = [];
    for (var i = 0; i < 5; i++)
    {
        util.knuthShuffle(shuffler10);
        retval.push(shuffler10[0] + 10 * i);
        retval.push(shuffler10[1] + 10 * i);
    }
    return retval;
}

function generateStratifyRow()
{
    samples[1] = _stratRow();
    _generateHelper(1);
}

function _stratCol()
{
    var retval = [];
    for (var i = 0; i < 10; i++)
        retval.push(i + 10 * util.randomIntFromInterval(0,4));
    return retval;    
}

function generateStratifyColumn()
{
    samples[2] = _stratCol();
    _generateHelper(2);
}

function doManySamples() { _manySamples(_stratRow, _stratCol); }

function doManyOfflineSamples()
{
    var howMany = parseInt(UI.getProperty("txtManyOfflineSamples", "value"));
    if (howMany > 2000)
    {
        UI.tempSetMessage("spnOfflineEditMsg", "Only 2000 items can be added at a time.", 2000, true);
        return;
    }
    var type = parseInt(UI.getProperty("selOfflinePlotEdit", "value"));
    var fnSample = null;
    if (type == 1) fnSample = _SRS;
    else if (type == 2) fnSample = _stratRow;
    else fnSample = _stratCol;
    for (var i = 0; i < howMany; i++)
    {
        var mean = getSampleMean(fnSample());
        if (mean < dataMin) dataMin = mean;
        if (mean > dataMax) dataMax = mean;
        graphData[type-1].push(mean);
    }
    updateGraphDistributions();
    UI.tempSetMessage("spnOfflineEditMsg", "Data generated.", 2000);
    UI.setProperty("txtOfflineManySamples", "value", "");
}