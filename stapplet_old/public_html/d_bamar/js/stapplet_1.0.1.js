// Namespace declaration
var STAP = STAP || { };

// Catch-all for functions that do not clearly belong in one class or space.
STAP.Utility =
{
    // Trim whitespace and commas from both ends of a string
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
        return STAP.Utility.trimString(str).split(/(?:,|\s)+/);
    },

    // Splits string array input AND creates the numeric array.
    // Do not use without validation!
    splitStringGetArray: function(str, parseFunc)
    {
        var arr = STAP.Utility.splitString(str);
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

    // shallow equality check -- arrays must be sorted first.
    arraysEqual: function(arr1, arr2)
    {
        if (arr1 === arr2) return true;
        if (!arr1 || !arr2) return false;
        if (arr1.length !== arr2.length) return false;  
        
        for (var i = 0; i < arr1.length; i++)
            if (arr1[i] !== arr2[i]) return false;
        return true;
    },

    sortArrayAscending: function(arr)
    {
        arr.sort(function(a, b) { return (a - b); } );
    },

    sortArrayAscendingByProperty: function(arr, prop)
    {
	arr.sort(function(a, b) { return (a[prop] - b[prop]); } );
    },

    sortArrayAscendingByKeys: function(arr, arrKeys)
    {
	var toSort = [];
	for (var i = 0; i < arr.length; i++)
		toSort.push({key: arrKeys[i], val: arr[i]});
	STAP.Utility.sortArrayAscendingByProperty(toSort, "key");
	for (var i = 0; i < arr.length; i++)
	{
		arrKeys[i] = toSort[i].key;
		arr[i] = toSort[i].val;
	}
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
        var util = STAP.Utility;
        for (var i = 0; i < arr.length; i++)
            util.arraySwap(arr, i, util.randomIntFromInterval(i, arr.length - 1));
    },

    // Create HTML suitable for display of RHS of an exponential regression equation    
    exponentialRegEQDisplayHTML: function(constant, base, fnFormat)
    {
        var safenum = STAP.SafeNumber;
        var pref = STAP.Preferences;
        var zero_places = pref.getPreference(pref.keys.zero_tolerance);
        var places = pref.getPreference(pref.keys.number.rounding_places.auto);
        
        fnFormat = fnFormat || function(x)
        	{
        		if (!isNaN(x))
        		{
        			var diff = parseFloat(x.toFixed(places)) - parseFloat(x.toFixed(zero_places));
	        		var exp = -parseInt(diff.toExponential(places).split("e")[1]);
	        		if (exp > places)
	        			return STAP.Format.formatNumber(x, exp);
	        		else
	        			return STAP.Format.formatNumber(x);
	        	}
	        	else
	        		return x;
	        };
        return ((safenum.compareToWithinTolerance(constant, 0) !== 0) ?
            fnFormat(constant) : constant.toExponential(1)) + " &times; " + fnFormat(base) + "<SUP><EM>x</EM></SUP>";
    },

    // Create HTML suitable for display of RHS of a polynomial regression equation
    // of arbitrary length.  Coefficients are in order of increasing degree.
    polynomialRegEQDisplayHTML: function(coeffs, fnFormat)
    {
        if (!coeffs || (coeffs.length == 0)) return "";

        var safenum = STAP.SafeNumber;
        var pref = STAP.Preferences;
        var zero_places = pref.getPreference(pref.keys.zero_tolerance);
        var places = pref.getPreference(pref.keys.number.rounding_places.auto);

        fnFormat = fnFormat || function(x)
        	{
        		if (!isNaN(x))
        		{
        			var diff = parseFloat(x.toFixed(places)) - parseFloat(x.toFixed(zero_places));
	        		var exp = -parseInt(diff.toExponential(places).split("e")[1]);
	        		if (exp > places)
	        			return STAP.Format.formatNumber(x, exp);
	        		else
	        			return STAP.Format.formatNumber(x);
	        	}
	        	else
	        		return x;
	        };
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
    
    // Hardcoding a few small factorials
    factorialMemo: [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880],
    
    // Memoized version of factorial
    factorial: function(op)
    {
        var map = STAP.Utility.factorialMemo;
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
        var util = STAP.Utility;
        var arr = s.split('/');
        if (arr.length > 1)
            return parseFloat(util.trimString(arr[0])) / parseFloat(util.trimString(arr[1]));
        else
            return parseFloat(s);
    },

	arrayToGraphData: function(arr, attr, nosort)
	{
		if (!nosort)
		{
			arr = arr.slice(0);
			STAP.Utility.sortArrayAscending(arr);
		}
		var retval = [];
		for (var i = 0; i < arr.length; i++)
		{
			var obj = {};
			obj[attr] = +arr[i];
			retval.push(obj);
		}
		return retval;
	},

	arraysTo2DGraphData: function(arrx, arry, xAttr, yAttr)
	{
		var retval = [];
		for (var i = 0; i < arrx.length; i++)
		{
			var obj = {};
			obj[xAttr] = +arrx[i];
			obj[yAttr] = +arry[i];
			retval.push(obj);
		}
		return retval;
	},
	
	normalCurve: function(mean, stdev)
	{
		return function (x) {
			return (1 / stdev / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * Math.pow((x - mean)/stdev, 2));
		};
	},

    // https://stackoverflow.com/questions/55677328/convert-json-to-svg
    JSONToSVG: function(URL, ctlTarget)
    {
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET',URL, true); 
          
        xobj.onreadystatechange = function() {
            if (xobj.readyState == 4 && xobj.status == "200")
            {
                //put the svg inside the target control
                UI.setProperty(ctlTarget, "innerHTML", JSON.parse(this.responseText).pages[0].boxes[1].insideBox);
            }
        };
        xobj.send();        
    }
};

/** FileIO */
// Functions dealing with downloads / uploads (e.g. CSV files, plots)
STAP.FileIO =
{
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
    saveCanvas: function(canvasElement, filename)
    {
        var a = document.createElement('a');
        a.style = "display: none";
        filename = (filename ? filename : "stapplet_plot");
        var imageURI = canvasElement.toDataURL();
        var myBlob = (window.Blob ? STAP.FileIO.base64ToBlob(imageURI.slice(imageURI.indexOf(",") + 1), "image/png") : null);
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
    },

    saveSVG: function(svgElement, filename)
    {
	var svgURL = new XMLSerializer().serializeToString(svgElement);
	var img  = new Image();
	var DOMURL = self.URL || self.webkitURL || self;
	var svg = new Blob([svgURL], {type: "image/svg+xml;charset=utf-8"});
	var url = DOMURL.createObjectURL(svg);
	img.onload = function()
	{
		var canvas = document.createElement('canvas');
		if (this.width && this.height)
	  	{
		    canvas.width = this.width;
		    canvas.height = this.height;
		} else if (svgElement.getAttribute("width") && svgElement.getAttribute("height"))
	    	{
			canvas.setAttribute("height", svgElement.getAttribute("height"));
			canvas.setAttribute("width", svgElement.getAttribute("width"));
	    	} else
	   	{
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
	    	}
	    	canvas.style = "display: none";
	    	document.body.appendChild(canvas);
	    	var ctx = canvas.getContext("2d");
	    	ctx.drawImage(this, 0,0);
		STAP.FileIO.saveCanvas(canvas, filename);
		document.body.removeChild(canvas);
	};
	img.src = url;
    }
};

/** Storage */
// Functions dealing with reads/writes to client storage (for preferences, mainly)
STAP.Storage =
{
    keyBase: "STAP.",
    
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

// Try doing all preferences as dynamic loads.
STAP.Preferences =
{
    version: "1.02", // Note that if you update this, all clients will reload to default
                     // Definitely update if you change the preference tree _structure_
    keys:
        { version: "version",
          number:
          { rounding_type: "number.rounding_type",        // "auto", "fixed" or "precision"
            rounding_places:
            { auto: "number.rounding_places.auto",
              fixed: "number.rounding_places.fixed",
              precision: "number.rounding_places.precision"
            }
          },
          proportion:
          { display_type: "proportion.display_type",        // "proportion" or "percent"
            display_places: "proportion.display_places"
          },
          zero_tolerance: "zero_tolerance",
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
            { display_type: "percent",
              display_places: "3"
            },
          zero_tolerance: "10",
          drawing:
          { dot_radius: "2",
            point_radius: "1",
            bg_color: "#FFFFFF",
            line_color: "#000000",
            fill_color: "#3333FF",
            select_color: "#660000",
            font_size: "14",
            font_face: "Times, serif"
          }
        },

    writeCSSRules: function()
    {
	d3.selectAll("text, .axis, .label")
	  .style("font-family", this.getPreference(this.keys.drawing.font_face))
	  .style("font-size", this.getPreference(this.keys.drawing.font_size) + "px");

	d3.selectAll(".area")
	  .style("stroke-width", "0")
	  .style("fill", this.getPreference(this.keys.drawing.fill_color));

	d3.selectAll(".fillable")
	  .style("stroke", this.getPreference(this.keys.drawing.line_color))
	  .style("fill", this.getPreference(this.keys.drawing.fill_color));

	d3.selectAll(".bkgrect")
	  .style("stroke-width", "0")
	  .style("fill", this.getPreference(this.keys.drawing.bg_color));

	d3.selectAll(".axis path, .axis line")
	  .style("fill", "none")
	  .style("stroke", "#000000")
	  .style("shape-rendering", "crispEdges");
	
	d3.selectAll(".marker")
      .style("fill", "none")
      .style("font-weight", "lighter")
      .style("font-size", "10px");
    },
    
    // Rewrite the client stored preferences to be the defaults coded above.
    // Useful for "Reset preferences to default"
    writeDefaultPreferences: function()
    {
        var stor = STAP.Storage;

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

	this.writeCSSRules();
    },

    validatePreferences: function()
    {
        var version = STAP.Storage.readFromStorage(this.keys.version);
        if (!version || (version != this.version))
                this.writeDefaultPreferences();
        else
        	this.writeCSSRules();
    },

    // Commit the value associated with the key to storage.
    setPreference: function(key, value, bRefreshCSS)
    {
    	var self = this;
        (function recur(a, key, value)
        {
            for (var c in a)
            {
                if (typeof a[c] !== 'string')
                    recur(a[c], key, value);
                else if (a[c] == key)
                {
                    try
                    {
	                    STAP.Storage.writeToStorage(key, value);
		    	    if (bRefreshCSS) self.writeCSSRules();
	            } catch(e) { /* fail silently */ }
                    return;
                }
            }
        })(this.keys, key, value);
    },

    getPreference: function(key)
    {
	var val = null;
	try
	{
	        (function recur(a, key)
	        {
	            for (var c in a)
	            {
	                if (typeof a[c] !== 'string')
	                    recur(a[c], key);
	                else if (a[c] == key)
			    val = STAP.Storage.readFromStorage(key);
	            }
	        })(this.keys, key);
	}
	catch(e)
	{	// cannot read from storage; give the default
		var proparr = key.split(".");
		val = STAP.Preferences.defaults;
		for (var i = 0; i < proparr.length; i++)
			val = val[proparr[i]];
	}
	var valN = parseInt(val, 10);
	return (!isNaN(valN)) ? valN : val;
    },

    // Convenience method for getting zero tolerance
    getZeroTolerance: function()
    {
	return this.getPreference(this.keys.zero_tolerance);
    },
    
    // Convenience method for getting a CSS font descriptor for the preferred font
    getPreferredFontCSS: function()
    {
        return this.getPreference(this.keys.drawing.font_size) + "px " +
		this.getPreference(this.keys.drawing.font_face);
    },
    
    // Singleton instance of a preference DIV node
    preferenceDivNode: null,
    preferencePageOpen: false,
    preferencePageCloseCallback: null,
    
    // Convenience method for launching a preference page as an overlay
    launchPreferencePage: function(fnCloseCallback)
    {
        if (this.preferencePageOpen) return;

        this.preferencePageOpen = true;
        if (fnCloseCallback) preferencePageCloseCallback = fnCloseCallback;
        
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
                        STAP.Preferences.preferenceDivNode = document.createElement("div");
                        STAP.Preferences.preferenceDivNode.className = "modal";
                        STAP.Preferences.preferenceDivNode.innerHTML = req.responseText;
        
                        // Add the markup to the document
                        bodyNode.appendChild(STAP.Preferences.preferenceDivNode);
                        
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
                        STAP.Preferences.preferencePageOpen = false;
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
        if (preferencePageCloseCallback)
        {
            preferencePageCloseCallback();
            preferencePageCloseCallback = null;
        }
    }
};

/** SafeNumber */
// Handles number conversion and comparison
STAP.SafeNumber = 
{
    // What power of 10 is the most significant digit of the argument?
    getPow10: function(val)
    {
        var expForm = val.toExponential(STAP.Preferences.getZeroTolerance());
        return parseInt(expForm.slice(expForm.indexOf("e") + 1), 10);
    },

    // Estimate the power of 10 of the LEAST nonzero digit of a number by using the exponential form.
    getLSPow10: function(val)
    {
        // If the number is zero, return the highest possible value of the least significant place
        if (STAP.SafeNumber.isZeroWithinTolerance(val)) return Number.POSITIVE_INFINITY;

        // Work with the absolute value of the number, since the negative sign will throw off
        // all of our calculations below.
        var expForm = Math.abs(val).toExponential(STAP.Preferences.getZeroTolerance());
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
        var safenum = STAP.SafeNumber;
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
        if (typeof(tol) === "undefined") tol = STAP.Preferences.getZeroTolerance();
        return (Math.abs(val) < Math.pow(10, -tol));
    },

    // Attempt to round numbers within tolerance of 0
    roundWithinTolerance: function(val, tol)
    {
        if (typeof(tol) === "undefined") tol = STAP.Preferences.getZeroTolerance();
        return parseFloat(val.toFixed(tol));
    },

    // Round the given number to the specified level of significance
    roundToSignificance: function(val, places)
    {
        if (!places || (places < 1))
            places = 1;
        return STAP.SafeNumber.roundWithinTolerance(parseFloat(val.toExponential(places - 1)));
    },

    // Truncate the given number to the specified level of significance 
    truncToSignificance: function(val, places)
    {
        var safenum = STAP.SafeNumber;
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
        var safenum = STAP.SafeNumber;
        if (safenum.isZeroWithinTolerance(val)) return 0;

        var retval = safenum.truncToSignificance(val, places);
        if (safenum.compareToWithinTolerance(retval, val) !== 0 && val < 0)
            retval -= Math.pow(10, safenum.getPow10(val) - places + 1);
        return retval;
    },

    // Ceiling the given number to the specified level of significance
    ceilToSignificance: function(val, places)
    {
        var safenum = STAP.SafeNumber;
        if (safenum.isZeroWithinTolerance(val)) return 0;

        var retval = safenum.truncToSignificance(val, places);
        if (safenum.compareToWithinTolerance(retval, val) !== 0 && val > 0)
            retval += Math.pow(10, safenum.getPow10(val) - places + 1);
        return retval;
    },
    
    // Comparator-style function for comparing two floating point values
    compareToWithinTolerance: function(num1, num2, tol)
    {
        if (typeof(tol) === "undefined") tol = STAP.Preferences.getPreference(STAP.Preferences.keys.zero_tolerance);
        return STAP.SafeNumber.roundWithinTolerance(num1 - num2, tol);
    },
    
    // Simply call roundWithinTolerance on an array of numbers
    cleanArray: function(arr)
    {
        for (var i = 0; i < arr.length; i++)
            arr[i] = STAP.SafeNumber.roundWithinTolerance(arr[i]);
    }
};

/** Format */
// Handles number display to client, including preferential formatting of numbers
// to certain numbers of decimal places or as proportions versus percents
STAP.Format =
{
    // Format a proportion as a String according to preferences.
    formatProportion: function(p, overridePlaces)
    {
        var placesDefined = (typeof(overridePlaces) !== "undefined");
        var pref = STAP.Preferences;
        var places = (placesDefined ? overridePlaces : pref.getPreference(pref.keys.proportion.display_places));
        if (pref.getPreference(pref.keys.proportion.display_type) == "proportion")
            return "" + parseFloat(p.toFixed(places));
        else
            return (placesDefined ? STAP.Format.formatPercent(p, overridePlaces) : STAP.Format.formatPercent(p));
    },

    // Format a number as a percent.
    formatPercent: function(p, overridePlaces)
    {
        var placesDefined = (typeof(overridePlaces) !== "undefined");
        var pref = STAP.Preferences;
        var places = (placesDefined ? overridePlaces : pref.getPreference(pref.keys.proportion.display_places));
        if (places > 1) // percent
            return "" + parseFloat((p * 100).toFixed(places - 2)) + "%";
        else
            return "" + parseFloat((p * 100).toPrecision(1)) + "%";
    },
    
    // Format a decimal as a String according to preferences.
    formatNumber: function(num, overridePlaces)
    {
        var placesDefined = (typeof(overridePlaces) !== "undefined");
        var val = STAP.SafeNumber.roundWithinTolerance(num);
        var pref = STAP.Preferences;
    	var rounding_type = pref.getPreference(pref.keys.number.rounding_type);

        if (placesDefined)
            return val.toFixed(overridePlaces);
        else if (rounding_type == "fixed")
            return val.toFixed(pref.getPreference(pref.keys.number.rounding_places.fixed));
        else if (rounding_type == "precision")
            return val.toPrecision(pref.getPreference(pref.keys.number.rounding_places.precision));
        else
            return "" + parseFloat(val.toFixed(pref.getPreference(pref.keys.number.rounding_places.auto)));
    },
    
    // This handles P value display so that extremely small P-values are listed
    // as "< 0.001," for example.
    // FUTURE: Maybe make this tolerance value a preference?
    formatPValueHTML: function(pValue, tol)
    {
        if (typeof tol == "undefined") tol = 0.001;
        return (pValue < tol ? "&lt;" + tol : this.formatNumber(pValue));
    },

	d3NumberFormatter: function()
	{
		if (STAP.Preferences.getPreference(STAP.Preferences.keys.number.rounding_type) == "fixed")
			return d3.format("." + STAP.Preferences.getPreference(STAP.Preferences.keys.number.rounding_places.fixed) + "f");
		else if (STAP.Preferences.getPreference(STAP.Preferences.keys.number.rounding_type) == "precision")
			return d3.format("." + STAP.Preferences.getPreference(STAP.Preferences.keys.number.rounding_places.precision) + "r");
		else // auto
			return d3.format("g");
	},

	d3ProportionFormatter: function()
	{
		var places = STAP.Preferences.getPreference(STAP.Preferences.keys.proportion.display_places);
		return d3.format("." +
			(STAP.Preferences.getPreference(STAP.Preferences.keys.proportion.display_type) == "percent"
				? (places - 2) + "%" 
				: places + "f"));
	}
};

/*
rect.selection {
  cursor: move !important;
  -webkit-touch-callout: none !important;
  -webkit-user-select: none !important;
  -khtml-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  user-select: none !important;
  stroke: #545454;
  stroke-width: 2px;
  stroke-opacity: 1;
  fill: white;
  fill-opacity: 0.5;
}

*/

/** SVGGraph */
STAP.SVGGraph = function(containerID, width, height, minWidth, minHeight)
{
	if (!width) width = 600;
	if (!height) height = 400;

	var self = this;

	this.containerID = containerID;
	this.margin = {top: 20, right: 60, bottom: 40, left: 50};
	this.defaultMargin = {top: 20, right: 60, bottom: 40, left: 50};
	this.width = width - this.margin.left - this.margin.right;
	this.height = height - this.margin.top - this.margin.bottom;

	this.preferredTotalWidth = width;
	this.preferredTotalHeight = height;

    this.minimumWidth = (minWidth ? minWidth : 0);
    this.minimumHeight = (minHeight ? minHeight : 0);

	// add the graph canvas to the body of the webpage
	this.svgID = "svg_" + containerID;
	this.svg = d3.select("#" + containerID).append("svg")
	    .attr("id", this.svgID)
	    .attr("width", this.width + this.margin.left + this.margin.right)
	    .attr("height", this.height + this.margin.top + this.margin.bottom);
	
    this.svgDesc = this.svg.append("desc");
	this.svgDefs = this.svg.append("defs");
	this.viewportClipId = this.svgID + "_viewport";
	this.viewportRect = this.svgDefs.append("clipPath")
		.attr("id", this.viewportClipId)
		.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", this.width)
		.attr("height", this.height);
		
	this.svg = this.svg.append("g")
	    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
	
	this.svgRoot = document.getElementById(this.svgID);

	// add the tooltip area to the webpage
	this.tooltip = d3.select("#" + containerID).append("div")
	    .attr("class", "tooltip")
	    .attr("id", this.svgID + "_tooltip")
	    .style("opacity", 0);

	// set up selection rectangle behavior
	this.selectionRect = {
		element			: null,
		previousElement 	: null,
		currentY		: 0,
		currentX		: 0,
		originX			: 0,
		dragging        : false,
		setElement: function(ele) {
			this.previousElement = this.element;
			this.element = ele;
		},
		getNewAttributes: function() {
			var x = this.currentX<this.originX?this.currentX:this.originX;
			var width = Math.abs(this.currentX - this.originX);
			return {
		        x       : x,
		        y       : 0,
		        width  	: width,
		        height  : self.height
			};
		},
		getCurrentAttributes: function() {
			// use plus sign to convert string into number
			var x = +this.element.attr("x");
			var y = +this.element.attr("y");
			var width = +this.element.attr("width");
			var height = +this.element.attr("height");
			return {
				x1  : x,
			        y1  : y,
			        x2  : x + width,
		        	y2  : y + height
			};
		},
		init: function(newX) {
			var rectElement = self.svg.append("rect")
			    .attr("class", "selection")
			    .attr({
			        rx      : 4,
			        ry      : 4,
			        x       : 0,
			        y       : 0,
			        width   : 0,
			        height  : self.height
			    })
			.style("cursor", "move !important")
			.style("-webkit-touch-callout", "none !important")
			.style("-webkit-user-select", "none !important")
			.style("-khtml-user-select", "none !important")
			.style("-moz-user-select", "none !important")
			.style("-ms-user-select", "none !important")
			.style("user-select", "none !important")
			.style("stroke", "#545454")
			.style("stroke-width", "2px")
			.style("stroke-opacity", "1")
			.style("fill", "white")
			.style("fill-opacity", "0.5");				
			
		        this.setElement(rectElement);
			this.originX = newX;
			this.update(newX);
		},
		update: function(newX, newY) {
			this.currentX = newX;
			this.element.attr(this.getNewAttributes());
		},
		focus: function() {
	        this.element
	            .style("stroke", "#DE695B")
	            .style("stroke-width", "2.5");
	    },
	    remove: function() {
		if (this.element)
		    	this.element.remove();
	    	this.element = null;
	    },
	    removePrevious: function() {
	    	if(this.previousElement) {
	    		this.previousElement.remove();
	    	}
	    }
	};

	this.selectionDragStart = function() {
	    self.selectionRect.dragging = true;
		var p = d3.mouse(self.svg.node());
		self.selectionRect.init(p[0]);
		self.selectionRect.removePrevious();
	};
	
	this.selectionDragMove = function() {
		var p = d3.mouse(self.svg.node());
		self.selectionRect.update(p[0]);
	};
	
	this.selectionDragEnd = function() {
        self.selectionRect.dragging = false;
		var finalAttributes = self.selectionRect.getCurrentAttributes();
		if(finalAttributes.x2 - finalAttributes.x1 > 1 && finalAttributes.y2 - finalAttributes.y1 > 1)
		{
			// range selected
			d3.event.sourceEvent.preventDefault();
			self.selectionRect.focus();
			if (self.selectionCallback) self.selectionCallback(finalAttributes);
		} else {
		        // single point selected
	        	self.selectionRect.remove();
			if (self.unselectionCallback) self.unselectionCallback();	
		}
	};

	this.selectionDragBehavior = d3.behavior.drag()
	    .on("drag", this.selectionDragMove)
	    .on("dragstart", this.selectionDragStart)
	    .on("dragend", this.selectionDragEnd);
};

STAP.SVGGraph.prototype.setSelectionRectangleEnabled = function(bSet)
{		
	if (bSet)
		this.svg.call(this.selectionDragBehavior);
	else
		this.svg.on(".drag", null);
};

STAP.SVGGraph.prototype.forceSelectionRectangle = function(xMin, xMax, bSkipCallback)
{
	var domain = this.xScale.domain();
	if (xMin === null || isNaN(xMin) || xMin < domain[0]) xMin = domain[0];
	if (xMax === null || isNaN(xMax) || xMax > domain[1]) xMax = domain[1];

	this.selectionRect.init(this.xScale(xMin));
	this.selectionRect.removePrevious();
	this.selectionRect.update(this.xScale(xMax));
	this.selectionRect.focus();

	if (!bSkipCallback && this.selectionCallback) this.selectionCallback(this.selectionRect.getCurrentAttributes());
};

STAP.SVGGraph.prototype.clearSelectionRectangle = function()
{
	this.selectionRect.remove();
	if (this.unselectionCallback) this.unselectionCallback();
};

STAP.SVGGraph.prototype.clearGraph = function()
{
    this.svgDesc.html("");
	this.svg.selectAll("*").remove();
	this.clearSelectionRectangle();
	this.setSelectionRectangleEnabled(false);
	var container = document.getElementById(this.containerID);
	var children = container.childNodes;
	var i = 0;
	while (i < children.length)
	{
		var id = children.item(i).id;
		if (id.indexOf(this.svgID) == -1)
			container.removeChild(children.item(i));
		else
			i++;
	}

	d3.select("#" + this.svgID)
		.attr("width", "" + this.preferredTotalWidth)
		.attr("height", "" + this.preferredTotalHeight);

	this.margin.left = this.defaultMargin.left;
	this.margin.top = this.defaultMargin.top;
	this.margin.right = this.defaultMargin.right;
	this.margin.bottom = this.defaultMargin.bottom;	
	this.width = this.preferredTotalWidth - this.margin.left - this.margin.right;
	this.height = this.preferredTotalHeight - this.margin.top - this.margin.bottom;

	this.svg
	    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
	this.viewportRect
		.attr("width", this.width)
		.attr("height", this.height);
};

STAP.SVGGraph.prototype.setMarker = function(xW, capt, col)
{
    if (this.marker) this.clearMarker();
    this.marker = {
        xWorld: xW,
        caption: capt,
        color: (col ? col : "#999999")
    };
};

STAP.SVGGraph.prototype.clearMarker = function()
{
    this.marker = null; 
};

STAP.SVGGraph.prototype.setTitle = function(title)
{
	var titleSelect = this.svg.select(".svgtitle");
	if (titleSelect.empty())
		titleSelect = this.svg.append("g").attr("class", "svgtitle");
	else
		titleSelect.selectAll("*").remove();
	titleSelect.append("text")
	      .attr("x", this.width / 2)
	      .attr("y", -5)
	      .style("text-anchor", "middle")
	      .text(title);
};

STAP.SVGGraph.prototype.drawBackground = function()
{
	// plot the background
	this.svg.append("rect")
		.attr("class", "bkgrect")
	  	.attr("x", 0)
	  	.attr("y", 0)
	  	.attr("width", this.width)
	  	.attr("height", this.height);
};

STAP.SVGGraph.prototype.adjustWidthForLabels = function(xAxis, yAxis, groupArr)
{
	if (xAxis)
	{
		var xTicks = xAxis.tickValues() || xAxis.scale().ticks();
		var formatter = xAxis.tickFormat() || function(x) { return x; };
		var max = 0;
		
		// dry-run drawing each label by making its opacity 0
		for (var i = 0; i < xTicks.length; i++)
		{
			var dry = this.svg.append("text")
			.attr("class", "temp")
			.style("opacity", 0)
			.style("font-family", STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_face))
			.style("font-size", STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size + "px"))
			.text(formatter(xTicks[i]));

			var w = dry[0][0].getBBox().width;
			if (w > max) max = w;
		}
		var expectedWidth = max * xTicks.length * 1.3;
		this.width = Math.max(this.width, expectedWidth);
		this.width = Math.max(this.width, this.minimumWidth);
		xAxis.scale().range([0,this.width]);
		this.svg.selectAll(".temp").remove();
	}
	if (yAxis)
	{
		var yTicks = yAxis.tickValues() || yAxis.scale().ticks();
		var formatter = yAxis.tickFormat() || function(x) { return x; };
		var max = 0;
		
		// dry-run drawing each label by making its opacity 0
		for (var i = 0; i < yTicks.length; i++)
		{
			var dry = this.svg.append("text")
			.attr("class", "temp")
			.style("opacity", 0)
			.style("font-family", STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_face))
			.style("font-size", STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size + "px"))
			.text(formatter(yTicks[i]));

			var w = dry[0][0].getBBox().width;
			if (w > max) max = w;
		}
		this.margin.left = Math.max(this.margin.left, max + 40)	
		this.svg.selectAll(".temp").remove();
	}
	if (groupArr)
	{
		var max = 0;
		
		// dry-run drawing each label by making its opacity 0
		for (var i = 0; i < groupArr.length; i++)
		{
			var dry = this.svg.append("text")
			.attr("class", "temp")
			.style("opacity", 0)
			.style("font-family", STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_face))
			.style("font-size", STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size + "px"))
			.text(groupArr[i]);

			var w = dry[0][0].getBBox().width;
			if (w > max) max = w;
		}
		this.margin.right = Math.max(this.margin.right, max + 5);
		this.svg.selectAll(".temp").remove();
	}
	d3.select("#" + this.svgID)
		.attr("width", "" + (this.width + this.margin.left + this.margin.right));	
	this.svg
	    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");	
	this.viewportRect
		.attr("width", this.width)
		.attr("height", this.height);
};

