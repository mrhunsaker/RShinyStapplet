// dotplot.js
// for SRiS Applets Test
// Robert Amar
// v1.0, 2/8/14
// v1.1, 7/10/14 -- includes counting dot and drawing code

var AXIS_HEIGHT = 50; // leave this many pixels for the axis
var AXIS_FONT_PX = 12; // use this px font on the axis
var AXIS_FONT = "Arial"; // name of axis font
var AXIS_PADDING_PROP = 0.05; // add this proportion of space on either side of the plot
var AXIS_MAJOR_TICK_PROP = 0.25; // what proportion of the axis height are major ticks
var AXIS_MINOR_TICK_PROP = 0.1; // what proportion of the axis height are minor ticks
var AXIS_MAJOR_TICK_MIN_PROP = 0.08; // a major tick must cover at least this much of the axis
var AXIS_MAJOR_TICK_MAX_PROP = 0.25; // a major tick cannot cover more than this much of the axis
var AXIS_MINOR_TICK_TOL_PROP = 0.12; // if major ticks are this far apart or more as a proportion of width, draw the minor ticks
var AXIS_TEXT_PADDING = 2; // how many pixels should separate labels vertically on the axis
var DOT_SIZE = 4; // diameter of dots on canvas in pixels
var TRI_SIZE = 10; // size of counting boundary triangle
var DOT_OUTLINE_WIDTH = 1; // context stroke size for dots
var DOT_MAX_SPACE = 5; // maximum space between dots
var DOT_OVERHEAD = 10; // attempt to leave at least this many pixels at the top of any dot plot

// Convenience / legacy wrapper: a map structure for all currently existing dotplots
var m_dotplots = {};

// Convenience / legacy method: This creates a new dotplot if necessary, or simply tells the old one to redraw itself
// A reference to the dotplot is returned
function dotplot(arr, canvasID, axisLabel, fnFormat, forceBin, forceMinX, forceMaxX)
{
    var obj = m_dotplots[canvasID];
    if (obj)
    {
        if (arr) obj.setData(arr);
        if (axisLabel) obj.axisLabel = axisLabel;
        if (fnFormat) obj.fnFormat = fnFormat;
        if (forceBin) obj.forceBin = forceBin;
        if (forceMinX) obj.forceMinX = forceMinX;
        if (forceMaxX) obj.forceMaxX = forceMaxX;
        
        if (forceBin || forceMinX || forceMaxX)
            if (obj.binnedData) delete obj.binnedData;
            
        obj.draw();
    }
    else
    {
        if (canvasSupported())
        {
            obj = new Dotplot(arr, canvasID, axisLabel, fnFormat, forceBin, forceMinX, forceMaxX);
            m_dotplots[canvasID] = obj;
        }
    }
    return obj;
}

// Convenience / legacy method: Returns any existing dotplot associated with the canvasID, or null if nothing exists.
function getDotplotForCanvas(canvasID)
{
    return m_dotplots[canvasID];
}

// Delete a dotplot for a given canvas.  This method will clear the given canvas before destroying the dotplot object.
function deleteDotplotForCanvas(canvasID)
{
    if (m_dotplots[canvasID])
    {
        var canvas = document.getElementById(canvasID);
        var ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        delete m_dotplots[canvasID];
    }
}

function Dotplot(arr, canvasID, axisLabel, fnFormat, forceBin, forceMinX, forceMaxX)
{
    this.setData(arr);
    this.canvasID = canvasID;
    this.axisLabel = axisLabel;
    this.fnFormat = fnFormat || formatNumber;
    this.forceBin = forceBin;
    this.forceMinX = forceMinX;
    this.forceMaxX = forceMaxX;
    this.draw();
}

// Call this to set the plotted data; do not set Dotplot.data directly.
Dotplot.prototype.setData = function(arr)
{
    // Shallow-copy and sort the data array.
    this.data = arr.slice(0);
    sortAscending(this.data);
    if (this.binnedData) delete this.binnedData;
}

