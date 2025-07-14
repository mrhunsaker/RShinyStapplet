// Robert Amar
// ui_handlers.js
// Handles gruntwork of UI tasks for a little bit more cleanliness in page code.

// Set the control with the given ID to have the given value for property propName
function ui_setProperty(id, propName, value)
{
    var elt = document.getElementById(id);
    if (elt) elt[propName] = value;
}

// Give array of control IDs to have the given value for property propName
function ui_batchSetProperty(arr, propName, value)
{
    for (var i = 0; i < arr.length; i++) ui_setProperty(arr[i], propName, value);
}

// The typical logic for implementing dot plot counting
function ui_handleCount(txtCountBoundId, cnvPlotId, selCountTypeId, selCountDirId, spnCountResultId, btnClearCountId)
{
    if (!canvasSupported()) return;
    
    if (!txtCountBoundId) txtCountBoundId = "txtCountBound";
    if (!cnvPlotId) cnvPlotId = "cnvPlot";
    if (!selCountTypeId) selCountTypeId = "selCountType";
    if (!selCountDirId) selCountDirId = "selCountDir";
    if (!spnCountResultId) spnCountResultId = "spnCountResult";
    if (!btnClearCountId) btnClearCountId = "btnClearCount";

    if (validateInputFloat(txtCountBoundId, -Number.MAX_VALUE, Number.MAX_VALUE, false))
        recordInputState(txtCountBoundId);
    else if (hasInputState(txtCountBoundId))
        resetInputState(txtCountBoundId);
    else
        return;

    var formatAsPercent = (document.getElementById(selCountTypeId).value == "percent");
    var count = getDotplotForCanvas(cnvPlotId).countDots(
        parseFloat(document.getElementById(txtCountBoundId).value),
        (document.getElementById(selCountDirId).value == "greater"),
        formatAsPercent
    );
    document.getElementById(btnClearCountId).disabled = false;
    document.getElementById(spnCountResultId).innerHTML = "<B>" + 
        (formatAsPercent ? formatNumber(count * 100) + "% of dots" : count + " dot(s)") + "</B> are " +
        document.getElementById(selCountDirId).value + " than or equal to the specified value.";
}

// The typical logic for clearing out the count from a dot plot
// Be sure you call this if the applet is reset
function ui_clearCount(txtCountBoundId, cnvPlotId, spnCountResultId, btnClearCountId)
{
    if (!canvasSupported()) return;

    if (!txtCountBoundId) txtCountBoundId = "txtCountBound";
    if (!cnvPlotId) cnvPlotId = "cnvPlot";
    if (!spnCountResultId) spnCountResultId = "spnCountResult";
    if (!btnClearCountId) btnClearCountId = "btnClearCount";

    var plot = getDotplotForCanvas(cnvPlotId);
    if (plot) plot.clearCount();
    document.getElementById(btnClearCountId).disabled = true;
    document.getElementById(spnCountResultId).innerHTML = "";
    clearInputState(txtCountBoundId);
}

function ui_setOnLoad(func)
{
    if (window.addEventListener)
        window.addEventListener("load", func, false);
    else if (window.attachEvent)
        window.attachEvent("onload", func);
    else if (window.onload)
        window.onload = func;
}

// Thanks to http://stackoverflow.com/questions/8830839/javascript-dom-remove-element
function ui_removeElement(id)
{
    var elt = document.getElementById(id);
    if (elt) elt.parentNode.removeChild(elt);
}

function ui_removeElements(ids)
{
    for (var i = 0; i < ids.length; i++) ui_removeElement(ids[i]);
}