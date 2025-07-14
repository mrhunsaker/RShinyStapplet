// Group indices -- 0 = SRS, 1 = Cluster, 2 = Systematic
var meanSpanIds = ["spnMeanSRS", "spnMeanCluster", "spnMeanSystematic"];
var tblIds = ["tblSRS", "tblCluster", "tblSystematic"];
var graphDivIds = ["divSRSPlot", "divClusterPlot", "divSystematicPlot"];
var divIds = ["divSRS", "divCluster", "divSystematic"];
var btnIds = ["btnSRS", "btnCluster", "btnSystematic"];

function _cluster()
{
    var retval = [];
    var row = util.randomIntFromInterval(0,4);
    for (var i = 0; i < 10; i++)
        retval.push(10 * row + i);
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