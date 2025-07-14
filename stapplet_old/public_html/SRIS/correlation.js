// correlation.js
// DEPENDENCIES: mean_median_sd.js
//
// Methods for calculating regression statistics.
// Many of these are inefficient; they are implemented this way for the
// sake of readability.
//
// Robert Amar
// v1.0, 2/12/14

// Calculate the sample correlation given the paired data in arrX and arrY.
function correlation(arrX, arrY)
{
    var meanX = mean(arrX);
    var meanY = mean(arrY);
    var sdX = sampleSD(arrX);
    var sdY = sampleSD(arrY);
    var numer = 0;
    
    for (var i = 0; i < arrX.length; i++)
    {
        var zx = (arrX[i] - meanX) / sdX;
        var zy = (arrY[i] - meanY) / sdY;
        numer += zx * zy;
    }
    
    return numer / (arrX.length - 1);
}

// Calculate the slope of the LSRL for the paired data in arrX and arrY.
function LSRLslope(arrX, arrY)
{
    var sdX = sampleSD(arrX);
    var sdY = sampleSD(arrY);
    return correlation(arrX, arrY) * sdY / sdX;    
}

// Calculate the intercept of the LSRL for the paired data in arrX and arrY.
function LSRLintercept(arrX, arrY)
{
    var meanX = mean(arrX);
    var meanY = mean(arrY);
    return meanY - LSRLslope(arrX, arrY) * meanX;
}

// Calculate the standard deviation of the residuals.
function LSRLs(arrX, arrY)
{
    var slope = LSRLslope(arrX, arrY);
    var intercept = LSRLintercept(arrX, arrY);
    var SSR = 0;
    for (var i = 0; i < arrX.length; i++)
        SSR += Math.pow(arrY[i] - (intercept + slope * arrX[i]), 2);
    return Math.sqrt(SSR / (arrX.length - 2));
}

function correlation_simulate_many(arrX, arrY, trials)
{
    return LSRL_arrfunc_simulate_many(arrX, arrY, trials, correlation);
}

function LSRLslope_simulate_many(arrX, arrY, trials)
{
    return LSRL_arrfunc_simulate_many(arrX, arrY, trials, LSRLslope);
}

// Simulate for the desired array function by shuffling the Y array.
function LSRL_arrfunc_simulate_many(arrX, arrY, trials, arrfunc)
{
    var mutArrY = arrY.slice(0);
    var retArr = new Array(trials);
    for (var i = 0; i < trials; i++)
    {
        knuthShuffle(mutArrY);
        retArr[i] = arrfunc(arrX, mutArrY);
    }
    sortAscending(retArr);
    return retArr;
}