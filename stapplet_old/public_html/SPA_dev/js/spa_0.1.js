// Establishes a global SPAApplet namespace to avoid name collisions with other functions
var SPAApplet = SPAApplet || {};

/** Utility */
// Catch-all for functions that don't clearly belong in one class or space.
SPAApplet.Utility =
{
    // Trim whitespace and commas from both ends of a string
    // (Honestly, I stole the regex trim and split code from W3Schools and StackExchange:
    // http://www.w3schools.com/jsref/jsref_trim_string.asp
    // http://stackoverflow.com/questions/650022/how-do-i-split-a-string-with-multiple-separators-in-javascript )
    trimString: function(str)
    {
        return str.replace(/^\s+|\s+$/gm,'').replace(/^,+|,+$/gm,'');
    },

    // Utility for converting long string input into an array.
    // Will treat any sequence of commas or whitespace as a delimiter and
    // ignores them at the beginning and end.
    splitString: function(str)
    {
        // Trim whitespace and commas from both ends before moving forward
        return SPAApplet.Utility.trimString(str).split(/(?:,|\s)+/);
    },

    // Splits string array input AND creates the numeric array.
    // Do not use without validation!
    splitStringGetArray: function(str, parseFunc)
    {
        var arr = SPAApplet.Utility.splitString(str);
        parseFunc = parseFunc || parseFloat;
        var retArr = new Array(arr.length);
        for (var i = 0; i < arr.length; i++)
            retArr[i] = parseFunc(arr[i]);
        return retArr;
    },

    // Unsplit the result of splitString or splitStringGetArray, perhaps for sanitization purposes.
    unsplitString: function(arr)
    {
        var retStr = "";
        for (var i = 0; i < arr.length; i++)
        {
            retStr += arr[i];
            if (i < arr.length - 1) retStr += " ";
        }
        return retStr;
    },

    // Modifies the argument array to be sorted in numeric order.
    // PRECONDITION: array is numeric
    sortArrayAscending: function(arr)
    {
        arr.sort(function(a, b) { return (a - b); } );
    },

    // Returns a random integer from min to max inclusive    
    randomIntFromInterval: function(min, max)
    {
        return Math.floor(Math.random()*(max-min+1)+min);
    },
    
    // Swap arr[a] and arr[b]
    // PRECONDITION: a and b are valid array indices
    arraySwap: function(arr, a, b)
    {
        var temp = arr[a];
        arr[a] = arr[b];
        arr[b] = temp;
    },

    // Donald Knuth randomization of an array of length n by
    // swapping each item in the array with another randomly-selected item
    // and going on down the line
    knuthShuffle: function(arr)
    {
        var util = SPAApplet.Utility;
        for (var i = 0; i < arr.length; i++)
            util.arraySwap(arr, i, util.randomIntFromInterval(i, arr.length - 1));
    },

    // Create HTML suitable for display of RHS of an exponential regression equation    
    exponentialRegEQDisplayHTML: function(constant, base, fnFormat)
    {
        var safenum = SPAApplet.SafeNumber;
        fnFormat = fnFormat || SPAApplet.Format.formatNumber;
        return ((safenum.compareToWithinTolerance(constant, 0) !== 0) ?
            fnFormat(constant) : constant.toExponential(1)) + " &times; " + fnFormat(base) + "<SUP><EM>x</EM></SUP>";
    },

    // Create HTML suitable for display of RHS of a polynomial regression equation
    // of arbitrary length.  Coefficients are in order of increasing degree.
    polynomialRegEQDisplayHTML: function(coeffs, fnFormat)
    {
        if (!coeffs || (coeffs.length == 0)) return "";

        var safenum = SPAApplet.SafeNumber;
        fnFormat = fnFormat || SPAApplet.Format.formatNumber;
        var displayHTML = "";
        
        // Display first coefficient as-is if it is not zero
        if (safenum.compareToWithinTolerance(coeffs[0], 0) !== 0)
            displayHTML += fnFormat(coeffs[0]);
            
        for (var i = 1; i < coeffs.length; i++)
        {
            // Skip this loop altogether if the coefficient is zero
            if (safenum.compareToWithinTolerance(coeffs[i], 0) == 0) continue;
            
            var displaynum = coeffs[i];
            if (displayHTML.length > 0)
            {
                displayHTML += ((safenum.compareToWithinTolerance(coeffs[i], 0) < 0) ? " &ndash; " : " + ");
                displaynum = Math.abs(displaynum);
            }
            if (safenum.compareToWithinTolerance(Math.abs(displaynum), 1) !== 0)
                displayHTML += fnFormat(displaynum);

            if (i === 1)
                displayHTML += "<em>x</em>";
            else
                displayHTML += "<em>x</em><SUP>" + i + "</SUP>";
        }
        return displayHTML;
    },
    
    // 14-color spectrum of standard CSS names, arranged in alphabetical order.
    // This omits "white", "black" and "lime".
    spectrumColors: ["fuchsia", "maroon", "navy", "teal", "silver", "blue", "purple", "gray",
                    "red", "orange", "green", "olive", "aqua", "yellow"],

    // If you have more colors than the ones above, random colors will be picked
    // and added to the spectrum for later use (in same page session)
    getSpectrumColor: function(i)
    {
        var util = SPAApplet.Utility;
        if (i < util.spectrumColors.length) return util.spectrumColors[i];
        else
        {
            var col = "rgb(" + util.randomIntFromInterval(0, 255) + "," + util.randomIntFromInterval(0, 255) +
                    "," + util.randomIntFromInterval(0, 255) + ")";
            util.spectrumColors.push(col);
            return col;
        }
    },
    
    // Hardcoding a few small factorials
    factorialMemo: [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880],
    
    // Memoized version of factorial
    factorial: function(op)
    {
        var map = SPAApplet.Utility.factorialMemo;
        if (op < map.length)
            return map[op];

        // Memoize all factorials leading to answer
        var n = map.length;
        while (op >= n)
        {
            map.push(map[n - 1] * n);
            n++;
        }
        return map[op];
    },

    // number of combinations of n items taken r at a time
    nCr: function(n, r)
    {
        if (n < r) return 0;
        
        var num = 1, den = 1, diff = Math.min(r, n - r);
        r = diff;
        while (r > 0)
        {
            num *= n--;
            den *= r--;
        }
        return Math.round(num / den);
    },

    // number of permutations of n items taken r at a time
    nPr: function(n, r)
    {
        if (n < r) return 0;
        
        var ans = 1;
        while (n > r)
            ans *= n--;

        return ans;
    },

    // Wrapper on javascript parseFloat that also parses strings
    // input as fractions as rational numbers
    parseFloatOrFraction: function(s)
    {
        var util = SPAApplet.Utility;
        var arr = s.split('/');
        if (arr.length > 1)
            return parseFloat(util.trimString(arr[0])) / parseFloat(util.trimString(arr[1]));
        else
            return parseFloat(s);
    },

    // Render the given text on the given Canvas context ctx at location
    // (x, y) for upper-left corner with enforced width w.
    renderText: function(ctx, text, x, y, w)
    {
        var lw = ctx.lineWidth;
        ctx.lineWidth = 0.6;
        if (typeof(w) == "undefined")
        {
            ctx.fillText(text, x, y);
            ctx.strokeText(text, x, y);
        }
        else
        {
            ctx.fillText(text, x, y, w);
            ctx.strokeText(text, x, y, w);
        }
        ctx.lineWidth = lw;
    }
};

/** FileIO */
// Functions dealing with downloads / uploads (e.g. CSV files, plots)
SPAApplet.FileIO =
{
    // Determine if canvases are supported on this browser.
    canvasSupported: (document.createElement("canvas").getContext ? true : false),

    // Determine if download of any kind is supported on this browser.
    downloadSupported: (typeof document.createElement("a").download != "undefined") || (window.Blob && window.navigator.msSaveBlob),

    // Determine if local storage is supported on this browser.
    storageSupported: (window.localStorage ? true : false),

    // Convert base64-encoded text to a Blob with the specified MIME type.
    base64ToBlob: function(encodedText, mimetype)
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
    },

    // If possible, utilize the download feature to save the textarea to a file;
    // otherwise, open another window with the Data URI
    saveCSV: function(txtAreaID, filename)
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
                  "Try copying the results and pasting them into Excel directly.");
        }
    },

    // If possible, utilize the download feature to save the dotplot to a file;
    // otherwise, open another window with the Data URI
    saveCanvas: function(canvasID, filename)
    {
        var canvas = document.getElementById(canvasID);
        var a = document.createElement('a');
        a.style = "display: none";
        filename = (filename ? filename : "dotplot");
        var imageURI = canvas.toDataURL();
        var myBlob = (window.Blob ? this.base64ToBlob(imageURI.slice(imageURI.indexOf(",") + 1), "image/png") : null);
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
};

/** Storage */
// Functions dealing with reads/writes to client storage (for preferences, mainly)
SPAApplet.Storage =
{
    // Prevent collisions with SRIS preferences
    keyBase: "SPA.",
    
    // Preferentially write to localStorage to handle private browsing
    writeToStorage: function(key, value)
    {
        try
        {
            window.localStorage.setItem(this.keyBase + key, value);
        }
        catch(e) // fix for Private Browsing sessions on mobile devices
        {
            try
            {
                window.sessionStorage.setItem(this.keyBase + key, value);
            }
            catch(e) { } // at this point, fail silently; preferences not supported
        }
    },

    // Preferentially read from sessionStorage to handle private browsing   
    readFromStorage: function(key)
    {
        var ret = window.sessionStorage.getItem(this.keyBase + key);
        return (ret ? ret : window.localStorage.getItem(this.keyBase + key));
    },

    // Preferentially remove from localStorage to handle private browsing
    clearStorage: function(keys)
    {
        for (var c in keys)
        {
            if (typeof keys[c] !== 'string')
                this.clearStorage(keys[c]);
            else
            {
                try
                {
                    window.localStorage.removeItem(this.keyBase + c);
                } catch(e)
                {
                    try
                    {
                        window.sessionStorage.removeItem(this.keyBase + c);
                    }
                    catch(e) { } // fail silently; preferences not supported
                }
            }
        }
    }
};

/** Preferences */
// Manage the preferences for all applets.
SPAApplet.Preferences =
{
    // SPAApplet.Preferences.keys shows the strings used for the storage
    // map on the client (for writing and retrieval).  defaults property shows what
    // will be written on writeDefaultPreferences( ).  values property is a map
    // populated on page load that show what is currently being used by an
    // active page.  If no preferences are stored on the client, or if the version
    // string does not match the version string coded below, the default
    // preferences are used and loaded; otherwise, what is in client's
    // localStorage (or sessionStorage, in certain cases) is loaded into values.

    version: "1.01", // Note that if you update this, all clients will reload to default
                     // Definitely update if you change the preference tree _structure_
    keys:
        { version: "version",
          number:
          { rounding_type: "num_rounding",        // "auto", "fixed" or "precision"
            rounding_places:
            { auto: "num_rounding.auto_places",
              fixed: "num_rounding.fixed_places",
              precision: "num_rounding.precision"
            }
          },
          proportion:
          { display_type: "prop_display",        // "proportion" or "percent"
            display_places: "prop_display.places"
          },
          zero_tolerance: "zero_tol_places",
          drawing:
          { dot_radius: "drawing.dot_radius",
            point_radius: "drawing.point_radius",
            bg_color: "drawing.bg_color",
            line_color: "drawing.line_color",
            fill_color: "drawing.fill_color",
            select_color: "drawing.select_color",
            font_size: "drawing.font_size",
            font_face: "drawing.font_face"
          }
        },
    defaults:
        { number:
            { rounding_type: "auto",
              rounding_places:
              { auto: "3",
                fixed: "3",
                precision: "3"
              },
            },
          proportion:
            { display_type: "proportion",
              display_places: "3"
            },
          zero_tolerance: "8",
          drawing:
          { dot_radius: "4",
            point_radius: "1",
            bg_color: "#FFFFFF",
            line_color: "#000000",
            fill_color: "#3333FF",
            select_color: "#660000",
            font_size: "11",
            font_face: "Times, serif"
          }
        },
    values:
        { number:
            { rounding_type: "auto",
              rounding_places:
              { auto: 3,
                fixed: 3,
                precision: 3
              },
            },
          proportion:
            { display_type: "proportion",
              display_places: 3
            },
          zero_tolerance: 8,
          drawing:
          { dot_radius: 4,
            point_radius: 1,
            bg_color: "#CCCCCC",
            line_color: "#000000",
            fill_color: "#3333FF",
            select_color: "#660000",
            font_size: 11,
            font_face: "Times, serif"
          }
        },

    // Rewrite the client's stored preferences to be the defaults coded above.
    // Useful for "Reset preferences to default"
    writeDefaultPreferences: function()
    {
        var stor = SPAApplet.Storage;

        stor.clearStorage(this.keys);
        stor.writeToStorage(this.keys.version, this.version);

        // Anonymous function tree walk
        (function recur(a, b){
            for (var c in a)
            {
                if (typeof a[c] !== 'string')
                    recur(a[c], b[c]);
                else
                    if (b[c]) stor.writeToStorage(a[c], b[c]);
            }
        })(this.keys, this.defaults);
        this.loadPreferences(true);
    },

    // Load preferences into memory.
    // skipPrefsCheck is generally used internally when we know the preference
    // structure is valid.
    loadPreferences: function(skipPrefsCheck)
    {
        var stor = SPAApplet.Storage;

        // If preferences have never been written before or if the version string
        // does not match, write the default preferences first, then load again,
        // unless we are skipping the prefs check
        if (!skipPrefsCheck) 
        {
            var version = stor.readFromStorage(this.keys.version);
            if (!version || (version != this.version))
            {
                this.writeDefaultPreferences();
                this.loadPreferences(true);
            }
        }
        
        // Read the current preferences into memory.
        // No error-checking -- these should have been written by default
        (function recur(a, b){
            for (var c in a)
            {
                if (typeof a[c] !== 'string')
                    recur(a[c], b[c]);
                else if (b[c])
                {
                    var s = stor.readFromStorage(a[c]);
                    var n = parseInt(s, 10);
                    b[c] = (isNaN(n) ? s : n);
                }
            }
        })(this.keys, this.values);
    },

    // Updates currently-loaded preference object and writes the result to storage.
    // You will have to manually reload preferences on other pages.
    writePreference: function(key, value)
    {
        (function recur(a, b, key, value)
        {
            for (var c in a)
            {
                if (typeof a[c] !== 'string')
                    recur(a[c], b[c], key, value);
                else if (a[c] == key)
                {
                    var n = parseInt(value, 10);
                    b[c] = (isNaN(n) ? value : n);
                    SPAApplet.Storage.writeToStorage(key, value);                    
                    return;
                }
            }
        })(this.keys, this.values, key, value);
    },
    
    // Convenience method for getting the current font name, suitable for setting canvas context
    getPreferredFont: function()
    {
        return this.values.drawing.font_size + "pt " + this.values.drawing.font_face;
    },
    
    // Singleton instance of a preference DIV node
    preferenceDivNode: null,
    preferencePageOpen: false,

    // Convenience method for launching a preference page as an overlay
    launchPreferencePage: function()
    {
        if (this.preferencePageOpen) return;

        this.preferencePageOpen = true;
        var bodyNode = document.getElementsByTagName("body")[0];

        // Create a modal div child on the body
        if (!this.preferenceDivNode)
        {
            var req = new XMLHttpRequest();
            req.open("GET", "prefs_dialog.html", true); // asynchronous request
            req.send();
            
            req.onreadystatechange = function()            
            {
                if (req.readyState == 4)
                {
                    if (req.status == 200)
                    {
                        SPAApplet.Preferences.preferenceDivNode = document.createElement("div");
                        SPAApplet.Preferences.preferenceDivNode.className = "modal";
                        SPAApplet.Preferences.preferenceDivNode.innerHTML = req.responseText;
        
                        // Add the markup to the document
                        bodyNode.appendChild(SPAApplet.Preferences.preferenceDivNode);
                        
                        // Load the helper Javascript once
                        var headNode = document.getElementsByTagName("head")[0];
                        var scriptNode = document.createElement("script");
                        scriptNode.src = "js/prefs_dialog.js";
                        scriptNode.type = "text/javascript";
                        headNode.appendChild(scriptNode);
                    }
                    else
                    {
                        alert("Loading preferences page failed.\nStatus: " + req.status + "\nMessage: " + req.statusText);
                        SPAApplet.Preferences.preferencePageOpen = false;
                    }
                }
            };
        }
        else // Preference code already loaded, just append it
            bodyNode.appendChild(this.preferenceDivNode);
    },

    // Close the preference overlay, if it is open    
    closePreferencePage: function()
    {
        if (!this.preferencePageOpen) return;

        var bodyNode = document.getElementsByTagName("body")[0];
        bodyNode.removeChild(this.preferenceDivNode);
        this.preferencePageOpen = false;
    }
};

// This code ensures that the preferences are loaded once as the SPA code loads.
// After this, you are on your own
SPAApplet.Preferences.loadPreferences();

/** SafeNumber */
// Handles number conversion and comparison
SPAApplet.SafeNumber = 
{
    // What power of 10 is the most significant digit of the argument?
    getPow10: function(val)
    {
        var expForm = val.toExponential(SPAApplet.Preferences.values.zero_tolerance);
        return parseInt(expForm.slice(expForm.indexOf("e") + 1), 10);
    },

    // Estimate the power of 10 of the LEAST nonzero digit of a number by using the exponential form.
    getLSPow10: function(val)
    {
        // If the number is zero, return the highest possible value of the least significant place
        if (SPAApplet.SafeNumber.isZeroWithinTolerance(val)) return Number.POSITIVE_INFINITY;

        // Work with the absolute value of the number, since the negative sign will throw off
        // all of our calculations below.
        var expForm = Math.abs(val).toExponential(SPAApplet.Preferences.values.zero_tolerance);
        var exponent = parseInt(expForm.slice(expForm.indexOf("e") + 1), 10);
        var mantissa = expForm.split("e", 1)[0];
        
        // work backward from the zeroes to the first non-zero and non-decimal point character
        var index = mantissa.length - 1;
        var dpIndex = mantissa.indexOf('.');
        while (index > dpIndex && mantissa.charAt(index) == '0')
            index--;

        // the difference between the indices is the negative power of 10 of the LS digit;
        // add the original exponent back in for the final answer.
        return exponent - (index - dpIndex);
    },

    // Round off num to the decimal place indicated by 10^pow
    roundToPow10: function(num, pow)
    {
        var safenum = SPAApplet.SafeNumber;
        if (safenum.isZeroWithinTolerance(num)) return 0;
        
        var pow10 = safenum.getPow10(num);
        if (pow10 >= pow)
            return safenum.roundToSignificance(num, safenum.getPow10(num) - pow + 1);
        else if (pow - pow10 === 1)
            return safenum.roundWithinTolerance(Math.round(num / Math.pow(10, pow10 + 1)) * Math.pow(10, pow));
        else    // no reason to do any calculation if the rounding place is more than 1 place above; answer is 0
            return 0;
    },

    // Is the argument zero within tolerance?
    isZeroWithinTolerance: function(val, tol)
    {
        if (typeof(tol) === "undefined") tol = SPAApplet.Preferences.values.zero_tolerance;
        return (Math.abs(val) < Math.pow(10, -tol));
    },

    // Attempt to round numbers within tolerance of 0
    roundWithinTolerance: function(val, tol)
    {
        if (typeof(tol) === "undefined") tol = SPAApplet.Preferences.values.zero_tolerance;
        return parseFloat(val.toFixed(tol));
    },

    // Round the given number to the specified level of significance
    roundToSignificance: function(val, places)
    {
        if (!places || (places < 1))
            places = 1;
        return SPAApplet.SafeNumber.roundWithinTolerance(parseFloat(val.toExponential(places - 1)));
    },

    // Truncate the given number to the specified level of significance 
    truncToSignificance: function(val, places)
    {
        var safenum = SPAApplet.SafeNumber;
        if (safenum.isZeroWithinTolerance(val)) return 0;

        var retval = safenum.roundToSignificance(val, places);
        var cutoffPlaces = safenum.getPow10(val) - places + 1;
        if (val < 0)
        {
            if (retval < val) retval += Math.pow(10, cutoffPlaces);
        }
        else
        {
            if (retval > val) retval -= Math.pow(10, cutoffPlaces);
        }
        return retval;
    },

    // Floor the given number to the specified level of significance
    floorToSignificance: function(val, places)
    {
        var safenum = SPAApplet.SafeNumber;
        if (safenum.isZeroWithinTolerance(val)) return 0;

        var retval = safenum.truncToSignificance(val, places);
        if (safenum.compareToWithinTolerance(retval, val) !== 0 && val < 0)
            retval -= Math.pow(10, safenum.getPow10(val) - places + 1);
        return retval;
    },

    // Ceiling the given number to the specified level of significance
    ceilToSignificance: function(val, places)
    {
        var safenum = SPAApplet.SafeNumber;
        if (safenum.isZeroWithinTolerance(val)) return 0;

        var retval = safenum.truncToSignificance(val, places);
        if (safenum.compareToWithinTolerance(retval, val) !== 0 && val > 0)
            retval += Math.pow(10, safenum.getPow10(val) - places + 1);
        return retval;
    },
    
    // Comparator-style function for comparing two floating point values
    compareToWithinTolerance: function(num1, num2, tol)
    {
        if (typeof(tol) === "undefined") tol = SPAApplet.Preferences.values.zero_tolerance;
        return SPAApplet.SafeNumber.roundWithinTolerance(num1 - num2, tol);
    },
    
    // Simply call roundWithinTolerance on an array of numbers
    cleanArray: function(arr)
    {
        for (var i = 0; i < arr.length; i++)
            arr[i] = SPAApplet.SafeNumber.roundWithinTolerance(arr[i]);
    }
};

