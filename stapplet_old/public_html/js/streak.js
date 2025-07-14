var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;

var pageActive = false;

var rawFormats = [ { regex: /[^YN]+/g, succChar: 'Y', failChar: 'N' },
		   { regex: /[^SF]+/g, succChar: 'S', failChar: 'F' },
		   { regex: /[^WL]+/g, succChar: 'W', failChar: 'L' }
		 ];

var currentFormat = 0;
var rawData = [];
var trialData = [];

function initializePage()
{
	UI.setStyleProperty("divDataEntrySummary", "display", "none");
	UI.setStyleProperty("divAnalysis", "display", "none");
	UI.setStyleProperty("spnSimulationResults", "display", "none");
	graph = new STAP.SVGGraph("divDotplot");
	UI.writeLinkColorOriginRules();
}

function streakInputChanged()
{
	var str = UI.getProperty("txtDataRaw", "value").toUpperCase().replace(rawFormats[currentFormat].regex,'');
	UI.setProperty("txtDataRaw", "value", str);
	UI.setProperty("spnRawStreakCount", "innerHTML", "" + stat.streakCount(str));
}

function handleDataRawFormatChange()
{
	currentFormat = parseInt(UI.getProperty("selDataRawFormat", "value"));
	UI.setProperty("txtDataRaw", "value", "");
	UI.setProperty("spnRawStreakCount", "innerHTML", "");	
}

function handleDataEntryChange()
{
	var val = UI.getProperty("selDataEntryMethod", "value");
	UI.setStyleProperty("divDataEntrySummary", "display", (val == "raw" ? "none" : "block"));
	UI.setStyleProperty("divDataEntryRaw", "display", (val == "summary" ? "none" : "block"));		
}

function beginAnalysis()
{
	if (validateDataInput())
	{
		pageActive = true;
		UI.batchSetProperty(["selDataEntryMethod", "selDataRawFormat",
			"txtDataRaw", "txtDataSummarySuccesses", "txtDataSummaryFailures"],
			"disabled", true);
		UI.setProperty("btnChangeInputs", "disabled", false);
		var val = UI.getProperty("selDataEntryMethod", "value");			
		UI.setStyleProperty("divAnalysis", "display", "block");
	}
}

function validateDataInput()
{
	var val = UI.getProperty("selDataEntryMethod", "value");
	if (val == "raw")
	{
		if (UI.getProperty("txtDataRaw", "value").length > 0)
		{
			UI.setProperty("spnSeqMsg", "innerHTML", "");
			return true;
		}
		else
		{
			UI.setProperty("spnSeqMsg", "innerHTML", "Sequence must have at least one valid character.");
			return false;
		}
	}
	else
	{
		var valid = 
	                IV.validateInputInt("txtDataSummarySuccesses", 0, Number.MAX_VALUE, true, "spnSeqMsg", "Number of successes", "must be positive.");
		valid = valid &
	                IV.validateInputInt("txtDataSummaryFailures", 0, Number.MAX_VALUE, true, "spnSeqMsg", "Number of failures", "must be positive.");
		return valid;
	}
}

function validateSimulationInput()
{
	if (!IV.validateInputInt("txtTrials", 0, Number.MAX_VALUE, true, "spnTrialsMsg", "Number of trials", "must be positive.")) return;

	UI.setProperty("spnTrialsMsg", "innerHTML", "");
	addTrials(parseInt(UI.getProperty("txtTrials", "value")));			
}