STAP.SVGGraph.prototype.dotplot = function(data, xAttr, caseAttr, bAllowCount, bIsRelative, forceDomainArr, forceDotSize)
{
	var self = this;
	var dataMap = {};

    // If a selection rectangle exists on this plot, pull its info and the scale first
    var oldSelectionWorldAttr = null;
    if (this.selectionRect.element)
    {
        var rectAttr = this.selectionRect.getCurrentAttributes();
        var oldWorldWidth = this.xScale.domain()[1] - this.xScale.domain()[0];
        oldSelectionWorldAttr = {
            x1: (this.xScale.domain()[0] + rectAttr.x1 / this.width * oldWorldWidth),
            x2: (this.xScale.domain()[0] + rectAttr.x2 / this.width * oldWorldWidth)
        };
    }

	// remove any old items
	this.clearGraph();

	/* 
	 * value accessor - returns the value to encode for a given data object.
	 * scale - maps value to a visual display encoding, such as a pixel position.
	 * map function - maps from data value to display value
	 * axis - sets up axis
	 */ 
	
	// setup x 
	var xValue = function(d) { return d[xAttr];}, // data -> value
	    xScale = d3.scale.linear().range([0, this.width]), // value -> display
	    xMap = function(d) { return xScale(xValue(d));}, // data -> display
	    xAxis = d3.svg.axis().outerTickSize(0).scale(xScale).orient("bottom");
	
	// setup y
	var yValue = function(d) { return d.Count;}, // data -> value
	    yScale = d3.scale.linear().range([this.height, 0]), // value -> display
	    yMap = function(d) { return yScale(yValue(d));}, // data -> display
	    yAxis = d3.svg.axis().scale(yScale).orient("left");

	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;
		
	this.currentData = data;

	data.forEach(function(d) { d.dataValue = d[xAttr]; });

	// do not want dots overlapping axis, so add in buffer to data domain
	var dot_buffer = 0.02 *
	    (forceDomainArr ? (forceDomainArr[1] - forceDomainArr[0]) : (data[data.length - 1].dataValue - data[0].dataValue));
	if (dot_buffer == 0) dot_buffer = 1;
	if (forceDomainArr)
	    xScale.domain([forceDomainArr[0] - dot_buffer,
	                  forceDomainArr[1] + dot_buffer]);
	else
    	xScale.domain([data[0].dataValue - dot_buffer, data[data.length - 1].dataValue + dot_buffer]);
	
	// Wilkinson 1999 (American Statistician) binning algorithm
	// Start out with a dot diameter that should not take up less than 4 or more than 8 units on screen (using default preferences);
	// diameter should be a good guess for a normally-distributed set of data
	var minDotSize = 2 * parseFloat(STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.dot_radius));
	var maxDotSize = 2 * minDotSize;

	var wilk_h = Math.max(Math.min(xScale.invert(maxDotSize + xScale(0)), 1 / (minDotSize * Math.sqrt(data.length))),
				xScale.invert(minDotSize + xScale(0)));
	var wilk_v = function(left, right){
			var prevval = (left > 0 ? data[left - 1].dataValue : Number.NEGATIVE_INFINITY);
			var leftval = data[left].dataValue;
			var rightval = data[right].dataValue;
			if ((leftval - prevval) > wilk_h )			
				return (rightval - leftval) / 2;
			else
				return 0;
		};

	var curr_index = 0;
	var max_count = 0;
	var min_diff = Number.POSITIVE_INFINITY;
	while (curr_index < data.length)
	{
		// First dot in stack is smallest item yet to be considered.
		var stack_base = data[curr_index].dataValue;
		data[curr_index].Count = 1;
		
		// Find number of data values within wilk_h of this current value.
		var stack_outer_index = curr_index;
		while ((stack_outer_index + 1) < data.length && (data[stack_outer_index + 1].dataValue - stack_base) < wilk_h )
			stack_outer_index++;
			
		// Plot the entire stack either at the original value or
		// offset by the average of the lowest and highest values if there is room
		var offset = wilk_v(curr_index, stack_outer_index);
		var counter = 1;

		var diff = (curr_index == 0 ? Number.POSITIVE_INFINITY : (stack_base + offset) - data[curr_index - 1][xAttr]);
		if (diff < min_diff) min_diff = diff;
		while (curr_index <= stack_outer_index)
		{
			data[curr_index][xAttr] = stack_base + offset;
			data[curr_index++].Count = counter++;		
		}
		counter--;
		if (counter > max_count) max_count = counter;
	}	

	// The dot algorithm may make bad decisions for skewed or sparse data;
	// adjust for this, but not to make the dots too big (they already cannot be too small).
	diam = Math.max(xScale(wilk_h) - xScale(0), 0.9 * (xScale(min_diff) - xScale(0)));
	if (diam > maxDotSize || isNaN(diam)) diam = maxDotSize;

	// Compress dots if the stacks would be too high and make final adjustment to y domain
	if (this.height / (max_count + 2) < diam)
		diam = this.height / (max_count + 2);	

    this.suggestedDotDiameter = diam;
    if (forceDotSize) diam = forceDotSize;

	// Make the dotplot smaller to accommodate a disparity in height
	if (diam * (max_count + 2) < 0.9 * this.height)
	{
	    var proposedHeight = diam * (max_count + 2);
	    if (proposedHeight > this.minimumHeight)
	    {
    		this.height = diam * (max_count + 2);
    		yScale.range([this.height, 0]);
    		d3.select("#" + this.svgID)
    			.attr("height", "" + (this.height + this.margin.top + this.margin.bottom));
	    }
	}
	yScale.domain([0, Math.max(this.height / diam, max_count + 2)]);

    this.dotDiameter = diam;

	xAxis.tickFormat(
		(bIsRelative ? format.d3ProportionFormatter() : format.d3NumberFormatter())
	);

	var xTicks = xAxis.scale().ticks();
	STAP.SafeNumber.cleanArray(xTicks);
	xAxis.tickValues(xTicks);
	this.adjustWidthForLabels(xAxis);

	// plot the background
	this.drawBackground();

	// x-axis
	this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis)
	    .append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 2)
	      .attr("y", this.margin.bottom - 5)
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(xAttr);

	// draw dots
	this.svg.selectAll(".fillable")
	.data(data)
	.enter().append("circle")
	.attr("class", "fillable")
	.attr("r", diam / 2)
	.attr("cx", xMap)
	.attr("cy", yMap)
	.on("mouseover", function(d) {
	  self.tooltip.transition()
	       .duration(200)
	       .style("opacity", .9);
	  var tooltip_text = STAP.Format.formatNumber(d.dataValue);
	 if (caseAttr)
	 {       
	   var casetext = (typeof d[caseAttr] == "number") ? STAP.Format.formatNumber(d[caseAttr]) : STAP.Utility.trimString(d[caseAttr]);
	   tooltip_text = casetext + ": " + tooltip_text;
	 }
	  self.tooltip.html(tooltip_text)
	       .style("left", (d3.event.pageX + 5) + "px")
	       .style("top", (d3.event.pageY - 28) + "px");
	})
	.on("mouseout", function(d) {
	  self.tooltip.transition()
	       .duration(500)
	       .style("opacity", 0);
	});