/** Format */
// Handles number display to client, including preferential formatting of numbers
// to certain numbers of decimal places or as proportions versus percents
SPAApplet.Format =
{
    // Format a proportion as a String according to preferences.
    formatProportion: function(p, overridePlaces)
    {
        var placesDefined = (typeof(overridePlaces) !== "undefined");
        var pref = SPAApplet.Preferences;
        var places = (placesDefined ? overridePlaces : pref.values.proportion.display_places);
        if (pref.values.proportion.display_type == "proportion")
            return "" + parseFloat(p.toFixed(places));
        else
            return (placesDefined ? this.formatPercent(p, overridePlaces) : this.formatPercent(p));
    },

    // Format a number as a percent.
    formatPercent: function(p, overridePlaces)
    {
        var placesDefined = (typeof(overridePlaces) !== "undefined");
        var pref = SPAApplet.Preferences;
        var places = (placesDefined ? overridePlaces : pref.values.proportion.display_places);
        if (places > 1) // percent
            return "" + parseFloat((p * 100).toFixed(places - 2)) + "%";
        else
            return "" + (p * 100).toPrecision(1) + "%";
    },
    
    // Format a decimal as a String according to preferences.
    formatNumber: function(num, overridePlaces)
    {
        var placesDefined = (typeof(overridePlaces) !== "undefined");
        var val = SPAApplet.SafeNumber.roundWithinTolerance(num);
        var pref = SPAApplet.Preferences;
    
        if (placesDefined)
            return val.toFixed(overridePlaces);
        else if (pref.values.number.rounding_type == "fixed")
            return val.toFixed(pref.values.number.rounding_places.fixed);
        else if (pref.values.number.rounding_type == "precision")
            return val.toPrecision(pref.values.number.rounding_places.precision);
        else
            return "" + parseFloat(val.toFixed(pref.values.number.rounding_places.auto));
    },
    
    // This handles P value display so that extremely small P-values are listed
    // as "< 0.001," for example.
    // FUTURE: Maybe make this tolerance value a preference?
    formatPValueHTML: function(pValue, tol)
    {
        if (typeof tol == "undefined") tol = 0.001;
        return (pValue < tol ? "&lt;" + tol : this.formatNumber(pValue));
    }
};

/** AxisSpace */
// Convenience for linearly interpolating a number within a certain range into a number in
// a different range.  Often used to represent real-life or canvas coordinate spaces.
SPAApplet.AxisSpace = function(min, max)
{
    this.min = min;
    this.max = max;
};

// Returns width of this AxisSpace.
SPAApplet.AxisSpace.prototype.getRange = function() { return this.max - this.min; };

// Interpolate coord in this space into AxisSpace newSpace.
SPAApplet.AxisSpace.prototype.transform = function(coord, newSpace)
{
    return (coord - this.min) / this.getRange() * newSpace.getRange() + newSpace.min;
};

// Suggests an axis division of this AxisSpace that will make for a clean graph display.
// In specific:
//  maxTicks: maximum number of ticks you will allow
//  maximize: if true, take initial suggestion and subdivide it into 2's and 5's to maximize the
//     number of ticks, up to maxTicks
//  forceInteger: don't subdivide below the units place
SPAApplet.AxisSpace.prototype.suggestedTickIncrement = function(maxTicks, maximize, forceInteger)
{
    var safenum = SPAApplet.SafeNumber;

    // If no max/min number of ticks is provided, use 20 and 2, respectively
    if (typeof(maxTicks) === "undefined") maxTicks = 20;

    // As a first guess, let the tick increment be the power of 10 that is one order of magnitude below
    // the range covered by the axis space.
    var range = this.getRange();
    var tickIncrement = Math.pow(10, safenum.getPow10(range) - 1);

    if (forceInteger && (tickIncrement < 1)) return 1;

    // In certain cases (e.g. residual plots for perfect correlations), the proposed tickIncrement will be 0.
    // If this is the case, give up.
    if (safenum.isZeroWithinTolerance(tickIncrement)) return Number.POSITIVE_INFINITY;

    // If this AxisSpace will be divided into more than the maximum number of ticks,
    // make the ticking increment larger by successive powers of 10.
    while (safenum.compareToWithinTolerance(range / tickIncrement, maxTicks) > 0)
        tickIncrement *= 10;

    if (maximize)
    {
        var multiplierPattern = [2, 5];
        var counter = 0;
        // While you can still halve the tick increment and not exceed the maximum number of ticks,
        // try half of the current power of 10, then the next power down.
        while (safenum.compareToWithinTolerance(range / tickIncrement * multiplierPattern[counter], maxTicks) < 0)
        {
            if (forceInteger && (tickIncrement / multiplierPattern[counter] < 1)) return tickIncrement;
            tickIncrement /= multiplierPattern[counter];
            counter = (counter + 1) % 2;
        }
    }
    return tickIncrement;
};

// Companion to suggestedTickIncrement, this suggests a numerically clean place to start the
// axis subdivision when drawing.  insureCompleteLeftBin is useful for drawing histograms,
// adding an insurance tick increment to be sure a left bar does not run off the page.
SPAApplet.AxisSpace.prototype.suggestedStartingTickValue = function(tickIncrement, insureCompleteLeftBin)
{
    // TODO: Try using the SafeNumber methods to refactor this slightly
    // TODO: You may want to refactor SafeNumber to use this approach.
    var safenum = SPAApplet.SafeNumber;
    var firstTick = Math.floor(this.min / tickIncrement) * tickIncrement;

    if (!insureCompleteLeftBin)
        while (safenum.compareToWithinTolerance(firstTick, this.min) < 0)
            firstTick += tickIncrement;

    return SPAApplet.SafeNumber.roundWithinTolerance(firstTick);
};

/** DrawingArea */
// Maps world coordinates to canvas coordinates on an HTML5 Canvas.
// By convention, the yDrawSpace will be "upside-down" -- this will invert any
// graphing done according to world coordinates.
SPAApplet.DrawingArea = function(canvas, xAxisSpace, yAxisSpace, xDrawSpace, yDrawSpace)
{
    this.canvas = canvas;
    this.xAxisSpace = xAxisSpace;
    this.yAxisSpace = yAxisSpace;
    this.xDrawSpace = xDrawSpace || new SPAApplet.AxisSpace(0, canvas.width - 1);
    this.yDrawSpace = yDrawSpace || new SPAApplet.AxisSpace(canvas.height - 1, 0);
};

// Be sure anything you draw does not go outside your assigned bounds.  This can be
// useful when graphs share the same single canvas space.
SPAApplet.DrawingArea.prototype.executeInClip = function(drawFunc, ctx)
{
    ctx.save();
    ctx.beginPath(); // Let's not start any new paths or extend what is going on
    // Note the reverse mapping applied here.
    ctx.rect(this.xDrawSpace.min, this.yDrawSpace.max, this.xDrawSpace.getRange(), -this.yDrawSpace.getRange());
    ctx.clip();   
    drawFunc();
    ctx.restore();
};

// Draws a line on the area in world coordinates (actual mathematical graphing coordinates)
SPAApplet.DrawingArea.prototype.drawLineWC = function(x1, y1, x2, y2, color, thickness)
{
    var pref = SPAApplet.Preferences;
    
    x1 = this.xAxisSpace.transform(x1, this.xDrawSpace);
    x2 = this.xAxisSpace.transform(x2, this.xDrawSpace);
    y1 = this.yAxisSpace.transform(y1, this.yDrawSpace);
    y2 = this.yAxisSpace.transform(y2, this.yDrawSpace);
    var ctx = this.canvas.getContext("2d");
    this.executeInClip(function()
    {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = (color || pref.values.drawing.line_color);
        ctx.lineWidth = (thickness || 1);
        ctx.stroke();
    }, ctx);
};

// Draws a rectangle on the area in world coordinates (actual mathematical graphing coordinates)
// and fills it
SPAApplet.DrawingArea.prototype.fillRectWC = function(x1, y1, x2, y2, fillColor, lineColor)
{
    var pref = SPAApplet.Preferences;
    
    x1 = this.xAxisSpace.transform(x1, this.xDrawSpace);
    x2 = this.xAxisSpace.transform(x2, this.xDrawSpace);
    y1 = this.yAxisSpace.transform(y1, this.yDrawSpace);
    y2 = this.yAxisSpace.transform(y2, this.yDrawSpace);
    var topLeftX = Math.min(x1, x2);
    var topLeftY = Math.min(y1, y2);
    var btmRightX = Math.max(x1, x2);
    var btmRightY = Math.max(y1, y2);
    var width = btmRightX - topLeftX;
    var height = btmRightY - topLeftY;
    var ctx = this.canvas.getContext("2d");
    this.executeInClip(function()
    {
        ctx.strokeStyle = (lineColor || pref.values.drawing.line_color);
        ctx.fillStyle = (fillColor || pref.values.drawing.fill_color);
        ctx.fillRect(topLeftX, topLeftY, width, height);
        ctx.strokeRect(topLeftX, topLeftY, width, height);
    }, ctx);
};

