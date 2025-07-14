// simple_validate.js
// for SRiS Applets Test
// Robert Amar
// v1.0, 2/9/14

// Facility for checking whether a particular input control contains a valid integer value.
// input: the input control itself
// min: lowest possible value for control
// max: highest possible value for control
// strict: if inclusive, max and min are checked exclusively, else inclusive
// Optionals:
// spnMsg: a SPAN in which to write the error message
// msgParamName: the parameter name to output to the user in the error message
// altRangeMsg: if the parameter is out of range, a more friendly/specific error to output
function validateInputInt(inputID, min, max, strict, spnMsgID, msgParamName, altRangeMsg)
{
    var input = document.getElementById(inputID);
    var spnMsg = (spnMsgID ? document.getElementById(spnMsgID) : null);

    var val = parseInt(input.value);
    var valid = true;

    if (!msgParamName) msgParamName = "Input";
    
    if (isNaN(val))
    {
        if (spnMsg)
            spnMsg.innerHTML = msgParamName + " must be numeric.";
        valid = false;
    }
    else if (strict && !(val > min && val < max))
    {
        if (spnMsg)
            spnMsg.innerHTML = msgParamName + " " + (altRangeMsg ? altRangeMsg : "must be a number between " + min + " and " + max + ".");
        valid = false;
    }
    else if (!strict && !(val >= min && val <= max))
    {
        if (spnMsg)
            spnMsg.innerHTML = msgParamName + " " + (altRangeMsg ? altRangeMsg : "must be a number between " + min + " and " + max + ".");
        valid = false;
    }
    else
    {
        input.value = val;
        if (spnMsg)
            spnMsg.innerHTML = "";
    }
    return valid;
}

// Facility for checking whether a particular input control contains a valid decimal value.
// input: the input control itself
// min: lowest possible value for control
// max: highest possible value for control
// strict: if inclusive, max and min are checked exclusively, else inclusive
// Optionals:
// spnMsg: a SPAN in which to write the error message
// msgParamName: the parameter name to output to the user in the error message
// altRangeMsg: if the parameter is out of range, a more friendly/specific error to output
function validateInputFloat(inputID, min, max, strict, spnMsgID, msgParamName, altRangeMsg)
{
    var input = document.getElementById(inputID);
    var spnMsg = (spnMsgID ? document.getElementById(spnMsgID) : null);

    var val = parseFloat(input.value);
    var valid = true;

    if (!msgParamName) msgParamName = "Input";
   
    if (isNaN(val))
    {
        if (spnMsg)
            spnMsg.innerHTML = msgParamName + " must be numeric.";
        valid = false;
    }
    else if (strict && !(val > min && val < max))
    {
        if (spnMsg)
            spnMsg.innerHTML = msgParamName + " " + (altRangeMsg ? altRangeMsg : "must be a decimal between " + min + " and " + max + ".");
        valid = false;
    }
    else if (!strict && !(val >= min && val <= max))
    {
        if (spnMsg)
            spnMsg.innerHTML = msgParamName + " " + (altRangeMsg ? altRangeMsg : "must be a decimal between " + min + " and " + max + ".");
        valid = false;
    }
    else
    {
        if (spnMsg)
            spnMsg.innerHTML = "";
    }
    return valid;
}

// Validates a comma- and/or space-separated string of values to see if the input is all numbers.
// Trims the string first.
// input: the text input control itself
// Optionals:
// spnMsg: a SPAN in which to write the error message
// msgParamName: the parameter name to output to the user in the error message
// altMsg: if the parameter has invalid values, a more friendly/specific error to output
function validateInputFloatArray(inputID, spnMsgID, msgParamName, altMsg)
{
    var input = document.getElementById(inputID);
    var spnMsg = (spnMsgID ? document.getElementById(spnMsgID) : null);
    var arr = splitString(input.value);
    var valid = true;
    
    for (var i = 0; i < arr.length; i++)
    {
        var val = parseFloat(arr[i]);
        if (isNaN(val))
        {
            valid = false;
            break;
        }  
    }
    
    if (!valid)
    {
        if (spnMsg) spnMsg.innerHTML = msgParamName + " " + (altMsg ? altMsg : "has invalid values. Please try again.");
    }
    else
    {
        if (spnMsg) spnMsg.innerHTML = "";
    }
    
    return valid;
}