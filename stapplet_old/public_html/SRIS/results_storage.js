var rs_multResults = new Array(0);

// Add the numeric array of values to the existing results and returns the
// total number of results there are after the addition.
// OPTIONAL: idTextArea -- write the results to the textarea with the given ID
// OPTIONAL: fnFormat -- use the formatting function callback given
// OPTIONAL: idDPCanvas -- write the values to a dotplot on the canvas with the given ID
// axisLabel -- what to label that axis
function addToStoredResults(arr, idTextArea, fnFormat, idDPCanvas, axisLabel)
{
    rs_multResults = rs_multResults.concat(arr);
    sortAscending(rs_multResults);
    
    if (idTextArea)
    {
        var textArea = document.getElementById(idTextArea);
        var txtStr = "";
        for (var i = 0; i < rs_multResults.length; i++)
        {
            var adder = (fnFormat ? fnFormat(rs_multResults[i]) : rs_multResults[i]);
            txtStr += adder + "\r\n";
        }
        textArea.value = txtStr;
    }
    if (idDPCanvas)
        dotplot(rs_multResults, idDPCanvas, axisLabel, fnFormat);
        
    return rs_multResults.length;
}

// Get the stored results as a shallow copy.
function getStoredResults() { return rs_multResults.slice(0); }

// Special confirm box -- DOES NOT actually do the reset, just checks to see
// if there is any data before actually showing a confirm prompt.
function confirmStoredResultsReset()
{
    if (rs_multResults.length == 0) return true;
    else return confirm("This will reset the stored data.\nDo you really wish to proceed?");
}

// Reset the values in the currently stored results array.
// OPTIONAL: idTextArea -- write the results to the given textarea element
// OPTIONAL: idDPCanvas -- write a blank white rectangle to the canvas.
function resetStoredResults(idTextArea, idDPCanvas)
{
    rs_multResults = [];
    if (idTextArea) document.getElementById(idTextArea).value = "";
    deleteDotplotForCanvas(idDPCanvas);
}