// Draws a small filled point on the area in world coordinates (actual mathematical graphing coordinates)
SPAApplet.DrawingArea.prototype.drawPointWC = function(x, y, size, fillColor, lineColor)
{
    var pref = SPAApplet.Preferences;
    size = size || pref.values.drawing.point_radius;
    
    x = this.xAxisSpace.transform(x, this.xDrawSpace);
    y = this.yAxisSpace.transform(y, this.yDrawSpace);
    var ctx = this.canvas.getContext("2d");
    this.executeInClip(function()
    {
        ctx.beginPath();
        ctx.strokeStyle = (lineColor || pref.values.drawing.line_color);
        ctx.fillStyle = (fillColor || pref.values.drawing.fill_color);
        ctx.arc(x, y, size, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
    }, ctx);
};

// Plot the points for a function given by the anonymous javascript func,
// evaluated at small intervals between minX and maxX (see step definition below).
// Highlight the area under the curve if plotAreaToAxis is true.
SPAApplet.DrawingArea.prototype.plotFunction = function(func, minX, maxX, plotAreaToAxis, step)
{
    var pref = SPAApplet.Preferences;
    var pointSize = pref.values.drawing.point_radius;
    
    // If no function step is provided, use the mapping of the drawing radius to the axis space
    // For typical Gaussians on wide canvases, in testing it looked a little bad to use the pointSize itself,
    // thus pointSize / 2
    step = step || (pointSize / 2 / this.xDrawSpace.getRange() * this.xAxisSpace.getRange());

    // Bring the function plotting into range if needed; no need to plot outside the axis space
    if (minX < this.xAxisSpace.min) minX = this.xAxisSpace.min;
    if (maxX > this.xAxisSpace.max) maxX = this.xAxisSpace.max;

    while (SPAApplet.SafeNumber.compareToWithinTolerance(minX, maxX) < 0)
    {
        var yVal = func(minX);
        if (plotAreaToAxis)
            this.drawLineWC(minX, yVal, minX, 0, pref.values.drawing.fill_color);
        this.drawPointWC(minX, yVal, pointSize);
        minX += step;
    }
};

/** CategoricalGraphContainer */
// A simple graph container that plots one categorical data set at a time.
// The container manages the y scale and adds the labels from the graph to the x scale,
// as well as managing a separate area for a graph legend.
// A DrawingArea is provided to the graph portion at rendering time.

// Create container and associate it with a canvas element on the page by the ID attribute
// PRECONDITION: canvasId is a valid ID attribute for a canvas (cannot be null)
SPAApplet.CategoricalGraphContainer = function(canvasId)
{
    // "Globals" -- mutable per instance in case this is useful in the future...
    this.leftLabelWidth = 100;
    this.bottomLabelHeight = 40;    // will change later with font height
    this.rightLegendWidth = 200;
    
    // Use relative labeling on y axis
    this.relativeYScale = true;

    this.yAxisSpace = new SPAApplet.AxisSpace(0, 1);

    this.canvas = document.getElementById(canvasId);

    var fontHeight = this.getPreferredFontHeightBespin();
    this.bottomLabelHeight = 3 * fontHeight;
    this.xCanvasSpace = new SPAApplet.AxisSpace(this.leftLabelWidth, this.canvas.width - fontHeight - this.rightLegendWidth - 1);
    this.yCanvasSpace = new SPAApplet.AxisSpace(this.canvas.height - this.bottomLabelHeight - 1, fontHeight);

    this.xDrawSpace = new SPAApplet.AxisSpace(0, this.xCanvasSpace.getRange() - 1);
};

// Assign a graph to this container and render it unless "norender" is true.
SPAApplet.CategoricalGraphContainer.prototype.setGraph = function(graph, norender)
{
    this.graph = graph;
    if (graph.container)
        graph.container.removeGraph();
    graph.container = this;
    graph.drawingArea = new SPAApplet.DrawingArea(this.canvas, this.xDrawSpace,
                    this.yAxisSpace, this.xCanvasSpace, this.yCanvasSpace);

    if (!norender)  
        this.renderGraph();
};

// Remove whatever graph is in the container and clear the rendering
SPAApplet.CategoricalGraphContainer.prototype.removeGraph = function()
{
    if (this.graph)
        this.graph.container = null;
    this.graph = null;
    this.clearAll();
};

// Google Bespin method for approximating height of a font -- height of a font roughly
// equal to width of lowercase "m".
// See: http://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
SPAApplet.CategoricalGraphContainer.prototype.getPreferredFontHeightBespin = function(ctx)
{
    ctx = ctx || this.canvas.getContext("2d");
    ctx.save();
    ctx.font = SPAApplet.Preferences.getPreferredFont();
    var retval = ctx.measureText("m").width;
    ctx.restore();
    return retval;
};

// Render the background color by drawing a rectangle over the whole thing in
// the preferred color
SPAApplet.CategoricalGraphContainer.prototype.drawBackground = function()
{
    var ctx = this.canvas.getContext("2d");
    ctx.fillStyle = SPAApplet.Preferences.values.drawing.bg_color;
    ctx.fillRect(this.xCanvasSpace.min, this.yCanvasSpace.max,
                 this.xCanvasSpace.getRange(), -this.yCanvasSpace.getRange());
};

// Render the legend in the space allowed for a legend on the canvas
SPAApplet.CategoricalGraphContainer.prototype.drawLegend = function(catArr, reverse)
{
    var pref = SPAApplet.Preferences;
    var util = SPAApplet.Utility;
    var legendName = this.graph.legendName || "Key";
    if (legendName.length == 0) legendName = "Key";
    
    var ctx = this.canvas.getContext("2d");
    ctx.strokeStyle = pref.values.drawing.line_color;
    ctx.fillStyle = pref.values.drawing.line_color; // it's the line color because we're doing text
    var fontHeight = this.getPreferredFontHeightBespin(ctx);
    ctx.font = pref.getPreferredFont();

    var leftX = this.xCanvasSpace.max + 5;
    var currentY = fontHeight;
    SPAApplet.Utility.renderText(ctx, legendName, leftX, currentY);
    var underlineLength = ctx.measureText(legendName).width;
    ctx.moveTo(leftX, currentY + 2);
    ctx.lineTo(leftX + underlineLength, currentY + 2);
    ctx.stroke();
    var lineIncrement = fontHeight * 1.5;
    
    for (var i = 0; i < catArr.length; i++)  
    {
        var index = reverse ? catArr.length - 1 - i : i;
        var col = util.getSpectrumColor(index);
        currentY += lineIncrement;
        ctx.fillStyle = col;
        ctx.fillRect(leftX, currentY - fontHeight, fontHeight, fontHeight);
        SPAApplet.Utility.renderText(ctx, catArr[index], leftX + 2 * fontHeight, currentY);
    }
};

// Render the axis scales/ticks and expose the ticking strategy as properties
SPAApplet.CategoricalGraphContainer.prototype.drawScales = function()
{
    if (!this.graph) return;
    
    var pref = SPAApplet.Preferences;
    var safenum = SPAApplet.SafeNumber;

    var minFontHeight = 8;
    
    var ctx = this.canvas.getContext("2d");
    ctx.strokeStyle = pref.values.drawing.line_color;
    ctx.fillStyle = pref.values.drawing.line_color; // it's the line color because we're doing text
    var fontHeight = this.getPreferredFontHeightBespin(ctx);
    ctx.font = pref.getPreferredFont();
    
    // First draw all y-axis scales for all graphs in this container
    if (!this.graph.hideYScale)
    {       
        // The maximum number of ticks is 90% of the ratio of the draw height to the font height
        // Note the draw space range is negative due to the inverted mapping versus the y-axis
        this.yTickIncrement = this.yAxisSpace.suggestedTickIncrement(-this.yCanvasSpace.getRange() / fontHeight * 0.9, true,
                                (this.graph.indicateFrequency && !this.relativeYScale));
        var currentY = this.yAxisSpace.suggestedStartingTickValue(this.yTickIncrement);
        this.yFirstTick = currentY;
        
        this.furthestLeftY = this.leftLabelWidth - fontHeight;
        
        // Increase currentY by the increment, continuing until currentY is larger than the max
        // At each increment, draw the appropriate tick mark and label it
        var yTickStart = this.leftLabelWidth - 6;
        while (safenum.compareToWithinTolerance(currentY, this.yAxisSpace.max) <= 0)
        {
            // Draw a small mark from the left edge of the draw canvas
            var canvasYTick = this.yAxisSpace.transform(currentY, this.yCanvasSpace);
            ctx.beginPath();
            ctx.moveTo(yTickStart, canvasYTick);
            ctx.lineTo(this.leftLabelWidth - 1, canvasYTick);
            ctx.stroke();
            
            // Draw the text
            var labeltext = this.relativeYScale ? SPAApplet.Format.formatProportion(currentY) : safenum.roundWithinTolerance(currentY);
            var canvasYText = canvasYTick + fontHeight / 2;
            var canvasTextWidth = ctx.measureText(labeltext).width;
            var labelstart = this.leftLabelWidth - 10 - canvasTextWidth;
            if (labelstart < this.furthestLeftY) this.furthestLeftY = labelstart;
            SPAApplet.Utility.renderText(ctx, labeltext, labelstart, canvasYText);
            currentY = safenum.roundWithinTolerance(currentY + this.yTickIncrement);
        }
    }

    if (!this.graph.hideXScale)
    {
        ctx.save();

        // Drawing the x scale is complicated by the fact that the category labels figure into it.
        // First, measure all categories to determine if the font size needs to be made smaller.
        var renderOK = true;
        do
        {
            renderOK = true;
            var maxXLabelWidth = 0;
            for (var i = 0; i < this.graph.data.categories.length; i++)
            {
                var cat = this.graph.data.categories[i];
                ctx.font = fontHeight + "px " + pref.values.drawing.font_face;
                var width = ctx.measureText(cat).width;
                if (width > maxXLabelWidth) maxXLabelWidth = width;
            }
            
            if (this.graph.data.categories.length * maxXLabelWidth > this.canvas.width)
            {
                fontHeight -= 1;
                if (fontHeight > minFontHeight) renderOK = false;
            }
        } while (!renderOK);

        var transformSpace = new SPAApplet.AxisSpace(0, this.graph.data.categories.length + 1);
        
        // Increase currentX by the increment, continuing until currentX is larger than the max
        // At each increment, draw the appropriate tick mark and label it
        var bottomDrawEdge = this.canvas.height - this.bottomLabelHeight;
        this.categoryXLocations = {};
        var index = 0;
        for (var i = 0; i < this.graph.data.categories.length; i++)
        {
            var cat = this.graph.data.categories[i];
            index++;
            var currentX = transformSpace.transform(index, this.xCanvasSpace);
            this.categoryXLocations[cat] = this.xCanvasSpace.transform(currentX, this.xDrawSpace);
            
            // Draw a small mark from the left edge of the draw canvas
            ctx.beginPath();
            ctx.moveTo(currentX, bottomDrawEdge + 5);
            ctx.lineTo(currentX, bottomDrawEdge);
            ctx.stroke();
            
            // Draw the text -- compress the labels if you need to
            var currentWidth = Math.min(ctx.measureText(cat).width,
                        (this.xCanvasSpace.getRange() / (this.graph.data.categories.length * 2)));
            var canvasXText = currentX - currentWidth / 2;
            SPAApplet.Utility.renderText(ctx, cat, canvasXText, bottomDrawEdge + 6 + fontHeight, currentWidth);
        }
        ctx.restore();
    }
};

// Determine whether frequencies should be rendered as relative or not
SPAApplet.CategoricalGraphContainer.prototype.setRelativeScale = function(setRelative, norender)
{
    if (setRelative)
    {
        this.relativeYScale = true;
        this.yAxisSpace.max = 1;
    }
    else
        // The yAxisSpace will be set at render time to max out at the total number
        // of data being graphed.
        this.relativeYScale = false;
    
    if (!norender)
        this.renderGraph();
};

// Clear all rendering by writing a big white rectangle over the whole container
SPAApplet.CategoricalGraphContainer.prototype.clearAll = function()
{
    var ctx = this.canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

// Draw the axis titles in appropriate places
SPAApplet.CategoricalGraphContainer.prototype.drawTitles = function()
{
    var ctx = this.canvas.getContext("2d");
    var fontHeight = this.getPreferredFontHeightBespin(ctx);
    ctx.fillStyle = SPAApplet.Preferences.values.drawing.line_color;
    ctx.font = SPAApplet.Preferences.getPreferredFont();

    var edgeOffset = (this.furthestLeftY ? Math.max(this.furthestLeftY - 2 * fontHeight, fontHeight)
                                         : fontHeight);

    if (this.graph.indicateFrequency)
    {
        ctx.save();
        var transformSpace = new SPAApplet.AxisSpace(0, 1);
        var groupNameCenterY = transformSpace.transform(0.5, this.yCanvasSpace);
        var text = (this.relativeYScale ? "Relative frequency" : "Frequency");
        var textWidth = ctx.measureText(text).width;
        ctx.translate(edgeOffset, groupNameCenterY + textWidth / 2);
        ctx.rotate(-Math.PI / 2);
        SPAApplet.Utility.renderText(ctx, text, 0, fontHeight);
        ctx.restore();
    }
    
    // Draw variable name
    if (this.graph.variableName)
    {
        var varNameWidth = ctx.measureText(this.graph.variableName).width;
        SPAApplet.Utility.renderText(ctx, this.graph.variableName,
            this.xCanvasSpace.min + (this.xCanvasSpace.getRange() - varNameWidth) / 2,
                     this.canvas.height - 3);
    }
};

// Do all the drawing for the graph contained
SPAApplet.CategoricalGraphContainer.prototype.renderGraph = function()
{
    this.clearAll();

    if (this.graph)
    {
        if (this.graph.preRender)
            this.graph.preRender();
    
        // Set the maximum y world coordinate to be 105% of the largest frequency present in the data.
        var maxFreq = 0;
        for (var key in this.graph.data.frequencies)
        {
            if (this.graph.data.frequencies[key] > maxFreq)
                maxFreq = this.graph.data.frequencies[key];
        }
        this.yAxisSpace.max = 1.05 * maxFreq / (this.relativeYScale ? this.graph.data.getTotalFrequency() : 1);

        this.drawBackground();
        this.drawScales();
        this.drawTitles();
        
        if (!this.graph.hideBorders)
        {
            var ctx = this.canvas.getContext("2d");
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.xCanvasSpace.min, this.yCanvasSpace.max);
            ctx.lineTo(this.xCanvasSpace.min, this.yCanvasSpace.min);
            ctx.lineTo(this.xCanvasSpace.max, this.yCanvasSpace.min);
            ctx.stroke();
        }        
        this.graph.render();
    }
};

// The following are graph objects compatible with CategoricalGraphContainer,
// as they specify a render method and take advantage of exposed properties

/** BarGraph */
// A bar graph for qualitative data
SPAApplet.BarGraph = function(data, variableName, container)
{
    this.data = data;
    this.variableName = variableName;
    if (container)
        container.addGraph(this);
};

SPAApplet.BarGraph.prototype.render = function()
{
    var barWidth = this.drawingArea.xAxisSpace.getRange() / (2 * this.data.categories.length);
    var total = this.data.getTotalFrequency();
    for (var i = 0; i < this.data.categories.length; i++)
    {
        var cat = this.data.categories[i];
        var barCenter = this.container.categoryXLocations[cat];
        this.drawingArea.fillRectWC(barCenter - barWidth / 2, 0, barCenter + barWidth / 2,
            (this.container.relativeYScale ? this.data.frequencies[cat] / total : this.data.frequencies[cat]));
    }
};

// Property to trigger graph behavior
SPAApplet.BarGraph.prototype.indicateFrequency = true;

/** PieGraph */
// A pie graph for qualitative data
SPAApplet.PieGraph = function(data, container)
{
    this.data = data;
    if (container)
        container.addGraph(this);
};

// Break encapsulation and draw directly on canvas.
SPAApplet.PieGraph.prototype.render = function()
{
    var util = SPAApplet.Utility;
    var pref = SPAApplet.Preferences;
    
    var canvas = this.container.canvas;
    var ctx = canvas.getContext("2d");
    var xCanvasSpace = this.container.xCanvasSpace;
    var yCanvasSpace = this.container.yCanvasSpace;
    var canvasWidth = xCanvasSpace.getRange();
    var canvasHeight = -yCanvasSpace.getRange();
    
    var xDrawSpace = new SPAApplet.AxisSpace(0, canvasWidth - 1);
    var yDrawSpace = new SPAApplet.AxisSpace(canvasHeight - 1, 0);  // reverse the reverse mapping :-P

    // Be a good citizen; clip
    ctx.save();
    ctx.beginPath();
    ctx.rect(xCanvasSpace.min, yCanvasSpace.max, canvasWidth, canvasHeight);
    ctx.clip();

    ctx.font = pref.getPreferredFont();
    
    // Draw a circle taking up 80% of the height, on the left side.
    // Circle is centered, then, in the draw space at (canvasWidth / 2, canvasHeight / 2).
    var centerXCoordCanvas = xDrawSpace.transform(canvasWidth / 2, xCanvasSpace);
    var centerYCoordCanvas = yDrawSpace.transform(canvasHeight / 2, yCanvasSpace);
    
    var radius = 0.4 * Math.min(canvasHeight, canvasWidth);
    var total = this.data.getTotalFrequency();
    var fontHeight = ctx.measureText("m").width; // Bespin approach

    var currentAngle = 0;
    for (var i = 0; i < this.data.categories.length; i++)
    {
        var key = this.data.categories[i];
        var relFreq = this.data.frequencies[key] / total;
        var angleIncrement = -Math.PI * 2 * relFreq;
        ctx.beginPath();
        ctx.fillStyle = util.getSpectrumColor(i);
        ctx.arc(centerXCoordCanvas, centerYCoordCanvas, radius, currentAngle, currentAngle + angleIncrement, true);
        ctx.lineTo(centerXCoordCanvas, centerYCoordCanvas);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        currentAngle += angleIncrement;
    }

    // All done
    ctx.restore();

    // This graph requires a legend   
    this.container.drawLegend(this.data.categories);
};

// For automatic properties of container
SPAApplet.PieGraph.prototype.hideXScale = true;
SPAApplet.PieGraph.prototype.hideYScale = true;
SPAApplet.PieGraph.prototype.hideBorders = true;

/** StackedBarGraph */
// Graph data in a contingency table as stacked / segmented bars
SPAApplet.StackedBarGraph = function(data2Var, variableName, legendName, container)
{
    this.data2Var = data2Var;
    this.variableName = variableName || "";
    this.legendName = legendName || "Key";
    
    // Fake-out exposed object so 1-var container will render labels properly
    this.data = {
        categories: data2Var.columnCategories,
        frequencies: { dummy: 1 },
        getTotalFrequency: function() { return 1; }
    };
    if (container)
        container.setGraph(this);
};

SPAApplet.StackedBarGraph.prototype.render = function()
{
    var barWidth = this.drawingArea.xAxisSpace.getRange() / (2 * this.data.categories.length);
    for (var i = 0; i < this.data.categories.length; i++)
    {
        var cat = this.data.categories[i];
        var cond = this.data2Var.getColumnConditionalDistribution(cat);
        var barCenter = this.container.categoryXLocations[cat];
        var currentY = 0;
        for (var j = 0; j < cond.length; j++)
        {
            this.drawingArea.fillRectWC(barCenter - barWidth / 2, currentY, barCenter + barWidth / 2, currentY + cond[j],
                SPAApplet.Utility.getSpectrumColor(j));
            currentY += cond[j];
        }
    }
    
    this.container.drawLegend(this.data2Var.rowCategories, true);
};

// Property to trigger graph behavior
SPAApplet.StackedBarGraph.prototype.indicateFrequency = true;

/** SideBySideBarGraph */
// Graph data in a contingency table as side-by-side bars
SPAApplet.SideBySideBarGraph = function(data2Var, variableName, legendName, container)
{
    this.data2Var = data2Var;
    this.variableName = variableName || "";
    this.legendName = legendName || "Key";
    
    // Fake-out exposed object so 1-var container will render labels properly
    var allFreq = [];
    for (var i = 0; i < data2Var.rowCategories.length; i++)
        for (var j = 0; j < data2Var.columnCategories.length; j++)
            allFreq.push(data2Var.data[i][j]);
            
    this.data = {
        categories: data2Var.columnCategories,
        frequencies: allFreq,
        getTotalFrequency: function() { return jStat.max(data2Var.columnTotals); }
    };
    if (container)
        container.setGraph(this);
};

SPAApplet.SideBySideBarGraph.prototype.render = function()
{
    var totalBarAllots = this.data2Var.rowCategories.length * (this.data2Var.columnCategories.length + 2);
    var barWidth = this.drawingArea.xAxisSpace.getRange() / totalBarAllots;
    var total = this.data.getTotalFrequency();
    for (var i = 0; i < this.data2Var.columnCategories.length; i++)
    {
        var barX = this.container.categoryXLocations[this.data2Var.columnCategories[i]] -
                        (barWidth * this.data2Var.rowCategories.length / 2);
        for (var j = 0; j < this.data2Var.rowCategories.length; j++)
        {
            this.drawingArea.fillRectWC(barX, 0 , barX + barWidth,
                (this.container.relativeYScale ? this.data2Var.data[j][i] / this.data2Var.columnTotals[i]
                    : this.data2Var.data[j][i]),
                SPAApplet.Utility.getSpectrumColor(j));
            barX += barWidth;
        }
    }
    
    this.container.drawLegend(this.data2Var.rowCategories);
};

// Property to trigger graph behavior
SPAApplet.SideBySideBarGraph.prototype.indicateFrequency = true;

/** QuantitativeGraphContainer */
// More sophisticated (convoluted?) canvas facilities for quantitative univariate graphs
// (boxplot, dotplot, histogram, stemplot).
// The x-axis is "shared" among all graphs.  The y-axis is shared among all graphs and
// defaults to [0, 1] (relative labeling); apply a specific unit labeling to get a specific display.
// PRECONDITION: canvasId is a valid ID attribute for a canvas element
//   (varname can be empty)
// FUTURE: Align this signature and associated set/initialize methods
//   with the ctor for CategoricalGraphContainer
SPAApplet.QuantitativeGraphContainer = function(canvasId, varname)
{
    // "Globals" -- mutable per instance in case this is useful in the future...
    this.leftLabelWidth = 100;
    this.bottomLabelHeight = 40;    // will change later with font height
    
    // Object map for aligned properties of parent    
    this.commonProperties = {};
    
    // Array of current graphs
    this.graphs = [];

    // Use relative labeling on y axis
    this.relativeYScale = true;

    this.xAxisSpace = new SPAApplet.AxisSpace(0, 1);
    this.yAxisSpace = new SPAApplet.AxisSpace(0, 1);

    this.setCanvasById(canvasId);
    this.setVariableName(varname, true);
};

// Set explanatory axis variable name
SPAApplet.QuantitativeGraphContainer.prototype.setVariableName = function(varname, norender)
{
    this.variableName = varname || "";
    if (!norender)
        this.renderGraphs();
};

// Associate this container with a canvas element on the page by the ID attribute
SPAApplet.QuantitativeGraphContainer.prototype.setCanvasById = function(canvasId)
{
    this.setCanvas(document.getElementById(canvasId));
};

// Set the canvas of this Container directly by assigning its actual Canvas DOM object
SPAApplet.QuantitativeGraphContainer.prototype.setCanvas = function(canvas)
{
    this.canvas = canvas;
    var fontHeight = this.getPreferredFontHeightBespin();
    this.bottomLabelHeight = 3 * fontHeight;
    this.xCanvasSpace = new SPAApplet.AxisSpace(this.leftLabelWidth, this.canvas.width - fontHeight - 1);
    this.yCanvasSpace = new SPAApplet.AxisSpace(this.canvas.height - this.bottomLabelHeight - 1, fontHeight);
    this.reassignGraphAreas();
};

// Google Bespin method for approximating height of a font -- height of a font roughly
// equal to width of lowercase "m".
// See: http://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
SPAApplet.QuantitativeGraphContainer.prototype.getPreferredFontHeightBespin = function(ctx)
{
    ctx = ctx || this.canvas.getContext("2d");
    ctx.save();
    ctx.font = SPAApplet.Preferences.getPreferredFont();
    var retval = ctx.measureText("m").width;
    ctx.restore();
    return retval;
};

// Add each graph to this container contained in array graphArr
SPAApplet.QuantitativeGraphContainer.prototype.addGraphs = function(graphArr)
{
    this.graphs = this.graphs.concat(graphArr);
    for (var i = 0; i < graphArr.length; i++)
    {
        if (graphArr[i].container)
            graphArr[i].container.removeGraph(graphArr[i]);
        graphArr[i].container = this;
    }
    this.reassignGraphAreas();
};

// Add a single graph (reuses array logic above)
SPAApplet.QuantitativeGraphContainer.prototype.addGraph = function(graph)
{
    this.addGraphs([graph]);
};

// Remove the specified graph if it is contained in this container
// Reassign the graph areas and force a re-render
SPAApplet.QuantitativeGraphContainer.prototype.removeGraph = function(graph)
{
    var obj = this.graphs.splice(this.graphs.indexOf(graph), 1);
    if (obj)
    {
        obj.container = null;
        this.reassignGraphAreas();
    }
};

// Remove all graphs contained in this container and clear the rendering
SPAApplet.QuantitativeGraphContainer.prototype.removeAllGraphs = function()
{
    for (var i = 0; i < this.graphs.length; i++)
        this.graphs[i].container = null;
    this.graphs = [];
    this.setRelativeScale(true);
    this.commonProperties = {};
    this.clearAll();
};

// Render background rectangle in graph area
SPAApplet.QuantitativeGraphContainer.prototype.drawBackground = function()
{
    var ctx = this.canvas.getContext("2d");
    ctx.fillStyle = SPAApplet.Preferences.values.drawing.bg_color;
    ctx.fillRect(this.xCanvasSpace.min, this.yCanvasSpace.max,
                 this.xCanvasSpace.getRange(), -this.yCanvasSpace.getRange());
};

// Convenience method for returning all data belonging to all graphs currently
// assigned to this container, as well as an AxisSpace describing the range of
// all values in the data
SPAApplet.QuantitativeGraphContainer.prototype.getAggregateData = function()
{
    var allData = [];
    if (this.graphs.length > 0)
    {
        for (var j = 0; j < this.graphs.length; j++)
            allData = allData.concat(this.graphs[j].data);
    }
    return { data: allData,
             space: new SPAApplet.AxisSpace(jStat.min(allData), jStat.max(allData)) };
};

// Make graph drawing area assignments for the graphs currently contained in this container
// and re-render all graphs unless norender is true
SPAApplet.QuantitativeGraphContainer.prototype.reassignGraphAreas = function(norender)
{
    // If there's only one graph, just give it the whole canvas
    if (this.graphs.length == 1)
        this.graphs[0].drawingArea = new SPAApplet.DrawingArea(this.canvas, this.xAxisSpace, this.yAxisSpace,
                            this.xCanvasSpace, this.yCanvasSpace);
    else
    {
        var transformSpace = new SPAApplet.AxisSpace(0, this.graphs.length);
        for (var i = 0; i < this.graphs.length; i++)
        {
            var graph = this.graphs[i];
            // Each graph gets a vertical area with headspace equal to the font size (trying to avoid collisions)
            graph.drawingArea = new SPAApplet.DrawingArea(this.canvas, this.xAxisSpace, this.yAxisSpace,
                                this.xCanvasSpace,
                        new SPAApplet.AxisSpace(transformSpace.transform(i, this.yCanvasSpace),
                                transformSpace.transform(i + 1, this.yCanvasSpace) +
                                this.getPreferredFontHeightBespin()));
        }
    }
    if (!norender)
        this.renderGraphs();
};

// Draw axis titles
SPAApplet.QuantitativeGraphContainer.prototype.drawTitles = function()
{
    // Draw group names
    // Offset from edges of canvas.  Should this be a preference?
    var edgeOffset = 3;
    
    var ctx = this.canvas.getContext("2d");
    ctx.font = SPAApplet.Preferences.getPreferredFont();
    var fontHeight = this.getPreferredFontHeightBespin(ctx);
    var transformSpace = new SPAApplet.AxisSpace(0, this.graphs.length * 2);
    ctx.fillStyle = SPAApplet.Preferences.values.drawing.line_color;

    // If there's only one graph, integrate the frequency indicator into the axis title
    // If there are multiple graphs, indicate frequency / relative frequency apart from the individual
    //   group titles
    if (this.graphs.length == 1)
    {
        ctx.save();
        var groupNameCenterY = transformSpace.transform(1, this.yCanvasSpace);
        var text = (this.graphs[0].indicateFrequency ? 
            (this.relativeYScale ? "Relative frequency" : "Frequency") : "")
            + (((this.graphs[0].groupName) && (this.graphs[0].groupName.length > 0)) ?
                    (this.graphs[0].indicateFrequency ? " of " : "") + this.graphs[0].groupName : "") +
            ((this.yScaleScientific && this.yScalePow10 !== 0) ? " ( x 10 ^ " + this.yScalePow10 + " )"
                : "");
        var textWidth = ctx.measureText(text).width;
        ctx.translate(this.leftLabelWidth - this.maxYLabelWidth - 2 * fontHeight,
                        groupNameCenterY + textWidth / 2);
        ctx.rotate(-Math.PI / 2);
        SPAApplet.Utility.renderText(ctx, text, 0, fontHeight);
        ctx.restore();
    }
    else
    {
        var maxLabelHeight = (-this.yCanvasSpace.getRange() / this.graphs.length);
        if (this.graphs[0].indicateFrequency || (this.yScaleScientific && this.yScalePow10 !== 0))
        {
            ctx.save();
            var groupNameCenterY = transformSpace.transform(this.graphs.length, this.yCanvasSpace);
            var text = (this.graphs[0].indicateFrequency ? (this.relativeYScale ? "Relative frequency" : "Frequency") : "")
                    + ((this.yScaleScientific && this.yScalePow10 !== 0) ? " ( x 10 ^ " + this.yScalePow10 + " )" : "");

            var textWidth = Math.min(-this.yCanvasSpace.getRange(), ctx.measureText(text).width);
            ctx.translate(edgeOffset, groupNameCenterY + textWidth / 2);
            ctx.rotate(-Math.PI / 2);
            SPAApplet.Utility.renderText(ctx, text, 0, fontHeight, textWidth);
            ctx.restore();
        }
        
        for (var i = 0; i < this.graphs.length; i++)
        {
            ctx.save();
            var groupNameCenterY = transformSpace.transform(2 * i + 1, this.yCanvasSpace);
            var text = this.graphs[i].groupName;
            var textWidth = Math.min(maxLabelHeight, ctx.measureText(text).width);
            ctx.translate(edgeOffset + 2 * fontHeight, groupNameCenterY + textWidth / 2);
            ctx.rotate(-Math.PI / 2);
            SPAApplet.Utility.renderText(ctx, text, 0, fontHeight, textWidth);
            ctx.restore();
        }
    }

    // Render explanatory axis title
    var variableName = this.variableName.slice(0);
    if (this.xScaleScientific && this.xScalePow10 !== 0)
        variableName += " ( x 10 ^ " + this.xScalePow10 + " )";
    var varNameWidth = ctx.measureText(variableName).width;
    SPAApplet.Utility.renderText(ctx, variableName, this.xCanvasSpace.min + (this.xCanvasSpace.getRange() - varNameWidth) / 2,
                 this.canvas.height - edgeOffset);
};

// Draw the Y scale for the graph(s).
// Because the Y scale may change after pre-rendering is run, it has to be
// done separately (unlike the categorical case).
SPAApplet.QuantitativeGraphContainer.prototype.drawYScale = function()
{
    var pref = SPAApplet.Preferences;
    var safenum = SPAApplet.SafeNumber;

    var ctx = this.canvas.getContext("2d");
    ctx.strokeStyle = pref.values.drawing.line_color;
    ctx.fillStyle = pref.values.drawing.line_color; // it's the line color because we're doing text
    var fontHeight = this.getPreferredFontHeightBespin(ctx);
    ctx.font = SPAApplet.Preferences.getPreferredFont();

    // Note the draw space range is negative due to the inverted mapping versus the y-axis
    var yDrawSpace = this.graphs[0].drawingArea.yDrawSpace;
    this.yTickIncrement = this.yAxisSpace.suggestedTickIncrement(-yDrawSpace.getRange() / fontHeight * 0.9, true,
                                (this.graphs[0].indicateFrequency && !this.relativeYScale));
    var currentY = this.yAxisSpace.suggestedStartingTickValue(this.yTickIncrement);
    this.yFirstTick = currentY;
    
    // Measure the label widths before drawing anything
    var maxYLabelWidth = 0;
    while (safenum.compareToWithinTolerance(currentY, this.yAxisSpace.max) <= 0)
    {
        var labelWidth = ctx.measureText("" + currentY).width;
        if (maxYLabelWidth < labelWidth)
            maxYLabelWidth = labelWidth;
        currentY = safenum.roundWithinTolerance(currentY + this.yTickIncrement);
    }

    // If some label will be too large, run all labels in scientific notation.
    // Make a note you have done this so you can label the variable appropriately.
    this.yScaleScientific = (maxYLabelWidth > (this.leftLabelWidth - 2 * fontHeight));
    if (this.yScaleScientific)
        this.yScalePow10 = safenum.getPow10(this.yFirstTick);

    this.maxYLabelWidth = 0;
    
    for (var i = 0; i < this.graphs.length; i++)
    {
        if (!this.graphs[i].hideYScale)
        {       
            yDrawSpace = this.graphs[i].drawingArea.yDrawSpace;
            
            // The maximum number of ticks is 90% of the ratio of the draw height to the font height
            // Note the draw space range is negative due to the inverted mapping versus the y-axis
            currentY = this.yFirstTick;

            // Increase currentY by the increment, continuing until currentY is larger than the max
            // At each increment, draw the appropriate tick mark and label it
            var yTickStart = this.leftLabelWidth - 5;
            while (safenum.compareToWithinTolerance(currentY, this.yAxisSpace.max) <= 0)
            {
                // Draw a small mark from the left edge of the draw canvas
                var canvasYTick = this.yAxisSpace.transform(currentY, yDrawSpace);
                ctx.beginPath();
                ctx.moveTo(yTickStart, canvasYTick);
                ctx.lineTo(this.leftLabelWidth, canvasYTick);
                ctx.stroke();
                
                // Draw the text
                var labelText = (this.yScaleScientific ?
                                    (currentY / Math.pow(10, this.yScalePow10)).toFixed(1)
                                        : "" + ((this.graphs[0].indicateFrequency && this.relativeYScale)
                                                                    ? SPAApplet.Format.formatProportion(safenum.roundWithinTolerance(currentY))
                                                                    : safenum.roundWithinTolerance(currentY)));
                var canvasYText = canvasYTick + fontHeight / 2;
                var canvasTextWidth = ctx.measureText(labelText).width;
                if (this.maxYLabelWidth < canvasTextWidth)
                    this.maxYLabelWidth = canvasTextWidth;
                SPAApplet.Utility.renderText(ctx, labelText, this.leftLabelWidth - 6 - canvasTextWidth, canvasYText);
                currentY = safenum.roundWithinTolerance(currentY + this.yTickIncrement);
            }
        }

        // Draw the actual axis
        if (!this.graphs[i].hideYAxis)
            this.graphs[i].drawingArea.drawLineWC(0, this.yAxisSpace.min, 0, this.yAxisSpace.max);
    }    
};

// Draw the X scale / ticks for the graph.
// Note that this exposes the ticking strategy as properties you can use during preRender and render
SPAApplet.QuantitativeGraphContainer.prototype.drawXScale = function()
{
    if (this.graphs.length == 0) return;
    
    var pref = SPAApplet.Preferences;
    var safenum = SPAApplet.SafeNumber;

    var ctx = this.canvas.getContext("2d");
    ctx.strokeStyle = pref.values.drawing.line_color;
    ctx.fillStyle = pref.values.drawing.line_color; // it's the line color because we're doing text
    var fontHeight = this.getPreferredFontHeightBespin(ctx);
    ctx.font = SPAApplet.Preferences.getPreferredFont();
    
    if (!this.graphs[0].hideXScale)
    {
        // Seed the x-axis space by using the values in the data; we will modify it later to ensure proper
        // binning in dotplots and histograms
        var dataSpace = this.getAggregateData().space;
        if (typeof(this.graphs[0].forceXMin) == "undefined")
            this.xAxisSpace.min = dataSpace.min;
        else
            this.xAxisSpace.min = this.graphs[0].forceXMin;

        if (typeof(this.graphs[0].forceXMax) == "undefined")
            this.xAxisSpace.max = dataSpace.max;
        else
            this.xAxisSpace.max = this.graphs[0].forceXMax;

        if (this.graphs[0].preferXZeroSymmetry &&
            typeof(this.graphs[0].forceXMin) == "undefined" &&
            typeof(this.graphs[0].forceXMin) == "undefined")
        {
            var bound = Math.max(Math.abs(this.xAxisSpace.min), Math.abs(this.xAxisSpace.max));
            this.xAxisSpace.min = -bound;
            this.xAxisSpace.max = bound;
        }

        // If we have gotten this far and the xAxisSpace still has a null range, we're in trouble.
        if (safenum.isZeroWithinTolerance(this.xAxisSpace.getRange()))
        {
            if (safenum.compareToWithinTolerance(this.xAxisSpace.min, 0) < 0)
            {
                this.xAxisSpace.max = 0;
                this.xAxisSpace.min *= 2;
            }
            else if (safenum.compareToWithinTolerance(this.xAxisSpace.min, 0) > 0)
            {
                this.xAxisSpace.min = 0;
                this.xAxisSpace.max *= 2;
            }
            else
            {
                this.xAxisSpace.min = -1;
                this.xAxisSpace.max = 1;
            }
        }

        this.xTickIncrement = this.graphs[0].forceXTickIncrement ||
                                this.xAxisSpace.suggestedTickIncrement(9, true);

        var currentX = this.xAxisSpace.suggestedStartingTickValue(this.xTickIncrement, true);

        // Add a buffer to the left and right of 20% of the tick increment.
        if (typeof(this.graphs[0].forceXMin) == "undefined")
            this.xAxisSpace.min = currentX - 0.2 * this.xTickIncrement;

        if (typeof(this.graphs[0].forceXMax) == "undefined")
        {            
            var tempX = currentX;
            while (tempX < this.xAxisSpace.max) tempX += this.xTickIncrement;
            if (this.graphs[0].completeLastBin && safenum.compareToWithinTolerance(tempX, this.xAxisSpace.max) == 0)
                tempX += this.xTickIncrement;
            this.xAxisSpace.max = tempX + 0.2 * this.xTickIncrement;
        }

        if (typeof(this.graphs[0].forceXFirstTick) == "undefined")
            this.xFirstTick = currentX;
        else
            this.xFirstTick = this.graphs[0].forceXFirstTick;

        // Measure the label widths before drawing anything
        var maxXLabelWidth = 0;
        while (safenum.compareToWithinTolerance(currentX, this.xAxisSpace.max) <= 0)
        {
            var labelWidth = ctx.measureText("" + currentX).width;
            if (maxXLabelWidth < labelWidth)
                maxXLabelWidth = labelWidth;
            currentX = safenum.roundWithinTolerance(currentX + this.xTickIncrement);
        }
        
        // If some label will be too large, run all labels in scientific notation.
        // Make a note you have done this so you can label the variable appropriately.
        this.xScaleScientific = (maxXLabelWidth > (this.xTickIncrement / this.xAxisSpace.getRange() * this.xCanvasSpace.getRange()));
        currentX = this.xFirstTick;
        if (this.xScaleScientific)
            this.xScalePow10 = safenum.getPow10(currentX);
        
        // Increase currentX by the increment, continuing until currentX is larger than the max
        // At each increment, draw the appropriate tick mark and label it
        var bottomDrawEdge = this.canvas.height - this.bottomLabelHeight;
        while (safenum.compareToWithinTolerance(currentX, this.xAxisSpace.max) <= 0)
        {
            if (safenum.compareToWithinTolerance(currentX, this.xAxisSpace.min) >= 0)
            {
                // Draw a small mark from the left edge of the draw canvas
                var canvasXTick = this.xAxisSpace.transform(currentX, this.xCanvasSpace);
                ctx.beginPath();
                ctx.moveTo(canvasXTick, bottomDrawEdge + 5);
                ctx.lineTo(canvasXTick, bottomDrawEdge);
                ctx.stroke();
                
                // Draw the text
                var labelText = (this.xScaleScientific ?
                                    (currentX / Math.pow(10, this.xScalePow10)).toFixed(1)
                                        : safenum.roundWithinTolerance(currentX));
                var currentWidth = ctx.measureText("" + labelText).width;
                var canvasXText = canvasXTick - currentWidth / 2;
                SPAApplet.Utility.renderText(ctx, "" + labelText, canvasXText, bottomDrawEdge + 6 + fontHeight);
            }
            currentX = safenum.roundWithinTolerance(currentX + this.xTickIncrement);
        }
    }
    
    // Draw the actual axis
    if (!this.graphs[0].hideXAxis)
        this.graphs[0].drawingArea.drawLineWC(this.xAxisSpace.min, 0, this.xAxisSpace.max, 0);
};

// Clear all rendering on this container by drawing a white rectangle over the whole thing
SPAApplet.QuantitativeGraphContainer.prototype.clearAll = function()
{
    var ctx = this.canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

// Clear rendering on only the axis labels and ticks
SPAApplet.QuantitativeGraphContainer.prototype.clearScalesAndTitles = function()
{
    var ctx = this.canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    
    // Clear left side
    ctx.fillRect(0, 0, this.leftLabelWidth, this.canvas.height);
    
    // Clear bottom
    ctx.fillRect(0, this.yCanvasSpace.min, this.canvas.width, this.bottomLabelHeight);
};

// This returns the number of data points in the graph that contains the most
// data points.
// FUTURE: Possibly remove this method, as it doesn't seem to be used by anyone anywhere.
SPAApplet.QuantitativeGraphContainer.prototype.getLargestDataSetSize = function()
{
    if (this.graphs.length === 0) return 0;
    
    var max = this.graphs[0].data.length;
    for (var i = 1; i < this.graphs.length; i++)
        max = Math.max(max, this.graphs[i].data.length);
    return max;
};

// Indicate whether relative frequency or frequency is displayed
SPAApplet.QuantitativeGraphContainer.prototype.setRelativeScale = function(setRelative, norender)
{
    if (setRelative)
    {
        this.relativeYScale = true;
        this.yAxisSpace.max = 1;
    }
    else
        // The yAxisSpace will be set at render time to max out at the size of the
        // largest data set present in any of the graphs.
        this.relativeYScale = false;
    
    if (!norender)
        this.renderGraphs();
};

// Render all graphs in this container
SPAApplet.QuantitativeGraphContainer.prototype.renderGraphs = function()
{
    this.clearAll();

    if (this.graphs.length > 0)
    {
        this.drawBackground();
        this.drawXScale();
        for (var i = 0; i < this.graphs.length; i++)
            this.graphs[i].preRender();

        this.drawYScale();
        this.drawTitles();

        for (var i = 0; i < this.graphs.length; i++)
        {
            if (!this.graphs[i].hideBorders)
            {
                this.graphs[i].drawingArea.drawLineWC(this.xAxisSpace.min, this.yAxisSpace.min, this.xAxisSpace.min, this.yAxisSpace.max);
                this.graphs[i].drawingArea.drawLineWC(this.xAxisSpace.min, this.yAxisSpace.min, this.xAxisSpace.max, this.yAxisSpace.min);
            }        
    
            this.graphs[i].render();
            
            if (this.graphs.length > 1)
                // Draw a horizontal line separator between graphs
                this.graphs[i].drawingArea.drawLineWC(this.xAxisSpace.min, 0, this.xAxisSpace.max, 0);
        }
        // Reset the common properties if the graphs in this container do not specify otherwise
        if (!this.graphs[0].persistProperties)
            this.commonProperties = {};
    }
    else
        this.commonProperties = {};
};

/** UnivariateQuantitativeGraph */
// Common creation foundation for all graphs compatible with UnivariateQuantitativeGraph.
// Creates a copy of the specified data and sorts it, as most of the graphs below render
// assuming that the data is sorted; if nosort is true, this behavior is skipped.
// Also ensures that a preRender and render are both defined on a graph for convenience;
// individual graph objects can override this behavior.
SPAApplet.UnivariateQuantitativeGraph = function(dataArr, groupName, container, nosort)
{
    this.data = dataArr.slice(0);
    this.groupName = groupName || "";
    if (!nosort)
        SPAApplet.Utility.sortArrayAscending(this.data);
    if (container)
        container.addGraph(this);
};

// Empty shells; override in other classes
SPAApplet.UnivariateQuantitativeGraph.prototype.preRender = function() { };
SPAApplet.UnivariateQuantitativeGraph.prototype.render = function() { };

/** Dotplot */
// Univariate dotplot.  Dotplots can also count the number of dots greater than or less than a certain number.
// The page using the dotplot can reference properties of the dotplot exposed after the render.
SPAApplet.Dotplot = function(dataArr, title, container)
{
    SPAApplet.UnivariateQuantitativeGraph.call(this, dataArr, title, container);
};
SPAApplet.Dotplot.prototype = Object.create(SPAApplet.UnivariateQuantitativeGraph.prototype);

// Specify how the dotplot should count dots.
// The sidedness constants are the same as those used in SPAApplet.Statistics (ONE_SIDED_LT and ONE_SIDED_GT).
// Note that the countingRegion and dotCount properties do not exist if the applet is not supposed to be
// rendering a dot count.  This operation also forces a re-render.
SPAApplet.Dotplot.prototype.setCountingRegion = function(boundary, sidedness)
{
    this.countingRegion =
    {
        boundary: boundary,
        sidedness: sidedness
    };
    this.dotCount = 0;
    if (this.container)
        this.container.renderGraphs();
};

// Forget the current counting region and remove the properties involved.
// This operation also forces a re-render.
SPAApplet.Dotplot.prototype.clearCountingRegion = function()
{
    if (this.countingRegion) delete this.countingRegion;
    if (this.dotCount) delete this.dotCount;
    if (this.container)
        this.container.renderGraphs();
};

SPAApplet.Dotplot.prototype.preRender = function()
{
    var pref = SPAApplet.Preferences;
    var safenum = SPAApplet.SafeNumber;
    var props = this.container.commonProperties;
    var binIncrement = 0;
    var highBoundary = 0;   

    if (this.dotCount) this.dotCount = 0;

    // Set up the bin increment, a.k.a. the mathematical width of grouping of dots.
    // Basically, the dotplot is treated like a frequency histogram with very small bins.
    if (!props["dotplot_binIncrement"])
    {

        var aggregateDataObj = this.container.getAggregateData();

        var aggRange = aggregateDataObj.space.getRange();
        binIncrement = safenum.roundToPow10(aggRange / (this.drawingArea.xDrawSpace.getRange() / pref.values.drawing.dot_radius / 2), safenum.getPow10(aggRange) - 1);
        if (binIncrement == 0) binIncrement = Math.pow(10, safenum.getPow10(aggRange) - 1) / 2;
        props["dotplot_binIncrement"] = binIncrement;
        highBoundary = aggregateDataObj.space.suggestedStartingTickValue(binIncrement);
        props["dotplot_startingBinBound"] = highBoundary;
    }
    else
    {
        binIncrement = props["dotplot_binIncrement"];
        highBoundary = props["dotplot_startingBinBound"];
    }

    // Loop through your own data to find maximum count for the bin increment
    var maxCount = 0;
    var currCount = 0;
    for (var i = 0; i < this.data.length; i++)
    {
        if (this.data[i] < highBoundary) currCount++;
        else
        {
            while(this.data[i] >= highBoundary) highBoundary += binIncrement;
            if (currCount > maxCount)
            {
                maxCount = currCount;
                currCount = 0;
            }
        }

        if (this.countingRegion)
        {
            if ((this.countingRegion.sidedness == SPAApplet.Statistics.ONE_SIDED_LT) &&
                SPAApplet.SafeNumber.compareToWithinTolerance(this.data[i], this.countingRegion.boundary) < 0)
                this.dotCount++;
            else if ((this.countingRegion.sidedness == SPAApplet.Statistics.ONE_SIDED_GT) &&
                SPAApplet.SafeNumber.compareToWithinTolerance(this.data[i], this.countingRegion.boundary) > 0)
                this.dotCount++;
            else if (SPAApplet.SafeNumber.compareToWithinTolerance(this.data[i], this.countingRegion.boundary) == 0)
                this.dotCount++;
        }
    }
    if (currCount > maxCount) maxCount = currCount;

    var currMaxCount = props["dotplot_maxCount"] || 0;
    if (maxCount >= currMaxCount)
    {
        props["dotplot_maxCount"] = maxCount;
        if (!this.container.relativeYScale) this.container.yAxisSpace.max = maxCount;
    }
};

SPAApplet.Dotplot.prototype.render = function()
{
    var pref = SPAApplet.Preferences;
    var safenum = SPAApplet.SafeNumber;
    var props = this.container.commonProperties;
    var canvas = this.drawingArea;
    var maxCount = props["dotplot_maxCount"];
    var dotRadius = pref.values.drawing.dot_radius;
    
    // If the current canvas would not support maxCount dots, reduce dot radius by 0.5 until it does
    // or until the dot radius is 1.
    if (!props["dotplot_dotRadius"])
    {
        while (dotRadius > 1 && canvas.yDrawSpace.getRange() / (-2 * dotRadius) < maxCount) dotRadius -= 0.5;
        if (dotRadius < 1) dotRadius = 1;
        props["dotplot_dotRadius"] = dotRadius;
    }
    else
        dotRadius = props["dotplot_dotRadius"];

    var transformSpace = new SPAApplet.AxisSpace(0, Math.max(maxCount, canvas.yDrawSpace.getRange() / (-2 * dotRadius)));

    // Render all the data as points
    var binIncrement = props["dotplot_binIncrement"];
    var highBoundary = props["dotplot_startingBinBound"];

    // Render the counting region, if there is one    
    if (this.countingRegion)
    {
        var highlightColor = "#660000"; // Make this a preference?
        var flagLength = this.container.xAxisSpace.getRange() / 20;
        var flagSemiHeight = this.container.yAxisSpace.getRange() / 20;

        if (this.countingRegion.sidedness == SPAApplet.Statistics.ONE_SIDED_LT) flagLength *= -1;

        canvas.drawLineWC(this.countingRegion.boundary, 0,
                            this.countingRegion.boundary, this.container.yAxisSpace.max, highlightColor);
        canvas.drawLineWC(this.countingRegion.boundary, this.container.yAxisSpace.max,
                            this.countingRegion.boundary + flagLength, this.container.yAxisSpace.max - flagSemiHeight, highlightColor);
        canvas.drawLineWC(this.countingRegion.boundary, this.container.yAxisSpace.max - 2 * flagSemiHeight,
                            this.countingRegion.boundary + flagLength, this.container.yAxisSpace.max - flagSemiHeight, highlightColor);
    }

    var index = 0;
    var currCount = 1;
    while (index < this.data.length)
    {
        // while the boundary is higher than the current element and there are still elements,
        // render a stacked dot at the location of the previous boundary and then check the next element
        while (index < this.data.length && safenum.compareToWithinTolerance(this.data[index], highBoundary) < 0)
        {
            index++;
            canvas.drawPointWC(highBoundary - binIncrement, transformSpace.transform(currCount++, this.container.yAxisSpace), dotRadius);
        } 

        // if there are still more elements, advance the boundary until it just exceeds the next item
        if (index < this.data.length)
        {
            currCount = 1;
            while (safenum.compareToWithinTolerance(highBoundary, this.data[index]) <= 0)
                highBoundary += binIncrement;
        }
    }
};

// Parameters for container to trigger automatic behaviors
SPAApplet.Dotplot.prototype.hideYScale = true;
SPAApplet.Dotplot.prototype.hideYAxis = true;
SPAApplet.Dotplot.prototype.hideBorders = true;

/** Boxplot */
// Univariate box-and-whisker plot
SPAApplet.Boxplot = function(dataArr, title, container)
{
    SPAApplet.UnivariateQuantitativeGraph.call(this, dataArr, title, container);
};
SPAApplet.Boxplot.prototype = Object.create(SPAApplet.UnivariateQuantitativeGraph.prototype);

// When rendering a box-and-whisker plot, the Y-scale is always set to relative (0 - 1), the
// vertical title suppressed, and the boxplot vertically drawn from (0.5 - heightFactor) to
// (0.5 + heightFactor).  So a heightFactor of 0.2 takes up 40% of the graph area height.
// FUTURE: Consider making this a preference or customizable
SPAApplet.Boxplot.prototype.heightFactor = 0.2;

SPAApplet.Boxplot.prototype.render = function()
{
    var pref = SPAApplet.Preferences;
    var safenum = SPAApplet.SafeNumber;
    var lowBound = 0.5 - this.heightFactor;
    var highBound = 0.5 + this.heightFactor;
    var stats = SPAApplet.Statistics.getOneVariableStatistics(this.data);
    
    var quartiles = stats.quartiles;
    var iqr = quartiles[2] - quartiles[0];
    var lowFence = quartiles[0] - iqr * 1.5;
    var highFence = quartiles[2] + iqr * 1.5;
        
    // Plot the low outliers
    var index = 0;
    var canvas = this.drawingArea;
    while(safenum.compareToWithinTolerance(this.data[index], lowFence) < 0)
        canvas.drawPointWC(this.data[index++], 0.5, pref.values.drawing.dot_radius);

    // At the lowest non-outlier obs, draw the min whisker
    canvas.drawLineWC(this.data[index], lowBound, this.data[index], highBound);
    
    // Connecting line
    canvas.drawLineWC(this.data[index], 0.5, quartiles[0], 0.5);
    
    // Big box for IQR with line for median
    canvas.fillRectWC(quartiles[0], highBound, quartiles[2], lowBound);
    canvas.drawLineWC(quartiles[1], lowBound, quartiles[1], highBound);
    
    // Work backwards - plot high outliers until you find the highest non-outlier
    index = this.data.length - 1;
    while(safenum.compareToWithinTolerance(this.data[index], highFence) > 0)
        canvas.drawPointWC(this.data[index--], 0.5, pref.values.drawing.dot_radius);
    
    // At the highest non-outlier obs, draw the max whisker
    canvas.drawLineWC(this.data[index], lowBound, this.data[index], highBound);
    
    // Final connecting line
    canvas.drawLineWC(this.data[index], 0.5, quartiles[2], 0.5);
};

// Parameters for container to trigger automatic behaviors
SPAApplet.Boxplot.prototype.hideYScale = true;
SPAApplet.Boxplot.prototype.hideYAxis = true;
SPAApplet.Boxplot.prototype.hideBorders = true;

/** Histogram */
// This class is a lot like dotplot, but the bin width and alignment change a few things.
SPAApplet.Histogram = function(dataArr, title, container)
{
    SPAApplet.UnivariateQuantitativeGraph.call(this, dataArr, title, container);
};
SPAApplet.Histogram.prototype = Object.create(SPAApplet.UnivariateQuantitativeGraph.prototype);

// Parameters for container to trigger automatic behaviors
SPAApplet.Histogram.prototype.persistProperties = true;
SPAApplet.Histogram.prototype.indicateFrequency = true;

// Changes the bin increment for ALL histograms displayed in this container
SPAApplet.Histogram.prototype.setBinIncrement = function(binIncr)
{
    this.container.commonProperties["histogram_binIncrement"] = binIncr;
};

// Changes the bin alignment for ALL histograms displayed in this container
SPAApplet.Histogram.prototype.setBinAlignment = function(binAlign)
{
    this.container.commonProperties["histogram_binAlignment"] = binAlign;
};

SPAApplet.Histogram.prototype.restoreDefaultBinning = function()
{
    var props = this.container.commonProperties;
    if (props["histogram_binIncrement"]) delete props["histogram_binIncrement"];
    if (props["histogram_binAlignment"]) delete props["histogram_binAlignment"];
}

// Similar to the dotplot, go ahead and pre-run the binning algorithm
SPAApplet.Histogram.prototype.preRender = function()
{
    var pref = SPAApplet.Preferences;
    var props = this.container.commonProperties;
    var binAlignment = props["histogram_binAlignment"] || this.container.xFirstTick;
    var binIncrement = props["histogram_binIncrement"] || this.container.xTickIncrement;
    var highBoundary = 0;   

    // If the user specified a binAligment larger than the first datum, fix the alignment until you get
    // to or below that datum.
    while (binAlignment > this.data[0]) binAlignment -= binIncrement;

    var highBoundary = binAlignment + binIncrement;
    var index = 0;
    var currCount = 0;
    var maxCount = 0;
    while (index < this.data.length)
    {
        // Count the number of items between binAlignment and highBoundary
        while (index < this.data.length && this.data[index] < highBoundary &&
                this.data[index] >= binAlignment)
        {
            index++;
            currCount++;
        }

        if (currCount > maxCount)
            maxCount = currCount;

        currCount = 0;
        highBoundary += binIncrement;
        binAlignment += binIncrement;
    }
    
    var maxY = (this.container.relativeYScale ? maxCount / this.data.length : maxCount) * 1.1;
    var currMaxY = props["histogram_maxY"] || 0;
    if (maxY >= currMaxY)
    {
        props["histogram_maxY"] = maxY;
        this.container.yAxisSpace.max = maxY;
    }
};

// Bin width is a shared property among all histograms being displayed.  If there isn't one,
// borrow one from the container's x-axis scale.
SPAApplet.Histogram.prototype.render = function()
{
    var props = this.container.commonProperties;
    var canvas = this.drawingArea;
    var binIncrement = this.container.xTickIncrement;
    var binAlignment = this.container.xFirstTick;
    if (props["histogram_binIncrement"])
        binIncrement = props["histogram_binIncrement"];
    if (props["histogram_binAlignment"])
        binAlignment = props["histogram_binAlignment"];
    
    // If the user specified a binAligment larger than the first datum, fix the alignment until you get
    // to or below that datum.
    while (binAlignment > this.data[0]) binAlignment -= binIncrement;

    var highBoundary = binAlignment + binIncrement;
    var index = 0;
    var currCount = 0;
    while (index < this.data.length)
    {
        // Count the number of items between binAlignment and highBoundary
        while (index < this.data.length && this.data[index] < highBoundary &&
                this.data[index] >= binAlignment)
        {
            index++;
            currCount++;
        }

        // Render the current bar and go on to the next bin
        if (currCount > 0)
            canvas.fillRectWC(binAlignment, 0, highBoundary, (this.container.relativeYScale ? currCount / this.data.length
                                                                : currCount));

        currCount = 0;
        highBoundary += binIncrement;
        binAlignment += binIncrement;
    }
        
    // Delete the max Y property
    if (props["histogram_maxY"])
        delete props["histogram_maxY"];
};

// Trigger automatic behaviors of the container
SPAApplet.Histogram.prototype.hideYAxis = true;
SPAApplet.Histogram.prototype.completeLastBin = true;

/** ProbabilityHistogram */
// Specialized histogram for drawing a probability distribution histogram:
//   - data is input only with relative frequencies
//   - certain bars can be selected to illustrate different joint probabilities
SPAApplet.ProbabilityHistogram = function(probDist, container)
{
    SPAApplet.UnivariateQuantitativeGraph.call(this, probDist.values, "Probability", container);
    this.probabilityDistribution = probDist;

    // Because this graph overrides the auto x-scale functionality of the container, we must
    // at this point set the x-scale how we want it.
    var vals = probDist.values.slice(0);
    SPAApplet.Utility.sortArrayAscending(vals);
    var leastDiff = Number.POSITIVE_INFINITY;
    for (var i = 0; i < vals.length - 1; i++)
    {
        var diff = SPAApplet.SafeNumber.roundWithinTolerance(vals[i+1] - vals[i]);
        if (diff < leastDiff) leastDiff = diff;
    }
    this.barWidth = leastDiff;
        
    this.forceXMin = jStat.min(probDist.values) - this.barWidth;
    this.forceXMax = jStat.max(probDist.values) + this.barWidth;
};
SPAApplet.ProbabilityHistogram.prototype = Object.create(SPAApplet.UnivariateQuantitativeGraph.prototype);

SPAApplet.ProbabilityHistogram.prototype.preRender = function()
{
    // Determine the largest probability and adjust the y-axis maximum to be 110% of that.
    var maxProb = 0;
    
    for (var i = 0; i < this.probabilityDistribution.values.length; i++)
    {
        var prob = this.probabilityDistribution.probabilities[i];
        if (prob > maxProb) maxProb = prob;
    }
    this.container.yAxisSpace.max = maxProb * 1.1;
}

SPAApplet.ProbabilityHistogram.prototype.render = function()
{
    var canvas = this.drawingArea;
    var safenum = SPAApplet.SafeNumber;
    var drawprefs = SPAApplet.Preferences.values.drawing;
    
    // For each value in the distribution, plot a bar centered at that value.
    for (var i = 0; i < this.probabilityDistribution.values.length; i++)
    {
        var currVal = this.probabilityDistribution.values[i];
        var fillColor = drawprefs.fill_color;

        // Take into account whether this bar is part of the selected range of values
        if (this.selectedRange)
        {
            if ((safenum.compareToWithinTolerance(currVal, this.selectedRange.min) >= 0) &&
                (safenum.compareToWithinTolerance(currVal, this.selectedRange.max) <= 0))
                fillColor = drawprefs.select_color;
        }
        canvas.fillRectWC(currVal - this.barWidth / 2, 0, currVal + this.barWidth / 2,
            this.probabilityDistribution.probabilities[i], fillColor);
    }
};

// Clear any highlighted range of bars
SPAApplet.ProbabilityHistogram.prototype.clearSelection = function()
{
    this.selectedRange = null;
    if (this.container) this.container.renderGraphs();
};

// Set a selected range of bars
SPAApplet.ProbabilityHistogram.prototype.selectValues = function(low, high)
{
    this.selectedRange = new SPAApplet.AxisSpace(low, high);
    if (this.container) this.container.renderGraphs();
};

SPAApplet.ProbabilityHistogram.prototype.hideYAxis = true;

/** NormalDiagram */
// Not really a graph -- fakes out the container with blank data.
// When rendered it simply displays a normal curve with any specified shading.
// On creation it is set to the standard normal.
SPAApplet.NormalDiagram = function(container)
{
    SPAApplet.UnivariateQuantitativeGraph.call(this, [], "", container);
    this.setParameters(0, 1);
};
SPAApplet.NormalDiagram.prototype = Object.create(SPAApplet.UnivariateQuantitativeGraph.prototype);

// Modify the normal curve to represent a non-standard normal, as well as select the
// area to show under the curve (from the value of left to the value of right).
// If inverted is true, the area OUTSIDE the left-right interval will be highlighted.
SPAApplet.NormalDiagram.prototype.setParameters = function(mean, stdev, left, right, inverted)
{
    if (!isNaN(left))
        this.selectedRange = new SPAApplet.AxisSpace(left, right);
    else
        this.selectedRange = null;

    if (inverted)
        this.inverted = true;
    else
        this.inverted = false;

    this.mean = mean;
    this.stdev = stdev;
    this.forceXMin = mean - 3.5 * stdev;
    this.forceXMax = mean + 3.5 * stdev;
    this.forceXTickIncrement = stdev;
    this.forceXFirstTick = mean - 3 * stdev;
    if (this.container) this.container.renderGraphs();
};

SPAApplet.NormalDiagram.prototype.preRender = function()
{
    this.container.yAxisSpace.max = jStat.normal.pdf(this.mean, this.mean, this.stdev) * 1.1;
};

SPAApplet.NormalDiagram.prototype.render = function()
{
    var mean = this.mean;
    var stdev = this.stdev;
    this.drawingArea.plotFunction(function(x) { return jStat.normal.pdf(x, mean, stdev); },
        this.container.xAxisSpace.min, this.container.xAxisSpace.max);

    // If there is a selected range, use the area-under-curve highlighting of DrawingArea.plotFunction
    if (this.selectedRange)
    {
        if (this.inverted)
        {
            this.drawingArea.plotFunction(function(x) { return jStat.normal.pdf(x, mean, stdev); },
                Number.NEGATIVE_INFINITY, this.selectedRange.min, true);
            this.drawingArea.plotFunction(function(x) { return jStat.normal.pdf(x, mean, stdev); },
                this.selectedRange.max, Number.POSITIVE_INFINITY, true);
        }
        else
        {
            this.drawingArea.plotFunction(function(x) { return jStat.normal.pdf(x, mean, stdev); },
                this.selectedRange.min, this.selectedRange.max, true);
        }
    }
};

// Clear the range of highlighting area under the curve
SPAApplet.NormalDiagram.prototype.clearSelection = function()
{
    this.selectedRange = null;
    if (this.container) this.container.renderGraphs();
};

// Select a range of data to be highlighted under the curve
SPAApplet.NormalDiagram.prototype.selectValues = function(low, high)
{
    this.selectedRange = new SPAApplet.AxisSpace(low, high);
    if (this.container) this.container.renderGraphs();
};

// For automatic properties of container
SPAApplet.NormalDiagram.prototype.hideYScale = true;
SPAApplet.NormalDiagram.prototype.hideBorders = true;

/** Stemplot */
// Standard stem-and-leaf plot.
// Stemplot is a little different than the others -- it can accept two data sets,
// in which case a back-to-back stemplot is rendered
SPAApplet.Stemplot = function(data1Arr, groupName1, data2Arr, groupName2, container)
{
    // Here we have to circumvent the UnivariateQuantitativeGraph constructor; we don't want
    // the properties it sets in this case.  We do need to have dummy references to
    // the properties expected to be exposed.
    SPAApplet.Stemplot.setDataAndTitles.call(this, data1Arr, groupName1, data2Arr, groupName2);
    this.stemSplitBasis = 1;
    this.reroundedWarning = false;
    this.leavesTooWideWarning = false;
    
    if (container)
        container.addGraph(this);
};

SPAApplet.Stemplot.prototype = Object.create(SPAApplet.UnivariateQuantitativeGraph.prototype);

SPAApplet.Stemplot.setDataAndTitles = function(data1Arr, groupName1, data2Arr, groupName2)
{
    this.data1 = data1Arr.slice(0);
    SPAApplet.Utility.sortArrayAscending(this.data1);
    this.groupName1 = groupName1 || "";   // We will handle the group titles ourselves.

    // Here are those dummy references to the properties, since the container expects
    // each graph to expose "data" and "title" properties.
    this.data = this.data1;
    this.groupName = "";

    if (data2Arr)
    {
        this.data2 = data2Arr.slice(0);
        SPAApplet.Utility.sortArrayAscending(this.data2);
        this.groupName2 = groupName2 || "";   // We will handle the group titles ourselves.
    }

    if (this.container)
        this.container.renderGraphs();   
};

// FUTURE: This appears to be an internal helper; remove from the outward-facing interface?
SPAApplet.Stemplot.prototype.getDataParameters = function(arr)
{
    var safenum = SPAApplet.SafeNumber;
    if (arr.length === 0) return null;

    var minSig = safenum.getLSPow10(arr[0]);
    var maxSig = safenum.getPow10(arr[0]);
    for (var i = 1; i < arr.length; i++)
    {
        minSig = Math.min(minSig, safenum.getLSPow10(arr[i]));
        maxSig = Math.max(maxSig, safenum.getPow10(arr[i]));
    }
    return { leastSignificantPower: minSig, mostSignificantPower: maxSig };
};

// Get a randomly-generated key string to help the user interpret the stemplot.
SPAApplet.Stemplot.prototype.generateKeyString = function(dataSig, stemPoint)
{
    // Generate a random integer with the appropriate number of digits, then multiply it by
    // an appropriate power of 10 to get the right level of significance.
    var totalSig = dataSig - stemPoint + 1;
    var num = SPAApplet.Utility.randomIntFromInterval(Math.pow(10, totalSig), Math.pow(10, totalSig + 1) - 1)
        * Math.pow(10, stemPoint - 1);

    var sampleKey = (stemPoint <= 0 ? num.toFixed(-stemPoint + 1) : "" + num);
    return "Key: " + this.stem(num, stemPoint) + " | " + this.leaf(num, stemPoint) + " = " + sampleKey;
};

// FUTURE: This appears to be an internal helper. Remove from outward-facing interface?
SPAApplet.Stemplot.prototype.stem = function(num, stemPoint)
{
    var safenum = SPAApplet.SafeNumber;
    if (safenum.isZeroWithinTolerance(num)) return "0";

    var stemSig = safenum.getPow10(num) - stemPoint + 1;
    var stemString = "" +
        safenum.roundToSignificance(safenum.truncToSignificance(num, stemSig) / Math.pow(10, stemPoint), stemSig);
    var dpIndex = stemString.indexOf('.');
    
    if (dpIndex >= 0)
        stemString = stemString.slice(0, dpIndex) + stemString.slice(dpIndex + 2);
    return stemString;
};

// FUTURE: This appears to be an internal helper. Remove from outward-facing interface?
SPAApplet.Stemplot.prototype.leaf = function(num, stemPoint)
{
    if (SPAApplet.SafeNumber.isZeroWithinTolerance(num)) return "0";
    var leafString = "" + Math.round(SPAApplet.SafeNumber.roundToPow10(num, stemPoint - 1) / Math.pow(10, stemPoint - 1) );

    // You only want the last character of the leaf string, whatever it is
    return leafString.slice(leafString.length - 1);
};

// Split stems according to the value of basis.
// Warning -- setting anything other than 1, 2, or 5 is dangerous.
SPAApplet.Stemplot.prototype.setStemSplitBasis = function(basis)
{
    this.stemSplitBasis = basis;
    if (this.container)
        this.container.renderGraphs();
};

// I dislike that this breaks encapsulation a little bit, since the Stemplot renders directly onto the
// container it's added to, but that's far and away an easier paradigm than the world-coordinates paradigm
// that the other plots use.
SPAApplet.Stemplot.prototype.render = function()
{
    var pref = SPAApplet.Preferences;
    var safenum = SPAApplet.SafeNumber;
    var util = SPAApplet.Utility;
    
    this.reroundedWarning = false;
    this.leavesTooWideWarning = false;
    
    // Buffer value between stems as a fraction of the font size
    var lineBuffer = 0.3;
    // Minimum font size to use, in pixels
    var minFontSize = 8;
    
    // Find the least significant digit power of any datum.
    // The stemming point for a datum will be one value above this.
    var plottedData1 = this.data1.slice(0);
    var plottedData2 = (this.data2 ? this.data2.slice(0) : null);
    
    var allData = (plottedData2 ? plottedData1.concat(plottedData2) : plottedData1);
    util.sortArrayAscending(allData);
    var dataParameters = this.getDataParameters(allData);
    
    // The first stem significance is the lowest least significance in the data
    var stemPoint = dataParameters.leastSignificantPower + 1;
    var stemIncrement = Math.pow(10, stemPoint) / this.stemSplitBasis;

    // Get the canvas boundary
    var xContainerCanvasSpace = this.container.xCanvasSpace;
    var yContainerCanvasSpace = this.container.yCanvasSpace;
    var canvasWidth = xContainerCanvasSpace.getRange();
    var canvasHeight = -yContainerCanvasSpace.getRange();  // note reverse mapping
    
    // Be a good citizen; save the existing context, translate it,
    // clip it, draw into that.
    var canvas = this.container.canvas;
    var ctx = canvas.getContext("2d");
    ctx.save();
    ctx.beginPath();
    ctx.translate(xContainerCanvasSpace.min, yContainerCanvasSpace.max);
    ctx.rect(0, 0, canvasWidth, canvasHeight);
    ctx.clip();
    ctx.strokeStyle = pref.values.drawing.line_color;
    ctx.fillStyle = pref.values.drawing.line_color;

    // Estimate the number of stems to set font size and re-round data, if necessary
    // Note the +3 = 2 extra lines for titles and key and one extra line of buffer (for nonuniform divisions)
    var fontSize = Math.floor(pref.values.drawing.font_size * 1.5); // rough guess; spec is in points
    var numStems = Math.ceil((allData[allData.length - 1] - allData[0]) / stemIncrement) + 3;
    var renderOK = true;
    do
    {
        renderOK = true;
        while (numStems * fontSize * (1 + lineBuffer) > canvasHeight && fontSize >= minFontSize)
            fontSize -= 1;
        if (fontSize < minFontSize)
        {
            // The stemplot won't fit vertically on the canvas; try rerounding all the data up to the current
            // stemming point and trying the process again
            renderOK = false;
            this.reroundedWarning = true;
            for (var i = 0; i < plottedData1.length; i++)
                plottedData1[i] = safenum.roundToPow10(plottedData1[i], stemPoint);
            if (plottedData2)
            {
                for (var i = 0; i < plottedData2.length; i++)
                    plottedData2[i] = safenum.roundToPow10(plottedData2[i], stemPoint);
            }
            // Repeat intialization and try dry running the stem plotting again
            stemPoint++;
            stemIncrement = Math.pow(10, stemPoint) / this.stemSplitBasis;
            allData = (plottedData2 ? plottedData1.concat(plottedData2) : plottedData1);
            util.sortArrayAscending(allData);
            dataParameters = this.getDataParameters(allData);
            fontSize = Math.floor(pref.values.drawing.font_size * 1.5); // rough guess; spec is in points
            numStems = Math.ceil((allData[allData.length - 1] - allData[0]) / stemIncrement) + 3; // as before
        }
    } while (!renderOK);
    
    ctx.font = fontSize + "px Monospace"; // must be monospace or else it will be unreadable

    // Amount of padding needed for line separating leaves and stems
    var separatorBuffer = ctx.measureText("m").width; 

    // Compute the widths of the stems on both ends to get a value for the max stem width
    var highStemNegative = (safenum.compareToWithinTolerance(allData[allData.length - 1], 0) < 0);
    var lowStemNegative = (safenum.compareToWithinTolerance(allData[0], 0) < 0);
    var maxStemWidth = Math.max(ctx.measureText(
            (highStemNegative ? "-" : "") + this.stem(allData[allData.length - 1], stemPoint)).width,
                                ctx.measureText(
            (lowStemNegative ? "-" : "") + this.stem(allData[0], stemPoint)).width);
    var stemLeftX = (plottedData2 ? (canvasWidth - maxStemWidth) / 2 : separatorBuffer);
    var leaf1LeftX = stemLeftX + maxStemWidth + 2 * separatorBuffer;
    var leaf2RightX = stemLeftX - 2 * separatorBuffer;
    
    var index1 = 0;
    var index2 = 0;
    var leaves = "";
    var stemBoundary = safenum.roundToPow10(allData[0], stemPoint);
    var negativePhase = (safenum.compareToWithinTolerance(allData[0], 0) < 0);

    // negative numbers are weird -- you have to decrement the stemBoundary if the first stem boundary
    // is bigger than or equal to the first datum itself so it ends up in the correct bin
    // if (negativePhase)
        while (safenum.compareToWithinTolerance(stemBoundary, allData[0]) >= 0)
            stemBoundary -= stemIncrement;
    
    // Do a dry run without actually plotting.
    do
    {
        renderOK = true;
        while (stemBoundary <= allData[allData.length - 1])
        {
            // When rendering negative numbers, you want to do the algorithm backwards, essentially
            if (negativePhase)
            {
                var effectiveStemBoundary = safenum.roundWithinTolerance(stemBoundary + stemIncrement);

                // Render the leaves for the stemplot to right
                leaves = "";
                while (index1 < plottedData1.length && plottedData1[index1] > stemBoundary
                        && plottedData1[index1] <= effectiveStemBoundary)
                    leaves += this.leaf(plottedData1[index1++], stemPoint) + " ";
                if ((ctx.measureText(leaves).width + leaf1LeftX) > canvasWidth)
                {
                    renderOK = false;
                    break;  // fall out of this loop
                }

                // Render the leaves for the stemplot to left, if needed
                if (plottedData2)
                {
                    leaves = "";
                    while (index2 < plottedData2.length && plottedData2[index2] > stemBoundary
                        && plottedData2[index2] <= effectiveStemBoundary)
                        // Note the prepend here
                        leaves = " " + this.leaf(plottedData2[index2++], stemPoint) + leaves;
                    if (leaf2RightX - ctx.measureText(leaves).width < 0)
                    {
                        renderOK = false;
                        break;  // fall out of this loop
                    }
                }
            }
            else
            {
                // Determine the leaves for the stemplot to right
                leaves = "";
                while (index1 < plottedData1.length && plottedData1[index1] < (stemBoundary + stemIncrement))
                    leaves += this.leaf(plottedData1[index1++], stemPoint) + " ";
                if ((ctx.measureText(leaves).width + leaf1LeftX) > canvasWidth)
                {
                    renderOK = false;
                    break;  // fall out of this loop
                }
                
                // Render the leaves for the stemplot to left, if needed
                if (plottedData2)
                {
                    leaves = "";
                    while (index2 < plottedData2.length && plottedData2[index2] < (stemBoundary + stemIncrement))
                        // Note the prepend here
                        leaves = " " + this.leaf(plottedData2[index2++], stemPoint) + leaves;
                    if (leaf2RightX - ctx.measureText(leaves).width < 0)
                    {
                        renderOK = false;
                        break;  // fall out of this loop
                    }
                }
            }
            stemBoundary = safenum.roundWithinTolerance(stemBoundary + stemIncrement);
            negativePhase = (safenum.compareToWithinTolerance(stemBoundary, 0) < 0);
        }
        index1 = 0;
        index2 = 0;
        stemBoundary = safenum.roundToPow10(allData[0], stemPoint);
        negativePhase = (safenum.compareToWithinTolerance(allData[0], 0) < 0) ;
        
        if (!renderOK)
        {
            // Try reducing the font size by 1 and going again
            fontSize -= 1;
            if (fontSize < minFontSize)
            {
                // Not much we can do without making it unreadable; render it anyway and give a warning
                fontSize = minFontSize;
                this.leavesTooWideWarning = true;
                renderOK = true;                
                // The parameters we determined here should still function for the fontSize
            }
            else
            {
                // Re-initialize and try again
                ctx.font = fontSize + "px Monospace";
                separatorBuffer = ctx.measureText("m").width; 
                maxStemWidth = Math.max(ctx.measureText(
                    (highStemNegative ? "-" : "") + this.stem(allData[allData.length - 1], stemPoint)).width,
                                    ctx.measureText(
                    (lowStemNegative ? "-" : "") + this.stem(allData[0], stemPoint)).width);
                stemLeftX = (plottedData2 ? (canvasWidth - maxStemWidth) / 2 : separatorBuffer);
                leaf1LeftX = stemLeftX + maxStemWidth + 2 * separatorBuffer;
                leaf2RightX = stemLeftX - 2 * separatorBuffer;
            }
        }
    } while (!renderOK);

    // Now it's time for the real plotting
    var currentY = (2 + lineBuffer) * fontSize;     // Leave room for titles
    negativePhase = (safenum.compareToWithinTolerance(allData[0], 0) < 0);
    
    // See note on this above
    // if (negativePhase)
        while (safenum.compareToWithinTolerance(stemBoundary, allData[0]) >= 0)
            stemBoundary -= stemIncrement;
    // If you are splitting stems in the positive phase,
    // if there is stem splitting you may have to advance the first stem boundary
    // (the negative case algorithm above should handle this situation already)
    if (!negativePhase)
        while (safenum.compareToWithinTolerance(stemBoundary + stemIncrement, allData[0]) <= 0)
            stemBoundary += stemIncrement;

    while (stemBoundary <= allData[allData.length - 1])
    {
        // When rendering negative numbers, you want to do the algorithm backwards, essentially
        if (negativePhase)
        {
            var effectiveStemBoundary = safenum.roundWithinTolerance(stemBoundary + stemIncrement);
            var currStem = this.stem(effectiveStemBoundary, stemPoint);
            if (currStem == "0") currStem = "-0";
            SPAApplet.Utility.renderText(ctx, currStem, stemLeftX, currentY);

            // Render the leaves for the stemplot to right
            leaves = "";
            while (index1 < plottedData1.length && plottedData1[index1] > stemBoundary
                    && plottedData1[index1] <= effectiveStemBoundary)
                leaves += this.leaf(plottedData1[index1++], stemPoint) + " ";
            SPAApplet.Utility.renderText(ctx, leaves, leaf1LeftX, currentY);

            // Render the leaves for the stemplot to left, if needed
            if (plottedData2)
            {
                leaves = "";
                while (index2 < plottedData2.length && plottedData2[index2] > stemBoundary
                    && plottedData2[index2] <= effectiveStemBoundary)
                    // Note the prepend here
                    leaves = " " + this.leaf(plottedData2[index2++], stemPoint) + leaves;
                SPAApplet.Utility.renderText(ctx, leaves, leaf2RightX - ctx.measureText(leaves).width, currentY);
            }
        }
        else
        {
            // Render this stem
            SPAApplet.Utility.renderText(ctx, this.stem(stemBoundary, stemPoint), stemLeftX, currentY);

            // Render the leaves for the stemplot to right
            leaves = "";
            while (index1 < plottedData1.length && plottedData1[index1] < (stemBoundary + stemIncrement))
                leaves += this.leaf(plottedData1[index1++], stemPoint) + " ";
            SPAApplet.Utility.renderText(ctx, leaves, leaf1LeftX, currentY);

            // Render the leaves for the stemplot to left, if needed
            if (plottedData2)
            {
                leaves = "";
                while (index2 < plottedData2.length && plottedData2[index2] < (stemBoundary + stemIncrement))
                    // Note the prepend here
                    leaves = " " + this.leaf(plottedData2[index2++], stemPoint) + leaves;
                SPAApplet.Utility.renderText(ctx, leaves, leaf2RightX - ctx.measureText(leaves).width, currentY);
            }
        }      
        currentY += (1 + lineBuffer) * fontSize;
        stemBoundary = safenum.roundWithinTolerance(stemBoundary + stemIncrement);
        negativePhase = (safenum.compareToWithinTolerance(stemBoundary, 0) < 0);
    }
    
    // Render the key in the lower-right corner
    var keyString = this.generateKeyString(dataParameters.mostSignificantPower, stemPoint);
    var keyWidth = ctx.measureText(keyString).width;
    SPAApplet.Utility.renderText(ctx, keyString, canvasWidth - keyWidth, canvasHeight - lineBuffer * fontSize);

    // Render titles/group names above, centered above the particular graph
    var groupName1Width = ctx.measureText(this.groupName1).width;
    if (!plottedData2)
        SPAApplet.Utility.renderText(ctx, this.groupName1, (canvasWidth - groupName1Width) / 2, fontSize);
    else
    {
        var groupName2Width = ctx.measureText(this.groupName2).width;
        SPAApplet.Utility.renderText(ctx, this.groupName1, 3 * canvasWidth / 4 - groupName1Width / 2, fontSize);
        SPAApplet.Utility.renderText(ctx, this.groupName2, canvasWidth / 4 - groupName2Width / 2, fontSize);
    }
    
    // Render vertical lines -- the coordinates are a bit of an estimation
    ctx.beginPath();
    ctx.moveTo(leaf1LeftX - separatorBuffer, (1 + 2 * lineBuffer) * fontSize);
    ctx.lineTo(leaf1LeftX - separatorBuffer, currentY - (1 + lineBuffer) * fontSize);
    ctx.stroke();
    if (this.data2)
    {
        ctx.beginPath();
        ctx.moveTo(leaf2RightX + separatorBuffer, (1 + 2 * lineBuffer) * fontSize);
        ctx.lineTo(leaf2RightX + separatorBuffer, currentY - (1 + lineBuffer) * fontSize);
        ctx.stroke();
    }
    
    // All done, unclip and return context to former state in case it's being referenced elsewhere
    ctx.restore();
};

// Automatic behaviors for container
SPAApplet.Stemplot.prototype.hideXScale = true;
SPAApplet.Stemplot.prototype.hideXAxis = true;
SPAApplet.Stemplot.prototype.hideYScale = true;
SPAApplet.Stemplot.prototype.hideYAxis = true;
SPAApplet.Stemplot.prototype.hideBorders = true;

/** Scatterplot */
// Bivariate dot graph.  It is possible to plot a function on top of this plot using setRegression.
// This implementation is not terribly elegant; we make a couple of concessions to get the behavior
// we want from the container, rather than re-implement a bunch of stuff from scratch.
SPAApplet.Scatterplot = function(dataArrX, dataArrY, xAxisName, yAxisName, container)
{
    // If the arrays happen to be different lengths, only plot the points common to both
    // sets of graphs.
    var minCommonLength = Math.min(dataArrX.length, dataArrY.length);
    this.xData = dataArrX.slice(0, minCommonLength + 1);
    this.yData = dataArrY.slice(0, minCommonLength + 1);
    
    // We need to expose a "data" property so the container will scale along the x properly.
    this.data = this.xData;
    
    // We need to expose a "groupName" property so the container will publish a y-axis label.
    this.groupName = yAxisName;

    this.xAxisName = xAxisName; // We will need to set this manually upon rendering.

    this.drawRegression = false;

    if (container)
        container.addGraph(this);
};

// Set the regression line / function to be displayed on this plot.
// FUTURE: This clears the regression by passing an empty parameter, which is not consistent
//   with other approaches.  Rewrite?
SPAApplet.Scatterplot.prototype.setRegression = function(fn)
{
    this.drawRegression = (fn ? true : false);
    this.fnRegression = fn;
    this.container.renderGraphs();
};

SPAApplet.Scatterplot.prototype.preRender = function()
{
    // Set x-axis name without causing an infinite rendering loop
    this.container.setVariableName(this.xAxisName, true);
    
    // Determine optimal y-axis spacing and override the container's y axis choices.
    var yDataMin = jStat.min(this.yData);
    var yDataMax = jStat.max(this.yData);
    
    if (SPAApplet.SafeNumber.compareToWithinTolerance(yDataMin, yDataMax) !== 0)
    {
        this.container.yAxisSpace.min = yDataMin - 0.1 * (yDataMax - yDataMin);
        this.container.yAxisSpace.max = yDataMax + 0.1 * (yDataMax - yDataMin);
    }
    else
    {
        this.container.yAxisSpace.min = yDataMin - 0.1;
        this.container.yAxisSpace.max = yDataMax + 0.1;
    }
};

SPAApplet.Scatterplot.prototype.render = function()
{
    // Draw axes
    this.drawingArea.drawLineWC(this.drawingArea.xAxisSpace.min, 0, this.drawingArea.xAxisSpace.max, 0);
    this.drawingArea.drawLineWC(0, this.drawingArea.yAxisSpace.min, 0, this.drawingArea.yAxisSpace.max);

    for (var i = 0; i < this.xData.length; i++)
        this.drawingArea.drawPointWC(this.xData[i], this.yData[i], SPAApplet.Preferences.values.drawing.dot_radius);
    
    // If we're drawing the LSRL, compute it and draw it here
    if (this.drawRegression)
        this.drawingArea.plotFunction(this.fnRegression,
                            this.drawingArea.xAxisSpace.min,
                            this.drawingArea.xAxisSpace.max);
};

// Don't render axes since the scatterplot will draw its own after preRender( )
SPAApplet.Scatterplot.prototype.hideXAxis = true;
SPAApplet.Scatterplot.prototype.hideYAxis = true;

/** UIHandlers */
// A collection of functions to make certain UI operations easier.
SPAApplet.UIHandlers =
{
    /** Functions for handling input states (to restore inputs to forms) */
    // FUTURE: It seems like much of this can be done with input.defaultValue DOM method.
    
    // The associative map of input states
    inputStates: {},

    hasInputState: function(inputID) { return (typeof this.inputStates[inputID] !== "undefined"); },

    recordInputState: function(inputID) { this.inputStates[inputID] = document.getElementById(inputID).value; },

    recordInputStates: function(arr) { for (var i = 0; i < arr.length; i++) this.recordInputState(arr[i]); },

    resetInputState: function(inputID)
    {
        var obj = this.inputStates[inputID];
        if (typeof obj !== "undefined")
            document.getElementById(inputID).value = obj;
    },

    clearInputState: function(inputID) { if (inputID && this.hasInputState(inputID)) delete this.inputStates[inputID]; },

    clearInputStates: function() { for (var inputID in this.inputStates) this.clearInputState(inputID); },
    
    /** Functions for handling batch logic on form elements */
    
    // Get the property from the selected element
    getProperty: function(id, propName)
    {
        var elt = document.getElementById(id);
        if (elt) return elt[propName];
    },

    // Set the control with the given ID to have the given value for style property propName
    setStyleProperty: function(id, propName, value)
    {
        var elt = document.getElementById(id);
        if (elt) elt.style[propName] = value;
    },

    // Give array of control IDs to have the given value for style property propName
    batchSetStyleProperty: function(arr, propName, value)
    {
        for (var i = 0; i < arr.length; i++) this.setStyleProperty(arr[i], propName, value);
    },
    
    // Set the control with the given ID to have the given value for property propName
    setProperty: function(id, propName, value)
    {
        var elt = document.getElementById(id);
        if (elt) elt[propName] = value;
    },

    // Give array of control IDs to have the given value for property propName
    batchSetProperty: function(arr, propName, value)
    {
        for (var i = 0; i < arr.length; i++) this.setProperty(arr[i], propName, value);
    },

    // Group the provided element IDs into a group of display elements that should be visible or invisible together.
    // The group comes with convenience functions for hiding and showing the group.
    makeVisibilityGroup: function()
    {
        return {
            controlIds: Array.prototype.slice.call(arguments, 0),
            show: function() {
                SPAApplet.UIHandlers.batchSetStyleProperty(this.controlIds, "display", "inline");
            },
            hide: function() {
                SPAApplet.UIHandlers.batchSetStyleProperty(this.controlIds, "display", "none");
            },
            toggle: function() {
                if (this.controlIds.length > 0)
                {
                    var display = document.getElementById(this.controlIds[0]).style.display;
                    display == "none" ? this.show() : this.hide();
                }
            }
        };
    },

    // Wrapper to set the onload property for a page cross-browser.    
    setOnLoad: function(func)
    {
        if (window.addEventListener)
            window.addEventListener("load", func, false);
        else if (window.attachEvent)
            window.attachEvent("onload", func);
        else if (window.onload)
            window.onload = func;
    },

    // If a page accepts preload data (coded below), use this method instead as
    // a convenience to add querystring parsing code to the onload.
    setOnLoadWithPreload: function(func)
    {
        this.setOnLoad(function(){
            func();
            
            var params = SPAApplet.UIHandlers.getQueryString();
            if (params["data"])
                SPAApplet.Preloads.loadData(params["data"]);
        });
    },

    // Remove a DOM item from the page by its ID
    // Thanks to http://stackoverflow.com/questions/8830839/javascript-dom-remove-element
    removeElement: function(id)
    {
        var elt = document.getElementById(id);
        if (elt) elt.parentNode.removeChild(elt);
    },

    // Remove multiple DOM items from the page by ID
    removeElements: function(ids)
    {
        for (var i = 0; i < ids.length; i++) this.removeElement(ids[i]);
    },

    // Extract the first element with the given class name it encounters
    // in traversing the HTML child elements of the given element
    extractElement: function(elt, cls)
    {
        var children = elt.children;
        for (var j = 0; j < children.length; j++)
            if (children[j].className == cls)
                return children[j];
        return null;
    },

    // Extracts the value property of the first item with the given class name it runs into
    // in the HTML child elements of the given element
    extractElementClassValue: function(elt, cls, setDefaultValue)
    {
        var ctl = SPAApplet.UIHandlers.extractElement(elt, cls);
        if (ctl)
        {
            if (setDefaultValue) ctl.defaultValue = ctl.value;
            return ctl.value;
        }
        return null;
    },

    // Get the contents of the querystring as a key-value map in a cross-browser way
    getQueryString: function()
    {
        if (!window.location.search) return {};

        var tokens = window.location.search.slice(1).split('&');
        var retval = {};
        for (var i = 0; i < tokens.length; i++)
        {
            var splitter = tokens[i].split('=');
            retval[splitter[0]] = splitter[1];
        }
        return retval;
    },
    
    // Designed to be added as a document-level paste event handler.
    // Grabs the clipboard data and preprocesses it if this is MSIE,
    // mainly for pasting from MS Excel into MSIE.
    // Adapted from http://stackoverflow.com/questions/9008438/copy-paste-from-ms-excel-fails-with-ie-but-works-with-firefox
    pasteFromExcelHandler: function(sysEventObj)
    {
        // Only do the preprocessing if this is Internet Explorer
        if (window.clipboardData)
        {
            // Try to strip the special characters BEFORE IE gets to them
            var str = window.clipboardData.getData("Text");    
            str = str.replace(/[\r\n\t]+/g, " "); // replace carriage return, newline or tab sequence by a single space
            window.clipboardData.setData("Text", str);
        }
    }
};

/** InputValidation */
// A variety of methods for validating form inputs
SPAApplet.InputValidation = 
{
    // Facility for checking whether a particular input control contains a valid integer value.
    // input: the input control itself
    // min: lowest possible value for control
    // max: highest possible value for control
    // strict: if inclusive, max and min are checked exclusively, else inclusive
    // Optionals:
    // spnMsg: a SPAN in which to write the error message
    // msgParamName: the parameter name to output to the user in the error message
    // altRangeMsg: if the parameter is out of range, a more friendly/specific error to output
    validateInputInt: function(inputID, min, max, strict, spnMsgID, msgParamName, altRangeMsg)
    {
        var input = document.getElementById(inputID);
        var spnMsg = (spnMsgID ? document.getElementById(spnMsgID) : null);
    
        // If the value is not the same parsed as a float and as an integer, do not allow it
        var val = parseInt(input.value, 10);
        var fVal = parseFloat(input.value);
        var valid = true;
    
        if (!msgParamName) msgParamName = "Input";
        
        if (isNaN(val))
        {
            if (spnMsg)
                spnMsg.innerHTML = msgParamName + " must be numeric.";
            valid = false;
        }
        else if (SPAApplet.SafeNumber.compareToWithinTolerance(val, fVal) !== 0)
        {
            if (spnMsg)
                spnMsg.innerHTML = msgParamName + " must be an integer.";
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
    },

    // Facility for checking whether a particular input control contains a valid decimal value.
    // input: the input control itself
    // min: lowest possible value for control
    // max: highest possible value for control
    // strict: if inclusive, max and min are checked exclusively, else inclusive
    // Optionals:
    // spnMsg: a SPAN in which to write the error message
    // msgParamName: the parameter name to output to the user in the error message
    // altRangeMsg: if the parameter is out of range, a more friendly/specific error to output
    validateInputFloat: function(inputID, min, max, strict, spnMsgID, msgParamName, altRangeMsg)
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
    },

    // Validates a comma- and/or space-separated string of values to see if the input is all numbers.
    // Trims the string first.
    // input: the text input control itself
    // Optionals:
    // spnMsg: a SPAN in which to write the error message
    // msgParamName: the parameter name to output to the user in the error message
    // altMsg: if the parameter has invalid values, a more friendly/specific error to output
    validateInputFloatArray: function(inputID, spnMsgID, msgParamName, altMsg)
    {
        var input = document.getElementById(inputID);
        var spnMsg = (spnMsgID ? document.getElementById(spnMsgID) : null);
        var arr = SPAApplet.Utility.splitString(input.value);
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
            if (spnMsg) spnMsg.innerHTML = msgParamName + " " + (altMsg ? altMsg : "has non-numeric values. Please try again.");
        }
        else
        {
            if (spnMsg) spnMsg.innerHTML = "";
        }
        
        return valid;
    }    
};

/** Statistics */
// This object interfaces with jStat functions to accomplish statistical tests and calculations.
SPAApplet.Statistics =
{
    // Constants for test directions
    ONE_SIDED_LT: 0,
    TWO_SIDED: 1,
    ONE_SIDED_GT: 2,

    // Get a map containing a variety of statistics for a given array of univariate quantitative data    
    getOneVariableStatistics: function(arr)
    {
        var sArr = arr.slice(0);
        SPAApplet.Utility.sortArrayAscending(sArr);
        var arrHalfLength = Math.floor(sArr.length / 2);
        var quartiles = [jStat.median(sArr.slice(0, arrHalfLength)),
                         jStat.median(sArr),
                         jStat.median(sArr.slice(-arrHalfLength))];
        return {
           n: arr.length,
           mean: jStat.mean(arr),
           Sx: jStat.stdev(arr, true),
           min: jStat.min(arr),
           Q1: quartiles[0],
           median: quartiles[1],
           Q3: quartiles[2],
           max: jStat.max(arr),
           quartiles: quartiles
        };
    },

    // Return an array of n bootstrap means using self-sampling
    simulationMeans: function(arr, n)
    {
        var means = [];
        for (var i = 0; i < n; i++)
        {
            var sample = [];
            for (var j = 0; j < arr.length; j++)
                sample.push(arr[SPAApplet.Utility.randomIntFromInterval(0, arr.length - 1)]);
            means.push(jStat.mean(sample));
        }
        return means;
    },

    // Return an array of n trials of a mean difference test (permuting outcomes around 0)
    simulationMeanDiff: function(arr, n)
    {
        var means = [];
        for (var i = 0; i < n; i++)
        {
            var simarr = [];
            for (var j = 0; j < arr.length; j++)
                simarr.push((SPAApplet.Utility.randomIntFromInterval(0, 1)) ? arr[j] : -arr[j]);
            means.push(jStat.mean(simarr));
        }
        return means;
    },

    // Return an array of n trials of shuffling outcomes into two piles equal to the original
    // size and calculating the mean difference
    simulationDiffMeans: function(arr1, arr2, n)
    {
        var allData = arr1.concat(arr2);
        var diffs = [];
        for (var i = 0; i < n; i++)
        {
            SPAApplet.Utility.knuthShuffle(allData);
            var sample1 = allData.slice(0, arr1.length);
            var sample2 = allData.slice(arr1.length);
            diffs.push(jStat.mean(sample1) - jStat.mean(sample2));
        }
        return diffs;
    },

    // Return an array of n simulated sample proportions with p as the success probability
    simulationProportions: function(p, sampleSize, n)
    {
        var props = [];
        for (var i = 0; i < n; i++)
        {
            var x = 0;
            for (var j = 0; j < sampleSize; j++)
                if (Math.random() < p) x++;
            props.push(x / sampleSize);
        }        
        return props;
    },

    // Return an array of n simulated success counts with p as the success probability
    simulationCounts: function(p, sampleSize, n)
    {
        var counts = [];
        for (var i = 0; i < n; i++)
        {
            var x = 0;
            for (var j = 0; j < sampleSize; j++)
                if (Math.random() < p) x++;
            counts.push(x);
        }        
        return counts;
    },

    // Return an array of n differences between two simulated proportions
    simulationDiffProportions: function(x1, n1, x2, n2, n)
    {
        var xt = x1 + x2;
        var nt = n1 + n2;
        var diffs = [];
        for (var i = 0; i < n; i++)
        {
            var succ1 = 0;
            var nPool = nt;
            var xPool = xt;
            for (var j = 0; j < n1; j++)
            {
                if (SPAApplet.Utility.randomIntFromInterval(1, nPool--) <= xPool)
                {
                    succ1++;
                    xPool--;
                }
            }
            diffs.push(succ1 / n1 - xPool / n2);
        }
        return diffs;
    },

    // Return the parameters for a z-confidence interval for a proportion
    onePropZInterval: function(x, n, cLevel)
    {
        var pHat = x / n;
        var SE = Math.sqrt(pHat * (1 - pHat) / n);
        var zStar = jStat.normal.inv((1 - cLevel) / 2, 0, 1);
        return {
            lowerBound: pHat + SE * zStar,  // zStar is negative
            upperBound: pHat - SE * zStar,
            pHat: pHat
        };
    },

    // Return the parameters from a z test for one proportion, null hypothesis proportion p0
    onePropZTest: function(x, n, p0, sidedness)
    {
        var pHat = x / n;
        var SD = Math.sqrt(p0 * (1 - p0) / n);
        var zScore = (pHat - p0) / SD;
        var leftTail = jStat.normal.cdf(zScore, 0, 1);
        return {
            z: zScore,
            pValue: (sidedness === this.ONE_SIDED_LT ? leftTail :
                    (sidedness === this.ONE_SIDED_GT ? 1 - leftTail : 2 * Math.min(leftTail, 1-leftTail))),
            pHat: pHat
        };
    },

    // Return the parameters for a z-confidence interval for a difference between two proportions    
    twoPropZInterval: function(x1, n1, x2, n2, cLevel)
    {
        var pHat1 = x1 / n1;
        var pHat2 = x2 / n2;
        var SE = Math.sqrt(pHat1 * (1 - pHat1) / n1 + pHat2 * (1-pHat2) / n2);
        var zStar = jStat.normal.inv((1 - cLevel) / 2, 0, 1);
        return {
            pHat1: pHat1,
            pHat2: pHat2,
            lowerBound: (pHat1 - pHat2) + SE * zStar,  // zStar is negative
            upperBound: (pHat1 - pHat2) - SE * zStar,
        };
    },

    // Return the parameters from a z test for a difference between two proportions, null hypothesis diff = 0
    twoPropZTest: function(x1, n1, x2, n2, sidedness)
    {
        var pHat1 = x1 / n1;
        var pHat2 = x2 / n2;
        var pHatC = (x1 + x2) / (n1 + n2);
        var SD = Math.sqrt(pHatC * (1 - pHatC) / n1 + pHatC * (1-pHatC) / n2);
        var zScore = (pHat1 - pHat2) / SD;
        var leftTail = jStat.normal.cdf(zScore, 0, 1);
        return {
            pHat1: pHat1,
            pHat2: pHat2,
            pHatC: pHatC,
            z: zScore,
            pValue: (sidedness === this.ONE_SIDED_LT ? leftTail :
                    (sidedness === this.ONE_SIDED_GT ? 1 - leftTail : 2 * Math.min(leftTail, 1-leftTail)))
        };
    },

    // Return the parameters for a t-confidence interval for a sample mean, given the sample data array
    oneSampTIntervalMean: function(arr, cLevel)
    {
        var interval = jStat.tci(jStat.mean(arr), 1 - cLevel, arr);
        return {
            lowerBound: interval[0],
            upperBound: interval[1],
            df: arr.length - 1
        };
    },
    
    // Return the parameters for a t-confidence interval for a sample mean, given the sample statistics
    oneSampTIntervalMeanStats: function(mean, SD, n, cLevel)
    {
        var SEM = SD / Math.sqrt(n);
        var tStar = jStat.studentt.inv((1 - cLevel) / 2, n - 1);
        return {
            lowerBound: mean + tStar * SEM,
            upperBound: mean - tStar * SEM,
            df: n - 1
        };
    },

    // Return the parameters from a t-test for a sample mean, given the sample data array and the null hypothesis mean    
    oneSampTTestMean: function(arr, mean, sidedness)
    {
        return this.oneSampTTestMeanStats(jStat.mean(arr), jStat.stdev(arr, true), arr.length, mean, sidedness);
    },

    // Return the parameters from a t-test for a sample mean, given the sample statistics and the null hypothesis mean    
    oneSampTTestMeanStats: function(xbar, SD, n, mean, sidedness)
    {
        var SEM = SD / Math.sqrt(n);
        var t = (xbar - mean) / SEM;
        var leftTail = jStat.studentt.cdf(t, n - 1);
        return {
            t: t,
            pValue: (sidedness === this.ONE_SIDED_LT ? leftTail :
                    (sidedness === this.ONE_SIDED_GT ? 1 - leftTail : 2 * Math.min(leftTail, 1-leftTail))),
            df: n - 1
        };
    },
    
    // Return the parameters for a t-interval for a difference in means, given the sample data arrays
    // Use conservative degrees of freedom if conservativeDF is true
    twoSampTIntervalDiffMean: function(arr1, arr2, cLevel, conservativeDF)
    {
        return this.twoSampTIntervalDiffMeanStats(jStat.mean(arr1), jStat.mean(arr2),
                                             jStat.stdev(arr1, true), jStat.stdev(arr2, true),
                                             arr1.length, arr2.length,
                                             cLevel, conservativeDF);
    },

    // Return the parameters for a t-interval for a difference in means, given the sample statistics
    // Use conservative degrees of freedom if conservativeDF is true
    twoSampTIntervalDiffMeanStats: function(xbar1, xbar2, s1, s2, n1, n2, cLevel, conservativeDF)
    {
        // SEM formula from TPS4e p. 633
        var SEM = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2);
        // DF formula from TPS4e p. 637
        var df = (conservativeDF ? Math.min(n1 - 1, n2 - 1) : 
                Math.pow(s1 * s1 / n1 + s2 * s2 / n2, 2) /
                 (Math.pow(s1 * s1 / n1, 2) / (n1 - 1) + (Math.pow(s2 * s2 / n2, 2) / (n2 - 1))));
        var tStar = jStat.studentt.inv((1 - cLevel) / 2, df);
        var ptEst = xbar1 - xbar2;
        return {
            lowerBound: ptEst + tStar * SEM,    // tStar is negative
            upperBound: ptEst - tStar * SEM,
            df: df
        };
    },

    // Return the parameters from a t-test for a difference in means, given the sample data arrays
    // Null hyp diff = 0
    // Use conservative degrees of freedom if conservativeDF is true
    twoSampTTestDiffMean: function(arr1, arr2, sidedness, conservativeDF)
    {
        return this.twoSampTTestDiffMeanStats(jStat.mean(arr1), jStat.mean(arr2),
                                         jStat.stdev(arr1, true), jStat.stdev(arr2, true),
                                         arr1.length, arr2.length,
                                         sidedness, conservativeDF);
    },
    
    // Return the parameters from a t-test for a difference in means, given the sample statistics
    // Null hyp diff = 0
    // Use conservative degrees of freedom if conservativeDF is true
    twoSampTTestDiffMeanStats: function(xbar1, xbar2, s1, s2, n1, n2, sidedness, conservativeDF)
    {
        // SEM formula from TPS4e p. 633
        var SEM = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2);
        // DF formula from TPS4e p. 637
        var df = (conservativeDF ? Math.min(n1 - 1, n2 - 1) : 
                Math.pow(s1 * s1 / n1 + s2 * s2 / n2, 2) /
                 (Math.pow(s1 * s1 / n1, 2) / (n1 - 1) + (Math.pow(s2 * s2 / n2, 2) / (n2 - 1))));
        var tScore = (xbar1 - xbar2) / SEM;
        var leftTail = jStat.studentt.cdf(tScore, df);
        return {
            t: tScore,
            pValue: (sidedness === this.ONE_SIDED_LT ? leftTail :
                    (sidedness === this.ONE_SIDED_GT ? 1 - leftTail : 2 * Math.min(leftTail, 1-leftTail))),
            df: df
        };
    },
    
    // Return the parameters for a t-confidence interval for regression slope given the sample data
    linRegTInterval: function(xArr, yArr, cLevel)
    {
        var reg = this.polynomialRegression(xArr, yArr, 1);
        var SE = reg.S / (jStat.stdev(xArr, true) * Math.sqrt(xArr.length - 1));
        var tStar = jStat.studentt.inv((1 - cLevel) / 2, xArr.length - 2);
        var ptEst = reg.coeffs[1];
        return {
            lowerBound: ptEst + tStar * SE,    // tStar is negative
            upperBound: ptEst - tStar * SE,
            df: xArr.length - 2
        };
    },

    // Return the parameters from a t-test for regression slope given the sample data
    // Null hyp slope = 0
    linRegTTest: function(xArr, yArr, sidedness)
    {
        var reg = this.polynomialRegression(xArr, yArr, 1);
        var SE = reg.S / (jStat.stdev(xArr, true) * Math.sqrt(xArr.length - 1));
        var tScore = reg.coeffs[1] / SE;
        var leftTail = jStat.studentt.cdf(tScore, xArr.length - 2);
        return {
            t: tScore,
            pValue: (sidedness === this.ONE_SIDED_LT ? leftTail :
                    (sidedness === this.ONE_SIDED_GT ? 1 - leftTail : 2 * Math.min(leftTail, 1-leftTail))),
            df: xArr.length - 2
        };
    },

    // Return an array of n simulated slopes in which the response array is shuffled randomly    
    // (The parameters are copied and left unchanged)
    simulateSlopes: function(arrExp, arrResp, n)
    {
        var xArr = arrExp.slice(0);
        var yArr = arrResp.slice(0);
        var slopes = [];
        for (var i = 0; i < n; i++)
        {
            SPAApplet.Utility.knuthShuffle(yArr);
            slopes.push(this.polynomialRegression(xArr, yArr, 1).coeffs[1]);
        }
        return slopes;
    },

    // Used for LSRL, quadratic, cubic, etc.
    // Expects arr1 and arr2 to be the same length
    // Returns a containing object with the coefficients in
    // increasing significance order, as well as a convenience function
    // for running / plotting the regression yourself
    polynomialRegression: function(arrX, arrY, order)
    {
        order = order || 1;
        var m = jStat.create(arrX.length, order + 1, function(r, c) {
           return Math.pow(arrX[r], c);
        });
        var y = jStat.transpose(arrY);
        var mt = jStat.transpose(m);
        
        // Following algorithm taken from Elementary Linear Algebra, Anton 10/e p. 473
        var coeffs = jStat.transpose(jStat.multiply(jStat.multiply(jStat.inv(jStat.multiply(mt,m)),mt),y));
        
        // Use a generic method for finding r-squared, r^2 = SSreg / SStotal
        var fn = function(x) {
                var val = 0;
                for (var i = 0; i < coeffs.length; i++)
                    val += coeffs[i] * Math.pow(x, i);
                return val;
            };
            
        var residuals = new Array(arrX.length);
        var ybar = jStat.mean(arrY);
        var SST = 0;
        var SSreg = 0;
        var sumSqrResid = 0;
        for (var i = 0; i < arrX.length; i++)
        {
            SST += Math.pow(arrY[i] - ybar, 2);
            var yhat = fn(arrX[i]);
            residuals[i] = arrY[i] - yhat;
            sumSqrResid += Math.pow(residuals[i], 2);
            SSreg += Math.pow(yhat - ybar, 2);
        }
        return {
            coeffs: coeffs,
            fn: fn,
            residuals: residuals,
            rSquared: SSreg/SST,
            S: ((arrY.length == order + 1) ? 0 : Math.sqrt(sumSqrResid / (arrY.length - (order + 1))))
        };
    },

    // Returns a containing object with the coefficients in
    // increasing significance order, as well as a convenience function for
    // running / plotting the regression yourself
    exponentialRegression: function(arrX, arrY)
    {
        var logArrY = arrY.slice(0);
        for (var i = 0; i < logArrY.length; i++)
            logArrY[i] = Math.log(arrY[i]);
            
        var baseObj = this.polynomialRegression(arrX, logArrY, 1);
        var constant = Math.exp(baseObj.coeffs[0]);
        var base = Math.exp(baseObj.coeffs[1]);
        var fn = function(x) {
                return constant * Math.pow(base, x);
            };

        // Must refigure residuals...
        var residuals = new Array(arrX.length);
        var sumSqrResid = 0;
        for (var i = 0; i < arrX.length; i++)
        {
            residuals[i] = arrY[i] - fn(arrX[i]);
            sumSqrResid += Math.pow(residuals[i], 2);
        }

        return {
            constant: constant,
            base: base,
            rSquared: baseObj.rSquared,
            fn: fn,
            residuals: residuals,
            S: (arrY.length == 2 ? 0 : Math.sqrt(sumSqrResid / (arrY.length - 2)))
        };
    },

    // Return the parameters from a chi square GOF test given observed and expected value arrays
    // FUTURE: The method name should probably be chiSquare and not chiSquared
    chiSquaredGOFTest: function(data1varObs, data1varExp)
    {
        var x2 = 0;
        var df = -1;
        var contributions = {};
        for (var cat in data1varObs.frequencies)
        {
            var obs = data1varObs.frequencies[cat];
            var exp = data1varExp.frequencies[cat];
            var cntrb = Math.pow(obs - exp, 2) / exp;
            contributions[cat] = cntrb;
            x2 += cntrb;
            df++;
        }
        var pValue = 1 - jStat.chisquare.cdf(x2, df);
        return {
            x2: x2,
            pValue: pValue,
            df: df,
            contributions: contributions
        };
    },
    
    // Return the parameters from a chi square contingency table test given the data
    // FUTURE: The method name should probably be chiSquare and not chiSquared
    chiSquared2WayTest: function(data2VarObs)
    {
        var x2 = 0;
        var df = (data2VarObs.rowCategories.length - 1) * (data2VarObs.columnCategories.length - 1);
        var contributions = [];
        var exp = [];
        var warning = false;
        for (var i = 0; i < data2VarObs.data.length; i++)
        {
            exp[i] = [];
            contributions[i] = [];
            for (var j = 0; j < data2VarObs.data[i].length; j++)
            {
                exp[i][j] = data2VarObs.rowTotals[i] * data2VarObs.columnTotals[j] / data2VarObs.grandTotal;
                var cntrb = Math.pow(data2VarObs.data[i][j] - exp[i][j], 2) / exp[i][j];
                x2 += cntrb;
                contributions[i][j] = cntrb;
                
                warning = warning || (exp[i][j] < 5);
            }
        }
        var pValue = 1 - jStat.chisquare.cdf(x2, df);
        return {
            x2: x2,
            expectedCounts: exp,
            pValue: pValue,
            df: df,
            contributions: contributions,
            lowCountWarning: warning
        };
    },

    // Return a DiscreteProbabilityDistribution object corresponding to the binomial distribution of
    // given parameters
    binomialProbabilityDistribution: function(n, p)
    {
        var values = [];
        var probabilities = [];
        for (var i = 0; i <= n; i++)
        {
            values.push(i);
            probabilities.push(jStat.binomial.pdf(i, n, p));
        }
        return new SPAApplet.DiscreteProbabilityDistribution(values, probabilities);
    }
};