/* disabled temporarily to check for performance
    // populate the desc element
    var formatter = format.formatNumber;
    var deschtml = "The figure shows a dot plot. The horizontal axis is labeled " + xAttr;

    var numticks = xScale.ticks().length;
    if (numticks > 1)
        deschtml += " and is marked from a value of " + formatter(xScale.ticks()[0]) + " to a value of " + formatter(xScale.ticks()[numticks - 1]) + " in intervals of " + formatter(xScale.ticks()[1] - xScale.ticks()[0]) + ". ";
    else
        deschtml += " and runs from a value of " + formatter(xScale.domain()[0]) + " to a value of " + formatter(xScale.domain()[1]) + ". ";
    for (var i = 0; i < data.length; i++)
    {
        var baseval = data[i][xAttr];
        while (i < (data.length - 1) && !STAP.SafeNumber.compareToWithinTolerance(data[i][xAttr],data[i+1][xAttr])) i++;
        if (data[i].Count )
        deschtml += "At a value of " + baseval + " there " + ((data[i].Count === 1) ? "is 1 dot. " : "are " + data[i].Count + " dots. ");
    }
    this.svgDesc.html(deschtml);
*/

    // marker
    if (this.marker)
    {
        var xMarkDisp = xScale(this.marker.xWorld);

    	this.svg.append("line")
    		.attr("x1", xMarkDisp)
    		.attr("y1", 0)
    		.attr("x2", xMarkDisp)
    		.attr("y2", this.height)
    	        .style("stroke", this.marker.color);

        if (this.marker.caption)
        {
        	this.svg.append("text")
        	  .attr("class","marker")
              .attr("x", xMarkDisp + 2)
    	      .attr("y", 0)
    	      .attr("dy", "0.71em")
    	      .attr("text-anchor", "begin")
              .style("stroke", this.marker.color)
    	      .text(this.marker.caption);
        }
    }

	STAP.Preferences.writeCSSRules();

	if (bAllowCount)
	{
		var countSpanID = this.containerID + "SpnCountMsg";
		this.selectionCallback = function(finalAttributes) {
			if (self.currentData)
			{
				var sel = 0;
				self.currentData.forEach(function(d){
					var x = xScale(d[xAttr]);
					if ((x <= finalAttributes.x2) && (x >= finalAttributes.x1)) sel++;
				});
				
				if (!document.getElementById(countSpanID))
				
						d3.select("#" + self.containerID)
						  .append("span")
						  .attr("id", countSpanID);
				
				document.getElementById(countSpanID).innerHTML = "<BR>There " +
					(sel == 1 ? "is " : "are ") + sel + (sel == 1 ? " dot" : " dots") + " (" +
				 	STAP.Format.formatPercent(sel / self.currentData.length)
					+ ") in the selected region.";
			}	
		};
	
		this.unselectionCallback = function() {
				if (document.getElementById(countSpanID))
					document.getElementById(countSpanID).innerHTML = "";
		};
	
		this.setSelectionRectangleEnabled(true);
		
		if (oldSelectionWorldAttr)
		{
		    this.selectionRect.init(xScale(oldSelectionWorldAttr.x1));
		    this.selectionRect.update(xScale(oldSelectionWorldAttr.x2));
		    this.selectionRect.focus();
		    this.selectionCallback(this.selectionRect.getCurrentAttributes());
		}
	}
};

STAP.SVGGraph.prototype.CSVtoDotplot = function(csvURL, xAttr, caseAttr, errMsgCtlID)
{
	var self = this;
	d3.csv(csvURL, function(error, data) {
		if (data)
		{			  
			STAP.UIHandlers.setProperty(errMsgCtlID, "innerHTML", "");
			data.forEach(function(d){d.dataValue = parseFloat(d[xAttr]);});
			STAP.Utility.sortArrayAscendingByProperty(data, "dataValue");
			self.dotplot(data, xAttr, caseAttr);
		}
		else
			STAP.UIHandlers.setProperty(errMsgCtlID, "innerHTML", "An error occurred: " + error);
	});
};

STAP.SVGGraph.prototype.parallelDotplot = function(dataArr, groupNameArr, xAttr, caseAttr)
{
	var self = this;

	// remove any old items
	this.clearGraph();

	/* 
	 * value accessor - returns the value to encode for a given data object.
	 * scale - maps value to a visual display encoding, such as a pixel position.
	 * map function - maps from data value to display value
	 * axis - sets up axis
	 */ 
	
	// setup x 
	var xValue = function(d) { return d[xAttr];}, // data -> value
	    xScale = d3.scale.linear().range([0, this.width]), // value -> display
	    xMap = function(d) { return xScale(xValue(d));}, // data -> display
	    xAxis = d3.svg.axis().outerTickSize(0).scale(xScale).orient("bottom");

	// Begin by making the graph height 33% larger for every additional graph
	var targetheight = this.preferredTotalHeight * (2 + dataArr.length) / 3;
	targetheight = Math.max(targetheight, this.minimumHeight);
	this.height = targetheight - this.margin.top - this.margin.bottom;	
	d3.select("#" + this.svgID)
	.attr("height", "" + (this.height + this.margin.top + this.margin.bottom));
	
	// setup y
	var yOffset = this.height / dataArr.length;
	var yValue = function(d) { return d.Count;}, // data -> value
	    yScale = d3.scale.linear().range([yOffset, 0]), // value -> display
	    yMap = function(d) { return yScale(yValue(d));}, // data -> display
	    yAxis = d3.svg.axis().scale(yScale).orient("left");

	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;
		
	var global_max_count = 0;
	var global_min_diff = Number.POSITIVE_INFINITY;
	var min_wilk_h = Number.POSITIVE_INFINITY;

	// do not want dots overlapping axis, so add in buffer to data domain
	var allData = dataArr[0];
	var concatIndex = 1;
	while (dataArr.length > concatIndex) allData = allData.concat(dataArr[concatIndex++]);
	var all_min = d3.min(allData, function(d) { return d[xAttr]; });
	var all_max = d3.max(allData, function(d) { return d[xAttr]; });
	this.currentData = allData;

	var dot_buffer = 0.02 * (all_max - all_min);
	if (dot_buffer == 0) dot_buffer = 1;
	xScale.domain([all_min - dot_buffer, all_max + dot_buffer]);
		
	dataArr.forEach(function(data)
	{
		data.forEach(function(d) { d.dataValue = d[xAttr]; });
	
		// Wilkinson 1999 (American Statistician) binning algorithm
		// Start out with a dot diameter that should not take up less than 4 or more than 8 units on screen;
		// diameter should be a good guess for a normally-distributed set of data
		var wilk_h = Math.max(Math.min(xScale.invert(8 + xScale(0)), 1 / (4 * Math.sqrt(data.length))),
					xScale.invert(4 + xScale(0)));
		var wilk_v = function(left, right){
				var prevval = (left > 0 ? data[left - 1].dataValue : Number.NEGATIVE_INFINITY);
				var leftval = data[left].dataValue;
				var rightval = data[right].dataValue;
				if ((leftval - prevval) > wilk_h )			
					return (rightval - leftval) / 2;
				else
					return 0;
			};
	
		var curr_index = 0;
		var max_count = 0;
		var min_diff = Number.POSITIVE_INFINITY;
		while (curr_index < data.length)
		{
			// First dot in stack is smallest item yet to be considered.
			var stack_base = data[curr_index].dataValue;
			data[curr_index].Count = 1;
			
			// Find number of data values within wilk_h of this current value.
			var stack_outer_index = curr_index;
			while ((stack_outer_index + 1) < data.length && (data[stack_outer_index + 1].dataValue - stack_base) < wilk_h )
				stack_outer_index++;
				
			// Plot the entire stack either at the original value or
			// offset by the average of the lowest and highest values if there is room
			var offset = wilk_v(curr_index, stack_outer_index);
			var counter = 1;
	
			var diff = (curr_index == 0 ? Number.POSITIVE_INFINITY : (stack_base + offset) - data[curr_index - 1][xAttr]);
			if (diff < min_diff) min_diff = diff;
			while (curr_index <= stack_outer_index)
			{
				data[curr_index][xAttr] = stack_base + offset;
				data[curr_index++].Count = counter++;		
			}
			counter--;
			if (counter > max_count) max_count = counter;
		}

		if (min_diff < global_min_diff) global_min_diff = min_diff;
		if (max_count > global_max_count) global_max_count = max_count;
		if (wilk_h < min_wilk_h) min_wilk_h = wilk_h;
	});
	
	// The dot algorithm may make bad decisions for skewed or sparse data;
	// adjust for this, but not to make the dots too big (they already cannot be too small).
	var diam = Math.max(xScale(min_wilk_h) - xScale(0), 0.9 * (xScale(global_min_diff) - xScale(0)));
	if (diam > 8 || isNaN(diam)) diam = 8;

	// Compress dots if the stacks would be too high and make final adjustment to y domain
	if (yOffset / (global_max_count + 2) < diam)
		diam = yOffset / (global_max_count + 2);	

	var graph_margin = 30;
	// Make the dotplot smaller to accommodate a disparity in height
	if (diam * (global_max_count + 2) < 0.9 * yOffset)
	{
		yOffset = diam * (global_max_count + 2);
		yScale.range([yOffset, 0]);
		var proposedHeight = yOffset * dataArr.length + graph_margin * (dataArr.length - 1);
		if (proposedHeight > this.minimumHeight)
		{
    		this.height = proposedHeight;
	    	d3.select("#" + this.svgID)
		    	.attr("height", "" + (this.height + this.margin.top + this.margin.bottom));
		}
	}
	yScale.domain([0, Math.max(yOffset / diam, global_max_count + 2)]);

	xAxis.tickFormat(format.d3NumberFormatter());
	var xTicks = xAxis.scale().ticks();
	STAP.SafeNumber.cleanArray(xTicks);
	xAxis.tickValues(xTicks);
	this.adjustWidthForLabels(xAxis, null, groupNameArr);

	// plot the background
	this.drawBackground();

	var plot_index = 0;
	var yBase = 0;
	dataArr.forEach(function(data, group_index)
	{
		  var axis = self.svg.append("g")
		      .attr("class", "axis axis--x")
		      .attr("transform", "translate(0," + (yBase + yOffset) + ")")
		      .call(xAxis)
		    .append("text")
		      .attr("class", "label")
		      .attr("x", self.width / 2)
		      .attr("y", self.margin.bottom - 5)
		      .style("font-weight", "bold");
	
		 if (plot_index == dataArr.length - 1)
		      axis.style("text-anchor", "middle").text(xAttr);

		// draw dots
		data.forEach(function(d)
		{
			self.svg.append("circle")
			.attr("class", "fillable")
			.attr("r", diam / 2)
			.attr("cx", xMap(d))
			.attr("cy", yMap(d) + yBase)
			.on("mouseover", function() {
			  self.tooltip.transition()
			       .duration(200)
			       .style("opacity", .9);
			  var tooltip_text = STAP.Format.formatNumber(d.dataValue);
			 if (caseAttr)
			 {       
			   var casetext = (typeof d[caseAttr] == "number") ? STAP.Format.formatNumber(d[caseAttr]) : STAP.Utility.trimString(d[caseAttr]);
			   tooltip_text = casetext + ": " + tooltip_text;
			 }
			  self.tooltip.html(tooltip_text)
			       .style("left", (d3.event.pageX + 5) + "px")
			       .style("top", (d3.event.pageY - 28) + "px");
			})
			.on("mouseout", function() {
			  self.tooltip.transition()
			       .duration(500)
			       .style("opacity", 0);

            // marker
            if (self.marker)
            {
                var xMarkDisp = xMap(self.marker.xWorld);
        
            	self.svg.append("line")
            		.attr("x1", xMarkDisp)
            		.attr("y1", yBase)
            		.attr("x2", xMarkDisp)
            		.attr("y2", yBase + yOffset)
            	        .style("stroke", this.marker.color);
        
                if (self.marker.caption)
                {
                	self.svg.append("text")
                	  .attr("class","marker")
            	      .attr("transform", "translate(" + xMarkDisp + ", " + this.height + ") rotate(-90)")
                      .attr("x", yBase + yOffset)
            	      .attr("y", 2)
            	      .attr("dy", "0.71em")
            	      .attr("text-anchor", "end")
                      .style("stroke", self.marker.color)
            	      .text(self.marker.caption);
                }
            }
			});
		});

		self.svg.append("text")
		.attr("transform", "translate(" + self.width
						+ "," + (yBase + yOffset + 5)
						+ ")")
		.attr("class", "label")
		.text(groupNameArr[group_index]);
				
		yBase += yOffset + graph_margin;
		plot_index++;
	});

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.binomialHistogram = function(n, p)
{
	var self = this;
	var xAttr = "# of Successes";
	var yAttr = "Probability";

	this.clearGraph();

	// setup x 
	var xScale = d3.scale.linear().range([0, this.width]), // value -> display
	    xAxis = d3.svg.axis().outerTickSize(0).scale(xScale).orient("bottom");
	
	// setup y
	var yScale = d3.scale.linear().range([this.height, 0]), // value -> display
	    yAxis = d3.svg.axis().outerTickSize(0).scale(yScale).orient("left");

    if (n <= 5)
    {
        var tickArray = [];
        for (var i = 0; i <= n; i++)
            tickArray.push(i);
        xAxis.tickValues(tickArray);
    }
    xAxis.tickFormat(d3.format("d"));
    
	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;

	var data = STAP.Statistics.binomialProbabilityDistribution(n, p);
	this.currentData = data;

	xScale.domain([-0.5, n + 0.5]);
	yScale.domain([0, d3.max(data, function(d) { return d.px; })]);

	this.adjustWidthForLabels(xAxis, yAxis);

	this.drawBackground();
	
	  this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis)
	    .append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 2)
	      .attr("y", this.margin.bottom - 5)
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(xAttr);

	var verticaloffset = parseInt(STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size)) / 2 - 2;
	  this.svg.append("g")
	      .attr("class", "axis axis--y")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "translate(-" + (this.margin.left + verticaloffset) + ", " + (this.height / 2) + ") rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "0.71em")
	      .attr("text-anchor", "end")
	      .style("font-weight", "bold")
	      .text(yAttr);

	var barWidth = xScale(0.5) - xScale(-0.5);

	  this.svg.selectAll(".fillable")
	    .data(data)
	    .enter().append("rect")
	      .attr("class", "fillable")
	      .attr("x", function(b) { return xScale(b.x - 0.5); })
	      .attr("y", function(b) { return yScale(b.px); })
	      .attr("width", function(b) { return barWidth;})
	      .attr("height", function(b) { return self.height - yScale(b.px); })
	.on("mouseover", function(b) {
	  self.tooltip.transition()
	       .duration(200)
	       .style("opacity", .9);
	  var tooltip_text = "P(x = " + b.x + ") "
				+ (STAP.SafeNumber.isZeroWithinTolerance(b.px, 4)
					? " &asymp; 0"
					: " = " + STAP.Format.formatProportion(b.px, 4));
	  self.tooltip.html(tooltip_text)
	       .style("left", (d3.event.pageX + 5) + "px")
	       .style("top", (d3.event.pageY - 28) + "px");
	})
	.on("mouseout", function(b) {
	  self.tooltip.transition()
	       .duration(500)
	       .style("opacity", 0);
	});	

	STAP.Preferences.writeCSSRules();

	var probSpanID = this.containerID + "BinomProbMsg";
	this.selectionCallback = function(finalAttributes) {
		if (self.currentData)
		{
			var min = Math.max(0, Math.round(self.xScale.invert(finalAttributes.x1)));
			var max = Math.min(self.currentData.length - 1, Math.round(self.xScale.invert(finalAttributes.x2)));
			var newleft = min - 0.5;
			var newright = max + 0.5;
			self.forceSelectionRectangle(newleft, newright, true);

			var sum = 0;
			for (var i = min; i <= max; i++) sum += self.currentData[i].px;

			if (!document.getElementById(probSpanID))
			
					d3.select("#" + self.containerID)
					  .append("span")
					  .attr("id", probSpanID);
			var numtext = (STAP.SafeNumber.isZeroWithinTolerance(sum, 4) ? "&asymp; 0"			
						: " = " + STAP.Format.formatProportion(sum, 4));
			if (min == max)
				document.getElementById(probSpanID).innerHTML = "<BR>P(x = " + min +
					") " + numtext;
			else
				document.getElementById(probSpanID).innerHTML = "<BR>P(" + min + " &le; x &le; " + max +
					") " + numtext;
		}	
	};

	this.unselectionCallback = function() {
			if (document.getElementById(probSpanID))
				document.getElementById(probSpanID).innerHTML = "";
	};

	this.setSelectionRectangleEnabled(true);
};

