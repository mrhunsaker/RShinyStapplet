// utility.js
// for SRiS Applets Test
// Robert Amar
// v1.0, 2/9/14

var u_inputState = {};

function hasInputState(inputID) { return (typeof u_inputState[inputID] !== "undefined"); }

function recordInputState(inputID) { u_inputState[inputID] = document.getElementById(inputID).value; }

function recordInputStates(arr) { for (var i = 0; i < arr.length; i++) recordInputState(arr[i]); }

function resetInputState(inputID)
{
    var obj = u_inputState[inputID];
    if (typeof obj !== "undefined")
        document.getElementById(inputID).value = obj;
}

function clearInputState(inputID) { if (hasInputState(inputID)) delete u_inputState[inputID]; }

function clearInputStates() { for (var inputID in u_inputState) clearInputState(inputID); }

// Here are some functions about cookies
// From http://www.w3schools.com/js/js_cookies.asp
var u_cookies = {};

// If there are any cookies, load them
if (!window.localStorage && navigator.cookieEnabled)
{
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) 
    {
        var c = ca[i].trim().split('=');
        u_cookies[c[0]] = c[1];
    }
}

function getCookie(cname)
{
    return u_cookies[cname];
}

// These cookies expire after one year
function setCookie(cname,cvalue)
{
    var d = new Date();
    d.setTime(d.getTime()+(365*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
    u_cookies[cname] = cvalue;
}

function deleteCookie(cname)
{
    document.cookie = cname + "=; + expires=" + (new Date()).toGMTString();
    if (u_cookies[cname]) delete u_cookies[cname];
}

function deleteAllCookies()
{
    for (var cname in u_cookies) deleteCookie(cname);
}

// Here end the cookie functions

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function sortAscending(arr)
{
    arr.sort(function(a, b) { return a - b; });
}

// Swap arr[a] and arr[b]
// PRECONDITION: a and b are valid array indices
function arraySwap(arr, a, b)
{
    var temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
}

// Utility for converting long string input into an array.
// Will treat any sequence of commas or spaces as a delimiter and ignores them at the beginning and end.
// (Honestly, I stole the regex trim and split code from W3Schools and StackExchange:
// http://www.w3schools.com/jsref/jsref_trim_string.asp
// http://stackoverflow.com/questions/650022/how-do-i-split-a-string-with-multiple-separators-in-javascript )
function splitString(str)
{
    // Trim whitespace and commas from both ends before moving forward
    return str.replace(/^\s+|\s+$/gm,'').replace(/^,+|,+$/gm,'').split(/(?:,| )+/);
}

// Unsplit the result of splitString or splitStringGetArray, perhaps for sanitization purposes.
function unsplitString(arr)
{
    var retStr = "";
    for (var i = 0; i < arr.length; i++)
    {
        retStr += arr[i];
        if (i < arr.length - 1) retStr += " ";
    }
    return retStr;
}

// Splits string array input AND creates the numeric array.
// Do not use without validation!
function splitStringGetArray(str)
{
    var arr = splitString(str);
    var retArr = new Array(arr.length);
    for (var i = 0; i < arr.length; i++)
    {
        retArr[i] = parseFloat(arr[i]);
    }
    return retArr;
}

function knuthShuffle(arr)
{
    for (var i = 0; i < arr.length; i++)
        arraySwap(arr, i, randomIntFromInterval(i, arr.length - 1));
}

// This moves elements until the pivot element is in the right place
// and returns the index of the pivot
function pivot(arr, pivotIndex)
{
    return pivot_bounded(arr, 0, arr.length - 1, pivotIndex);
}

// Helper for linear-time select and pivot.
// PRECONDITION: rightIndex >= pivotIndex >= leftIndex and all are valid arr indices
function pivot_bounded(arr, leftIndex, rightIndex, pivotIndex)
{
    // based on CLR pseudocode
    var pivotValue = arr[pivotIndex];
    arraySwap(arr, pivotIndex, rightIndex);
    var i = leftIndex - 1;
    for (var j = leftIndex; j < rightIndex; j++)
    {
        if (arr[j] <= pivotValue)
        {
            i++;
            arraySwap(arr, i, j);
        }
    }
    arraySwap(arr, i+1, rightIndex);
    return i+1;
}

// Give the kth largest element in arr.
// PRECONDITION: 0 < k <= arr.length
function randomSelect(arr, k)
{
    return randomSelectRecursive(arr, k, 0, arr.length - 1);
}

function randomSelectRecursive(arr, k, leftIndex, rightIndex)
{
    var pivotIndex = pivot_bounded(arr, leftIndex, rightIndex, randomIntFromInterval(leftIndex, rightIndex));
    if (pivotIndex == (k - 1))
        return arr[pivotIndex];
    else if (pivotIndex < (k - 1))
        return randomSelectRecursive(arr, k, pivotIndex + 1, rightIndex);
    else
        return randomSelectRecursive(arr, k, leftIndex, pivotIndex - 1);
}

// Determine if canvases are supported on this browser.
function canvasSupported()
{
    var testCanvas = document.createElement("canvas");
    if (testCanvas.getContext)
        return true;
    else
        return false;
}

// Determine if download of any kind is supported on this browser.
function downloadSupported()
{
    return (typeof document.createElement("a").download != "undefined") || (window.Blob && window.navigator.msSaveBlob);
}

// Determine if local storage is supported on this browser.
function storageSupported()
{
    if (window.localStorage)
        return true;
    else
        return false;
}

// Convert base64-encoded text to a Blob with the specified MIME type.
function base64ToBlob(encodedText, mimetype)
{
    // Convert from base64 to an ArrayBuffer
    var byteString = atob(encodedText);
    var buffer = new ArrayBuffer(byteString.length);
    var intArray = new Uint8Array(buffer);
    for (var i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }
    
    // Use the native blob constructor
    return new Blob([buffer], {type: "" + mimetype});    
}

// If possible, utilize the download feature to save the textarea to a file;
// otherwise, open another window with the Data URI
function saveCSV(txtAreaID, filename)
{
    var txtArea = document.getElementById(txtAreaID);
    var a = document.createElement('a');
    a.style.display = "none";
    filename = (filename ? filename : "results");
    var myBlob = (window.Blob ? new Blob([txtArea.value], {type: "text/csv"}) : null);
    if (typeof a.download != "undefined")
    {
        a.download = filename + ".csv";
        a.href = URL.createObjectURL(myBlob);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    else if (window.Blob && window.navigator.msSaveBlob) // Try to use IE10+ Blobs for saving if possible
    {
        window.navigator.msSaveBlob(myBlob, filename + ".csv");
    }
    else // cop-out failsafe
    {
        alert("Sorry, your browser does not support this.\n" +
              "Try copying the results from the box at left and pasting them into Excel directly.")
    }
}

// If possible, utilize the download feature to save the dotplot to a file;
// otherwise, open another window with the Data URI
function saveCanvas(canvasID, filename)
{
    var canvas = document.getElementById(canvasID);
    var a = document.createElement('a');
    a.style = "display: none";
    filename = (filename ? filename : "dotplot");
    var imageURI = canvas.toDataURL();
    var myBlob = (window.Blob ? base64ToBlob(imageURI.slice(imageURI.indexOf(",") + 1), "image/png") : null);
    if (typeof a.download != "undefined")
    {
        a.download = filename;
        a.href = URL.createObjectURL(myBlob); // was canvas.toDataURL();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    else if (window.Blob && window.navigator.msSaveBlob) // Try to use IE10+ Blobs for saving if possible
    {
        window.navigator.msSaveBlob(myBlob, filename + ".png");
    }
    else // cop-out failsafe
    {
        var newWindow = window.open("", "", "width=560, height=360");
        newWindow.document.write("<!DOCTYPE HTML><HTML><BODY>Right-click (Control-click on Mac) to save.<BR><IMG SRC='" + canvas.toDataURL() + "'></BODY></HTML>");
        newWindow.document.close();
    }
}

// Generic paste handler useful for handling copy-paste from MS Excel into MSIE, mainly
// Adapted from http://stackoverflow.com/questions/9008438/copy-paste-from-ms-excel-fails-with-ie-but-works-with-firefox
function pasteHandler(elt)
{
    // If this is not MSIE, just allow default handling
    if (!window.clipboardData) return true;

    // Try to strip the special characters BEFORE IE gets to them
    var str = window.clipboardData.getData("Text");    
    str = str.replace(/[\r\n\t]+/g, " "); // replace carriage return, newline or tab sequence by a single space
    elt.value = str;
    return false; // kill the paste event so you don't get duplicate data
}