// prop.js
// for SRiS Applets Test
// Robert Amar
// v1.0, 2/8/14

function bernoulliTrial(p)
{
    return (Math.random() < p);
}

// Conduct n Bernoulli trials and return the number of successes.
// PRECONDITIONS: 0 <= p <= 1 and n > 0 
function one_prop_simulate(p, n)
{
    var numSuccess = 0;
    for (var i = 0; i < n; i++)
        if (bernoulliTrial(p)) numSuccess++;
    return numSuccess;
}

// Conduct multiple one-prop simulations and return an array consisting of
// the _numbers of successes_ from each.
// PRECONDITIONS: 0 <= p <= 1; n > 0; trials > 0
function one_prop_simulate_many(p, n, trials)
{
    var retArr = new Array(trials);
    for (var i = 0; i < trials; i++)
        retArr[i] = one_prop_simulate(p, n);
    return retArr;
}

// Conduct a notecard trial for the difference in observed proportions when the
// observed PERFORMANCEs are x1 successes out of n1 trials and x2 successes
// out of n2 trials.  Return the difference in the simulated proportions.
// PRECONDITIONS: x1 > 0, n1 >= x1; x2 > 0, n2 >= x2
function diff_two_prop_simulate(x1, n1, x2, n2)
{
    return diff_two_prop_simulate_many(x1, n1, x2, n2, 1)[0];
}

// Conduct notecard trials for the difference in observed proportions when the
// observed PERFORMANCEs are x1 successes out of n1 trials and x2 successes
// out of n2 trials.  Return a sorted array consisting of the differences in the
// simulated proportions (group 1 - group 2).
//
// PRECONDITIONS: x1 > 0, n1 >= x1; x2 > 0, n2 >= x2
function diff_two_prop_simulate_many(x1, n1, x2, n2, trials)
{
    var retArr = new Array(trials);
    var n = n1 + n2;
    var x = x1 + x2;
    var cards = new Array(n);
    for (var i = 0; i < n; i++)
    {
        if (i < x)
            cards[i] = 1;
        else
            cards[i] = 0;
    }

    for (var i = 0; i < trials; i++)
    {
        knuthShuffle(cards);
        
        var numSuccessGrp1 = 0;
        for (var j = 0; j < n1; j++)
            if (cards[j] == 1) numSuccessGrp1++;

        var prop1 = numSuccessGrp1 / n1;
        var prop2 = (x - numSuccessGrp1) / n2;
        retArr[i] = prop1 - prop2;
    }
    
    sortAscending(retArr);
    return retArr;
}