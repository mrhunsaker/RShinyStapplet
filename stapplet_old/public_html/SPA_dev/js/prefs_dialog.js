// Avoid namespace collisions
var _dlgPref = SPAApplet.Preferences;
var _dlgFormat = SPAApplet.Format;
var _dlgUI = SPAApplet.UIHandlers;
var _dlgIV = SPAApplet.InputValidation;
var _dlgGraphContainer = null;

function _dlgUpdateExamples()
{
    _dlgUI.setProperty("spnNumEx1", "innerHTML", _dlgFormat.formatNumber(31.4159));
    _dlgUI.setProperty("spnNumEx2", "innerHTML", _dlgFormat.formatNumber(1/7));
    _dlgUI.setProperty("spnNumEx3", "innerHTML", _dlgFormat.formatNumber(-21.3));
    _dlgUI.setProperty("spnPropEx", "innerHTML", _dlgFormat.formatProportion(0.3141592));
    if (!_dlgGraphContainer)
    {
        _dlgGraphContainer = new SPAApplet.QuantitativeGraphContainer("cnvExamplePlot");
        var exampleData = [1, 2, 2, 3, 4, 4, 5];
        _dlgGraphContainer.addGraph(new SPAApplet.Boxplot(exampleData));
    }
    else
        _dlgGraphContainer.renderGraphs();
}

function _dlgInitializePreferences()
{
    for (var i = 1; i <= 2; i++)
    {
        var rdButton = document.getElementById("rdPropDisplay" + i);
        if (rdButton.value == _dlgPref.values.proportion.display_type)
            rdButton.checked = true;
    }
    
    for (var i = 1; i <= 3; i++)
    {
        var rdButton = document.getElementById("rdNumRounding" + i);
        if (rdButton.value == _dlgPref.values.number.rounding_type)
            rdButton.checked = true;
    }

    _dlgUI.setProperty("txtNumAutoPlaces", "value", _dlgPref.values.number.rounding_places.auto);
    _dlgUI.setProperty("txtNumFixedPlaces", "value", _dlgPref.values.number.rounding_places.fixed);
    _dlgUI.setProperty("txtNumPrecision", "value", _dlgPref.values.number.rounding_places.precision);
    _dlgUI.setProperty("txtPropPlaces", "value", _dlgPref.values.proportion.display_places);

    _dlgUI.setProperty("selDotplotBGColor", "value", _dlgPref.values.drawing.bg_color);
    _dlgUI.setProperty("selDotplotDotColor", "value", _dlgPref.values.drawing.fill_color);

    _dlgUpdateExamples();
}

function _dlgWriteNumberRoundingPreferences(rdButton)
{
    _dlgPref.writePreference(_dlgPref.keys.number.rounding_type, rdButton.value);
    if (_dlgIV.validateInputInt("txtNumAutoPlaces", 0, 20, false, "spnNumAutoPlacesMsg"))
        _dlgPref.writePreference(_dlgPref.keys.number.rounding_places.auto, _dlgUI.getProperty("txtNumAutoPlaces", "value"));
    if (_dlgIV.validateInputInt("txtNumFixedPlaces", 0, 20, false, "spnNumFixedPlacesMsg"))
        _dlgPref.writePreference(_dlgPref.keys.number.rounding_places.fixed, _dlgUI.getProperty("txtNumFixedPlaces", "value"));
    if (_dlgIV.validateInputInt("txtNumPrecision", 1, 21, false, "spnNumPrecisionMsg"))
        _dlgPref.writePreference(_dlgPref.keys.number.rounding_places.precision, _dlgUI.getProperty("txtNumPrecision", "value"));

    _dlgUpdateExamples();
}

function _dlgWritePropDisplayPreferences(rdButton)
{
    if (rdButton)
        _dlgPref.writePreference(_dlgPref.keys.proportion.display_type, rdButton.value);
    if (_dlgIV.validateInputInt("txtPropPlaces", 1, _dlgPref.values.zero_tolerance, false, "spnPropPlacesMsg"))
        _dlgPref.writePreference(_dlgPref.keys.proportion.display_places, _dlgUI.getProperty("txtPropPlaces", "value"));

    _dlgUpdateExamples();
}

function _dlgWriteDotPlotColorPreferences()
{
    _dlgPref.writePreference(_dlgPref.keys.drawing.bg_color, _dlgUI.getProperty("selDotplotBGColor", "value"));
    _dlgPref.writePreference(_dlgPref.keys.drawing.fill_color, _dlgUI.getProperty("selDotplotDotColor", "value"));

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