/** CategoricalData1Var */
// Collection of categories and frequencies.
SPAApplet.CategoricalData1Var = function()
{
    this.frequencies = {};
    this.categories = [];
};

// Given the raw data input, split it into individual observations
// and tally each string found
SPAApplet.CategoricalData1Var.prototype.addDataString = function(str)
{
    var arr = SPAApplet.Utility.splitString(str);
    for (var i = 0; i < arr.length; i++)
        this.addFrequencyFor(SPAApplet.Utility.trimString(arr[i]));
};

// Given a category, add the specified frequency for that category (or 1 if it is not specified).
// Create a new category if the category you observe has not yet been recorded.
SPAApplet.CategoricalData1Var.prototype.addFrequencyFor = function(cat, freq)
{
    freq = isNaN(freq) ? 1 : freq;
    if (!this.frequencies[cat])
    {
        this.categories.push(cat);
        this.frequencies[cat] = freq;
    }
    else
        this.frequencies[cat] += freq;
};

// Remove the frequencies for a given category, and the category itself
SPAApplet.CategoricalData1Var.prototype.deleteCategory = function(cat)
{
    if (this.frequencies[cat])
    {
        delete this.frequencies[cat]; 
        this.categories.splice(cat, 1);
    }
};

// Remove all tallied data from this object
SPAApplet.CategoricalData1Var.prototype.clear = function()
{
    for (var cat in this.frequencies) this.deleteCategory(cat);
};

