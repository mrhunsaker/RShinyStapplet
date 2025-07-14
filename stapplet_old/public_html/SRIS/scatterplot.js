// scatterplot.js
// for SRiS Applets Test
// Robert Amar
// v1.0, 2/12/14
//
// Quick-and-dirty scatterplot functionality.

//var X_AXIS_HEIGHT = 50; // leave this many pixels for the axis
//var Y_AXIS_HEIGHT = 50; // leave this many pixels for the axis
var AXIS_FONT_PX = 12; // use this px font on the axis
var AXIS_FONT = "Arial"; // name of axis font
var AXIS_PADDING_PROP = 0.05; // add this proportion of space on either side of the plot
var AXIS_MAJOR_TICK_LENGTH = 8; // what proportion of the axis height are major ticks
var AXIS_MINOR_TICK_LENGTH = 4; // what proportion of the axis height are minor ticks
var AXIS_MAJOR_TICK_MIN_PROP = 0.08; // a major tick must cover at least this much of the axis
var AXIS_MAJOR_TICK_MAX_PROP = 0.25; // a major tick cannot cover more than this much of the axis
var AXIS_MINOR_TICK_TOL_PROP = 0.12; // if major ticks are this far apart or more as a proportion of width, draw the minor ticks
var NUM_MINOR_TICKS = 4;
var AXIS_TEXT_PADDING = 2; // how many pixels should separate labels vertically on the axis
var SP_DOT_SIZE = 4; // diameter of dots on canvas in pixels
var SP_DOT_OUTLINE_WIDTH = 1; // context stroke size for dots
var LSRL_COLOR = "#CC99FF"; // sorta light purplish

function Pair(x, y)
{
    this.x = x;
    this.y = y;
}

Pair.prototype.getRange = function() { return this.y - this.x; }
Pair.prototype.normalize = function(pair1, pair2)
{
    this.x = (this.x - pair1.x) / pair1.getRange();
    this.y = (this.y - pair2.x) / pair2.getRange();
}

// Returns a object with tickIncrement and firstTick properties.
function calculateAxisParameters(axisPair)
{
    var ret = {};
    var axisRange = axisPair.getRange();
    
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

    var firstTick = (axisPair.x < 0) ? Math.ceil(axisPair.x / tickIncrement) * tickIncrement
                                  : Math.floor(axisPair.x / tickIncrement) * tickIncrement;
    firstTick = roundWithinTolerance(firstTick);

    ret.tickIncrement = tickIncrement;
    ret.firstTick = firstTick;
    return ret;
}

// Plot scatterplot on the given canvas.
//
// PRECONDITION: arrX and arrY are numeric arrays of equal length.

