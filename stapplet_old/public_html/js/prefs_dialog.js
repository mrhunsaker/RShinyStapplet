// Avoid namespace collisions
var _dlgPref = STAP.Preferences;
var _dlgFormat = STAP.Format;
var _dlgUI = STAP.UIHandlers;
var _dlgIV = STAP.InputValidation;
var _dlgGraph = new STAP.SVGGraph("divPrefDlgPlot", 400, 200);
var _dlgGraphData = STAP.Utility.arrayToGraphData([1, 2, 2, 3, 4, 4, 5], "Variable");

function _dlgUpdateExamples()
{
    _dlgUI.setProperty("spnNumEx1", "innerHTML", _dlgFormat.formatNumber(31.4159));
    _dlgUI.setProperty("spnNumEx2", "innerHTML", _dlgFormat.formatNumber(1/7));
    _dlgUI.setProperty("spnNumEx3", "innerHTML", _dlgFormat.formatNumber(-21.3));
    _dlgUI.setProperty("spnPropEx", "innerHTML", _dlgFormat.formatProportion(0.3141592));
    _dlgGraph.boxplot(_dlgGraphData, "Variable");
}

function _dlgInitializePreferences()
{
    for (var i = 1; i <= 2; i++)
    {
        var rdButton = document.getElementById("rdPropDisplay" + i);
        if (rdButton.value == _dlgPref.getPreference(_dlgPref.keys.proportion.display_type))
            rdButton.checked = true;
    }
    
    for (var i = 1; i <= 3; i++)
    {
        var rdButton = document.getElementById("rdNumRounding" + i);
        if (rdButton.value == _dlgPref.getPreference(_dlgPref.keys.number.rounding_type))
            rdButton.checked = true;
    }

    _dlgUI.setProperty("txtNumAutoPlaces", "value", _dlgPref.getPreference(_dlgPref.keys.number.rounding_places.auto));
    _dlgUI.setProperty("txtNumFixedPlaces", "value", _dlgPref.getPreference(_dlgPref.keys.number.rounding_places.fixed));
    _dlgUI.setProperty("txtNumPrecision", "value", _dlgPref.getPreference(_dlgPref.keys.number.rounding_places.precision));
    _dlgUI.setProperty("txtPropPlaces", "value", _dlgPref.getPreference(_dlgPref.keys.proportion.display_places));

    _dlgUI.setProperty("selDotplotBGColor", "value", _dlgPref.getPreference(_dlgPref.keys.drawing.bg_color));
    _dlgUI.setProperty("selDotplotDotColor", "value", _dlgPref.getPreference(_dlgPref.keys.drawing.fill_color));

    _dlgUI.setProperty("selDotplotFontFace", "value", _dlgPref.getPreference(_dlgPref.keys.drawing.font_face));
    _dlgUI.setProperty("selDotplotFontSize", "value", _dlgPref.getPreference(_dlgPref.keys.drawing.font_size));

    _dlgUpdateExamples();
}

function _dlgWriteNumberRoundingPreferences(rdButton)
{
    _dlgPref.setPreference(_dlgPref.keys.number.rounding_type, rdButton.value);
    if (_dlgIV.validateInputInt("txtNumAutoPlaces", 0, 20, false, "spnNumAutoPlacesMsg"))
        _dlgPref.setPreference(_dlgPref.keys.number.rounding_places.auto, _dlgUI.getProperty("txtNumAutoPlaces", "value"));
    if (_dlgIV.validateInputInt("txtNumFixedPlaces", 0, 20, false, "spnNumFixedPlacesMsg"))
        _dlgPref.setPreference(_dlgPref.keys.number.rounding_places.fixed, _dlgUI.getProperty("txtNumFixedPlaces", "value"));
    if (_dlgIV.validateInputInt("txtNumPrecision", 1, 21, false, "spnNumPrecisionMsg"))
        _dlgPref.setPreference(_dlgPref.keys.number.rounding_places.precision, _dlgUI.getProperty("txtNumPrecision", "value"));

    _dlgUpdateExamples();
}

function _dlgWritePropDisplayPreferences(rdButton)
{
    if (rdButton)
        _dlgPref.setPreference(_dlgPref.keys.proportion.display_type, rdButton.value);
    if (_dlgIV.validateInputInt("txtPropPlaces", 1, _dlgPref.getPreference(_dlgPref.keys.zero_tolerance), false, "spnPropPlacesMsg"))
        _dlgPref.setPreference(_dlgPref.keys.proportion.display_places, _dlgUI.getProperty("txtPropPlaces", "value"));

    _dlgUpdateExamples();
}

function _dlgWriteDotPlotColorPreferences()
{
    _dlgPref.setPreference(_dlgPref.keys.drawing.bg_color, _dlgUI.getProperty("selDotplotBGColor", "value"));
    _dlgPref.setPreference(_dlgPref.keys.drawing.fill_color, _dlgUI.getProperty("selDotplotDotColor", "value"));

    _dlgUpdateExamples();
}

function _dlgWriteDotPlotFontPreferences()
{
    _dlgPref.setPreference(_dlgPref.keys.drawing.font_size, UI.getProperty("selDotplotFontSize", "value"));
    _dlgPref.setPreference(_dlgPref.keys.drawing.font_face, UI.getProperty("selDotplotFontFace", "value"));

    _dlgUpdateExamples();
}

function _dlgSelectRadio(radioID)
{
    document.getElementById(radioID).click();
}

function _dlgResetPreferences()
{
    _dlgPref.writeDefaultPreferences();
    _dlgInitializePreferences();
}

_dlgInitializePreferences();
_dlgUI.writeLinkColorOriginRules();