// Count the total frequency of all categories observed in this object
SPAApplet.CategoricalData1Var.prototype.getTotalFrequency = function()
{
    var total = 0;
    for (var cat in this.frequencies) total += this.frequencies[cat];
    return total;
};

// Determine the category with the highest frequency
SPAApplet.CategoricalData1Var.prototype.getMostFrequentCategory = function()
{
    var max = 0;
    var maxCat = null;
    for (var cat in this.frequencies)
        if (this.frequencies[cat] >= max)
        {
            max = this.frequencies[cat];
            maxCat = cat;
        }
    return {
        category: maxCat,
        frequency: max
    };
};

/** CategoricalData2Var */
// Represents a matrix of observations.
// You must specify the row and column headings along with your two-dimensional array of data, if you have one;
// otherwise a blank table will be created from the row and column headings
SPAApplet.CategoricalData2Var = function(rowCategoriesArr, columnCategoriesArr, data2DArr)
{
    this.rowCategories = (rowCategoriesArr ? rowCategoriesArr.slice(0) : []);
    this.rowCategoryIndexMap = {};
    for (var i = 0; i < this.rowCategories.length; i++)
        this.rowCategoryIndexMap[this.rowCategories[i]] = i;
    this.columnCategories = (columnCategoriesArr ? columnCategoriesArr.slice(0) : []);
    this.columnCategoryIndexMap = {};
    for (var i = 0; i < this.columnCategories.length; i++)
        this.columnCategoryIndexMap[this.columnCategories[i]] = i;
    this.data = [];
    this.rowTotals = [];
    if (data2DArr)
    {
        for (var i = 0; i < data2DArr.length; i++)
        {
            this.data[i] = data2DArr[i].slice(0);
            this.rowTotals[i] = jStat.sum(this.data[i]);
        }
        this.columnTotals = jStat(this.data).sum();
        this.grandTotal = jStat.sum(this.columnTotals);
    }
    else
    {
        this.columnTotals = [];
        this.grandTotal = 0;
    }
};

