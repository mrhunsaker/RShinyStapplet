// Group indices -- 0 = SRS, 1 = Cluster, 2 = Systematic
var meanSpanIds = ["spnMeanSRS", "spnMeanCluster", "spnMeanSystematic"];
var tblIds = ["tblSRS", "tblCluster", "tblSystematic"];
var graphDivIds = ["divSRSPlot", "divClusterPlot", "divSystematicPlot"];
var divIds = ["divSRS", "divCluster", "divSystematic"];
var btnIds = ["btnSRS", "btnCluster", "btnSystematic"];

function _cluster()
{
    var retval = [];
    var col1 = util.randomIntFromInterval(0,9);
    var col2 = util.randomIntFromInterval(0,9);
    while (col1 == col2) col2 = util.randomIntFromInterval(0,9);
    for (var i = 0; i < 5; i++)
    {
        retval.push(col1 + 10 * i);
        retval.push(col2 + 10 * i)
    }
    return retval;
}

function generateCluster()
{
    samples[1] = _cluster();
    _generateHelper(1);
}

function _systematic()
{
    var seat = util.randomIntFromInterval(0, 49);
    var retval = [seat];
    for (var i = 0; i < 9; i++)
    {
        seat += 8;
        if (seat > 49) seat -= 50;
        retval.push(seat);
    }
    return retval;
}

function generateSystematic()
{
    samples[2] = _systematic();
    _generateHelper(2);
}

function doManySamples() { _manySamples(_cluster, _systematic); }

function doManyOfflineSamples()
{
    var howMany = parseInt(UI.getProperty("txtManyOfflineSamples", "value"));
    if (howMany > 2000)
    {
        tempSetMessage("spnOfflineEditMsg", "Only 2000 items can be added at a time.", 2000, true);
        return;
    }
    var type = parseInt(UI.getProperty("selOfflinePlotEdit", "value"));
    var fnSample = null;
    if (type == 1) fnSample = _SRS;
    else if (type == 2) fnSample = _cluster;
    else fnSample = _systematic;
    for (var i = 0; i < howMany; i++)
    {
        var mean = getSampleMean(fnSample());
        if (mean < dataMin) dataMin = mean;
        if (mean > dataMax) dataMax = mean;
        graphData[type-1].push(mean);
    }
    updateGraphDistributions();
    tempSetMessage("spnOfflineEditMsg", "Data generated.", 2000);
    UI.setProperty("txtOfflineManySamples", "value", "");
}