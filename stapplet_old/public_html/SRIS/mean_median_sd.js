// mean_median_sd.js
// for SRiS Applets Test
// Robert Amar
// v1.0, 2/9/14

// Calculate the mean of all items in the array.
// PRECONDITION: arr is an array of numeric values.
function mean(arr)
{
    var sum = 0;
    for (var i = 0; i < arr.length; i++) sum += arr[i];
    return (sum / arr.length);
}

// Calculate an array of deviations from the mean.
// PRECONDITION: arr is an array of numeric values.
function getDeviations(arr)
{
    var devs = arr.slice(0);
    var xbar = mean(arr);
    for (var i = 0; i < devs.length; i++)
        devs[i] -= xbar;
    return devs;
}

// Given an array of deviations from a mean, calculate the sample SD.
// PRECONDITION: devs is an array of numeric values.
function sampleSDFromDevs(devs)
{
    var SSD = 0;
    for (var i = 0; i < devs.length; i++)
        SSD += Math.pow(devs[i], 2);
    return Math.sqrt(SSD / (devs.length - 1));
}

// Calculate the sample SD of all items in the array.
// PRECONDITION: arr is an array of numeric values.
function sampleSD(arr)
{
    return sampleSDFromDevs(getDeviations(arr));
}

// Calculate the median of all items in the array.
// PRECONDITION: arr is an array of numeric values.
function median(arr)
{
    // Shallow copy -- we're going to be doing some rearranging for efficiency
    var data = arr.slice(0);
    
    var med = randomSelect(data, Math.floor(arr.length / 2) + 1);
    // for odd index, need only the Math.floor(arr.length / 2) + 1th order stat.
    if (arr.length & 1 == 1)
        return med;
    else
        return (med + randomSelect(data, Math.floor(arr.length / 2))) / 2;
}

// Conduct a notecard trial for the difference in observed means when the
// observed PERFORMANCEs are in arr1 for Context 1 and arr2 for Context 2.
// Return the difference in the simulated means.
function diff_two_mean_simulate(arr1, arr2)
{
    return diff_two_mean_simulate_many(arr1, arr2, 1)[0];
}

// Conduct notecard trials for the difference in observed means when the
// observed PERFORMANCEs are in arr1 for Context 1 and arr2 for Context 2.
// Return an array of the sorted differences in the simulated means.
function diff_two_mean_simulate_many(arr1, arr2, trials)
{
    return diff_two_arrfunc_simulate_many(arr1, arr2, mean, trials);
}

// Conduct a notecard trial for the difference in observed medians when the
// observed PERFORMANCEs are in arr1 for Context 1 and arr2 for Context 2.
// Return the difference in the simulated means.
function diff_two_median_simulate(arr1, arr2)
{
    return diff_two_median_simulate_many(arr1, arr2, 1)[0];
}

// Conduct notecard trials for the difference in observed medians when the
// observed PERFORMANCEs are in arr1 for Context 1 and arr2 for Context 2.
// Return an array of the sorted differences in the simulated means.
function diff_two_median_simulate_many(arr1, arr2, trials)
{
    return diff_two_arrfunc_simulate_many(arr1, arr2, median, trials);
}

// Conduct a notecard trial for the difference in observed stdevs when the
// observed PERFORMANCEs are in arr1 for Context 1 and arr2 for Context 2.
// Return the difference in the simulated means.
function diff_two_SD_simulate(arr1, arr2)
{
    return diff_two_SD_simulate_many(arr1, arr2, 1)[0];
}

// Conduct notecard trials for the difference in observed stdevs when the
// observed PERFORMANCEs are in arr1 for Context 1 and arr2 for Context 2.
// Return an array of the sorted differences in the simulated means.
function diff_two_SD_simulate_many(arr1, arr2, trials)
{
    return diff_two_arrfunc_simulate_many(getDeviations(arr1), getDeviations(arr2), sampleSD, trials);
}

// With the evolution of the interface, I needed a way to access this more
// flexibly as well as the "old-fashioned" way.
function diff_two_arrfunc_simulate(arr1, arr2, arrFunc)
{
    return diff_two_arrfunc_simulate_many(arr1, arr2, arrFunc, 1)[0];
}

// Helper for simulations -- since the only difference is the array function,
// the logic is very similar for the mean and median tests (and only slightly
// worse for the SD test).
function diff_two_arrfunc_simulate_many(arr1, arr2, arrFunc, trials)
{
    var retArr = new Array(trials);
    var cards = arr1.concat(arr2);

    for (var i = 0; i < trials; i++)
    {
        knuthShuffle(cards);
        
        var grpArr1 = cards.slice(0, arr1.length);
        var grpArr2 = cards.slice(arr1.length, cards.length);
        retArr[i] = arrFunc(grpArr1) - arrFunc(grpArr2);
    }
    
    sortAscending(retArr);
    return retArr;
}

// Simulate one paired mean difference where arr is the set of paired differences.
function paired_mean_diff_simulate(arr)
{
    return paired_mean_diff_simulate_many(arr, 1)[0];
}

// Simulate many paired mean differences where arr is the set of paired differences.
// The logic here is that toggling the sign of the data is equivalent to switching
// a difference between the two contexts (that is, pretend each difference is a
// real observation paired with an observation of 0).
function paired_mean_diff_simulate_many(arr, trials)
{
    var data = arr.slice(0);
    var retArr = new Array(trials);
    for (var n = 0; n < trials; n++)
    {
        for (var i = 0; i < data.length; i++)
            if (randomIntFromInterval(1, 2) == 1)
                data[i] *= -1;
        
        retArr[n] = mean(data);
    }
    sortAscending(retArr);
    return retArr;
}