// Add a specified tally (or 1 if not specified) to the given row - col match.
// The row and column will be appended to the end of the table if they are not already specified.
SPAApplet.CategoricalData2Var.prototype.addFrequencyFor = function(rowKey, colKey, freq)
{
    freq = isNaN(freq) ? 1 : freq;
    
    var rowIndex = this.rowCategoryIndexMap[rowKey];
    var colIndex = this.columnCategoryIndexMap[colKey];
    
    if (rowIndex === undefined)
    {
        rowIndex = this.rowCategories.length;
        this.rowCategoryIndexMap[rowKey] = rowIndex;
        this.rowCategories.push(rowKey);
        
        // Update data columns and totals
        this.data[rowIndex] = [];
        for (var i = 0; i < this.columnCategories.length; i++)
            this.data[rowIndex].push(0);
        this.rowTotals[rowIndex] = 0;
    }
    if (colIndex === undefined)
    {
        colIndex = this.columnCategories.length;
        this.columnCategoryIndexMap[colKey] = colIndex;
        this.columnCategories.push(colKey);

        // Update data rows and totals
        for (var i = 0; i < this.rowCategories.length; i++)
            this.data[i].push(0);
        this.columnTotals[colIndex] = 0;
    }
    
    this.data[rowIndex][colIndex] += freq;
    this.rowTotals[rowIndex] += freq;
    this.columnTotals[colIndex] += freq;
    this.grandTotal += freq;
};

