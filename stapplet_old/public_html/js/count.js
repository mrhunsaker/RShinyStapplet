var UI = STAP.UIHandlers;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var pref = STAP.Preferences;

function calculateFactorial()
{
    UI.setProperty("spnCountingResult", "innerHTML", "");
    if (!IV.validateInputInt("txtCountingN", 0, Number.POSITIVE_INFINITY, false,
        "spnCountingMsg", "n", "must be a non-negative integer.")) return;

    var n = parseInt(UI.getProperty("txtCountingN", "value"));
    UI.setProperty("spnCountingResult", "innerHTML", n + "! = " + util.factorial(n));
    UI.setProperty("spnCountingMsg", "innerHTML", "");
}

function calculatePermutations()
{
    calculateNRFunc("P", function(n, r) {
        return Math.round(util.factorial(n) / util.factorial(n - r));
    });
}

function calculateCombinations()
{
    calculateNRFunc("C", function(n, r) {
       return Math.round(util.factorial(n) / util.factorial(r) / util.factorial(n - r));
    });
}

function calculateNRFunc(label, fn)
{
    UI.setProperty("spnCountingResult", "innerHTML", "");
    if (!IV.validateInputInt("txtCountingN", 0, Number.POSITIVE_INFINITY, false,
        "spnCountingMsg", "n", "must be a non-negative integer.")) return;
    if (!IV.validateInputInt("txtCountingR", 0, Number.POSITIVE_INFINITY, false,
        "spnCountingMsg", "r", "must be a non-negative integer.")) return;

    var n = parseInt(UI.getProperty("txtCountingN", "value"));
    var r = parseInt(UI.getProperty("txtCountingR", "value"));

    if (r > n)
        UI.setProperty("spnCountingMsg", "innerHTML", "r cannot be greater than n.");
    else
    {
        UI.setProperty("spnCountingResult", "innerHTML", "<SUB>" + n + "</SUB>" + label + 
                                                         "<SUB>" + r + "</SUB> = "+ fn(n, r));
        UI.setProperty("spnCountingMsg", "innerHTML", "");
    }
}

UI.setOnLoad(UI.writeLinkColorOriginRules);