function scatterplot(arrXdata, arrYdata, canvasID, xAxisLabel, yAxisLabel, bPlotLSRL, fnFormat, forceMinX, forceMaxX, forceMinY, forceMaxY)
{
    var arrX = arrXdata.slice(0);
    var arrY = arrYdata.slice(0);
    var minX = (forceMinX ? forceMinX : randomSelect(arrX, 1));
    var maxX = (forceMaxX ? forceMaxX : randomSelect(arrX, arrX.length));
    var minY = (forceMinY ? forceMinY : randomSelect(arrY, 1));
    var maxY = (forceMaxY ? forceMaxY : randomSelect(arrY, arrY.length));

    var xAxisPair = new Pair(minX - Math.max(0.1, maxX - minX) * AXIS_PADDING_PROP,
                             maxX + Math.max(0.1, maxX - minX) * AXIS_PADDING_PROP);
    var yAxisPair = new Pair(minY - Math.max(0.1, maxY - minY) * AXIS_PADDING_PROP,
                             maxY + Math.max(0.1, maxY - minY) * AXIS_PADDING_PROP);

    var canvas = document.getElementById(canvasID);
    var canvasContext = canvas.getContext("2d");
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    canvasContext.font = AXIS_FONT_PX + "px " + AXIS_FONT;

    // How far does the x-axis have to be off the bottom?
    var xAxisDrawHeight = AXIS_MAJOR_TICK_LENGTH + AXIS_FONT_PX * 2 + AXIS_TEXT_PADDING * 3; // extra padding for bottom edge
    
    // How far does the y-axis have to be off the left?
    var yAxisDrawWidth = AXIS_MAJOR_TICK_LENGTH + canvasContext.measureText(fnFormat ? fnFormat(maxY) : formatNumber(maxY)).width
                        + AXIS_TEXT_PADDING * 3 + AXIS_FONT_PX;
    
    var drawWidth = canvasWidth - yAxisDrawWidth;
    var drawHeight = canvasHeight - xAxisDrawHeight;
    var xAxisParameters = calculateAxisParameters(xAxisPair);
    var yAxisParameters = calculateAxisParameters(yAxisPair);

    // Attempt to fix the tickIncrement for the X axis parameters -- if the labels will be too big and the numbers will overlap,
    // increase the increment by an integer factor.
    var incMultiplier = 1;
    var minSpaceForXLabel = canvasContext.measureText(fnFormat ? fnFormat(maxX) : formatNumber(maxX)).width + 2 * AXIS_TEXT_PADDING;
    while ( (incMultiplier * xAxisParameters.tickIncrement) / (xAxisPair.y - xAxisPair.x) * drawWidth < minSpaceForXLabel) incMultiplier++;
    xAxisParameters.tickIncrement *= incMultiplier;

    // Draw background
    canvasContext.fillStyle = PREF_DOTPLOT_BACKGROUND_COLOR;
    canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);

    // Translate the context for the plot drawing
    canvasContext.translate(yAxisDrawWidth, 0);

    canvasContext.strokeStyle = PREF_DOTPLOT_LINE_COLOR;

    // Draw the x-axis
    canvasContext.beginPath();
    canvasContext.moveTo(0, drawHeight);
    canvasContext.lineTo(drawWidth, drawHeight);
    canvasContext.stroke();
    canvasContext.fillStyle = PREF_DOTPLOT_LINE_COLOR;

    var drawXMinorTicks = (xAxisParameters.tickIncrement / drawWidth > AXIS_MINOR_TICK_TOL_PROP);
    var xTickIncrement = (drawXMinorTicks ? xAxisParameters.tickIncrement / NUM_MINOR_TICKS : xAxisParameters.tickIncrement);
    
    // Draw ticks until you run out of axis
    for (var currTick = xAxisParameters.firstTick; currTick < xAxisPair.y; currTick += xTickIncrement)
    {
        // Major tick
        var tickX = (currTick - xAxisPair.x) / xAxisPair.getRange() * drawWidth;

        if (tickX > 0 && tickX < drawWidth)
        {
            canvasContext.beginPath();
            canvasContext.moveTo(tickX, drawHeight);
            canvasContext.lineTo(tickX, drawHeight + AXIS_MAJOR_TICK_LENGTH);
            canvasContext.stroke();
            var tickLabel = (fnFormat ? fnFormat(currTick) : formatNumber(currTick));
            var tickLabelWidth = canvasContext.measureText(tickLabel).width;
            canvasContext.fillText(tickLabel, tickX - tickLabelWidth / 2,
                drawHeight + AXIS_FONT_PX + AXIS_MAJOR_TICK_LENGTH + AXIS_TEXT_PADDING);    
        }

        // Minor ticks
        if (drawXMinorTicks)               
        {
            for (var i = 0; i < NUM_MINOR_TICKS; i++)
            {
                currTick += xTickIncrement;
                tickX = (currTick - xAxisPair.x) / xAxisPair.getRange() * drawWidth;
                if (tickX > 0 && tickX < drawWidth)
                {
                    canvasContext.beginPath();
                    canvasContext.moveTo(tickX, drawHeight);
                    canvasContext.lineTo(tickX, drawHeight + AXIS_MINOR_TICK_LENGTH);
                    canvasContext.stroke();
                }
            }
        }
    }
    
    // Label the x-axis
    if (!xAxisLabel) xAxisLabel = "Explanatory";
    var xAxisLabelWidth = canvasContext.measureText(xAxisLabel).width;
    canvasContext.fillText(xAxisLabel, drawWidth / 2 - xAxisLabelWidth / 2,
        drawHeight + AXIS_MAJOR_TICK_LENGTH + 2 * AXIS_FONT_PX + 2 * AXIS_TEXT_PADDING);    

    // Draw the y-axis
    canvasContext.beginPath();
    canvasContext.moveTo(0, drawHeight);
    canvasContext.lineTo(0, 0);
    canvasContext.stroke();

    var drawYMinorTicks = (yAxisParameters.tickIncrement / drawHeight > AXIS_MINOR_TICK_TOL_PROP);
    var yTickIncrement = (drawYMinorTicks ? yAxisParameters.tickIncrement / NUM_MINOR_TICKS : yAxisParameters.tickIncrement);
    
    // Draw ticks until you run out of axis
    for (var currTick = yAxisParameters.firstTick; currTick < yAxisPair.y; currTick += yTickIncrement)
    {
        // Major tick
        var tickY = (1 - (currTick - yAxisPair.x) / yAxisPair.getRange()) * drawHeight;

        if (tickY > 0 && tickY < drawHeight)
        {
            canvasContext.beginPath();
            canvasContext.moveTo(0, tickY);
            canvasContext.lineTo(-AXIS_MAJOR_TICK_LENGTH, tickY);
            canvasContext.stroke();
            var tickLabel = (fnFormat ? fnFormat(currTick) : formatNumber(currTick));
            var tickLabelWidth = canvasContext.measureText(tickLabel).width;
            canvasContext.fillText(tickLabel, -AXIS_MAJOR_TICK_LENGTH - tickLabelWidth - AXIS_TEXT_PADDING,
                tickY + AXIS_FONT_PX / 2);
        }

        // Minor ticks
        if (drawYMinorTicks)               
        {
            for (var i = 0; i < NUM_MINOR_TICKS; i++)
            {
                currTick += yTickIncrement;
                tickY = (1 - (currTick - yAxisPair.x) / yAxisPair.getRange()) * drawHeight;
                if (tickY > 0 && tickY < drawHeight)
                {
                    canvasContext.beginPath();
                    canvasContext.moveTo(0, tickY);
                    canvasContext.lineTo(-AXIS_MINOR_TICK_LENGTH, tickY);
                    canvasContext.stroke();
                }
            }
        }
    }

    // If it is supported, make the =0 lines dashed
    if (canvasContext.setLineDash)
        canvasContext.setLineDash([5, 5]);

    // Draw x = 0 if you can
    var zeroLineX = -xAxisPair.x / xAxisPair.getRange() * drawWidth;
    if (zeroLineX > 0 && zeroLineX < drawWidth)
    {
        canvasContext.beginPath();
        canvasContext.moveTo(zeroLineX, 0);
        canvasContext.lineTo(zeroLineX, drawHeight);
        canvasContext.stroke();
    }

    // Draw y = 0 if you can
    var zeroLineY = (1 + yAxisPair.x / yAxisPair.getRange()) * drawHeight;
    if (zeroLineY > 0 && zeroLineY < drawHeight)
    {
        canvasContext.beginPath();
        canvasContext.moveTo(0, zeroLineY);
        canvasContext.lineTo(drawWidth, zeroLineY);
        canvasContext.stroke();
    }

    // Return to normal line stroke
    if (canvasContext.setLineDash)
        canvasContext.setLineDash([]);

    // If requested, draw the LSRL
    if (bPlotLSRL)
    {
        // We're going to turn on clipping, so hang on to current unclipped state
        canvasContext.save();

        // Clip to the region above the x-axis; we don't care about anything else
        canvasContext.beginPath();
        canvasContext.rect(0, 0, drawWidth, drawHeight);
        canvasContext.clip();
        
        canvasContext.strokeStyle = LSRL_COLOR;
        var slope = LSRLslope(arrXdata, arrYdata);
        var intercept = LSRLintercept(arrXdata, arrYdata);
        var LSRLleft = new Pair(xAxisPair.x, intercept + slope * xAxisPair.x);
        var LSRLright = new Pair(xAxisPair.y, intercept + slope * xAxisPair.y);
        LSRLleft.normalize(xAxisPair, yAxisPair);
        LSRLright.normalize(xAxisPair, yAxisPair);
        canvasContext.beginPath();
        canvasContext.moveTo(LSRLleft.x * drawWidth, (1 - LSRLleft.y) * drawHeight);
        canvasContext.lineTo(LSRLright.x * drawWidth, (1 - LSRLright.y) * drawHeight);
        canvasContext.stroke();
        
        canvasContext.restore();
    }

    // Draw the dots    
    canvasContext.fillStyle = PREF_DOTPLOT_DOT_COLOR;
    canvasContext.strokeStyle = PREF_DOTPLOT_LINE_COLOR;
    for (var i = 0; i < arrXdata.length; i++)
    {
        var coords = new Pair(arrXdata[i], arrYdata[i]);
        coords.normalize(xAxisPair, yAxisPair);
        coords.x *= drawWidth;
        coords.y = (1 - coords.y) * drawHeight;
        canvasContext.beginPath();
        canvasContext.arc(coords.x, coords.y, SP_DOT_SIZE / 2, 0, 2 * Math.PI, false);
        canvasContext.fill();
        canvasContext.lineWidth = SP_DOT_OUTLINE_WIDTH;
        canvasContext.stroke();
    }
    
    // Label the y-axis
    canvasContext.fillStyle = PREF_DOTPLOT_LINE_COLOR;
    if (!yAxisLabel) yAxisLabel = "Response";
    var yAxisLabelWidth = canvasContext.measureText(yAxisLabel).width;
    canvasContext.translate(AXIS_FONT_PX / 2 - yAxisDrawWidth, drawHeight / 2);
    canvasContext.rotate(-Math.PI / 2);
    canvasContext.fillText(yAxisLabel, -yAxisLabelWidth / 2, AXIS_FONT_PX / 2);

    // feed the context the identity matrix in case we need it again
    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
}