// Return the frequency associated with a given row - col lookup.
SPAApplet.CategoricalData2Var.prototype.getFrequencyFor = function(rowKey, colKey)
{
    return this.data[this.rowCategoryIndexMap[rowKey]][this.columnCategoryIndexMap[colKey]];
};

// Clear all data in this object.
SPAApplet.CategoricalData2Var.prototype.clear = function()
{
    this.data = [];
    this.rowTotals = [];
    this.columnTotals = [];
    this.rowCategories = [];
    this.columnCategories = [];
    this.rowCategoryIndexMap = {};
    this.columnCategoryIndexMap = {};
    this.grandTotal = 0;
};

// Get the conditional distribution of the columns given a row.
SPAApplet.CategoricalData2Var.prototype.getRowConditionalDistribution = function(rowKey)
{
    var index = this.rowCategoryIndexMap[rowKey];
    return jStat.divide(this.data[index], this.rowTotals[index]);
};

// Get the conditional distribution of the rows given a column.
SPAApplet.CategoricalData2Var.prototype.getColumnConditionalDistribution = function(colKey)
{
    var colIndex = this.columnCategoryIndexMap[colKey];
    var retval = [];
    for (var i = 0; i < this.data.length; i++)
        retval.push(this.data[i][colIndex] / this.columnTotals[colIndex]);
    return retval;
};