STAP.SVGGraph.prototype.discreteProbabilityHistogram = function(data, xAttr)
{
	var self = this;
	var yAttr = "Probability";

	// remove any old items
	this.clearGraph();

	// setup x 
	var xScale = d3.scale.linear().range([0, this.width]), // value -> display
	    xAxis = d3.svg.axis().outerTickSize(0).scale(xScale).orient("bottom");
	
	// setup y
	var yScale = d3.scale.linear().range([this.height, 0]), // value -> display
	    yAxis = d3.svg.axis().outerTickSize(0).scale(yScale).orient("left");

	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;
		
	this.currentData = data;

	var min = data[0].x;
	var max = data[data.length - 1].x;
	var range = max - min;

	var floatgcd = function(a, b)
	{
		var safenum = STAP.SafeNumber;
		var low = Math.min(a, b);
		var high = Math.max(a, b);
		
		var rem = safenum.roundWithinTolerance(high - low * Math.floor(high / low));
		while (!STAP.SafeNumber.isZeroWithinTolerance(rem))
		{
			var newlow = Math.min(low, rem);
			var newhigh = Math.max(low, rem);
			
			low = newlow;
			high = newhigh;
			rem = safenum.roundWithinTolerance(high - low * Math.floor(high / low));
		}
		return low;
	};
	
	var leastDiff = Number.POSITIVE_INFINITY;
	var barwidth;
	var prevDiff;
	for (var i = 1; i < data.length; i++)
	{
		var diff = data[i].x - data[i - 1].x;
		if (diff < leastDiff) leastDiff = diff;
		if (typeof barwidth == "undefined")
			barwidth = diff;
		else
			barwidth = floatgcd(barwidth, diff);		
		
		if (typeof prevDiff == "undefined")
			prevDiff = diff;
	}
	if (typeof barwidth == "undefined")
	{
		if (data.length == 1)
		{
			barwidth = 0.4;
			xScale.domain([data[0].x - 1, data[0].x + 1]);
		}
		else
			return;
	}
	else
		xScale.domain([min, max]).nice();

	var bins = [];
	var maxprob = 0;
	
	data.forEach(function (d) {
			var bin = { left: d.x - barwidth / 2,
				    right: d.x + barwidth / 2,
				    height: d.px };
			bins.push(bin);
			if (bin.height > maxprob) maxprob = bin.height;
		}
	);

	xScale.domain([bins[0].left, bins[bins.length - 1].right]).nice();	
	// Now set the maximum height to be that of the tallest bar
	yScale.domain([0, maxprob]);

	xAxis.tickFormat(STAP.Format.d3NumberFormatter());
	yAxis.tickFormat(STAP.Format.d3ProportionFormatter());
	this.adjustWidthForLabels(xAxis, yAxis);

	this.drawBackground();
	
	  this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis)
	    .append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 2)
	      .attr("y", this.margin.bottom - 5)
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(xAttr);
	
	var verticaloffset = parseInt(STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size)) / 2 - 2;
	  this.svg.append("g")
	      .attr("class", "axis axis--y")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "translate(-" + (this.margin.left + verticaloffset) + ", " + (this.height / 2) + ") rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "0.71em")
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(yAttr);

	  this.svg.selectAll(".fillable")
	    .data(bins)
	    .enter().append("rect")
	      .attr("class", "fillable")
	      .attr("x", function(b) { return xScale(b.left); })
	      .attr("y", function(b) { return yScale(b.height); })
	      .attr("width", function(b) { return xScale(b.right) - xScale(b.left);})
	      .attr("height", function(b) { return self.height - yScale(b.height); })
	.on("mouseover", function(b) {
	  self.tooltip.transition()
	       .duration(200)
	       .style("opacity", .9);

	var numtext = (STAP.SafeNumber.isZeroWithinTolerance(parseFloat(STAP.Format.formatProportion(b.height))) ? "&asymp; 0"			
				: "= " + STAP.Format.formatProportion(b.height));

	  var tooltip_text = "P(" + STAP.Format.formatNumber(b.left) + " &le; x < "
				+ STAP.Format.formatNumber(b.right) + ") " + numtext;
	  self.tooltip.html(tooltip_text)
	       .style("left", (d3.event.pageX + 5) + "px")
	       .style("top", (d3.event.pageY - 28) + "px");
	})
	.on("mouseout", function(b) {
	  self.tooltip.transition()
	       .duration(500)
	       .style("opacity", 0);
	});	

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.histogram = function(data, xAttr, bRelative, binWidth, firstBin)
{
	var self = this;
	var yAttr = (bRelative ? "Relative Frequency" : "Frequency");

	// remove any old items
	this.clearGraph();
	
	// setup x 
	var xScale = d3.scale.linear().range([0, this.width]), // value -> display
	    xAxis = d3.svg.axis().outerTickSize(0).scale(xScale).orient("bottom");
	
	// setup y
	var yScale = d3.scale.linear().range([this.height, 0]), // value -> display
	    yAxis = d3.svg.axis().outerTickSize(0).scale(yScale).orient("left");

	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;
		
	this.currentData = data;

	var rawData = [];
	data.forEach(function(d) { rawData.push(d[xAttr]); });

	// do not want bars overlapping axis, so add in buffer to data domain
	var buffer = 0.02 * (data[data.length - 1][xAttr] - data[0][xAttr]);
	xScale.domain([data[0][xAttr] - buffer, data[data.length - 1][xAttr] + buffer]);

	// default: both binWidth and firstBin are undefined;
	// bin data roughly according to graph ticks
	// Sturge/s rule: 1 + log_2(n)
	var optbins = 1 + Math.log(data.length) / Math.log(2);
	var binBounds = xScale.ticks(optbins);

	// If a binwidth is specified, slide the bars on over
	if (typeof binWidth != "number") binWidth = binBounds[1] - binBounds[0];

	if (typeof firstBin != "number") firstBin = binBounds[0];
	
	while (firstBin > data[0][xAttr]) firstBin -= binWidth;
	while ((firstBin + binWidth) < data[0][xAttr]) firstBin += binWidth;
	binBounds = [firstBin];

	while (binBounds[binBounds.length - 1] <= data[data.length - 1][xAttr])
		binBounds.push(binBounds[binBounds.length - 1] + binWidth);

	// do not want bars overlapping axis, so add in buffer to data domain
	buffer = 0.02 * (binBounds[binBounds.length - 1] - binBounds[0]);
	xScale.domain([binBounds[0] - buffer, binBounds[binBounds.length - 1] + buffer]);
	xAxis.tickValues(binBounds);
	
	var bins = [];
	var dataIndex = 0;
	var maxHeight = 0;
	for (var i = 0; i < binBounds.length - 1; i++)
	{
		var bin =
		{ left: binBounds[i],
		  right: binBounds[i+1],
		  height: 0 };
		while (dataIndex < data.length && data[dataIndex][xAttr] < bin.right)
		{
			bin.height++;
			dataIndex++;
		}
		bins.push(bin);
		if (bRelative) bin.height /= data.length;
		if (bin.height > maxHeight) maxHeight = bin.height;
	}

	// Now set the maximum height to be that of the tallest bar
	yScale.domain([0, maxHeight]);

	xAxis.tickFormat(format.d3NumberFormatter());
	if (bRelative)
		yAxis.tickFormat(STAP.Format.d3ProportionFormatter());
	else
		yAxis.tickFormat(d3.format("d"));
	var xTicks = xAxis.scale().ticks();
	STAP.SafeNumber.cleanArray(xTicks);
	xAxis.tickValues(xTicks);
	this.adjustWidthForLabels(xAxis, yAxis);

	this.drawBackground();
	
	  this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis)
	    .append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 2)
	      .attr("y", this.margin.bottom - 5)
	      .style("font-weight", "bold")
	      .style("text-anchor", "middle")
	      .text(xAttr);

	var verticaloffset = parseInt(STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size)) / 2 - 2;
	
	  this.svg.append("g")
	      .attr("class", "axis axis--y")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "translate(-" + (this.margin.left + verticaloffset) + ", " + ((this.height - this.margin.bottom) / 2) + ") rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "0.71em")
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(yAttr);

	var w = binBounds[1] - binBounds[0];

	  this.svg.selectAll(".fillable")
	    .data(bins)
	    .enter().append("rect")
	      .attr("class", "fillable")
	      .attr("x", function(b) { return xScale(b.left); })
	      .attr("y", function(b) { return yScale(b.height); })
	      .attr("width", function(b) { return xScale(b.right) - xScale(b.left);})
	      .attr("height", function(b) { return self.height - yScale(b.height); })
	.on("mouseover", function(b) {
	  self.tooltip.transition()
	       .duration(200)
	       .style("opacity", .9);
	  var tooltip_text = STAP.Format.formatNumber(b.left) + " &le; x < "
				+ STAP.Format.formatNumber(b.right) + ": "
				+ (bRelative ? STAP.Format.formatProportion(b.height) : STAP.Format.formatNumber(b.height));
	  self.tooltip.html(tooltip_text)
	       .style("left", (d3.event.pageX + 5) + "px")
	       .style("top", (d3.event.pageY - 28) + "px");
	})
	.on("mouseout", function(b) {
	  self.tooltip.transition()
	       .duration(500)
	       .style("opacity", 0);
	});	

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.parallelHistogram = function(dataArr, groupNameArr, xAttr, bRelative, binWidth, firstBin)
{
	var graph_margin = 30;
	var self = this;
	var yAttr = (bRelative ? "Relative Frequency" : "Frequency");

	// remove any old items
	this.clearGraph();
	
	// setup x 
	var xScale = d3.scale.linear().range([0, this.width]), // value -> display
	    xAxis = d3.svg.axis().outerTickSize(0).scale(xScale).orient("bottom");

	// setup y
	// Make the graph height 33% larger for every additional graph
	var targetheight = this.preferredTotalHeight * (2 + dataArr.length) / 3
	this.height = targetheight - this.margin.top - this.margin.bottom;	
	d3.select("#" + this.svgID)
	.attr("height", "" + (this.height + this.margin.top + this.margin.bottom));

	var graph_height = (this.height - (dataArr.length - 1) * graph_margin) / dataArr.length;
	var yScale = d3.scale.linear().range([graph_height, 0]); // value -> display
	    yAxis = d3.svg.axis().outerTickSize(0).scale(yScale).orient("left");

	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;
		
	// do not want bars overlapping axis, so add in buffer to data domain
	var allData = dataArr[0];
	var concatIndex = 1;
	while (dataArr.length > concatIndex) allData = allData.concat(dataArr[concatIndex++]);
	var all_min = d3.min(allData, function(d) { return d[xAttr]; });
	var all_max = d3.max(allData, function(d) { return d[xAttr]; });
	this.currentData = allData;

	// first pass at scale
	var buffer = 0.02 * (all_max - all_min);
	xScale.domain([all_min - buffer, all_max + buffer]);

	// default: both binWidth and firstBin are undefined;
	// bin data roughly according to graph ticks
	// Sturge/s rule: 1 + log_2(n)
	var optbins = 1 + Math.log(allData.length) / Math.log(2);
	var binBounds = xScale.ticks(optbins);

	// If a binwidth is specified, slide the bars on over
	if (typeof binWidth != "number") binWidth = binBounds[1] - binBounds[0];

	if (typeof firstBin != "number") firstBin = binBounds[0];

	while (firstBin > all_min) firstBin -= binWidth;
	while ((firstBin + binWidth) < all_min) firstBin += binWidth;
	binBounds = [firstBin];

	while (binBounds[binBounds.length - 1] <= all_max)
		binBounds.push(binBounds[binBounds.length - 1] + binWidth);

	// do not want bars overlapping axis, so add in buffer to data domain
	buffer = 0.02 * (binBounds[binBounds.length - 1] - binBounds[0]);
	xScale.domain([binBounds[0] - buffer, binBounds[binBounds.length - 1] + buffer]);
	xAxis.tickValues(binBounds);

	var allBins = [];
	var global_maxHeight = 0;
	dataArr.forEach(function(data)
	{
		var bins = [];
		var dataIndex = 0;
		var maxHeight = 0;
		for (var i = 0; i < binBounds.length - 1; i++)
		{
			var bin =
			{ left: binBounds[i],
			  right: binBounds[i+1],
			  height: 0 };
			while (dataIndex < data.length && data[dataIndex][xAttr] < bin.right)
			{
				bin.height++;
				dataIndex++;
			}
			bins.push(bin);
			if (bRelative) bin.height /= data.length;
			if (bin.height > maxHeight) maxHeight = bin.height;
		}
		if (maxHeight > global_maxHeight) global_maxHeight = maxHeight;
		allBins.push(bins);
	});
	
	// Now set the maximum height to be that of the tallest bar
	yScale.domain([0, global_maxHeight]);

	xAxis.tickFormat(format.d3NumberFormatter());
	if (bRelative)
		yAxis.tickFormat(STAP.Format.d3ProportionFormatter());
	else
		yAxis.tickFormat(d3.format("d"));
	var xTicks = xAxis.scale().ticks();
	STAP.SafeNumber.cleanArray(xTicks);
	xAxis.tickValues(xTicks);
	this.adjustWidthForLabels(xAxis, yAxis, groupNameArr);

	this.drawBackground();

	var graph_top = 0;
	var graph_bottom = graph_height;
	var plot_index = 0;
	var vertlabeloffset = parseInt(STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size)) / 2 - 2;
	allBins.forEach(function(bins, group_index)
	{
		  var axis = self.svg.append("g")
		      .attr("class", "axis axis--x")
		      .attr("transform", "translate(0," + graph_bottom + ")")
		      .call(xAxis)
		    .append("text")
		      .attr("class", "label")
		      .attr("x", self.width / 2)
		      .attr("y", self.margin.bottom - 5)
		      .style("font-weight", "bold");
	
		 if (plot_index++ == allBins.length - 1)
		      axis.style("text-anchor", "middle").text(xAttr);
	
		  self.svg.append("g")
		      .attr("class", "axis axis--y")
		      .attr("transform", "translate(0," + graph_top + ")")
		      .call(yAxis)
		    .append("text")
		      .attr("transform", "translate(-" + (self.margin.left + vertlabeloffset) + "," + (graph_height / 2) + ") rotate(-90)")
		      .attr("y", 6)
		      .attr("dy", "0.71em")
		      .style("text-anchor", "middle")
		      .style("font-weight", "bold")
		      .text(yAttr);
	
		var w = binBounds[1] - binBounds[0];
	
		bins.forEach(function(b)
		{
			  self.svg.append("rect")
			      .attr("class", "fillable")
			      .attr("x", xScale(b.left))
			      .attr("y", yScale(b.height) + graph_top)
			      .attr("width", xScale(b.right) - xScale(b.left))
			      .attr("height", graph_height - yScale(b.height))
			.on("mouseover", function() {
			  self.tooltip.transition()
			       .duration(200)
			       .style("opacity", .9);
			  var tooltip_text = STAP.Format.formatNumber(b.left) + " &le; x < "
						+ STAP.Format.formatNumber(b.right) + ": "
						+ (bRelative ? STAP.Format.formatProportion(b.height) : STAP.Format.formatNumber(b.height));
			  self.tooltip.html(tooltip_text)
			       .style("left", (d3.event.pageX + 5) + "px")
			       .style("top", (d3.event.pageY - 28) + "px");
			})
			.on("mouseout", function() {
			  self.tooltip.transition()
			       .duration(500)
			       .style("opacity", 0);
			});
		});

		self.svg.append("text")
		.attr("transform", "translate(" + self.width
						+ "," + (graph_top + graph_height + 5)
						+ ")")
		.attr("class", "label")
		.text(groupNameArr[group_index]);

		graph_top = graph_bottom + graph_margin;
		graph_bottom = graph_top + graph_height;	
	});

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.boxplot = function(data, xAttr)
{
	var self = this;

	// remove any old items
	this.clearGraph();
	
	// If the graph drawing area is more than 100 pixels tall, constrain it to be 100 pixels tall
	this.height = Math.min(this.height, 100);
	d3.select("#" + this.svgID)
		.attr("height", "" + (this.height + this.margin.top + this.margin.bottom));

    if (!data || data.length === 0) return;
	
	// setup x 
	var xScale = d3.scale.linear().range([0, this.width]), // value -> display
	    xAxis = d3.svg.axis().outerTickSize(0).scale(xScale).orient("bottom");
	
	// setup y
	var yScale = d3.scale.linear().range([this.height, 0]), // value -> display
	    yAxis = d3.svg.axis().scale(yScale).orient("left");
		
	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;

	this.currentData = data;

	var rawData = [];
	data.forEach(function(d) { rawData.push(d[xAttr]); });
	var stat = STAP.Statistics.getOneVariableStatistics(rawData);
	
	var iqr = stat.Q3 - stat.Q1;
	var lowfence = stat.Q1 - 1.5 * iqr;
	var highfence = stat.Q3 + 1.5 * iqr;
	var outliers = [];
	var fns = [stat.min, stat.Q1, stat.median, stat.Q3, stat.max];
	// do not want dots overlapping axis, so add in buffer to data domain
	var buffer = 0.02 * (fns[4] - fns[0]);
	xScale.domain([fns[0] - buffer, fns[4] + buffer]);
	yScale.domain([1,5]);

	// For there to be outliers there should be at least a few data points
	if (rawData.length > 3)
	{
		var lowindex = 0;
		var highindex = rawData.length - 1;
		var safenum = STAP.SafeNumber;
		if (safenum.compareToWithinTolerance(rawData[lowindex], lowfence) < 0)
		{
			do
			{
				outliers.push(rawData[lowindex]);
				lowindex++;	
			} while (safenum.compareToWithinTolerance(rawData[lowindex], lowfence) < 0);
			fns[0] = rawData[lowindex];
		}
		if (safenum.compareToWithinTolerance(rawData[highindex], highfence) > 0)
		{
			do
			{
				outliers.push(rawData[highindex]);
				highindex--;	
			} while (safenum.compareToWithinTolerance(rawData[highindex], highfence) > 0);
			fns[4] = rawData[highindex];
		}
	}

	xAxis.tickFormat(format.d3NumberFormatter());
	var xTicks = xAxis.scale().ticks();
	STAP.SafeNumber.cleanArray(xTicks);
	xAxis.tickValues(xTicks);
	this.adjustWidthForLabels(xAxis);
			
	this.drawBackground();
	
	this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis)
	    .append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 2)
	      .attr("y", this.margin.bottom - 5)
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(xAttr);

	this.svg.append("line")
		.attr("x1", xScale(fns[0]))
		.attr("y1", yScale(3))
		.attr("x2", xScale(fns[4]))
		.attr("y2", yScale(3))
	        .style("stroke", "#000000");
				
	this.svg.append("rect")
		.attr("class", "fillable")
		.attr("x", xScale(fns[1]))
		.attr("y", yScale(4))
		.attr("width", xScale(fns[3]) - xScale(fns[1]))
		.attr("height", yScale(2) - yScale(4));

	this.svg.selectAll(".boxline")
	    .data(fns)
	    .enter().append("line")
	      .attr("class", "boxline")
	      .attr("x1", function(b) { return xScale(b); })
	      .attr("y1", function(b) { return yScale(2); })
	      .attr("x2", function(b) { return xScale(b); })
	      .attr("y2", function(b) { return yScale(4); })
	      .style("stroke", "#000000");
	
	this.svg.selectAll(".zones")
		.data(fns)
		.enter().append("rect")
	      .attr("class", "zones")
	      .attr("x", function(b) { return xScale(b) - 5; })
	      .attr("y", function(b) { return yScale(4); })
	      .attr("width", function(b) { return 10; })
	      .attr("height", function(b) { return yScale(2) - yScale(4); })
	      .style("opacity", 0)
		.on("mouseover", function(d) {
		  self.tooltip.transition()
		       .duration(200)
		       .style("opacity", .9);
		  var tooltip_text = STAP.Format.formatNumber(d);
		  self.tooltip.html(tooltip_text)
		       .style("left", (d3.event.pageX + 5) + "px")
		       .style("top", (d3.event.pageY - 28) + "px");
		})
		.on("mouseout", function(d) {
		  self.tooltip.transition()
		       .duration(500)
		       .style("opacity", 0);
		});

	var dotradius = 4;
	
	this.svg.selectAll(".dot")
		.data(outliers)
		.enter().append("circle")
		.attr("class", "dot fillable")
		.attr("cx", function(b) { return xScale(b); })
		.attr("cy", function(b) { return yScale(3); })
		.attr("r", function(b) { return dotradius; })
		.on("mouseover", function(d) {
		  self.tooltip.transition()
		       .duration(200)
		       .style("opacity", .9);
		  var tooltip_text = STAP.Format.formatNumber(d);
		  self.tooltip.html(tooltip_text)
		       .style("left", (d3.event.pageX + 5) + "px")
		       .style("top", (d3.event.pageY - 28) + "px");
		})
		.on("mouseout", function(d) {
		  self.tooltip.transition()
		       .duration(500)
		       .style("opacity", 0);
		});
	
	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.parallelBoxplot = function(dataArr, groupNameArr, xAttr)
{
	var self = this;

	// remove any old items
	this.clearGraph();

	// If the graph drawing area is more than 100 pixels tall per graph, constrain it to be that tall
	this.height = Math.min(this.height, 100 * groupNameArr.length);
	d3.select("#" + this.svgID)
		.attr("height", "" + (this.height + this.margin.top + this.margin.bottom));
	
	// setup x 
	var xScale = d3.scale.linear().range([0, this.width]), // value -> display
	    xAxis = d3.svg.axis().outerTickSize(0).scale(xScale).orient("bottom");
	
	// setup y
	var yScale = d3.scale.linear().range([0, this.height]), // One of the few times we want higher y values to be lower
	    yAxis = d3.svg.axis().scale(yScale).orient("left");
		
	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;

	var data = [];
	dataArr.forEach(function(d)
	{
		d.forEach(function(n) { data.push(n[xAttr]); });
	});
	util.sortArrayAscending(data);
	this.currentData = data;
	var max = data[data.length - 1];
	var min = data[0];

	// do not want dots overlapping axis, so add in buffer to data domain
	var buffer = 0.02 * (max - min);
	xScale.domain([min - buffer, max + buffer]);
	yScale.domain([0, 4 * dataArr.length]);

	xAxis.tickFormat(format.d3NumberFormatter());
	var xTicks = xAxis.scale().ticks();
	STAP.SafeNumber.cleanArray(xTicks);
	xAxis.tickValues(xTicks);
	this.adjustWidthForLabels(xAxis, null, groupNameArr);

	this.drawBackground();
	
	this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis)
	    .append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 2)
	      .attr("y", this.margin.bottom - 5)
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(xAttr);

	var plot_index = 0;
	var dotradius = 4;
		
	dataArr.forEach(function(d, group_index)
	{
		var rawData = [];
		d.forEach(function(x) { rawData.push(x[xAttr]); });
		
		if (rawData.length > 0)
		{
    		var stat = STAP.Statistics.getOneVariableStatistics(rawData);
    		var iqr = (rawData.length > 1 ? stat.Q3 - stat.Q1 : 0);
    		var lowfence = (rawData.length > 1 ? stat.Q1 - 1.5 * iqr : stat.median);
    		var highfence = stat.Q3 + 1.5 * iqr;
    		var outliers = [];
    		var fns = [stat.min, (rawData.length > 1 ? stat.Q1 : stat.median), stat.median, stat.Q3, stat.max];
    
    		// For there to be outliers there should be at least a few data points
    		if (rawData.length > 3)
    		{
    			var lowindex = 0;
    			var highindex = rawData.length - 1;
    			var safenum = STAP.SafeNumber;
    			if (safenum.compareToWithinTolerance(rawData[lowindex], lowfence) <= 0)
    			{
    				do
    				{
    					outliers.push(rawData[lowindex]);
    					lowindex++;	
    				} while (safenum.compareToWithinTolerance(rawData[lowindex], lowfence) <= 0);
    				fns[0] = rawData[lowindex];
    			}
    			if (safenum.compareToWithinTolerance(rawData[highindex], highfence) >= 0)
    			{
    				do
    				{
    					outliers.push(rawData[highindex]);
    					highindex--;	
    				} while (safenum.compareToWithinTolerance(rawData[highindex], highfence) >= 0);
    				fns[4] = rawData[highindex];
    			}
    		}
    		
    		self.svg.append("line")
    			.attr("x1", xScale(fns[0]))
    			.attr("y1", yScale(2 + 4 * plot_index))
    			.attr("x2", xScale(fns[4]))
    			.attr("y2", yScale(2 + 4 * plot_index))
    		        .style("stroke", "#000000");
    					
    		self.svg.append("rect")
    			.attr("class", "fillable")
    			.attr("x", xScale(fns[1]))
    			.attr("y", yScale(1 + 4 * plot_index))
    			.attr("width", xScale(fns[3]) - xScale(fns[1]))
    			.attr("height", yScale(3) - yScale(1));
    	
    		fns.forEach(function(b)
    		{
    			self.svg.append("line")
    			      .attr("class", "boxline")
    			      .attr("x1", xScale(b))
    			      .attr("y1", yScale(1 + 4 * plot_index))
    			      .attr("x2", xScale(b))
    			      .attr("y2", yScale(3 + 4 * plot_index))
    			      .style("stroke", "#000000");
    			      
    			self.svg.append("rect")
    			      .attr("x", xScale(b) - 5)
    			      .attr("y", yScale(1 + 4 * plot_index))
    			      .attr("width", 10)
    			      .attr("height", yScale(3) - yScale(1))
    			      .style("opacity", 0)
    				.on("mouseover", function(d) {
    				  self.tooltip.transition()
    				       .duration(200)
    				       .style("opacity", .9);
    				  var tooltip_text = STAP.Format.formatNumber(b);
    				  self.tooltip.html(tooltip_text)
    				       .style("left", (d3.event.pageX + 5) + "px")
    				       .style("top", (d3.event.pageY - 28) + "px");
    				})
    				.on("mouseout", function(d) {
    				  self.tooltip.transition()
    				       .duration(500)
    				       .style("opacity", 0);
    				});
    		});
    
    		outliers.forEach(function(b)
    		{
    			self.svg.append("circle")
    			.attr("class", "dot fillable")
    			.attr("cx", xScale(b))
    			.attr("cy", yScale(2 + 4 * plot_index))
    			.attr("r", dotradius)
    			.on("mouseover", function(d) {
    			  self.tooltip.transition()
    			       .duration(200)
    			       .style("opacity", .9);
    			  var tooltip_text = STAP.Format.formatNumber(b);
    			  self.tooltip.html(tooltip_text)
    			       .style("left", (d3.event.pageX + 5) + "px")
    			       .style("top", (d3.event.pageY - 28) + "px");
    			})
    			.on("mouseout", function(d) {
    			  self.tooltip.transition()
    			       .duration(500)
    			       .style("opacity", 0);
    			});
    		});
		}
		self.svg.append("text")
		.attr("transform", "translate(" + self.width
						+ "," + yScale(2 + 4 * plot_index)
						+ ")")
		.attr("class", "label")
		.text(groupNameArr[group_index]);

		plot_index++;
	});

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.barChart = function(data, xAttr, bRelative)
{
	this.clearGraph();
	
	xAttr = xAttr || "Category";
	var yAttr = (bRelative ? "Relative Frequency" : "Frequency");

	var self = this;
	this.currentData = data;

	var x = d3.scale.ordinal()
			.rangeRoundBands([0, this.width],0.2),
	    y = d3.scale.linear()
			.rangeRound([this.height, 0]),
	    xAxis = d3.svg.axis().outerTickSize(0).scale(x).orient("bottom"),
	    yAxis = d3.svg.axis().outerTickSize(0).scale(y).orient("left");

	if (bRelative)
		yAxis.tickFormat(STAP.Format.d3ProportionFormatter());
	else
		yAxis.tickFormat(d3.format("d"));

	  x.domain(data.map(function(d) { return d[xAttr]; }));
	  y.domain([0, d3.max(data, function(d) { return d[yAttr]; })]).nice();

	this.adjustWidthForLabels(null, yAxis);

	// plot the background
	this.drawBackground();
	
	  this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis)
	    .append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 2)
	      .attr("y", this.margin.bottom - 5)
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(xAttr);
	
	var verticaloffset = parseInt(STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size)) / 2 - 2;
	  this.svg.append("g")
	      .attr("class", "axis axis--y")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "translate(-" + (this.margin.left + verticaloffset) + ", " + ((this.height - this.margin.bottom) / 2) + ") rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "0.71em")
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(yAttr);
	
	  // now a custom class so writeCSSRules doesn't overfill it
	  this.svg.selectAll(".chartbar")
	    .data(data)
	    .enter().append("rect")
	      .attr("class", "chartbar")
	      .attr("x", function(d) { return x(d[xAttr]); })
	      .attr("y", function(d) { return y(d[yAttr]); })
	      .attr("width", x.rangeBand())
	      .attr("height", function(d) { return self.height - y(d[yAttr]); })
    	  .style("stroke", pref.getPreference(pref.keys.drawing.line_color))
	  	  .style("fill", function(d) {
	  	      return (("barColor" in d) ? d["barColor"] : pref.getPreference(pref.keys.drawing.fill_color)); })
	  	  .on("mouseover", function(d) {
		var pref = STAP.Preferences;
		  d3.select(this)
	  	      .style("fill", function(d) {
	  	      return d3.rgb(("barColor" in d) ? d["barColor"] : pref.getPreference(pref.keys.drawing.fill_color)).brighter(0.4).toString(); });
		  self.tooltip.transition()
		       .duration(200)
		       .style("opacity", .9);
		  var tooltip_text = d[xAttr] + ": " +
			(bRelative ? STAP.Format.formatProportion(d["Relative Frequency"])
				: STAP.Format.formatNumber(d["Frequency"])
			);
		  self.tooltip.html(tooltip_text)
		       .style("left", (d3.event.pageX + 5) + "px")
		       .style("top", (d3.event.pageY - 28) + "px");
		})
		.on("mouseout", function(d) {
		  var pref = STAP.Preferences;
		  d3.select(this)
    	  	  .style("fill", function(d) {
	  	      return (("barColor" in d) ? d["barColor"] : pref.getPreference(pref.keys.drawing.fill_color)); });
	  	      self.tooltip.transition()
		       .duration(500)
		       .style("opacity", 0);
		});	

    // populate the desc element
    var formatter = yAxis.tickFormat();
    var deschtml = "The figure shows a bar chart. The vertical axis is labeled " + yAttr + " and is labeled from 0 to " + yAxis.tickFormat()(y.domain()[1]);
    if (y.ticks().length > 1)
        deschtml += " in intervals of " + formatter(y.ticks()[1] - y.ticks()[0]);
    deschtml += ". The horizontal axis is labeled " + xAttr + " and presents " + data.length + " categories: ";
    for (var i = 0; i < data.length; i++)
    {
        if (i === (data.length - 1))
            deschtml += " and ";
        deschtml += data[i][xAttr] + " with bar height " + formatter(data[i][yAttr])
        if (i < (data.length - 2))
            deschtml += ", ";
        else if (i === (data.length - 1))
            deschtml += ".";
    }
    this.svgDesc.html(deschtml);

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.stackedBarChart = function(data, xAttr, legAttr)
{
	this.clearGraph();
	
	xAttr = xAttr || "Group";
	if (STAP.Utility.trimString(xAttr).length == 0) xAttr = "Group";

	legAttr = legAttr || xAttr;
	if (STAP.Utility.trimString(legAttr).length == 0) legAttr = xAttr;

	var self = this;
	this.currentData = data;

	var x = d3.scale.ordinal()
			.rangeRoundBands([0, 2 * this.width / 3], 0.2),
	    y = d3.scale.linear()
			.rangeRound([this.height, 0]),
	    xAxis = d3.svg.axis().outerTickSize(0).scale(x).orient("bottom"),
	    yAxis = d3.svg.axis().outerTickSize(0).scale(y).orient("left");

	yAxis.tickFormat(STAP.Format.d3ProportionFormatter());
	var color = d3.scale.category20();

	  x.domain(data.columnCategories);
	  y.domain([0, 1]);

	this.adjustWidthForLabels(null, yAxis);

	// plot the background
	this.drawBackground();
	
	var xa = this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis);
	
	if (data.columnCategories.length > 1)
	    xa.append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 3)
	      .attr("y", this.margin.bottom - 5)
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(xAttr);
	
	var verticaloffset = parseInt(STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size)) / 2 - 2;
	  this.svg.append("g")
	      .attr("class", "axis axis--y")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "translate(-" + (this.margin.left + verticaloffset) + ", " + ((this.height - this.margin.bottom) / 2) + ") rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "0.71em")
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text("Relative Frequency");

	var graphingData = [];
	data.columnCategories.forEach(function(g)
	{
		var dist = data.getColumnConditionalDistribution(g);
		var mem = 0;
		for (var i = 0; i < dist.length; i++)
		{
			var f = dist[i];
			mem += f;
			graphingData.push({
				Category: data.rowCategories[i],
				Group: g,
				y: mem,
				rf: f,
				Color: color(data.rowCategories[i])
			});
		}
	});

	this.svg.selectAll(".stackedbar")
	    .data(graphingData)
	    .enter().append("rect")
	      .attr("class", "stackedbar")
	      .attr("x", function(d) { return (data.columnCategories.length > 1 ? x(d.Group) : x(d.Group) + x.rangeBand() / 4); })
	      .attr("y", function(d) { return y(d.y); })
	      .attr("width", (data.columnCategories.length > 1 ? x.rangeBand() : x.rangeBand() / 2))
	      .attr("height", function(d) { return self.height - y(d.rf); })
	      .style("fill", function(d) { return d.Color; })
		.on("mouseover", function(d) {
		  self.tooltip.transition()
		       .duration(200)
		       .style("opacity", .9);
		  var tooltip_text = d.Group + ", " + d.Category + ": " + STAP.Format.formatProportion(d.rf);
		  self.tooltip.html(tooltip_text)
		       .style("left", (d3.event.pageX + 5) + "px")
		       .style("top", (d3.event.pageY - 28) + "px");
		})
		.on("mouseout", function() {
		  self.tooltip.transition()
		       .duration(500)
		       .style("opacity", 0);
		});

	var legend = this.svg.append("g")
		.attr("transform", "translate(" + 2.1 * this.width / 3 + ", 0)");

	var legEntries = legend.selectAll(".legend")
			.data(data.rowCategories)
			.enter().append("g")
			.attr("class", "legend");

	legEntries.append("text")
		.text(legAttr)
		.style("text-decoration", "underline");

	// These next two y-attribute entries are meant to reverse the order of the key to match the order of the bars.
	legEntries.append("rect")
		.attr("width", "5")
		.attr("height", "5")
		.attr("x", "10")
		.attr("y", function(d, i) { return 19 + 14 * (data.rowCategories.length - i - 1); })
		.style("fill", function(d) { return color(d); })
		.style("stroke-width", "0");

	legEntries.append("text")
		.attr("transform", function(d, i) { return "translate(20, " + (24 + 14 * (data.rowCategories.length - i - 1)) + ")"; })
		.text(function(d) { return d; });

    // populate the desc element
    var formatter = yAxis.tickFormat();
    var numgroups = data.columnCategories.length;
    var numdiv = data.rowCategories.length;
    var deschtml = "The figure shows a segmented bar chart. The vertical axis is labeled Relative Frequency and is labeled from 0 to " + formatter(y.domain()[1]);
    if (y.ticks().length > 1)
        deschtml += " in intervals of " + formatter(y.ticks()[1] - y.ticks()[0]);
    deschtml += ". " + numgroups + " bar" + (numgroups > 1 ? "s are presented, one for each of the following groups: " : " is presented representing the group ");
    for (var i = 0; i < numgroups; i++)
    {
        if ((numgroups > 1) && (i === (numgroups - 1)))
            deschtml += " and ";
        deschtml += data.columnCategories[i];
        if (i < (numgroups - 2))
            deschtml += ", ";
        else if (i === (numgroups - 1))
            deschtml += ". ";
    }
    deschtml += "Each bar is divided into " + numdiv + " sections from bottom to top as follows: ";
    for (var i = 0; i < numdiv; i++)
    {
        if (i === (numdiv - 1))
            deschtml += " and ";
        deschtml += data.rowCategories[i];
        if (i < (numdiv - 2))
            deschtml += ", ";
        else if (i === (numdiv - 1))
            deschtml += ". ";
    }
    deschtml += "The bars are divided at the following percents: ";
    for (var i = 0; i < graphingData.length; i++)
    {
        deschtml += graphingData[i].Category + ", ";
        for (var j = 0; j < numdiv; j++)
        {
            if (j === (numdiv - 1))
                deschtml += " and ";
            deschtml += formatter(graphingData[i++].y);
            if (j < (numdiv - 2))
                deschtml += ", ";
            else if (j === (numdiv - 1))
                deschtml += ". ";
        }
    }
    this.svgDesc.html(deschtml);

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.mosaicPlot = function(data, xAttr, legAttr)
{
	this.clearGraph();
	
	xAttr = xAttr || "Group";
	if (STAP.Utility.trimString(xAttr).length == 0) xAttr = "Group";

	legAttr = legAttr || xAttr;
	if (STAP.Utility.trimString(legAttr).length == 0) legAttr = xAttr;

	var self = this;
	this.currentData = data;

	var x = d3.scale.linear()
	        .rangeRound([0, this.width * 2 / 3]),
	    y = d3.scale.linear()
			.rangeRound([this.height, 0]),
	    xAxis = d3.svg.axis().outerTickSize(0).scale(x).orient("bottom"),
	    yAxis = d3.svg.axis().outerTickSize(0).scale(y).orient("left");

	yAxis.tickFormat(STAP.Format.d3ProportionFormatter());
	var color = d3.scale.category20();

	  x.domain([0, 1]);
	  y.domain([0, 1]);

	this.adjustWidthForLabels(null, yAxis);

	// plot the background
	this.drawBackground();

	var graphingData = [];
	var xTickValues = [];
	var xTickLabelMap = {};
	var memX = 0;
	data.columnCategories.forEach(function(g)
	{
		var dist = data.getColumnConditionalDistribution(g);
		var memY = 0;
		var w = data.getColumnTotal(g)/data.grandTotal;
		for (var i = 0; i < dist.length; i++)
		{
			var f = dist[i];
			memY += f;
			graphingData.push({
				Category: data.rowCategories[i],
				Group: g,
				x: memX,
				y: memY,
				width: w,
				rf: f,
				grf: (f * w),
				Color: color(data.rowCategories[i])
			});
		}
		var tickval = memX + w / 2;
		xTickValues.push(tickval);
		xTickLabelMap[tickval] = g;
		memX += w;
	});

    xAxis.tickValues(xTickValues)
        .tickFormat(function(v) { return xTickLabelMap[v]; });

	var xa = this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis);
	
	if (data.columnCategories.length > 1)
	    xa.append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 3)
	      .attr("y", this.margin.bottom - 5)
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(xAttr);
	
	var verticaloffset = parseInt(STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size)) / 2 - 2;
	  this.svg.append("g")
	      .attr("class", "axis axis--y")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "translate(-" + (this.margin.left + verticaloffset) + ", " + ((this.height - this.margin.bottom) / 2) + ") rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "0.71em")
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text("Relative Frequency");

	this.svg.selectAll(".mosaicbar")
	    .data(graphingData)
	    .enter().append("rect")
	      .attr("class", "mosaicbar")
	      .attr("x", function(d) { return x(d.x); })
	      .attr("y", function(d) { return y(d.y); })
	      .attr("width", function(d) { return x(d.width); })
	      .attr("height", function(d) { return self.height - y(d.rf); })
	      .style("fill", function(d) { return d.Color; })
	      .style("stroke", "#000000")
	      .style("stroke-width", 0.5)
		.on("mouseover", function(d) {
		  self.tooltip.transition()
		       .duration(200)
		       .style("opacity", .9);
		  var tooltip_text = d.Group + ", " + d.Category + ": " + STAP.Format.formatProportion(d.rf) + " (" + STAP.Format.formatProportion(d.grf) + " of whole)";
		  self.tooltip.html(tooltip_text)
		       .style("left", (d3.event.pageX + 5) + "px")
		       .style("top", (d3.event.pageY - 28) + "px");
		})
		.on("mouseout", function() {
		  self.tooltip.transition()
		       .duration(500)
		       .style("opacity", 0);
		});

	var legend = this.svg.append("g")
		.attr("transform", "translate(" + 2.1 * this.width / 3 + ", 0)");

	var legEntries = legend.selectAll(".legend")
			.data(data.rowCategories)
			.enter().append("g")
			.attr("class", "legend");

	legEntries.append("text")
		.text(legAttr)
		.style("text-decoration", "underline");

	// These next two y-attribute entries are meant to reverse the order of the key to match the order of the bars.
	legEntries.append("rect")
		.attr("width", "5")
		.attr("height", "5")
		.attr("x", "10")
		.attr("y", function(d, i) { return 19 + 14 * (data.rowCategories.length - i - 1); })
		.style("fill", function(d) { return color(d); })
		.style("stroke-width", "0");

	legEntries.append("text")
		.attr("transform", function(d, i) { return "translate(20, " + (24 + 14 * (data.rowCategories.length - i - 1)) + ")"; })
		.text(function(d) { return d; });

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.sideBySideBarChart = function(data, xAttr, bRelative, legAttr)
{
	this.clearGraph();
	
	xAttr = xAttr || "Group";
	if (STAP.Utility.trimString(xAttr).length == 0) xAttr = "Group";
	
	legAttr = legAttr || xAttr;
	if (STAP.Utility.trimString(legAttr).length == 0) legAttr = xAttr;
	
	var yDisp = (bRelative ? "Relative Frequency" : "Frequency");

	var self = this;
	this.currentData = data;

	var x = d3.scale.ordinal()
			.rangeRoundBands([0, 2 * this.width / 3],0.2),
	    y = d3.scale.linear()
			.rangeRound([this.height, 0]),
	    xAxis = d3.svg.axis().outerTickSize(0).scale(x).orient("bottom"),
	    yAxis = d3.svg.axis().outerTickSize(0).scale(y).orient("left");

	if (bRelative)
		yAxis.tickFormat(STAP.Format.d3ProportionFormatter());
	else
		yAxis.tickFormat(d3.format("d"));

	var color = d3.scale.category20();

	var graphingData = [];
	data.columnCategories.forEach(function(g)
	{
		var dist = data.getColumnConditionalDistribution(g);
		for (var i = 0; i < dist.length; i++)
		{
			graphingData.push({
				Category: data.rowCategories[i],
				Group: g,
				f: data.getFrequencyFor(data.rowCategories[i], g),
				rf: dist[i],
				Color: color(data.rowCategories[i]),
				Offset: i
			});
		}
	});

	var yAttr = (bRelative ? "rf" : "f");
	x.domain(data.columnCategories);
	y.domain([0, d3.max(graphingData, function(d) { return d[yAttr]; })]).nice();

	this.adjustWidthForLabels(null, yAxis);

	// plot the background
	this.drawBackground();
	
	  this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis)
	    .append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 3)
	      .attr("y", this.margin.bottom - 5)
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(xAttr);
	
	var verticaloffset = parseInt(STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size)) / 2 - 2;

	  this.svg.append("g")
	      .attr("class", "axis axis--y")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "translate(-" + (this.margin.left + verticaloffset) + ", " + ((this.height - this.margin.bottom) / 2) + ") rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "0.71em")
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(yDisp);

	var numcats = data.rowCategories.length;
	var barwidth = x.rangeBand() / numcats;
	
	  this.svg.selectAll(".sidebysidebar")
	    .data(graphingData)
	    .enter().append("rect")
	      .attr("class", "sidebysidebar")
	      .attr("x", function(d) { return x(d.Group) + barwidth * d.Offset; })
	      .attr("y", function(d) { return y(d[yAttr]); })
	      .attr("width", barwidth)
	      .attr("height", function(d) { return self.height - y(d[yAttr]); })	
	      .style("fill", function(d) { return d.Color; })
		.on("mouseover", function(d) {
		  self.tooltip.transition()
		       .duration(200)
		       .style("opacity", .9);
		  var tooltip_text = d.Group + ", " + d.Category + ": " + 
		  	(bRelative ? STAP.Format.formatProportion(d.rf) : STAP.Format.formatNumber(d.f));
		  self.tooltip.html(tooltip_text)
		       .style("left", (d3.event.pageX + 5) + "px")
		       .style("top", (d3.event.pageY - 28) + "px");
		})
		.on("mouseout", function() {
		  self.tooltip.transition()
		       .duration(500)
		       .style("opacity", 0);
		});

	var legend = this.svg.append("g")
		.attr("transform", "translate(" + 2.1 * this.width / 3 + ", 0)");

	var legEntries = legend.selectAll(".legend")
			.data(data.rowCategories)
			.enter().append("g")
			.attr("class", "legend");

	legEntries.append("text")
		.text(legAttr)
		.style("text-decoration", "underline");

	legEntries.append("rect")
		.attr("width", "5")
		.attr("height", "5")
		.attr("x", "10")
		.attr("y", function(d, i) { return 19 + 14 * i; })
		.style("fill", function(d) { return color(d); })
		.style("stroke", "#fff");

	legEntries.append("text")
		.attr("transform", function(d, i) { return "translate(20, " + (24 + 14 * i) + ")"; })
		.text(function(d) { return d; });

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.pieChart = function(data, labelAttr)
{
	var self = this;

	this.clearGraph();
	this.currentData = data;

	// plot the background
	this.drawBackground()

	var radius = Math.min(this.width / 3, this.height / 2),
		 g = this.svg.append("g")
			.attr("transform", "translate(" + this.width / 3 + "," + this.height / 2 + ")");

	var color = d3.scale.category20();

	var pie = d3.layout.pie()
	    .sort(null)
	    .value(function(d) { return d.Frequency; });

	var path = d3.svg.arc()
	    .outerRadius(radius - 10)
	    .innerRadius(0);
	
	var label = d3.svg.arc()
	    .outerRadius(radius - 40)
	    .innerRadius(radius - 40);
		
	var arc = g.selectAll(".arc")
	    .data(pie(data))
	    .enter().append("g")
	      .attr("class", "arc");
	
	arc.append("path")
	      .attr("d", path)
	      .attr("fill", function(d) { return color(d.data[labelAttr]); })
	      .attr("stroke-width", "0")
		.on("mouseover", function(d) {
		  d3.select(this)
	  		.style("fill", d3.rgb(color(d.data[labelAttr])).brighter(0.4).toString());
		  self.tooltip.transition()
		       .duration(200)
		       .style("opacity", .9);
		  var tooltip_text = d.data[labelAttr] + ": " + STAP.Format.formatPercent(d.data["Relative Frequency"]);
		  self.tooltip.html(tooltip_text)
		       .style("left", (d3.event.pageX + 5) + "px")
		       .style("top", (d3.event.pageY - 28) + "px");
		})
		.on("mouseout", function(d) {
		  d3.select(this)
		      .style("fill", function(d) { return color(d.data[labelAttr]); });
		  self.tooltip.transition()
		       .duration(500)
		       .style("opacity", 0);
		});	
	
	var legend = this.svg.append("g")
		.attr("transform", "translate(" + 2.1 * this.width / 3 + ", 0)");

	var legEntries = legend.selectAll(".legend")
			.data(data)
			.enter().append("g")
			.attr("class", "legend");

	legEntries.append("text")
		.text(function(d) { return labelAttr; })
		.style("text-decoration", "underline");

	legEntries.append("circle")
		.attr("fill", function(d) { return color(d[labelAttr]); })
		.attr("r", "5")
		.attr("cx", "10")
		.attr("cy", function(d, i) { return 19 + 14 * i; })
		.attr("stroke-width", "0");

	legEntries.append("text")
		.attr("transform", function(d, i) { return "translate(20, " + (23 + 14 * i) + ")"; })
		.text(function(d) { return d[labelAttr]; });

    // populate the desc element
    var deschtml = "The figure shows a pie chart. The categories start at the top of the pie chart and proceed clockwise around the circle. The categories and percentages are as follows: ";
    for (var i = 0; i < data.length; i++)
    {
        if (i === (data.length - 1))
            deschtml += " and ";
        deschtml += data[i][labelAttr] + ", " + STAP.Format.formatPercent(data[i]["Relative Frequency"]);
        if (i < (data.length - 2))
            deschtml += "; ";
        else if (i === (data.length - 1))
            deschtml += ".";
    }
    this.svgDesc.html(deschtml);

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.yesNoSpinner = function(propYes)
{
	var self = this;

    this.propYes = propYes;
	this.clearGraph();

	// plot the background
	this.drawBackground();

	var radius = Math.min(this.width / 2, this.height / 2),
		 g = this.svg.append("g")
			.attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");

	var arcYes = d3.svg.arc()
	    .outerRadius(radius)
	    .innerRadius(0)
        .startAngle(0)
        .endAngle(propYes * 2 * Math.PI);
    
    var arcNo = d3.svg.arc()
	    .outerRadius(radius)
	    .innerRadius(0)
        .startAngle(propYes * 2 * Math.PI)
        .endAngle(2 * Math.PI);

    g.append("path")
	      .attr("d", arcYes)
	      .style("fill", "darkgreen")
	      .attr("stroke-width", "0");

    g.append("path")
	      .attr("d", arcNo)
	      .style("fill", "indianred")
	      .attr("stroke-width", "0");

	this.spoke = g.append("line")
	      .attr("x1", 0)
	      .attr("y1", 0)
	      .attr("x2", 0)
	      .attr("y2", -radius)
	      .attr("stroke-width", "2")
	      .style("stroke", "white");

    this.spokeAngle = 0;
    
    this.spin = function(timems)
    {
        self.spokeAngle = 0;
        self.spoke.attr("transform", "rotate(0)");
        var finalAngle = STAP.Utility.randomIntFromInterval(1080,1800);
        timems = timems || 1000;
        self.spoke.transition().duration(timems).attrTween("transform", function() {
         return d3.interpolateString("rotate(0)", "rotate(" + finalAngle + ")");
        });
        
        self.spokeAngle = finalAngle % 360;
    };

    this.yes = function()
    {
        return (self.spokeAngle / 360) < self.propYes;
    }
	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.scatterplot = function(data, xAttr, yAttr, caseAttr, dotRadius, forceXDomainArr, forceYDomainArr)
{
	if (!dotRadius) dotRadius = 4;

	var self = this;
	
	this.clearGraph();
	this.currentData = data;

	// setup x 
	var xValue = function(d) { return d[xAttr];}, // data -> value
	    xScale = d3.scale.linear().range([0, this.width]), // value -> display
	    xMap = function(d) { return xScale(xValue(d));}, // data -> display
	    xAxis = d3.svg.axis().outerTickSize(0).scale(xScale).orient("bottom");
	
	// setup y
	var yValue = function(d) { return d[yAttr];}, // data -> value
	    yScale = d3.scale.linear().range([this.height, 0]), // value -> display
	    yMap = function(d) { return yScale(yValue(d));}, // data -> display
	    yAxis = d3.svg.axis().outerTickSize(0).scale(yScale).orient("left");

	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;
		
	// do not want dots overlapping axis, so add in buffer to data domain
	var xMin = (forceXDomainArr ? forceXDomainArr[0] : d3.min(data, function(d) { return d[xAttr]; }));
	var xMax = (forceXDomainArr ? forceXDomainArr[1] : d3.max(data, function(d) { return d[xAttr]; }));
	var yMin = (forceYDomainArr ? forceYDomainArr[0] : d3.min(data, function(d) { return d[yAttr]; }));
	var yMax = (forceYDomainArr ? forceYDomainArr[1] : d3.max(data, function(d) { return d[yAttr]; }));

	// More buffer desired here than in other plots
	var xBuffer = (0.05 * (xMax - xMin)) || 0.01;
	var yBuffer = (0.05 * (yMax - yMin)) || 0.01;
	xScale.domain([xMin - xBuffer, xMax + xBuffer]);
	yScale.domain([yMin - yBuffer, yMax + yBuffer]);

	xAxis.tickFormat(format.d3NumberFormatter());
	yAxis.tickFormat(format.d3NumberFormatter());
	var xTicks = xAxis.scale().ticks();
	STAP.SafeNumber.cleanArray(xTicks);
	var yTicks = yAxis.scale().ticks();
	STAP.SafeNumber.cleanArray(yTicks);
	xAxis.tickValues(xTicks);
	yAxis.tickValues(yTicks);
	this.adjustWidthForLabels(xAxis, yAxis);
	
	// plot the background
	this.drawBackground();

	// x-axis
	this.svg.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + this.height + ")")
	      .call(xAxis)
	    .append("text")
	      .attr("class", "label")
	      .attr("x", this.width / 2)
	      .attr("y", this.margin.bottom - 5)
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(xAttr);

	// y-axis
	  this.svg.append("g")
	      .attr("class", "axis axis--y")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "translate(-" + this.margin.left + ", " + (this.height / 2) + ") rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "0.71em")
	      .style("text-anchor", "middle")
	      .style("font-weight", "bold")
	      .text(yAttr);

	// draw dots
	this.svg.selectAll(".fillable")
	.data(data)
	.enter().append("circle")
	.attr("class", "fillable")
	.attr("r", dotRadius)
	.attr("cx", xMap)
	.attr("cy", yMap)
	.style("fill", "#6666FF")
	.style("stroke", "#3333CC")
	.on("mouseover", function(d) {
	  self.tooltip.transition()
	       .duration(200)
	       .style("opacity", .9);
	  var tooltip_text = xAttr + ": " + STAP.Format.formatNumber(d[xAttr]) +
			"<BR>" + yAttr + ": " + STAP.Format.formatNumber(d[yAttr]);
	 if (caseAttr)
	 {       
	   var casetext = (typeof d[caseAttr] == "number") ? STAP.Format.formatNumber(d[caseAttr]) : STAP.Utility.trimString(d[caseAttr]);
	   tooltip_text = casetext + "<BR>" + tooltip_text;
	 }
	  self.tooltip.html(tooltip_text)
	       .style("left", (d3.event.pageX + 5) + "px")
	       .style("top", (d3.event.pageY - 28) + "px");
	})
	.on("mouseout", function(d) {
	  self.tooltip.transition()
	       .duration(500)
	       .style("opacity", 0);
	});

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.fnRangeMap = function(fn, L, R, n, bNoClean)
{
	var ret = d3.range(n).map(function (d) {
		var p = L + d * (R - L) / (n - 1);
		return { x:p, y:fn(p) };
	});
	if (!bNoClean)
	    for (var i = 0; i < ret.length; i++)
	        while (i < ret.length && isNaN(ret[i].y))
                ret.splice(i, 1);        
	return ret;
};

STAP.SVGGraph.prototype.clearTopCurve = function() { this.svg.selectAll(".topcurve").remove(); };

STAP.SVGGraph.prototype.plotTopCurve = function(fn, n, color, bDashed, bNoClear)
{
	var self = this;

	if (!n) n = 50;
	if (!color) color = "#000000";
	if (!bNoClear) 	this.svg.selectAll(".topcurve").remove();

	var data = this.fnRangeMap(fn, this.xScale.domain()[0], this.xScale.domain()[1], n);

	var line = d3.svg.line()
		.interpolate('basis')
		.x(function (d) {return self.xScale(d.x);})
		.y(function (d) {return self.yScale(d.y);});

	this.viewportRect
		.attr("width", this.width)
		.attr("height", this.height);

    if (!bDashed)
    	this.svg.append('path')
    		.attr("class", "topcurve")
    		.attr("clip-path", "url(#" + this.viewportClipId + ")")
    		.datum(data)
    		.attr('d', line)
    		.style("stroke", color)
    		.style("fill", "none");
    
    else
    	this.svg.append('path')
    		.attr("class", "topcurve")
    		.attr("clip-path", "url(#" + this.viewportClipId + ")")
    		.datum(data)
    		.attr('d', line)
    		.attr("stroke-dasharray", "10,10")
    		.style("stroke", color)
    		.style("fill", "none");
};

STAP.SVGGraph.prototype.normalDiagram = function(mean, stdev, left, right, bBetween)
{
	this.clearGraph();

	var fn = STAP.Utility.normalCurve(mean, stdev);
	
	var xScale = d3.scale.linear()
	.range([0, this.width]);
	
	var yScale = d3.scale.linear()
	.range([this.height, 0]);
	
	var xAxis = d3.svg.axis()
	.outerTickSize(0).scale(xScale);
	
	var yAxis = d3.svg.axis()
	.orient('left')
	.scale(yScale);

	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;
	
	var l4s = mean - 3.5 * stdev;
	var r4s = mean + 3.5 * stdev;
	
	xScale.domain([l4s, r4s]);
	yScale.domain([0, fn(mean)]);

	xAxis.tickFormat(format.d3NumberFormatter());
	var xTicks = [mean - 3 * stdev, mean - 2 * stdev, mean - stdev, mean,
			mean + stdev, mean + 2 * stdev, mean + 3 * stdev];
	STAP.SafeNumber.cleanArray(xTicks);
	xAxis.tickValues(xTicks);
	this.adjustWidthForLabels(xAxis);

	// plot the background
	this.drawBackground()
		
	var plotSelected = false;
	
	if (typeof left == "number")
	{
		if (left < l4s) left = l4s;
		plotSelected = true;
		if (typeof right != "number")
		{
			right = r4s;
			bBetween = true;
		}
		else if (right > r4s) right = r4s;
	}
	else if (typeof right == "number")
	{
		if (right > r4s) right = r4s;
		plotSelected = true;
		left = l4s;
		bBetween = true;
	}
	
	if (plotSelected)
	{
		var area = d3.svg.area()
		.interpolate("basis")
		.x(function (d) { return xScale(d.x); })
		.y0(this.height)
		.y1(function (d) { return yScale(d.y); });
				
		if (bBetween)
		{
			var seldata = this.fnRangeMap(fn, left, right, 80);

			this.svg.append('path')
			.attr('class', 'area')
			.datum(seldata)
			.attr('d', area);			
		}
		else
		{
			var seldata1 = this.fnRangeMap(fn, l4s, left, 80);
			var seldata2 = this.fnRangeMap(fn, right, r4s, 80);
			
			this.svg.append('path')
			.attr('class', 'area')
			.datum(seldata1)
			.attr('d', area);			

			this.svg.append('path')
			.attr('class', 'area')
			.datum(seldata2)
			.attr('d', area);			
		}
	}

	this.svg.append('g')
	.attr('class', 'axis')
	.attr('transform', 'translate(0,' + this.height + ')')
	.call(xAxis);

	// Finally, draw the Gaussian
	this.plotTopCurve(fn);

	STAP.Preferences.writeCSSRules();
};

STAP.SVGGraph.prototype.TDiagram = function(df, left, right, bBetween, bPlotNormal)
{
	this.clearGraph();
	
	var nfn = STAP.Utility.normalCurve(0, 1);

	var fn = function(x) {
	    return jStat.studentt.pdf(x, df);
	};

	var xScale = d3.scale.linear()
	.range([0, this.width]);
	
	var yScale = d3.scale.linear()
	.range([this.height, 0]);
	
	var xAxis = d3.svg.axis()
	.outerTickSize(0).scale(xScale);
	
	var yAxis = d3.svg.axis()
	.orient('left')
	.scale(yScale);

	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;

    var furthest = Math.max(4, 7 - df);
	var l4s = -furthest - 0.5;
	var r4s = furthest + 0.5;
    var xTicks = [];
    for (var i = -furthest; i <= furthest; i++)
        xTicks.push(i);
	xScale.domain([l4s, r4s]);
	yScale.domain([0, nfn(0)]);

	xAxis.tickFormat(format.d3NumberFormatter());
	STAP.SafeNumber.cleanArray(xTicks);
	xAxis.tickValues(xTicks);
	this.adjustWidthForLabels(xAxis);

	// plot the background
	this.drawBackground()
		
	var plotSelected = false;
	
	if (typeof left == "number")
	{
		if (left < l4s) left = l4s;
		plotSelected = true;
		if (typeof right != "number")
		{
			right = r4s;
			bBetween = true;
		}
		else if (right > r4s) right = r4s;
	}
	else if (typeof right == "number")
	{
		if (right > r4s) right = r4s;
		plotSelected = true;
		left = l4s;
		bBetween = true;
	}
	
	if (plotSelected)
	{
		var area = d3.svg.area()
		.interpolate("basis")
		.x(function (d) { return xScale(d.x); })
		.y0(this.height)
		.y1(function (d) { return yScale(d.y); });
				
		if (bBetween)
		{
			var seldata = this.fnRangeMap(fn, left, right, 80);

			this.svg.append('path')
			.attr('class', 'area')
			.datum(seldata)
			.attr('d', area);			
		}
		else
		{
			var seldata1 = this.fnRangeMap(fn, l4s, left, 80);
			var seldata2 = this.fnRangeMap(fn, right, r4s, 80);
			
			this.svg.append('path')
			.attr('class', 'area')
			.datum(seldata1)
			.attr('d', area);			

			this.svg.append('path')
			.attr('class', 'area')
			.datum(seldata2)
			.attr('d', area);			
		}
	}

	this.svg.append('g')
	.attr('class', 'axis')
	.attr('transform', 'translate(0,' + this.height + ')')
	.call(xAxis);

	// Finally, draw the t curve
	this.plotTopCurve(fn);

    // Also plot the normal curve if requested
    if (bPlotNormal)
        this.plotTopCurve(nfn, null, "#CC33CC", true, true);

	STAP.Preferences.writeCSSRules();
};

// chi-square diagram
STAP.SVGGraph.prototype.X2Diagram = function(df, left, right, bBetween)
{
	this.clearGraph();
	
	var fn = (df == 1 ? function(x) {
	    if (x < 0.01)
	        return 5;
	    else
    	    return jStat.chisquare.pdf(x, df);
	} : (df == 2 ? function(x) {
	    if (STAP.SafeNumber.isZeroWithinTolerance(x))
	        return 0.5;
	    else
    	    return jStat.chisquare.pdf(x, df);
	} : function(x) { return jStat.chisquare.pdf(x, df); }));

	var xScale = d3.scale.linear()
	.range([0, this.width]);
	
	var yScale = d3.scale.linear()
	.range([this.height, 0]);
	
	var xAxis = d3.svg.axis()
	.outerTickSize(0).scale(xScale);
	
	var yAxis = d3.svg.axis()
	.orient('left')
	.scale(yScale);

	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;

    var farthest = jStat.chisquare.inv(0.999, df);
    var max = (df == 1 ? 4 : (df == 2 ? 0.5 : jStat.chisquare.pdf(df - 2, df)));
	xScale.domain([0, farthest]);
	yScale.domain([0, max]);

	this.adjustWidthForLabels(xAxis);

	// plot the background
	this.drawBackground();
		
	var plotSelected = false;
	
	if (typeof left == "number")
	{
		if (left < 0) left = 0;
		plotSelected = true;
		if (typeof right != "number")
		{
			right = farthest;
			bBetween = true;
		}
		else if (right > farthest) right = farthest;
	}
	else if (typeof right == "number")
	{
		if (right > farthest) right = farthest;
		plotSelected = true;
		left = 0;
		bBetween = true;
	}
	
	if (plotSelected)
	{
		var area = d3.svg.area()
		.interpolate("basis")
		.x(function (d) { return xScale(d.x); })
		.y0(this.height)
		.y1(function (d) { return yScale(d.y); });
				
		if (bBetween)
		{
			var seldata = this.fnRangeMap(fn, left, right, 80);

			this.svg.append('path')
			.attr('class', 'area')
			.datum(seldata)
			.attr('d', area);			
		}
		else
		{
			var seldata1 = this.fnRangeMap(fn, 0, left, 80);
			var seldata2 = this.fnRangeMap(fn, right, farthest, 80);
			
			this.svg.append('path')
			.attr('class', 'area')
			.datum(seldata1)
			.attr('d', area);			

			this.svg.append('path')
			.attr('class', 'area')
			.datum(seldata2)
			.attr('d', area);			
		}
	}

	this.svg.append('g')
	.attr('class', 'axis')
	.attr('transform', 'translate(0,' + this.height + ')')
	.call(xAxis);

	// Finally, draw the chi-square curve
	this.plotTopCurve(fn, 100);

	STAP.Preferences.writeCSSRules();
    
/* OLD
	this.clearGraph();
	
	var fn = (df == 1 ? function(x) {
	    if (x < 0.01)
	        return 5;
	    else
    	    return jStat.chisquare.pdf(x, df);
	} : (df == 2 ? function(x) {
	    if (STAP.SafeNumber.isZeroWithinTolerance(x))
	        return 0.5;
	    else
    	    return jStat.chisquare.pdf(x, df);
	} : function(x) { return jStat.chisquare.pdf(x, df); }));

	var xScale = d3.scale.linear()
	.range([0, this.width]);
	
	var yScale = d3.scale.linear()
	.range([this.height, 0]);
	
	var xAxis = d3.svg.axis()
	.outerTickSize(0).scale(xScale);
	
	var yAxis = d3.svg.axis()
	.orient('left')
	.scale(yScale);

	// In quantitative graphs, save scale and axis for later
	this.xScale = xScale;
	this.xAxis = xAxis;
	this.yScale = yScale;
	this.yAxis = yAxis;

    var right = jStat.chisquare.inv(0.999, df);
    var max = (df == 1 ? 4 : (df == 2 ? 0.5 : jStat.chisquare.pdf(df - 2, df)));
	xScale.domain([0, right]);
	yScale.domain([0, max]);

	this.adjustWidthForLabels(xAxis);

	// plot the background
	this.drawBackground()
		
	var plotSelected = false;
	
	if (typeof left == "number")
	{
		if (left < 0) left = 0;
		plotSelected = true;
	}

	if (plotSelected)
	{
		var area = d3.svg.area()
		.interpolate("basis")
		.x(function (d) { return xScale(d.x); })
		.y0(this.height)
		.y1(function (d) { return yScale(d.y); });
				
		var seldata = this.fnRangeMap(fn, left, right, 80);
		
		this.svg.append('path')
		.attr('class', 'area')
		.datum(seldata)
		.attr('d', area);
	}

	this.svg.append('g')
	.attr('class', 'axis')
	.attr('transform', 'translate(0,' + this.height + ')')
	.call(xAxis);

	// Finally, draw the chi-square curve
	if (df == 1) // use higher precision for df = 1
    	this.plotTopCurve(fn, 100);
    else
    	this.plotTopCurve(fn);
    
	STAP.Preferences.writeCSSRules();
*/
};

/** UIHandlers */
// A collection of functions to make certain UI operations easier.
STAP.UIHandlers =
{
    /** Functions for handling input states (to restore inputs to forms) */
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
                STAP.UIHandlers.batchSetStyleProperty(this.controlIds, "display", "inline");
            },
            hide: function() {
                STAP.UIHandlers.batchSetStyleProperty(this.controlIds, "display", "none");
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
    // This method hides the page before running the onload to prevent flicker
    // as the body onload code is executed.
    setOnLoad: function(func)
    {
    	var prepFunc = function(){ document.body.style.display = "none"; }
        if (document.addEventListener)
            document.addEventListener("DOMContentLoaded", prepFunc, false);
        else if (document.attachEvent)
            document.attachEvent("onDOMContentLoaded", prepFunc);

        var loadFunc = function(){
            try
            {
	            func();
	            if (STAP.UIHandlers.browserError)
	                STAP.UIHandlers.setProperty("spnBrowserMsg", "innerHTML",
	                    STAP.UIHandlers.browserError);
	    } catch(e)
	    {
	    	console.error(e);
	    }
	    document.body.style.display = "block";
	};
        if (window.addEventListener)
            window.addEventListener("load", loadFunc, false);
        else if (window.attachEvent)
            window.attachEvent("onload", loadFunc);
        else if (window.onload)
            window.onload = loadFunc;
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
        var ctl = STAP.UIHandlers.extractElement(elt, cls);
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
    },
    
    // https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
    inIFrame: function()
    {
	    try {
	        return window.self !== window.top;
	    } catch (e) {
	        return true;
	    }
	 },

    // Not-very-graceful way of attempting to handle StatsMedic embed link colors based on top-level access vs. embedded iFrame.
    writeLinkColorOriginRules: function()
    {
    	if (STAP.UIHandlers.inIFrame())
    	{
	    	d3.selectAll("a")
		      .style("color", "rgb(237,28,36)");
    	}
    },

    defaultAsyncFailHandler: function(action)
    {
        return function() {
            console.log("Contact with the server failed" +
                (action ? " during " + action : ""));
        };
    },

    defaultAsyncErrorHandler: function(action)
    {
        return function(xhttp) {
            console.log("Server returned status " + xhttp.status +                 (action ? " during " + action : "") + ": " + xhttp.statusText);
        };
    },
    
    HTTPRequest: function(isGet, url, queryString, fnSucc, fnFail, fnError)
    {
        var xhttp = new XMLHttpRequest();
    
        if (fnFail) xhttp.onerror = fnFail;

        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                    if (fnSucc) fnSucc(util.trimString(this.responseText));
                else
                    if (fnError) fnError(xhttp);
            }
        };

        if (isGet)
        {
            xhttp.open("GET", url + "?" + queryString);
            xhttp.send();
        }
        else
        {
            xhttp.open("POST", url);
            xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhttp.send(queryString);
        }
    },
    
    _overlayExec: null,
    _overlayClickExec: null,
    _overlayClickHandler: null,
    _overlayPersist: false,
    
    overlayWarning: function(divid, html, timems, fnClick)
    {
        this._overlayPersist = (timems == 0);
        if (this._overlayExec)
        {
            clearTimeout(this._overlayExec);
            this._overlayExec = null;
        }
        if (this._overlayClickExec)
        {
            clearTimeout(this._overlayClickExec);
            this._overlayClickExec = null;
        }
        
        this.setProperty(divid, "className", "overlayWarning");
        this.setProperty(divid, "innerHTML", html);
        this.setStyleProperty(divid, "visibility", "visible");
        this.setStyleProperty(divid, "opacity", "1");
        
        if (timems)
            this._overlayExec = setTimeout(function() {
                if (!STAP.UIHandlers._overlayPersist)
                {
                    STAP.UIHandlers.setStyleProperty(divid, "opacity", "0");
                    STAP.UIHandlers.setStyleProperty(divid, "visibility", "hidden");
                }
            }, timems);
        
        if (this._overlayClickHandler)
            document.getElementById(divid).removeEventListener('click', this._overlayClickHandler);            
        
        this._overlayClickHandler = function(event) {
            STAP.UIHandlers.setStyleProperty(divid, "opacity", "0");
            STAP.UIHandlers.setStyleProperty(divid, "visibility", "hidden");
            if (fnClick) fnClick();
            document.getElementById(divid).removeEventListener('click', STAP.UIHandlers._overlayClickHandler);
            STAP.UIHandlers._overlayClickHandler = null;
        };
        
        document.getElementById(divid).addEventListener('click', this._overlayClickHandler);
        
        if (timems)
            this._overlayClickExec = setTimeout(function() {
                if (!STAP.UIHandlers._overlayPersist)
                {
                    document.getElementById(divid).removeEventListener('click',
                        STAP.UIHandlers._overlayClickHandler);
                    STAP.UIHandlers._overlayClickHandler = null;
                }
            }, timems);
    },
    
    clearOverlayWarning: function(divid)
    {
        this.setStyleProperty(divid, "visibility", "hidden");
        this.setStyleProperty(divid, "opacity", "0");
        if (this._overlayExec)
        {
            clearTimeout(this._overlayExec);
            this._overlayExec = null;
        }
        if (this._overlayClickExec)
        {
            clearTimeout(this._overlayClickExec);
            this._overlayClickExec = null;
        }
        if (this._overlayClickHandler)
        {
            document.getElementById(divid).removeEventListener('click', this._overlayClickHandler);            
            this._overlayClickHandler = null;
        }
        this._overlayPersist = false;
    }
};

