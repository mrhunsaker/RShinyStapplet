var pref = SPAApplet.Preferences;
var format = SPAApplet.Format;
var UI = SPAApplet.UIHandlers;
var IV = SPAApplet.InputValidation;
var graphContainer = null;

function updateExamples()
{
    UI.setProperty("spnNumEx1", "innerHTML", format.formatNumber(31.4159));
    UI.setProperty("spnNumEx2", "innerHTML", format.formatNumber(1/7));
    UI.setProperty("spnNumEx3", "innerHTML", format.formatNumber(-21.3));
    UI.setProperty("spnPropEx", "innerHTML", format.formatProportion(0.3141592));
    if (!graphContainer)
    {
        graphContainer = new SPAApplet.QuantitativeGraphContainer("cnvExamplePlot");
        var exampleData = [1, 2, 2, 3, 4, 4, 5];
        graphContainer.addGraph(new SPAApplet.Boxplot(exampleData));
    }
    else
        graphContainer.renderGraphs();
}

function initializePreferences()
{
    for (var i = 1; i <= 2; i++)
    {
        var rdButton = document.getElementById("rdPropDisplay" + i);
        if (rdButton.value == pref.values.proportion.display_type)
            rdButton.checked = true;
    }
    
    for (var i = 1; i <= 3; i++)
    {
        var rdButton = document.getElementById("rdNumRounding" + i);
        if (rdButton.value == pref.values.number.rounding_type)
            rdButton.checked = true;
    }

    UI.setProperty("txtNumAutoPlaces", "value", pref.values.number.rounding_places.auto);
    UI.setProperty("txtNumFixedPlaces", "value", pref.values.number.rounding_places.fixed);
    UI.setProperty("txtNumPrecision", "value", pref.values.number.rounding_places.precision);
    UI.setProperty("txtPropPlaces", "value", pref.values.proportion.display_places);

    UI.setProperty("selDotplotBGColor", "value", pref.values.drawing.bg_color);
    UI.setProperty("selDotplotDotColor", "value", pref.values.drawing.fill_color);

    updateExamples();
}

function writeNumberRoundingPreferences(rdButton)
{
    pref.writePreference(pref.keys.number.rounding_type, rdButton.value);
    if (IV.validateInputInt("txtNumAutoPlaces", 0, 20, false, "spnNumAutoPlacesMsg"))
        pref.writePreference(pref.keys.number.rounding_places.auto, UI.getProperty("txtNumAutoPlaces", "value"));
    if (IV.validateInputInt("txtNumFixedPlaces", 0, 20, false, "spnNumFixedPlacesMsg"))
        pref.writePreference(pref.keys.number.rounding_places.fixed, UI.getProperty("txtNumFixedPlaces", "value"));
    if (IV.validateInputInt("txtNumPrecision", 1, 21, false, "spnNumPrecisionMsg"))
        pref.writePreference(pref.keys.number.rounding_places.precision, UI.getProperty("txtNumPrecision", "value"));

    updateExamples();
}

function writePropDisplayPreferences(rdButton)
{
    if (rdButton)
        pref.writePreference(pref.keys.proportion.display_type, rdButton.value);
    if (IV.validateInputInt("txtPropPlaces", 1, pref.values.zero_tolerance, false, "spnPropPlacesMsg"))
        pref.writePreference(pref.keys.proportion.display_places, UI.getProperty("txtPropPlaces", "value"));

    updateExamples();
}

function writeDotPlotColorPreferences()
{
    pref.writePreference(pref.keys.drawing.bg_color, UI.getProperty("selDotplotBGColor", "value"));
    pref.writePreference(pref.keys.drawing.fill_color, UI.getProperty("selDotplotDotColor", "value"));

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

UI.setOnLoad(initializePreferences);