/** DiscreteProbabilityDistribution */
// A collection that maps a numeric value to its probability
SPAApplet.DiscreteProbabilityDistribution = function(valueArr, probsArr)
{
    this.values = valueArr.slice(0);
    this.probabilities = probsArr.slice(0);
};

// Returns true if this object's probability distribution is valid:
//  - no negative probabilities
//  - sum of probabilities is 1
SPAApplet.DiscreteProbabilityDistribution.prototype.isValid = function()
{
    // NOTE: Because of typical rounding errors, the tolerance for the totals of the probabilities
    // being equal to 1 is much lower than it would normally be -- only two decimal places.
    if (!SPAApplet.SafeNumber.isZeroWithinTolerance(jStat.sum(this.probabilities) - 1, 2))
        return false;
    for (var i = 0; i < this.probabilities.length; i++)
    {
        var curr = this.probabilities[i];
        if (curr < 0 || curr > 1)
            return false;
    }
    return true;
};

// Get the parameters (mean, SD, etc.) for this probability distribution.
SPAApplet.DiscreteProbabilityDistribution.prototype.getStatistics = function()
{
    var mean = 0;
    for (var i = 0; i < this.values.length; i++)
        mean += this.values[i] * this.probabilities[i];

    var variance = 0;
    for (var i = 0; i < this.values.length; i++)
        variance += Math.pow(this.values[i] - mean, 2) * this.probabilities[i];
    
    return {
      mean: mean,
      stdev: Math.sqrt(variance)
    };
};

/** Preloads */
// Hardcoded data provided by authors for use with the pages.
SPAApplet.Preloads =
{
    // Load data onto a page corresponding to a name parameter, usually gotten from the querystring.
    loadData: function(name)  
    {
        if (name == "1.2")
        {
            if (!SPAApplet.Preloads.validatePageName("cat1v")) return;
            
            // These exist on source page
            document.getElementById("selInputType1Grp").selectedIndex = 1;
            handleInput1GrpChange(document.getElementById("selInputType1Grp"));

            SPAApplet.Preloads.genericPreload(null,
                ["txtVariableName", "txtInputRawData1Grp"],
                ["Preferred status",
                 "Famous Healthy Healthy Famous Happy Famous Happy Happy Famous " +
                 "Rich Happy Happy Rich Happy Happy Happy Rich Happy " +
                 "Famous Healthy Rich Happy Happy Rich Happy Happy Rich " +
                 "Healthy Happy Happy Rich Happy Happy Rich Happy Famous " +
                 "Famous Happy Happy Happy"]
            );
        }

        else if (name == "1.3") SPAApplet.Preloads.genericPreload(
            "quant1v",
            ["txtVariableName", "txtGroup1Data"],
            ["Highway gas mileage", "31 28 25 28 27 30 30 30 31 38 30 31 31 31 40 30 26 32 48 34 25"]
        );

        else if (name == "1.4") SPAApplet.Preloads.genericPreload(
            "quant1v",
            ["txtVariableName", "txtGroup1Data"],
            ["Electoral votes",
             "9 3 11 6 55 9 7 3 3 29 16 4 4 20 11 6 6 8 8 4 10 11 16 10 6 10 3 15 " +
             "5 6 4 14 5 29 3 18 7 7 20 4 13 12 9 3 11 38 6 3 5 10 3"]
        );

        else if (name == "1.5") SPAApplet.Preloads.genericPreload(
            "quant1v",
            ["txtVariableName", "txtGroup1Data"],
            ["Percent foreign-born",
             "3.4 6.2 13.4 4.3 27.1 9.7 13.3 8.6 19.4 9.6 18.2 5.9 13.9 4.6 4.3 6.7 3.3 3.8 3.3 13.7 " +
             "14.9 6.1 7.4 2.3 4.1 2.0 6.2 19.2 5.3 21.3 10.2 22.2 7.3 2.4 3.9 5.5 9.5 5.9 13.5 4.7 " +
             "2.9 4.7 16.5 8.4 3.9 11.1 13.4 1.3 4.8 2.9"]
        );

        else if (name == "1.7") SPAApplet.Preloads.genericPreload(
            "quant1v",
            ["txtVariableName", "txtGroup1Data"],
            ["Travel time to work (min)",
             "10 30 5 25 40 20 10 15 30 20 15 20 85 15 65 15 60 60 40 45"]
        );

        else if (name == "1.8")
        {
            if (!SPAApplet.Preloads.validatePageName("quant1v")) return;

            // These exist on source page
            document.getElementById("selNumGroups").selectedIndex = 1;
            handleGroupsChange(document.getElementById("selNumGroups"));

            SPAApplet.Preloads.genericPreload(null,
            ["txtVariableName", "txtGroup1Name", "txtGroup1Data", "txtGroup2Name", "txtGroup2Data"],
            ["Number of texts",
             "Males", "127 44 28 83 0 6 78 6 5 213 73 20 214 28 11",
             "Females", "112 203 102 54 379 305 179 24 127 65 41 27 298 6 130 0"]
            );
        }

        else if (name == "1.SA")
        {
            if (!SPAApplet.Preloads.validatePageName("quant1v")) return;

            // These exist on source page
            document.getElementById("selNumGroups").selectedIndex = 2;
            handleGroupsChange(document.getElementById("selNumGroups"));

            SPAApplet.Preloads.genericPreload(null,
            ["txtVariableName", "txtGroup1Name", "txtGroup1Data", "txtGroup2Name", "txtGroup2Data",
            "txtGroup3Name", "txtGroup3Data"],
            ["Number of bacteria colonies",
             "Soap", "18 10 10 6 6 5 4 4 4 1",
             "Hand sanitizer", "27 23 14 8 7 6 5 4 3 2",
             "Nothing", "108 97 92 81 57 49 41 38 29 3"]
            );
        }
        
        else if (name == "2.2") SPAApplet.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Dash time (s)", "5.41 5.05 7.01 7.17 6.73 5.68 5.78 6.31 6.44 6.50 6.80 7.25",
             "Long-jump distance (in.)", "171 184 90 65 78 130 173 143 92 139 120 110"]
        );

        else if (name == "2.6") SPAApplet.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Miles driven", "70583 129484 29932 29953 24495 75678 8359 4447 34077 58023 44447 68474 144162 140776 29397 131385",
             "Price (in dollars)", "21994 9500 29875 41995 41995 28986 31891 37991 34995 29988 22896 33961 16883 20897 27495 13997"]
        );

        else if (name == "2.8a") SPAApplet.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Age", "29 34 31 29 29 31 27 33 25 28 25 23 22 34 25 24 27 28 28 30 35 28 32 30 41 29 26 38 27 38 24 23",
             "Passing yards", "4710 4700 4620 4370 4002 3970 3922 3900 3705 3653 3622 3512 3451 3377 3301 3291 3274 3200 3116 3018 3001 3000 2734 2686 2509 2387 2370 2365 2065 1823 1576 1558"]
        );

        else if (name == "2.8b") SPAApplet.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Years since 1970", "1 2 4 8 12 15 19 23 25 27 29 30 31 32 33 34 36 38 40 41 42 44",
             "No. of transistors", "2300 3500 4500 29000 134000 275000 1180235 3100000 5500000 7500000 9500000 42000000 45000000 220000000 410000000 592000000 1700000000 1900000000 2300000000 2600000000 5000000000 5560000000"]
        );

        else if (name == "5.2")
        {
            if (!SPAApplet.Preloads.validatePageName("prob")) return;

            // These exist on source page
            document.getElementById("selCalculatorType").selectedIndex = 1;
            handleCalcChange();
            for (var i = 0; i < 9; i++)
                document.getElementById("btnAddRow").click();

            SPAApplet.Preloads.genericPreload(null,
            ["txtVariableName",
             "txtDiscName1", "txtDiscData1",
             "txtDiscName2", "txtDiscData2",
             "txtDiscName3", "txtDiscData3",
             "txtDiscName4", "txtDiscData4",
             "txtDiscName5", "txtDiscData5",
             "txtDiscName6", "txtDiscData6",
             "txtDiscName7", "txtDiscData7",
             "txtDiscName8", "txtDiscData8",
             "txtDiscName9", "txtDiscData9",
             "txtDiscName10", "txtDiscData10",
             "txtDiscName11", "txtDiscData11"],
            ["Apgar score",
             "0", "0.001",
             "1", "0.006",
             "2", "0.007",
             "3", "0.008",
             "4", "0.012",
             "5", "0.020",
             "6", "0.038",
             "7", "0.099",
             "8", "0.319",
             "9", "0.437",
             "10", "0.053"]
            );
        }

        else if (name == "8.6") SPAApplet.Preloads.genericPreload(
            "quant1v",
            ["txtVariableName", "txtGroup1Data"],
            ["Length (in.)",
             "4.50 4.75 4.75 5.00 5.00 5.00 5.50 5.50 5.50 5.50 5.50 5.50 5.75 5.75 5.75 " +
             "6.00 6.00 6.00 6.00 6.00 6.50 6.75 6.75 7.00"]
        );

        else if (name == "10.5a") SPAApplet.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Row", "1 1 1 1 2 2 2 2 3 3 3 3 4 4 4 4 4 5 5 5 5 5 6 6 6 6 7 7 7 7",
             "Score", "76 77 94 99 83 85 74 79 90 88 68 78 94 72 101 70 79 76 65 90 67 96 88 79 90 83 79 76 77 63"]
        );

        else if (name == "10.5b") SPAApplet.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Foot length (cm)", "26 25 26 24 29 26 28 23 23 21 22 30 23 24 22",
             "Height (cm)", "164 175 187 156 177 181 179 164 177 169 164 192 168 163 156"]
        );

        else if (name == "10.6") SPAApplet.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Amount of sugar (tbs)", "0 0 0 1 1 1 2 2 2 3 3 3",
             "Freshness time (hr)", "168 180 192 192 204 204 204 210 210 222 228 234"]
        );

    },

    // Check that the pagename string is found in the URL of the page you are on. 
    // FUTURE: Should this be in Utility or UIHandlers?
    validatePageName: function(pagename)
    {
        return (window.location.pathname.indexOf(pagename) > -1);
    },
    
    // This generic preload verifies the pagename (so that the control IDs specified in the
    // loadData correspond to actual page elements) and then executes a value set on each input
    // specified in the arrays above.  No other actions can occur; if you want a button to be
    // pressed or a pull-down activated, you must do this yourself outside of calling this method.
    genericPreload: function(pagename, ctlIDarr, ctlvalarr)
    {
        if (pagename && !SPAApplet.Preloads.validatePageName(pagename)) return;

        var UI = SPAApplet.UIHandlers;

        for (var i = 0; i < ctlIDarr.length; i++)
            UI.setProperty(ctlIDarr[i], "value", ctlvalarr[i]);
    }
};

// The following code ensures that the MS Excel paste handler is always loaded.
// It catches paste events at the document level and preprocesses them if needed
if (document.addEventListener)
    document.addEventListener("paste", SPAApplet.UIHandlers.pasteFromExcelHandler);
else if (document.attachEvent)
    document.attachEvent("onpaste", SPAApplet.UIHandlers.pasteFromExcelHandler);