function addTrials(n)
{
	var val = UI.getProperty("selDataEntryMethod", "value");
	var numSucc = 0, numFail = 0;
	if (val == "raw")
	{
		var str = UI.getProperty("txtDataRaw", "value");
		for (var i = 0; i < str.length; i++)
		{
			if (str.charAt(i) == rawFormats[currentFormat].succChar) numSucc++;
			else numFail++;
		}
	}
	else
	{
		numSucc = parseInt(UI.getProperty("txtDataSummarySuccesses", "value"));
		numFail = parseInt(UI.getProperty("txtDataSummaryFailures", "value"));			
	}
	var total = numSucc + numFail;
	var ratio = numSucc / total;
	while (n > 0)
	{
		var simstr = "";
		for (var i = 0; i < total; i++)
			simstr += (Math.random() < ratio ? "s" : "f");
		var result = stat.streakCount(simstr);				
		var obj = {};
		obj["Simulated number of streaks"] = result;
		trialData.push(obj);
		rawData.push(result);
		n--;
	}
	UI.setStyleProperty("spnSimulationResults", "display", "inline");
	UI.setProperty("spnRecentResult", "innerHTML", "" + trialData[trialData.length - 1]["Simulated number of streaks"]);
	UI.setProperty("spnNumSeq", "innerHTML", "" + trialData.length);
	var resultStats = stat.getOneVariableStatistics(rawData);
	UI.setProperty("spnSimMean", "innerHTML", format.formatNumber(resultStats.mean));
	UI.setProperty("spnSimSD", "innerHTML", format.formatNumber(resultStats.Sx));
	util.sortArrayAscendingByProperty(trialData, "Simulated number of streaks");
	graph.dotplot(trialData, "Simulated number of streaks", null, true);
}

function deactivatePage(bSkipConfirm)
{
	if (pageActive && (bSkipConfirm || confirm("This will end analysis.  Do you wish to continue?")))
	{
		pageActive = false;
		clearAnalysis(true);
		UI.batchSetProperty(["selDataEntryMethod", "selDataRawFormat",
				"txtDataRaw", "txtDataSummarySuccesses", "txtDataSummaryFailures"],
			"disabled", false);
		UI.setProperty("btnChangeInputs", "disabled", true);
		UI.setStyleProperty("divAnalysis", "display", "none");
	}
}

function resetApplet()
{
        if (confirm("All entered data will be lost.  Do you wish to continue?"))
	{
		deactivatePage(true);
		UI.batchSetProperty(["txtDataRaw", "txtDataSummarySuccesses", "txtDataSummaryFailures"], "value", "");
		UI.batchSetProperty(["spnSeqMsg", "spnRawStreakCount"], "innerHTML", "");
		UI.batchSetStyleProperty(["divDataEntrySummary", "divAnalysis"], "display", "none");
		UI.setStyleProperty("divDataEntryRaw", "display", "block");
		UI.setProperty("selDataEntryMethod", "value", "raw");
		clearAnalysis(true);
        }
}

function clearAnalysis(bSkipConfirm)
{
	if (!bSkipConfirm && !confirm("All simulation results will be lost.  Do you wish to continue?"))
		return;
	rawData = [];
	trialData = [];
	graph.clearGraph();
	UI.batchSetProperty(["spnRecentResult", "spnNumSeq", "spnSimMean", "spnSimSD"],"innerHTML", "");
	UI.setStyleProperty("spnSimulationResults", "display", "none");
}

function handleSimulationDotplotCount()
{
    UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");
    if ( (UI.getProperty("txtSimulationDotplotCountBound", "value").length > 0)
              && IV.validateInputFloat("txtSimulationDotplotCountBound", Number.NEGATIVE_INFINITY,
            Number.POSITIVE_INFINITY, false, "spnSimulationDotplotCountErrorMsg", "Bound"))
    {
	var sel = UI.getProperty("selSimulationDotplotCountDir", "value");
	var bound = parseFloat(UI.getProperty("txtSimulationDotplotCountBound", "value"));
	if (sel == "left")
		graph.forceSelectionRectangle(null, bound);
	else
		graph.forceSelectionRectangle(bound, null);
    }
}

function clearSimulationDotplotCount()
{
    UI.setProperty("spnSimulationDotplotCountErrorMsg", "innerHTML", "");
    UI.setProperty("txtSimulationDotplotCountBound", "value", "");
    graph.clearSelectionRectangle();
}

UI.setOnLoad(initializePage);