/** HTMLStemplot */
// HTML table-based single-group stemplot
STAP.HTMLStemplot = function(containerID)
{
    this.containerID = containerID;
};

// Make a stemplot whose stems are split into groups of splitlevel
// where the leaves are at the least significant power of 10, adjusted upward
// by sigAdj
STAP.HTMLStemplot.prototype.stemplot = function(data1, name1, varname, splitLevel, sigAdj, gapHide, data2, name2)
{
    if (!splitLevel) splitLevel = 1;
    if (!sigAdj) sigAdj = 0;
    if (!gapHide || gapHide < 3) gapHide = 3;
    if (sigAdj < 0) sigAdj = 0;
    this.variableName = (varname) ? varname : "";
    this.data1 = data1.slice(0);
    this.grp1Name = (name1) ? name1 : "";
    this.data2 = (data2) ? data2.slice(0) : [];
    this.grp2Name = (name2) ? name2 : "";
    STAP.Utility.sortArrayAscending(this.data1);
    STAP.Utility.sortArrayAscending(this.data2);
    this.dataAgg = [];
    var c1 = 0;
    var c2 = 0;
    var aggNegFlag = false;
    while (c1 < this.data1.length && c2 < this.data2.length)
    {
        var dataflag = (this.data1[c1] < this.data2[c2]) ? 1 : 2;
        var pushval = (this.data1[c1] < this.data2[c2]) ? this.data1[c1++] : this.data2[c2++];
        if (STAP.SafeNumber.compareToWithinTolerance(pushval, 0) < 0)
            aggNegFlag = true;
        this.dataAgg.push({
                val: pushval,
                flag: dataflag
            });
    }
    while (c1 < this.data1.length)
    {
        var pushval = this.data1[c1++];
        if (STAP.SafeNumber.compareToWithinTolerance(pushval, 0) < 0)
            aggNegFlag = true;
        this.dataAgg.push({ val: pushval, flag: 1});
    }
    while (c2 < this.data2.length)
    {
        var pushval = this.data2[c2++];
        if (STAP.SafeNumber.compareToWithinTolerance(pushval, 0) < 0)
            aggNegFlag = true;
        this.dataAgg.push({ val: pushval, flag: 2});
    }

    var sig = Number.MAX_VALUE;
    for (var i = 0; i < this.dataAgg.length; i++)
    {
        sig = Math.min(sig, STAP.SafeNumber.getLSPow10(this.dataAgg[i].val));
    }
    sig += sigAdj;

    var stem = function(val)
    {
        var adjval = val/Math.pow(10,sig+1);
        if (STAP.SafeNumber.compareToWithinTolerance(adjval, Math.round(adjval)) == 0)
            return Math.round(adjval);
        else
            return Math.trunc(adjval);
    };
    
    var leaf = function(val)
    {
        var adjval = val/Math.pow(10,sig+1);
        var pleaf = Number(Math.abs(adjval - Math.trunc(adjval)) * 10);
        if (STAP.SafeNumber.compareToWithinTolerance(pleaf, Math.round(pleaf)) == 0)
            return Math.round(pleaf) % 10;
        else
            return Math.trunc(pleaf) % 10;
    };
    
    var entries = [];
    if (this.dataAgg.length > 0)
    {
        var leafGroup = function(val)
        {
            var v = leaf(val);
            var posGroup = Math.floor(v / (10 / splitLevel));
            if (STAP.SafeNumber.compareToWithinTolerance(val, 0) >= 0)
                return posGroup;
            else
                return (splitLevel - 1) - posGroup;
        };
        
        var items = [this.dataAgg[0]];
        var currentVal = this.dataAgg[0].val;
        var currentStem = stem(currentVal);
        var currentLeafGroup = leafGroup(currentVal);
        
        var belongs = function(val)
        {
            if (aggNegFlag && STAP.SafeNumber.compareToWithinTolerance(val,0) >= 0) return false;
            if (stem(val) != currentStem) return false;
            if (leafGroup(val) != currentLeafGroup) return false;
            return true;
        };
        
        var self = this;
        
        var pushEntry = function()
        {
            var stemstr = (currentStem == 0 && aggNegFlag ? "-" : "") + currentStem;
            var leaf1str = null;
            var leaf2str = null;
            for (var i = 0; i < items.length; i++)
            {
                var leafval = Math.abs(leaf(items[i].val)); // prevents "-" on leaf
                if (items[i].flag == 2)
                    leaf2str = ((leaf2str) ? (leaf2str + " ") : "") + leafval;
                else if (self.data2.length == 0)
                    leaf1str = ((leaf1str) ? (leaf1str + " ") : "") + leafval;
                else
                    leaf1str = leafval + ((leaf1str) ? (" " + leaf1str):"");
            }
            if (!leaf1str) leaf1str = "";
            if (!leaf2str) leaf2str = "";
            entries.push({ stem: stemstr, leaf1: leaf1str, leaf2: leaf2str});
            items = [];
        };
        
        var pushEmpty = function(arr)
        {
            if (!arr) arr = entries;
            var stemstr = (currentStem == 0 && aggNegFlag ? "-" : "") + currentStem;
            arr.push({ stem: stemstr, leaf1: "", leaf2: ""});
        };
        
        var pushBreak = function()
        {
            entries.push({ stem: ".", leaf1: "", leaf2: "" });
        };
        
        var index = 1;
        while (index < this.dataAgg.length)
        {
            currentVal = this.dataAgg[index].val;
            if (!belongs(currentVal))
            {
                pushEntry();
                var emptyBuffer = [];
                var skipFlag = false;
                while (!belongs(currentVal))
                {
                    currentLeafGroup = (currentLeafGroup + 1) % splitLevel;
                    if (currentLeafGroup == 0)
                    {
                        if (aggNegFlag && currentStem == 0)
                            aggNegFlag = false;
                        else
                            currentStem++;
                    }
                    if (!skipFlag && !belongs(currentVal))
                    {
                        pushEmpty(emptyBuffer);
                        if (emptyBuffer.length >= gapHide)
                            skipFlag = true;
                    }
                }
                if (skipFlag)
                    pushBreak();
                else
                    for (var i = 0 ; i < emptyBuffer.length; i++)
                        entries.push(emptyBuffer[i]);
            }
            items.push(this.dataAgg[index++]);
        }
        pushEntry();
    }
    
    var numColumns = (this.data2.length > 0) ? 3 : 2;

    var tblStr = '<BR><TABLE CLASS="stemplotTable">';
    if (numColumns == 3 && (this.grp1Name.length + this.grp2Name.length) > 0)
        tblStr += '<TR><TH COLSPAN="2" CLASS="stemplotVar1">' + this.grp1Name + '</TH><TH CLASS="stemplotHeader"></TH><TH COLSPAN="2" CLASS="stemplotVar2">' + this.grp2Name + '</TH></TR>';
    else if (this.grp1Name.length > 0)
        tblStr += '<TR><TH></TH><TH CLASS="stemplotHeader">' + this.grp1Name + '</TH></TR>';
    for (var j = 0; j < entries.length; j++)
    {
        if (numColumns == 3)
            tblStr += '<TR><TD COLSPAN="2" CLASS="stemplotRightAlign">' + entries[j].leaf1 + '</TD><TD CLASS="stemplotCenterStem">' + entries[j].stem + '</TD><TD COLSPAN="2" CLASS="stemplotLeftAlign">' + entries[j].leaf2 + '</TD></TR>';
        else
            tblStr += '<TR><TD CLASS="stemplotLeftStem">' + entries[j].stem + '</TD><TD CLASS="stemplotLeftAlign">' + entries[j].leaf1 + '</TD></TR>';
    }
    if (this.variableName.length > 0)
    {
        if (numColumns == 3)
            tblStr += '<TR><TH CLASS="stemplotHeader"></TH><TH COLSPAN="' + numColumns + '" CLASS="stemplotFooter">' + this.variableName + '</TH><TH CLASS="stemplotHeader"></TH></TR>';
        else
            tblStr += '<TR><TH COLSPAN="' + numColumns + '" CLASS="stemplotHeader">' + this.variableName + '</TH></TR>';        
    }
    if (numColumns == 3)
        tblStr += '<TR><TH CLASS="stemplotHeader"></TH><TH COLSPAN="' +numColumns+ '" CLASS="stemplotFooter">KEY: ' + stem(currentVal) + '|' + leaf(currentVal) + ' = ' + STAP.Format.formatNumber(currentVal) + '</TH><TH CLASS="stemplotHeader"></TH></TR></TABLE>';
    else
        tblStr += '<TR><TH COLSPAN="' +numColumns+ '" CLASS="stemplotHeader">KEY: ' + stem(currentVal) + '|' + leaf(currentVal) + ' = ' + STAP.Format.formatNumber(currentVal) + '</TH></TR></TABLE>';

    if (this.containerID)
    {
        var elt = document.getElementById(this.containerID);
        if (elt) elt.innerHTML = tblStr;
    }
};

