// The current preferences version
var PREF_VERSION = "1.01";
var PREF_KEY_VERSION = "version";
var PREF_KEY_BASE = "SRIS.";

var PREF_NUM_ROUNDING_TYPE; // "auto", "fixed" or "precision"
var PREF_NUM_ROUNDING_AUTO_PLACES;
var PREF_NUM_ROUNDING_FIXED_PLACES;
var PREF_NUM_ROUNDING_PRECISION;

var PREF_KEY_NUM_ROUNDING_TYPE = "num_rounding";
var PREF_KEY_NUM_ROUNDING_FIXED_PLACES = PREF_KEY_NUM_ROUNDING_TYPE + ".fixed_places";
var PREF_KEY_NUM_ROUNDING_PRECISION = PREF_KEY_NUM_ROUNDING_TYPE + ".precision";
var PREF_KEY_NUM_ROUNDING_AUTO_PLACES = PREF_KEY_NUM_ROUNDING_TYPE + ".auto_places";

var PREF_PROP_DISPLAY_TYPE; // "proportion" or "percent"
var PREF_PROP_DISPLAY_PLACES;

var PREF_KEY_PROP_DISPLAY_TYPE = "prop_display";
var PREF_KEY_PROP_DISPLAY_PLACES = PREF_KEY_PROP_DISPLAY_TYPE + ".places";

var PREF_ZERO_TOLERANCE_PLACES;
var PREF_KEY_ZERO_TOLERANCE_PLACES = "zero_tol_places";

var PREF_DOTPLOT_BIN;
var PREF_DOTPLOT_BACKGROUND_COLOR;
var PREF_DOTPLOT_DOT_COLOR;
var PREF_DOTPLOT_LINE_COLOR;

var PREF_KEY_DOTPLOT_BIN = "dotplot.bin";
var PREF_KEY_DOTPLOT_BACKGROUND_COLOR = "dotplot.background_color";
var PREF_KEY_DOTPLOT_DOT_COLOR = "dotplot.dot_color";
var PREF_KEY_DOTPLOT_LINE_COLOR = "dotplot.line_color";

// Remove a preference
function removePreference(key, omitBase)
{
   var base = (omitBase ? "" : PREF_KEY_BASE);
   try
   {
   	window.localStorage.removeItem(base + key);
   } catch (e)
   {
   	try
   	{
   		window.sessionStorage.removeItem(base + key);
   	} catch (e)
   	{ }
   }
}

// Remove all preferences
function removeAllPreferences()
{
    removePreference(PREF_KEY_VERSION);
    removePreference(PREF_KEY_VERSION, true);
    
    removePreference(PREF_KEY_NUM_ROUNDING_TYPE);
    removePreference(PREF_KEY_NUM_ROUNDING_TYPE, true);
    removePreference(PREF_KEY_NUM_ROUNDING_AUTO_PLACES);
    removePreference(PREF_KEY_NUM_ROUNDING_AUTO_PLACES, true);
    removePreference(PREF_KEY_NUM_ROUNDING_FIXED_PLACES);
    removePreference(PREF_KEY_NUM_ROUNDING_FIXED_PLACES, true);
    removePreference(PREF_KEY_NUM_ROUNDING_PRECISION);
    removePreference(PREF_KEY_NUM_ROUNDING_PRECISION, true);

    removePreference(PREF_KEY_PROP_DISPLAY_TYPE);
    removePreference(PREF_KEY_PROP_DISPLAY_TYPE, true);
    removePreference(PREF_KEY_PROP_DISPLAY_PLACES);
    removePreference(PREF_KEY_PROP_DISPLAY_PLACES, true);

    removePreference(PREF_KEY_ZERO_TOLERANCE_PLACES);
    removePreference(PREF_KEY_ZERO_TOLERANCE_PLACES, true);
    
    removePreference(PREF_KEY_DOTPLOT_BIN);
    removePreference(PREF_KEY_DOTPLOT_BIN, true);
    removePreference(PREF_KEY_DOTPLOT_BACKGROUND_COLOR);
    removePreference(PREF_KEY_DOTPLOT_BACKGROUND_COLOR, true);
    removePreference(PREF_KEY_DOTPLOT_DOT_COLOR);
    removePreference(PREF_KEY_DOTPLOT_DOT_COLOR, true);
    removePreference(PREF_KEY_DOTPLOT_LINE_COLOR);
    removePreference(PREF_KEY_DOTPLOT_LINE_COLOR, true);
}

// Writes the default preferences, clearing out any stored preferences.
function writeDefaultPreferences()
{
    removeAllPreferences();
            
    writePreference(PREF_KEY_VERSION, PREF_VERSION);
    
    writePreference(PREF_KEY_NUM_ROUNDING_TYPE, "auto");
    writePreference(PREF_KEY_NUM_ROUNDING_AUTO_PLACES, "3");
    writePreference(PREF_KEY_NUM_ROUNDING_FIXED_PLACES, "3");
    writePreference(PREF_KEY_NUM_ROUNDING_PRECISION, "3");

    writePreference(PREF_KEY_PROP_DISPLAY_TYPE, "proportion");
    writePreference(PREF_KEY_PROP_DISPLAY_PLACES, "3");

    writePreference(PREF_KEY_ZERO_TOLERANCE_PLACES, "8");
    
    writePreference(PREF_KEY_DOTPLOT_BIN, "true");
    writePreference(PREF_KEY_DOTPLOT_BACKGROUND_COLOR, "#FFFFCC");
    writePreference(PREF_KEY_DOTPLOT_DOT_COLOR, "#993399");
    writePreference(PREF_KEY_DOTPLOT_LINE_COLOR, "#000000");
}