// Give the count of dots relative to a certain boundary AND redraw the dotplot
Dotplot.prototype.countDots = function(countBoundary, dirIsGreater, givePercent)
{
    this.lastCountBoundary = countBoundary;
    this.lastCountDirGT = dirIsGreater;

    var numLess = 0;
    var retVal = 0;
    
    // Use the formatting preference of the dotplot, if specified, to round the data -- the idea here is that
    // whatever number is shown on screen, that's the boundary the user will probably input
    while(compareToWithinTolerance(
            parseFloat(this.fnFormat(this.data[numLess])),
            countBoundary) < 0) numLess++;
    if (!dirIsGreater)
    {
        while(compareToWithinTolerance(
                parseFloat(this.fnFormat(this.data[numLess])),
                countBoundary) === 0) numLess++;
        retVal = numLess;
    }
    else
        retVal = (this.data.length - numLess);
        
    this.draw();
    return (givePercent ? (retVal / this.data.length) : retVal);
}

// Remove any counting done on this dotplot.
Dotplot.prototype.clearCount = function()
{
    if ("undefined" !== typeof this.lastCountBoundary)
    {
        delete this.lastCountBoundary;
        delete this.lastCountDirGT;
    }
    this.draw();
}

// Plot dot plot on the given canvas.
//
// Precondition: data is sorted.
//
// Optional: forceMinX and forceMaxX force the maximum values _on the axis_ to
// be as specified.  No validation is done on any of these parameters.
Dotplot.prototype.draw = function()
{
    var dataMin = this.data[0];
    var dataMax = this.data[this.data.length - 1];
    var dataRange = dataMax - dataMin;
    var canvas = document.getElementById(this.canvasID);
    var canvasContext = canvas.getContext("2d");
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var visibleMin = (this.forceMinX ? this.forceMinX : dataMin);
    var visibleMax = (this.forceMaxX ? this.forceMaxX : dataMax);
    var visibleRange = visibleMax - visibleMin;
    if (visibleRange === 0) visibleRange = 1; // at least you get a little padding around the single dot

    var axisMin = visibleMin - visibleRange * AXIS_PADDING_PROP;
    var axisMax = visibleMax + visibleRange * AXIS_PADDING_PROP;
    var axisRange = axisMax - axisMin;

    // Determine axis markings.
    // Taken from StackExchange:
    // http://stackoverflow.com/questions/9890438/how-do-you-round-up-to-nearest-multiple-of-a-given-factor-with-floating-point-nu
    var baseTickIncrement = Math.pow(10, getPow10(axisRange));
    var multiplier = 1;

    // while the ticks are too big, make gross adjustments
    while (baseTickIncrement / axisRange > AXIS_MAJOR_TICK_MAX_PROP) baseTickIncrement /= 10;

    // while the ticks are too small, finely adjust them
    while (multiplier * baseTickIncrement / axisRange < AXIS_MAJOR_TICK_MIN_PROP) multiplier++;
    var tickIncrement = multiplier * baseTickIncrement;

    var firstTick = (axisMin < 0) ? Math.ceil(axisMin / tickIncrement) * tickIncrement
                                  : Math.floor(axisMin / tickIncrement) * tickIncrement;
    firstTick = roundWithinTolerance(firstTick);

    var plottedData;
    // If the data is forced to be binned, divide it into equal intervals of no less than DOT_SIZE (as drawn on screen) length.
    // Force each datum to the right to sit on the next boundary.
    if (PREF_DOTPLOT_BIN || this.forceBin)
    {
        if (!this.binnedData) // Don't repeat this work if you did it already!!
        {
            this.binnedData = this.data.slice(0);
            
            // If possible the bin increment should align to minor ticks, whether drawn or not.
            // If the minor ticks would cause the dots to overlap, just use the dot size to determine the bin increment.
            // If the minor ticks would cause the dots to be very far apart, use some division by an integer.
            var binIncrement = tickIncrement / 10;
            var minIncrement = DOT_SIZE / canvasWidth * axisRange;
            var maxIncrement = 2 * minIncrement;
            if (binIncrement < minIncrement) binIncrement = minIncrement;
            else
            {
                var incrementDivisor = 1;
                while ((binIncrement / incrementDivisor) > maxIncrement) incrementDivisor++;
                binIncrement /= incrementDivisor;
            }
            
            var dataCounter = 0;
            var currBinBound = firstTick;
            
            // Find the first bin as follows: Start at the first major tick to be drawn and back up until you go past 0, then
            // correct if necessary.  Sad, I know.
            while (compareToWithinTolerance(currBinBound, axisMin) > 0) currBinBound -= binIncrement;
            if (compareToWithinTolerance(currBinBound, axisMin) < 0) currBinBound += binIncrement;
    
            for (var i = 0; i < this.binnedData.length; i++)
            {
                while (compareToWithinTolerance(this.binnedData[i], currBinBound) > 0)
                    currBinBound += binIncrement;
                this.binnedData[i] = currBinBound;
            }
        }
        plottedData = this.binnedData;
    }
    else // If the data is not forced to be binned, simply use the reference to the data
    {
        plottedData = this.data;
    }
    
    // Determine if minor ticks are more useful for this current range.  If
    // the current tickIncrement would cover more than a certain part of the range,
    // you should also draw minor ticks.
    var drawMinorTicks = (tickIncrement / axisRange > AXIS_MINOR_TICK_TOL_PROP);
    if (drawMinorTicks) tickIncrement /= 10.0;

    // Assign a "dotting index" to each member of the data.
    var arrDotIndex = new Array(plottedData.length);
    var prevDatum = NaN;
    var currDotIndex = 0;
    var maxDotIndex = 1;
    for (var i = 0; i < plottedData.length; i++)
    {
        if (compareToWithinTolerance(plottedData[i], prevDatum) === 0)
        {
            currDotIndex++;
            if (currDotIndex > maxDotIndex)
                maxDotIndex = currDotIndex;
        }
        else
            currDotIndex = 1;

        arrDotIndex[i] = currDotIndex;
        prevDatum = plottedData[i];
    }
    
    // Draw background
    canvasContext.fillStyle = PREF_DOTPLOT_BACKGROUND_COLOR;
    canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Dot plot setup
    var drawBottom = canvasHeight - AXIS_HEIGHT;
    var drawRange = canvasWidth - DOT_SIZE * 2;
    var dotPixelYIncrement = Math.min(DOT_SIZE + DOT_MAX_SPACE, (drawBottom - DOT_OVERHEAD) / maxDotIndex);
    canvasContext.fillStyle = PREF_DOTPLOT_DOT_COLOR;
    canvasContext.strokeStyle = PREF_DOTPLOT_LINE_COLOR;

    // Draw the axis
    var axisY = drawBottom + DOT_SIZE;
    canvasContext.beginPath();
    canvasContext.moveTo(0, axisY);
    canvasContext.lineTo(canvasWidth, axisY);
    canvasContext.stroke();

    // If it is supported, make the x=0 line dashed
    if (canvasContext.setLineDash)
        canvasContext.setLineDash([5, 5]);

    // Draw the x=0 line
    var zeroLineX = -axisMin / axisRange * drawRange;
    if (zeroLineX > 0 && zeroLineX < canvasWidth)
    {
        canvasContext.beginPath();
        canvasContext.moveTo(zeroLineX, 0);
        canvasContext.lineTo(zeroLineX, axisY);
        canvasContext.stroke();
    }

    // Return to normal stroke style
    if (canvasContext.setLineDash)
        canvasContext.setLineDash([]);

    // Draw the dots    
    for (var i = 0; i < plottedData.length; i++)
    {
        var centerX = (plottedData[i] - axisMin) / axisRange * drawRange;
        var centerY = drawBottom - dotPixelYIncrement * (arrDotIndex[i] - 1) - DOT_SIZE / 2;        
        canvasContext.beginPath();
        canvasContext.arc(centerX, centerY, DOT_SIZE / 2, 0, 2 * Math.PI, false);
        canvasContext.fill();
        canvasContext.lineWidth = DOT_OUTLINE_WIDTH;
        canvasContext.stroke();
    }
    
    canvasContext.font = AXIS_FONT_PX + "px " + AXIS_FONT;
    canvasContext.fillStyle = PREF_DOTPLOT_LINE_COLOR;

    // Draw ticks until you run out of axis
    for (var currTick = firstTick; currTick < axisMax; currTick += tickIncrement)
    {
        // Major tick
        var tickX = (currTick - axisMin) / axisRange * drawRange;
        var tickLength = AXIS_MAJOR_TICK_PROP * AXIS_HEIGHT;

        if (tickX > 0 && tickX < canvasWidth)
        {
            canvasContext.beginPath();
            canvasContext.moveTo(tickX, axisY);
            canvasContext.lineTo(tickX, axisY + tickLength);
            canvasContext.stroke();
            var tickLabel = this.fnFormat(currTick);
            var tickLabelWidth = canvasContext.measureText(tickLabel).width;
            canvasContext.fillText(tickLabel, tickX - tickLabelWidth / 2,
                axisY + AXIS_FONT_PX + tickLength + AXIS_TEXT_PADDING);    
        }

        // Minor ticks
        if (drawMinorTicks)               
        {
            tickLength = AXIS_MINOR_TICK_PROP * AXIS_HEIGHT;
            for (var i = 1; i < 10; i++)
            {
                currTick += tickIncrement;
                tickX = (currTick - axisMin) / axisRange * drawRange;
                if (tickX > 0 && tickX < canvasWidth)
                {
                    canvasContext.beginPath();
                    canvasContext.moveTo(tickX, axisY);
                    canvasContext.lineTo(tickX, axisY + tickLength);
                    canvasContext.stroke();
                }
            }
        }
    }
    
    // Label the axis
    canvasContext.beginPath();
    if (!this.axisLabel) this.axisLabel = "Data";
    var axisLabelWidth = canvasContext.measureText(this.axisLabel).width;
    canvasContext.fillText(this.axisLabel, canvasWidth / 2 - axisLabelWidth / 2,
        axisY + AXIS_MAJOR_TICK_PROP * AXIS_HEIGHT + 2 * AXIS_FONT_PX + 2 * AXIS_TEXT_PADDING);

    // Draw the counting boundary and direction, if necessary
    if ("undefined" !== typeof this.lastCountBoundary) // This is only set as a property if a count has been requested ever
    {
        var countBoundX;
        var triDelta = TRI_SIZE / 2 * Math.sqrt(3) * (this.lastCountDirGT ? 1 : -1);

        // use a middling gray
        canvasContext.strokeStyle = "#999999";
        canvasContext.fillStyle = "#999999";

        var apparentMin = parseFloat(this.fnFormat(axisMin));
        var apparentMax = parseFloat(this.fnFormat(axisMax));
        
        if (this.lastCountBoundary <= apparentMin)
            countBoundX = (this.lastCountDirGT ? 0 : -triDelta);
        else if (this.lastCountBoundary <= apparentMax)
        {
            var apparentRange = apparentMax - apparentMin;
            countBoundX = (this.lastCountBoundary - apparentMin) / apparentRange * drawRange;

            // Since this is the only case where a counting bound is necessary to draw,
            // draw it here
            if (canvasContext.setLineDash)
                canvasContext.setLineDash([2, 2]);

            canvasContext.beginPath();
            canvasContext.moveTo(countBoundX, 0);
            canvasContext.lineTo(countBoundX, axisY);
            canvasContext.stroke();
            
            if (canvasContext.setLineDash)
                canvasContext.setLineDash([]);
                
            // If the flag would run offscreen, keep it from doing so
            if (this.lastCountDirGT && countBoundX > (canvasWidth - triDelta))
                countBoundX = canvasWidth - triDelta;
            else if (!this.lastCountDirGT && countBoundX < -triDelta)
                countBounX = -triDelta;
        }
        else
            countBoundX = (this.lastCountDirGT ? canvasWidth - triDelta : canvasWidth);
        
        // Draw a triangle representing counting direction
        canvasContext.beginPath();
        canvasContext.moveTo(countBoundX, 0);
        canvasContext.lineTo(countBoundX, TRI_SIZE);
        canvasContext.lineTo(countBoundX + triDelta, TRI_SIZE / 2);
        canvasContext.lineTo(countBoundX, 0);
        canvasContext.fill();
    }
}

/* The Dead Code Depository (TM) -- stuff that maybe should work later if the
issues can be worked out.

var d_resizeCanvasCallbacks = {}; // we will eventually map canvasIDs to callback functions

function d_fnResizeListener()
{
    for (var canvasID in d_resizeCanvasCallbacks)
    {
        var canvas = document.getElementById(canvasID);
        var parent = canvas.parentNode;
        canvas.width = parent.width;
        canvas.height = parent.height;
        
        d_resizeCanvasCallbacks[canvasID]();
    }
}

// Convenience method for adding a resize listener.  It will take a function for
// callback that takes no parameters; you have to provide drawing logic in your
// callback.
function addResizeListener(containerID, canvasID, callback)
{
    var container = document.getElementById(containerID);
    if (container.addEventListener)
        container.addEventListener("resize", function(){alert('debug');}, false);
    else if (container.attachEvent)
        container.attachEvent("onresize", d_fnResizeListener);
        
    d_resizeCanvasCallbacks[canvasID] = callback;
}
*/