/** InputValidation */
// A variety of methods for validating form inputs
STAP.InputValidation = 
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
        else if (STAP.SafeNumber.compareToWithinTolerance(val, fVal) !== 0)
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

    // Facility for checking whether a particular input control contains a valid proportion between 0 and 1 inclusive.
    // If the preferences indicate a proportion displayed as percent, it is divided by 100 before checking.
    // The function returns an object containing the parsed proportion and percent.
    //
    // inputID: the input control itself
    // Optionals:
    // spnMsg: a SPAN in which to write the error message
    // msgParamName: the parameter name to output to the user in the error message
    // altRangeMsg: if the parameter is out of range, a more friendly/specific error to output
    validateInputProportion: function(inputID, bCheckBounds, spnMsgID, msgParamName, altRangeMsg)
    {
        var input = document.getElementById(inputID);
        var spnMsg = (spnMsgID ? document.getElementById(spnMsgID) : null);
	var pref = STAP.Preferences;
	
	var strMeasure = pref.getPreference(pref.keys.proportion.display_type);
	
        var val = parseFloat(input.value);
        var valid = true;
    
        if (!msgParamName) msgParamName = "Input";
       
        if (isNaN(val))
        {
            if (spnMsg)
                spnMsg.innerHTML = msgParamName + " must be numeric.";
            valid = false;
        }
	else
	{
		if (strMeasure == "percent") val /= 100;
	
	        if (bCheckBounds && (val < 0 || val > 1))
	        {
	            if (spnMsg)
	                spnMsg.innerHTML = msgParamName + " " + (altRangeMsg ? altRangeMsg : "must be a valid " + strMeasure + ".");
	            valid = false;
	        }
	        else if (val < 0.01)
	        {
	            if (spnMsg)
	                spnMsg.innerHTML =
    "WARNING: The specified percentage is very small. " +
    "Did you enter a proportion by accident?";
	        }
	        else
	        {
	            if (spnMsg)
	                spnMsg.innerHTML = "";
	        }
	}
	if (!valid) return null;
	else
	{
		var retval =
		{
			parsedProportion: val,
			parsedPercent: (val * 100)
		};
		return retval;
	}
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
        var arr = STAP.Utility.splitString(input.value);
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
STAP.Statistics =
{
    // Constants for test directions
    ONE_SIDED_LT: 0,
    TWO_SIDED: 1,
    ONE_SIDED_GT: 2,

    // Get a map containing a variety of statistics for a given array of univariate quantitative data    
    getOneVariableStatistics: function(arr)
    {
        var sArr = arr.slice(0);
        STAP.Utility.sortArrayAscending(sArr);
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
                sample.push(arr[STAP.Utility.randomIntFromInterval(0, arr.length - 1)]);
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
                simarr.push((STAP.Utility.randomIntFromInterval(0, 1)) ? arr[j] : -arr[j]);
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
            STAP.Utility.knuthShuffle(allData);
            var sample1 = allData.slice(0, arr1.length);
            var sample2 = allData.slice(arr1.length);
            diffs.push(jStat.mean(sample1) - jStat.mean(sample2));
        }
        return diffs;
    },

    // Return an array of n trials of shuffling outcomes into two piles equal to the original
    // size and calculating the median difference
    simulationDiffMedians: function(arr1, arr2, n)
    {
        var allData = arr1.concat(arr2);
        var diffs = [];
        for (var i = 0; i < n; i++)
        {
            STAP.Utility.knuthShuffle(allData);
            var sample1 = allData.slice(0, arr1.length);
            var sample2 = allData.slice(arr1.length);
            diffs.push(jStat.median(sample1) - jStat.median(sample2));
        }
        return diffs;
    },

    // Return an array of n trials of shuffling outcomes into two piles equal to the original
    // size and calculating the mean difference
    simulationDiffSDs: function(arr1, arr2, n)
    {
    	var mean1 = jStat.mean(arr1);
    	var mean2 = jStat.mean(arr2);
    	var arrDev1 = arr1.map(function(x) { return x - mean1; });
    	var arrDev2 = arr2.map(function(x) { return x - mean2; });
        var allData = arrDev1.concat(arrDev2);
        var diffs = [];
        for (var i = 0; i < n; i++)
        {
            STAP.Utility.knuthShuffle(allData);
            var sample1 = allData.slice(0, arr1.length);
            var sample2 = allData.slice(arr1.length);
            diffs.push(jStat.stdev(sample1, true) - jStat.stdev(sample2, true));
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
                if (STAP.Utility.randomIntFromInterval(1, nPool--) <= xPool)
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
            STAP.Utility.knuthShuffle(yArr);
            slopes.push(this.polynomialRegression(xArr, yArr, 1).coeffs[1]);
        }
        return slopes;
    },

    // Return an array of n simulated correlations in which the response array is shuffled randomly    
    // (The parameters are copied and left unchanged)
    simulateCorrelations: function(arrExp, arrResp, n)
    {
        var xArr = arrExp.slice(0);
        var yArr = arrResp.slice(0);
        var corrs = [];
        for (var i = 0; i < n; i++)
        {
            STAP.Utility.knuthShuffle(yArr);
            corrs.push(jStat.corrcoeff(xArr, yArr));
        }
        return corrs;
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

    // Verify a proposed array of predictors is linearly independent
    isLinearlyIndependent: function(arrArr)
    {
	// Each arrArr is a variable so arrArr[0] is the first explanatory variable
	// arrArr[m][n-1] is the value of the mth explanatory variable for the nth data point

        var m = jStat.create(arrArr[0].length, arrArr.length + 1, function(r, c) {
           if (c === 0)
		return 1;
	   else
		return arrArr[c-1][r]; // "on the fly transpose"
        });
        var mt = jStat.transpose(m);
	
	return !isNaN(jStat.inv(jStat.multiply(mt, m))[0][0]);
    },

    // Expects all x- and y-arr to be the same length
    // Returns a containing object with the coefficients as follows:
    // constant, then same order as each explanatory
    // arrX is an array of arrays
    multipleRegression: function(arrX, arrY)
    {
	// Each arrX is a variable so arrX[0] is the first explanatory variable
	// arrX[m][n-1] is the value of the mth explanatory variable for the nth data point

        var m = jStat.create(arrY.length, arrX.length + 1, function(r, c) {
           if (c === 0)
		return 1;
	   else
		return arrX[c-1][r]; // "on the fly transpose"
        });
        var y = jStat.transpose(arrY);
        var mt = jStat.transpose(m);
        
        // Following algorithm taken from Elementary Linear Algebra, Anton 10/e p. 473
        var coeffs = (arrX.length > 0) ? jStat.transpose(jStat.multiply(jStat.multiply(jStat.inv(jStat.multiply(mt,m)),mt),y))
       					: [jStat.mean(arrY)];
       					
        // Use a generic method for finding r-squared, r^2 = SSreg / SStotal

	// Evaluate the model response at the data point with index n
        var fn = function(n) {
                var val = coeffs[0];
                for (var i = 1; i < coeffs.length; i++)
                    val += coeffs[i] * arrX[i-1][n];
                return val;
            };
            
        var residuals = new Array(arrY.length);
        var ybar = jStat.mean(arrY);
        var SST = 0;
        var SSreg = 0;
        var sumSqrResid = 0;
        for (var i = 0; i < arrY.length; i++)
        {
            SST += Math.pow(arrY[i] - ybar, 2);
            var yhat = fn(i);
            residuals[i] = arrY[i] - yhat;
            sumSqrResid += Math.pow(residuals[i], 2);
            SSreg += Math.pow(yhat - ybar, 2);
        }
        return {
            coeffs: coeffs,
            residuals: residuals,
            rSquared: SSreg/SST,
            S: Math.sqrt(sumSqrResid / (arrY.length - (arrX.length + 1))),
            prediction: function(xArr)
            {
            	var result = coeffs[0];
            	for (var i = 1; i < coeffs.length; i++)
            		result += xArr[i-1] * coeffs[i];
            	return result;
            }
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

    // Return an SVGGraph-able data set corresponding to the binomial probabilities
    // Log-based PDF required to prevent underflowing:
    // https://stackoverflow.com/questions/22201913/computing-a-binomial-probability-for-huge-numbers
    binomialProbabilityDistribution: function(n, p)
    {
    	var dist = [];
        for (var i = 0; i <= n; i++)
        {
            var val = Math.exp(jStat.gammaln(n+1) - jStat.gammaln(n-i+1) - jStat.gammaln(i+1) + i*Math.log(p) + (n-i)*Math.log(1-p));
            if (isNaN(val)) val = 1;
    	    dist.push({
	        	x: i,
	        	px: val
	         });
        }
        
    	return dist;
    },

    // PRECONDITION: s is a non-null string
    streakCount: function(s)
    {
	if (s.length == 0) return 0;

	var streaks = 1;
	var currChar = s.charAt(0);
	for (var i = 1; i < s.length; i++)
		if (s.charAt(i) !== currChar)
		{
			streaks++;
			currChar = s.charAt(i);
		}
	return streaks;
    },
    
    oneWayANOVA: function(dataArrArr)
    {
       var N = 0;
       dataArrArr.forEach(function(arr) { N += arr.length; });
       var F = jStat.anovafscore(dataArrArr);
       var retval = {};
       retval.F = F;
       retval.pValue = jStat.ftest(F, dataArrArr.length - 1, N - dataArrArr.length);
       retval.dfb = dataArrArr.length - 1;
       retval.dfw = N - dataArrArr.length;
       return retval;
      /*
       return
       {
       	   F: F,
       	   pValue: jStat.ftest(F, dataArrArr.length - 1, N - dataArrArr.length),
       	   dfb: dataArrArr.length - 1,
       	   dfw: N - dataArrArr.length;
       };
       */
    },
    
    oneWayANOVAStats: function(means, SDs, ns)
    {
    	var N = 0;
    	ns.forEach(function(n) { N += n; });
    	var grandsum = 0;
    	for (var i = 0; i < means.length; i++)
    		grandsum += (means[i] * ns[i]);
    	var grandmean = grandsum / N;
	
    	var ssb = 0;
    	for (var i = 0; i < means.length; i++)
    		ssb += Math.pow(ns[i] * means[i], 2) / ns[i];
    	ssb -= Math.pow(grandsum, 2) / N;
    	
    	var ssw = 0;
    	for (var i = 0; i < SDs.length; i++)
    		ssw += Math.pow(SDs[i], 2) * (ns[i] - 1);
    	
    	var F = (ssb / ssw) * (N - means.length) / (means.length - 1);
    	var retval = {};
    	retval.F = F;
    	retval.ssb = ssb;
    	retval.ssw = ssw;
    	retval.pValue = jStat.ftest(F, means.length - 1, N - means.length);
    	retval.dfb = means.length - 1;
       	retval.dfw = N - means.length;
       	return retval;
/*
       return
       {
       	   Fscore: Fratio,
       	   ssb: ssb,
       	   ssw: ssw,
       	   pValue: jStat.ftest(Fratio, means.length - 1, N - means.length),
       	   dfb: means.length - 1,
       	   dfw: N - means.length;
       };    	
*/
    }
};

/** CategoricalData1Var */
// Collection of categories and frequencies.
STAP.CategoricalData1Var = function()
{
    this.frequencies = {};
    this.categories = [];
};

// Given the raw data input, split it into individual observations
// and tally each string found
STAP.CategoricalData1Var.prototype.addDataString = function(str)
{
    var arr = STAP.Utility.splitString(str);
    for (var i = 0; i < arr.length; i++)
        this.addFrequencyFor(STAP.Utility.trimString(arr[i]));
};

// Given a category, add the specified frequency for that category (or 1 if it is not specified).
// Create a new category if the category you observe has not yet been recorded.
STAP.CategoricalData1Var.prototype.addFrequencyFor = function(cat, freq)
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
STAP.CategoricalData1Var.prototype.deleteCategory = function(cat)
{
    if (this.frequencies[cat])
    {
        delete this.frequencies[cat]; 
        this.categories.splice(cat, 1);
    }
};

// Remove only the frequencies from this object, not the categories
STAP.CategoricalData1Var.prototype.clearFrequencies = function()
{
    for (var cat in this.frequencies) this.frequencies[cat] = 0;
};

// Remove all tallied data from this object
STAP.CategoricalData1Var.prototype.clear = function()
{
    for (var cat in this.frequencies) this.deleteCategory(cat);
};

// Count the total frequency of all categories observed in this object
STAP.CategoricalData1Var.prototype.getTotalFrequency = function()
{
    var total = 0;
    for (var cat in this.frequencies) total += this.frequencies[cat];
    return total;
};

// Determine the category with the highest frequency
STAP.CategoricalData1Var.prototype.getMostFrequentCategory = function()
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

// Make a data array suitable for SVGGraph
STAP.CategoricalData1Var.prototype.toDataArray = function(attrName)
{
	attrName = attrName || "Category";
	var retval = [];
	var total = this.getTotalFrequency();
	for (var cat in this.frequencies)
	{
		var obj = {};
		obj[attrName] = cat;
		obj["Frequency"] = this.frequencies[cat];
		obj["Relative Frequency"] = this.frequencies[cat] / total;
		retval.push(obj);
	}
	return retval;
};

/** CategoricalData2Var */
// Represents a matrix of observations.
// You must specify the row and column headings along with your two-dimensional array of data, if you have one;
// otherwise a blank table will be created from the row and column headings
STAP.CategoricalData2Var = function(rowCategoriesArr, columnCategoriesArr, data2DArr)
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
STAP.CategoricalData2Var.prototype.addFrequencyFor = function(rowKey, colKey, freq)
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
STAP.CategoricalData2Var.prototype.getFrequencyFor = function(rowKey, colKey)
{
    return this.data[this.rowCategoryIndexMap[rowKey]][this.columnCategoryIndexMap[colKey]];
};

// Clear all data in this object.
STAP.CategoricalData2Var.prototype.clear = function()
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

// Get a row total given a category.
STAP.CategoricalData2Var.prototype.getRowTotal = function(rowKey)
{
    return this.rowTotals[this.rowCategoryIndexMap[rowKey]];
};

// Get a column total given a category.
STAP.CategoricalData2Var.prototype.getColumnTotal = function(colKey)
{
    return this.columnTotals[this.columnCategoryIndexMap[colKey]];
};

// Get the conditional distribution of the columns given a row.
STAP.CategoricalData2Var.prototype.getRowConditionalDistribution = function(rowKey)
{
    var index = this.rowCategoryIndexMap[rowKey];
    return jStat.divide(this.data[index], this.rowTotals[index]);
};

// Get the conditional distribution of the rows given a column.
STAP.CategoricalData2Var.prototype.getColumnConditionalDistribution = function(colKey)
{
    var colIndex = this.columnCategoryIndexMap[colKey];
    var retval = [];
    for (var i = 0; i < this.data.length; i++)
        retval.push(this.data[i][colIndex] / this.columnTotals[colIndex]);
    return retval;
};

/** DiscreteProbabilityDistribution */
// A collection that maps a numeric value to its probability
STAP.DiscreteProbabilityDistribution = function(valueArr, probsArr)
{
	this.values = valueArr.slice(0);
	this.probabilities = probsArr.slice(0);
};

STAP.DiscreteProbabilityDistribution.prototype.getGraphData = function()
{
	var graphData = [];
	for (var i = 0; i < this.values.length; i++)
		graphData.push({x: this.values[i], px: this.probabilities[i]});

	STAP.Utility.sortArrayAscendingByProperty(graphData, "x");
	return graphData;
};

// Returns true if this probability distribution is valid:
//  - no negative probabilities
//  - sum of probabilities is 1
STAP.DiscreteProbabilityDistribution.prototype.isValid = function()
{
    // NOTE: Because of typical rounding errors, the tolerance for the totals of the probabilities
    // being equal to 1 is much lower than it would normally be -- only two decimal places.
    if (!STAP.SafeNumber.isZeroWithinTolerance(jStat.sum(this.probabilities) - 1, 2))
        return false;
    for (var i = 0; i < this.probabilities.length; i++)
    {
        var curr = this.probabilities[i];
        if (curr < 0 || curr > 1)
            return false;
    }
    return true;
};

// Get the lowest difference between any two successive values in the probability dist.
STAP.DiscreteProbabilityDistribution.prototype.getLeastValueDiff = function()
{
    var vals = this.values.slice(0);
    STAP.Utility.sortArrayAscending(vals);
    var leastDiff = Number.POSITIVE_INFINITY;
    for (var i = 0; i < vals.length - 1; i++)
    {
        var diff = STAP.SafeNumber.roundWithinTolerance(vals[i+1] - vals[i]);
        if (diff < leastDiff) leastDiff = diff;
    }
    return leastDiff;
};

// Convert the probabilities to a set of integers representing the values in
// minimal frequencies.
STAP.DiscreteProbabilityDistribution.prototype.getDiscreteData = function()
{
    var safenum = STAP.SafeNumber;
    if (!this.probabilities) return;
    var lowestLS = safenum.getLSPow10(this.probabilities[0]);
    for (var i = 1; i < this.probabilities.length; i++)
    {
        var ls = safenum.getLSPow10(this.probabilities[i]);
        if (ls < lowestLS) lowestLS = ls;
    }
    var retvals = [];
    for (var j = 0; j < this.probabilities.length; j++)
    {
        var freq = this.probabilities[j] * Math.pow(10, -lowestLS);
        while (safenum.compareToWithinTolerance(freq, 0) > 0)
        {
            retvals.push(this.values[j]);
            freq -= 1;
        }
    }
    return retvals;
};

// Get the parameters (mean, SD, etc.) for this probability distribution.
STAP.DiscreteProbabilityDistribution.prototype.getStatistics = function()
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

// This code is run once to ensure that the preferences in storage are valid
STAP.Preferences.validatePreferences();

// The following code ensures that the MS Excel paste handler is always loaded.
// It catches paste events at the document level and preprocesses them if needed
if (document.addEventListener)
    document.addEventListener("paste", STAP.UIHandlers.pasteFromExcelHandler);
else if (document.attachEvent)
    document.attachEvent("onpaste", STAP.UIHandlers.pasteFromExcelHandler);