// Loads preferences.
// Always call this method before attempting to use anything with preferences.
// OPTIONAL: bSkipPrefsCheck - do not check to see if there are existing
//   prefs or if the version is right -- mainly for internal use, may cause errors
function loadPreferences(bSkipPrefsCheck)
{
    var preferredGet = null;
    var version = window.sessionStorage.getItem(PREF_KEY_BASE + PREF_KEY_VERSION);
    if (!version)
    {
    	preferredGet = function(key) { return window.localStorage.getItem(PREF_KEY_BASE + key); };
    	version = window.localStorage.getItem(PREF_KEY_BASE + PREF_KEY_VERSION);
    }
    else
    	preferredGet = function(key) { return window.sessionStorage.getItem(PREF_KEY_BASE + key); };
    
    // If preferences have never been written before or if the version string
    // does not match, write the default preferences first, then load again,
    // unless we are skipping the prefs check
    if (!bSkipPrefsCheck) 
    {
        if (!version || (version != PREF_VERSION))
        {
            writeDefaultPreferences();
            loadPreferences(true);
        }
    }
    
    // Read the current preferences into memory.
	PREF_NUM_ROUNDING_TYPE = preferredGet(PREF_KEY_NUM_ROUNDING_TYPE);
	PREF_NUM_ROUNDING_FIXED_PLACES = parseInt(preferredGet(PREF_KEY_NUM_ROUNDING_FIXED_PLACES));
	PREF_NUM_ROUNDING_PRECISION = parseInt(preferredGet(PREF_KEY_NUM_ROUNDING_PRECISION));
	PREF_NUM_ROUNDING_AUTO_PLACES = parseInt(preferredGet(PREF_KEY_NUM_ROUNDING_AUTO_PLACES));
	
	PREF_PROP_DISPLAY_TYPE = preferredGet(PREF_KEY_PROP_DISPLAY_TYPE);
	PREF_PROP_DISPLAY_PLACES = parseInt(preferredGet(PREF_KEY_PROP_DISPLAY_PLACES));
	
	PREF_ZERO_TOLERANCE_PLACES = parseInt(preferredGet(PREF_KEY_ZERO_TOLERANCE_PLACES));
	
	PREF_DOTPLOT_BIN = (preferredGet(PREF_KEY_DOTPLOT_BIN) == "true" ? true : false);
	PREF_DOTPLOT_BACKGROUND_COLOR = preferredGet(PREF_KEY_DOTPLOT_BACKGROUND_COLOR);
	PREF_DOTPLOT_DOT_COLOR = preferredGet(PREF_KEY_DOTPLOT_DOT_COLOR);
	PREF_DOTPLOT_LINE_COLOR = preferredGet(PREF_KEY_DOTPLOT_LINE_COLOR);
}

// Write a preference.  This does not reload the preferences; you will have to
// manually reload the preferences on your page if you are dynamically changing
// them on the same page where they matter.
// If either parameter is null or undefined, the entire operation is ignored.
function writePreference(key, value)
{
    if (key && value)
    {
        try
        {
            window.localStorage.setItem(PREF_KEY_BASE + key, value);
        } catch (e)
        {
        	try
        	{
        		window.sessionStorage.setItem(PREF_KEY_BASE + key, value);
        	} catch (e) { }
        }
    }
}

// What power of 10 is the most significant digit of the argument?
function getPow10(val)
{
    var expForm = (new Number(val)).toExponential(PREF_ZERO_TOLERANCE_PLACES);
    return parseFloat(expForm.slice(expForm.indexOf("e") + 1));
}

// Is the argument zero within tolerance?
function isZeroWithinTolerance(val, tol)
{
    if (!tol) tol = PREF_ZERO_TOLERANCE_PLACES;
    return (Math.abs(val) < Math.pow(10, -tol));
}

// Attempt to round numbers within tolerance of 0
function roundWithinTolerance(val, tol)
{
    if (!tol) tol = PREF_ZERO_TOLERANCE_PLACES;
    return parseFloat((new Number(val)).toFixed(tol));
}

// Comparator-style function for comparing two floating point values
function compareToWithinTolerance(num1, num2, tol)
{
    if (!tol) tol = PREF_ZERO_TOLERANCE_PLACES;
    return roundWithinTolerance(num1 - num2, tol);
}

// Format a proportion as a String according to preferences.
function formatProportion(p)
{
    if (PREF_PROP_DISPLAY_TYPE == "proportion")
        return "" + parseFloat((new Number(p)).toFixed(PREF_PROP_DISPLAY_PLACES));
    else if (PREF_PROP_DISPLAY_PLACES > 1) // percent
        return "" + parseFloat((new Number(p * 100)).toFixed(PREF_PROP_DISPLAY_PLACES - 2)) + "%";
    else
        return "" + (new Number(p * 100)).toPrecision(1) + "%";
}

// Format a decimal as a String according to preferences.
function formatNumber(num)
{
    var val = roundWithinTolerance(num);

    if (PREF_NUM_ROUNDING_TYPE == "fixed")
        return (new Number(val)).toFixed(PREF_NUM_ROUNDING_FIXED_PLACES);
    else if (PREF_NUM_ROUNDING_TYPE == "precision")
        return (new Number(val)).toPrecision(PREF_NUM_ROUNDING_PRECISION);
    else
        return "" + parseFloat((new Number(val)).toFixed(PREF_NUM_ROUNDING_AUTO_PLACES));
}

// The preferences will be loaded ONCE for you automatically.  After that you
// are on your own!
loadPreferences();