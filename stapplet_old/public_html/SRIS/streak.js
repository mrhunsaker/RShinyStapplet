// streak.js
// Robert Amar
// v1.0, 2/13/14

// Find the longest streak of any character present in the string.
// PRECONDITION: str is non-empty.
function findLongestStreak(str)
{
    var checkChar = str.charAt(0);
    var streakCount = 1;
    var maxStreak = 1;
    for (var i = 1; i < str.length; i++)
    {
        if (str.charAt(i) == checkChar) streakCount++;
        else
        {
            checkChar = str.charAt(i);
            if (streakCount > maxStreak) maxStreak = streakCount;
            streakCount = 1;
        }
    }
    return Math.max(maxStreak, streakCount);
}

// Find the number of streaks at or over the given length present in the string.
function countStreaksOfLength(str, streakLength)
{
    var checkChar = str.charAt(0);
    var streakCount = 1;
    var numStreaks = 0;
    for (var i = 1; i < str.length; i++)
    {
        if (str.charAt(i) == checkChar) streakCount++;
        else
        {
            checkChar = str.charAt(i);
            if (streakCount >= streakLength) numStreaks++;
            streakCount = 1;
        }
    }
    if (streakCount >= streakLength) numStreaks++;
    return numStreaks;
}

// Simulate a shuffling of the target string and find the longest streak
// in the shuffled order.
function simulate_longest_streak(str, str_callback)
{
    return simulate_longest_streak_many(str, 1, str_callback)[0];
}

// Simulate many shufflings of the target string and find the longest streak
// in the shuffled order.
function simulate_longest_streak_many(str, trials, str_callback)
{
    return simulate_streak_arrfunc_many(str, trials, findLongestStreak, null, str_callback);
}

// Simulate a shuffling of the target string and find the longest streak
// in the shuffled order.
function simulate_streaks_of_length(str, len, str_callback)
{
    return simulate_streaks_of_length_many(str, 1, len, str_callback)[0];
}

// Simulate many shufflings of the target string and find the longest streak
// in the shuffled order.
function simulate_streaks_of_length_many(str, trials, len, str_callback)
{
    return simulate_streak_arrfunc_many(str, trials, countStreaksOfLength, len, str_callback);
}

// Simulate a shuffling of the target string many times and find the longest
// streak in the shuffled order.
function simulate_streak_arrfunc_many(str, trials, arrfunc, len, str_callback)
{
    var retArr = new Array(trials);
    // Cannot mutate the string -- have to copy into an array...
    var strArr = str.split("");
    var unsplit;
    
    for (var i = 0; i < trials; i++)
    {
        unsplit = "";
        knuthShuffle(strArr);
        for (var j = 0; j < strArr.length; j++)
            unsplit += strArr[j];
        retArr[i] = (len ? arrfunc(unsplit, len) : arrfunc(unsplit));
    }
    
    if (str_callback) { str_callback(unsplit); }

    sortAscending(retArr);
    return retArr;
}