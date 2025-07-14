var pref = STAP.Preferences;
var format = STAP.Format;
var UI = STAP.UIHandlers;
var IV = STAP.InputValidation;
var graph = null;
var graphData = null;

function updateExamples()
{
    UI.setProperty("spnNumEx1", "innerHTML", format.formatNumber(31.4159));
    UI.setProperty("spnNumEx2", "innerHTML", format.formatNumber(1/7));
    UI.setProperty("spnNumEx3", "innerHTML", format.formatNumber(-21.3));
    UI.setProperty("spnPropEx", "innerHTML", format.formatProportion(0.3141592));
    graph.boxplot(graphData, "Variable");
}

function initializePreferences()
{
    for (var i = 1; i <= 2; i++)
    {
        var rdButton = document.getElementById("rdPropDisplay" + i);
        if (rdButton.value == pref.getPreference(pref.keys.proportion.display_type))
            rdButton.checked = true;
    }
    
    for (var i = 1; i <= 3; i++)
    {
        var rdButton = document.getElementById("rdNumRounding" + i);
        if (rdButton.value == pref.getPreference(pref.keys.number.rounding_type))
            rdButton.checked = true;
    }

    UI.setProperty("txtNumAutoPlaces", "value", pref.getPreference(pref.keys.number.rounding_places.auto));
    UI.setProperty("txtNumFixedPlaces", "value", pref.getPreference(pref.keys.number.rounding_places.fixed));
    UI.setProperty("txtNumPrecision", "value", pref.getPreference(pref.keys.number.rounding_places.precision));
    UI.setProperty("txtPropPlaces", "value", pref.getPreference(pref.keys.proportion.display_places));

    UI.setProperty("selDotplotBGColor", "value", pref.getPreference(pref.keys.drawing.bg_color));
    UI.setProperty("selDotplotDotColor", "value", pref.getPreference(pref.keys.drawing.fill_color));

    UI.setProperty("selDotplotFontFace", "value", pref.getPreference(pref.keys.drawing.font_face));
    UI.setProperty("selDotplotFontSize", "value", pref.getPreference(pref.keys.drawing.font_size));
    
    if (!graph) graph = new STAP.SVGGraph("divPlot", 400, 200);
    if (!graphData) graphData = STAP.Utility.arrayToGraphData([1, 2, 2, 3, 4, 4, 5], "Variable");

    updateExamples();
}

function writeNumberRoundingPreferences(rdButton)
{
    pref.setPreference(pref.keys.number.rounding_type, rdButton.value);
    if (IV.validateInputInt("txtNumAutoPlaces", 0, 20, false, "spnNumAutoPlacesMsg"))
        pref.setPreference(pref.keys.number.rounding_places.auto, UI.getProperty("txtNumAutoPlaces", "value"));
    if (IV.validateInputInt("txtNumFixedPlaces", 0, 20, false, "spnNumFixedPlacesMsg"))
        pref.setPreference(pref.keys.number.rounding_places.fixed, UI.getProperty("txtNumFixedPlaces", "value"));
    if (IV.validateInputInt("txtNumPrecision", 1, 21, false, "spnNumPrecisionMsg"))
        pref.setPreference(pref.keys.number.rounding_places.precision, UI.getProperty("txtNumPrecision", "value"));

    updateExamples();
}

function writePropDisplayPreferences(rdButton)
{
    if (rdButton)
        pref.setPreference(pref.keys.proportion.display_type, rdButton.value);
    if (IV.validateInputInt("txtPropPlaces", 1, pref.getPreference(pref.keys.zero_tolerance), false, "spnPropPlacesMsg"))
        pref.setPreference(pref.keys.proportion.display_places, UI.getProperty("txtPropPlaces", "value"));

    updateExamples();
}

function writeDotPlotColorPreferences()
{
    pref.setPreference(pref.keys.drawing.bg_color, UI.getProperty("selDotplotBGColor", "value"));
    pref.setPreference(pref.keys.drawing.fill_color, UI.getProperty("selDotplotDotColor", "value"));

    updateExamples();
}

function writeDotPlotFontPreferences()
{
    pref.setPreference(pref.keys.drawing.font_size, UI.getProperty("selDotplotFontSize", "value"));
    pref.setPreference(pref.keys.drawing.font_face, UI.getProperty("selDotplotFontFace", "value"));

    updateExamples();
}

function selectRadio(radioID)
{
    document.getElementById(radioID).click();
}

function resetPreferences()
{
    pref.writeDefaultPreferences();
    initializePreferences();
}

function initializePage()
{
    initializePreferences();
    UI.writeLinkColorOriginRules();
}

UI.setOnLoad(initializePage);