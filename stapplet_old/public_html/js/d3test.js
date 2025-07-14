var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

function initializePage()
{
	graph1 = new STAP.SVGGraph("divDotplot1");
	graph1.CSVtoDotplot("electoral.csv", "Electoral Votes", "State");
	graph2 = new STAP.SVGGraph("divDotplot2");
	graph2.CSVtoDotplot("cereal.csv", "Sodium", "Cereal Name");
}

STAP.UIHandlers.setOnLoad(initializePage);