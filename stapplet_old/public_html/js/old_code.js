/* From Utility
 
   // 14-color spectrum of standard CSS names, arranged in alphabetical order.
    // This omits "white", "black" and "lime".
    spectrumColors: ["fuchsia", "maroon", "navy", "teal", "silver", "blue", "purple", "gray",
                    "red", "orange", "green", "olive", "aqua", "yellow"],

    // If you have more colors than the ones above, random colors will be picked
    // and added to the spectrum for later use (in same page session)
    getSpectrumColor: function(i)
    {
        var util = STAP.Utility;
        if (i < util.spectrumColors.length) return util.spectrumColors[i];
        else
        {
            var col = "rgb(" + util.randomIntFromInterval(0, 255) + "," + util.randomIntFromInterval(0, 255) +
                    "," + util.randomIntFromInterval(0, 255) + ")";
            util.spectrumColors.push(col);
            return col;
        }
    },
*/    

/*	Use of label.centroid in pie chart

	arc.append("text")
	      .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
	      .attr("dy", "0.35em")
	      .attr("font", STAP.Preferences.getPreferredFontCSS())
	      .attr("text-anchor", "middle")
	      .text(function(d) { return d.data[labelAttr]; });
*/


/* From STAP.histogram
	var getBinCounts = function(arr, n)
	{
		arr = arr.slice(0);
		STAP.Utility.sortArrayAscending(arr);
		var range = arr[arr.length - 1] - arr[0];
		var binwidth = range / n;
		var counts = [];

		var dataIndex = 0;
		var count = 0;
		for (var i = 1; i < n; i++)
		{
			while (arr[dataIndex] < (arr[0] + (binwidth * i)))
			{
				count++;
				dataIndex++;
			}
			counts.push(count);
			count = 0;
		}
		counts.push(arr.length - dataIndex);

		return counts;
	};

	var chooseNumBins = function(maxbins)
	{
		// Ref: K.H. Knuth. 2012. Optimal data-based binning for histograms
		// and histogram-based probability density models, Entropy.

		var N = data.length;
		var logp = [];

		for (var M = 1; M <= maxbins; M++)
		{
			var binned = getBinCounts(rawData, M);
			jStat.add(binned, 0.5);
			for (var i = 0; i < M; i++)
				binned[i] = jStat.gammaln(binned[i]);
			logp.push(N * Math.log(M) + jStat.gammaln(M/2) - jStat.gammaln(N + M/2)
				  - M * jStat.gammaln(1/2) + jStat.sum(binned));
		}

		var maxindex = 0;
		for (var i = 1; i < logp.length; i++)
			if (logp[i] > logp[maxindex]) maxindex = i;
		return (maxindex + 1);
	};
*/

STAP.GraphData1Var = function(hTitle, vTitle)
{
	this.horizontalTitle = hTitle;
	this.verticalTitle = vTitle;
};

STAP.GraphData1Var.prototype._clearInternals = function()
{
	if (this.binStrategy) delete this.binStrategy;
	if (this.caseNames) delete this.caseNames;
	if (this.categoryNames) delete this.categoryNames;
	if (this.categoryCount) delete this.categoryCount;
	if (this.frequencyMap) delete this.frequencyMap;
	if (this.relativeMap) delete this.relativeMap;
	if (this.rawData) delete this.rawData;
};

STAP.GraphData1Var.prototype.loadCategorical = function(arrRaw)
{
	this._clearInternals();
	this.rawData = arrRaw.slice(0);
	this.frequencyMap = {};
	this.relativeMap = {};
	this.categoryNames = [];
	this.categoryCount = 0;

	for (var i = 0; i < this.rawData.length; i++)
	{
		if (!this.frequencyMap[this.rawData[i]])
		{
			this.frequencyMap[this.rawData[i]] = 1;
			this.categoryCount++;
		}
		else
			this.frequencyMap[this.rawData[i]]++;
	}
	for (var key in this.frequencyMap)
	{
		if (this.frequencyMap.hasOwnProperty(key))
		{
			this.relativeMap[key] = (this.frequencyMap[key] / this.rawData.length);
			this.categoryNames.push(key);
		}
	}
};

STAP.GraphData1Var.prototype.loadQuantitativeFixedStrategy = function(arrRaw, caseNames, binSize, firstBin)
{
	this._clearInternals();
	this.frequencyMap = [];
	this.relativeMap = [];
	this.rawData = arrRaw.slice(0);
	if (caseNames)
	{
		this.caseNames = caseNames.slice(0);
		STAP.Utility.sortArrayAscendingByKeys(this.caseNames, this.rawData);
	}
	else
		STAP.Utility.sortArrayAscending(this.rawData);

	while(STAP.SafeNumber.compareToWithinTolerance(firstBin, this.rawData[0]) > 0)
		firstBin -= binSize;
	var nextBin = firstBin + binSize;
	var count = 0;
	var index = 0;
	var maxFreq = 0;
	while (index < this.rawData.length)
	{
		while (index < this.rawData.length &&
			STAP.SafeNumber.compareToWithinTolerance(this.rawData[index], nextBin) < 0)
		{
			index++;
			count++;
		}
		
		if (count > 0 || index < this.rawData.length)
		{
			this.frequencyMap.push(count);
			this.relativeMap.push(count / this.rawData.length);
			if (count > maxFreq)
				maxFreq = count;
			count = 0;
			nextBin += binSize;
		}
	}
	this.binStrategy =
	{
		firstBin: firstBin,
		binSize: binSize,
		numBins: this.frequencyMap.length,
		maxFrequency: maxFreq
	};
};

STAP.GraphData1Var.prototype.loadQuantitativeForHist = function(arrRaw, caseNames)
{
	var safenum = STAP.SafeNumber;
	this.rawData = arrRaw.slice(0);
	STAP.Utility.sortArrayAscending(this.rawData);
	var min = this.rawData[0];
	var max = this.rawData[this.rawData.length - 1];
	var diffSig = safenum.getPow10(max - min);
	var leftBin = safenum.floorToSignificance(min, diffSig);
	var rightEnd = safenum.ceilToSignificance(max, diffSig);
	var binSize = Math.pow(10, diffSig);
	var pattern = [2, 2.5, 2];
	var pIndex = 0;
	while (((rightEnd - leftBin) / binSize + 1) < 6)
	{
		binSize = binSize / pattern[pIndex++ % 3];
		if (pIndex % 3 == 0)
		{
			diffSig--;
			leftBin = safenum.floorToSignificance(min, diffSig);
			rightEnd = safenum.ceilToSignificance(max, diffSig);
		}
	}

	this.loadQuantitativeFixedStrategy(arrRaw, caseNames, binSize, leftBin);
};

STAP.GraphData1Var.prototype.loadQuantitativeForDot = function(arrRaw, caseNames, width, height)
{
	var pref = STAP.Preferences;
	var prefRadius = pref.getPreference(pref.keys.drawing.dot_radius);
	var pixelPref = function() {
		return (prefRadius * 2 + 2 * STAP.SVGGraph.prototype._dotPadding);
	};
	var safenum = STAP.SafeNumber;
	var sorted = arrRaw.slice(0);
	STAP.Utility.sortArrayAscending(sorted);
	var lowSig = safenum.getLSPow10(arrRaw[0]);
	for (var i = 1; i < arrRaw.length; i++)
		lowSig = Math.min(lowSig, safenum.getLSPow10(arrRaw[i]));
	var binSize = Math.pow(10, lowSig);
	var diff = sorted[sorted.length - 1] - sorted[0];
	var pIndex = 0;
	var pattern = [2, 2.5, 2];
	var dotOK = false;

	while(!dotOK)
	{	
		while (safenum.compareToWithinTolerance(width / (diff / binSize), pixelPref()) < 0)
			binSize *= pattern[pIndex++ % 3];

		this.loadQuantitativeFixedStrategy(arrRaw, caseNames, binSize,
						safenum.floorToSignificance(sorted[0],
							safenum.getPow10(binSize)));

		// restrategizing is expensive, so hopefully this doesn't happen too often
		// if you combine too many bins, you lose either way
		if (safenum.compareToWithinTolerance(height / this.binStrategy.maxFrequency, pixelPref()) < 0)
		{
			prefRadius /= 2;
			binSize = Math.pow(10, lowSig);
		}
		else
			dotOK = true;
	}
	this.binStrategy.dotRadius = prefRadius;
};

// PRECONDITION: The svg element should be empty
STAP.SVGGraph = function(id)
{
	var pref = STAP.Preferences;

	this.elementID = id;
	this.element = document.getElementById(id);
	this.backdrops = document.createElementNS(this.xmlns, "g");
	this.backdrops.setAttribute("id", id+"_backdrops");
	this.titles = document.createElementNS(this.xmlns, "g");
	this.titles.setAttribute("id", id+"_titles");
	this.titles.setAttribute("font", pref.getPreferredFontCSS());
	this.labels = document.createElementNS(this.xmlns, "g");
	this.labels.setAttribute("id", id+"_labels");
	this.labels.setAttribute("font", pref.getPreferredFontCSS());
	this.sprites = document.createElementNS(this.xmlns, "g");
	this.sprites.setAttribute("id", id+"_sprites");
	this.axes = document.createElementNS(this.xmlns, "g");
	this.axes.setAttribute("id", id+"_axes");
	this.element.appendChild(this.backdrops);
	this.element.appendChild(this.titles);
	this.element.appendChild(this.labels);
	this.element.appendChild(this.sprites);
	this.element.appendChild(this.axes);
	this.data = null;

	var rect = this.element.getBoundingClientRect();
	this.clientWidth = rect.width;
	this.clientHeight = rect.height;

	pref.addListener(this, this.preferencesChanged);
};

STAP.SVGGraph.prototype.xmlns = "http://www.w3.org/2000/svg";
STAP.SVGGraph.prototype.margin = 3;
STAP.SVGGraph.prototype.ascentFactor = 1.5;
STAP.SVGGraph.prototype.type_bar = "bar";
STAP.SVGGraph.prototype.type_pie = "pie";
STAP.SVGGraph.prototype.type_hist = "hist";
STAP.SVGGraph.prototype.type_dot = "dot";
STAP.SVGGraph.prototype.type_box = "box";
STAP.SVGGraph.prototype.type_norm = "norm";
STAP.SVGGraph.prototype.type_stacked = "stacked";
STAP.SVGGraph.prototype.dotbin_strict = 1;
STAP.SVGGraph.prototype.dotbin_jitter = 2;
STAP.SVGGraph.prototype.dotbin_overlap = 3;
STAP.SVGGraph.prototype._dotPadding = 1;

STAP.SVGGraph.prototype._clearGroup = function(grpElement)
{
	if (grpElement)
		while (grpElement.lastChild) grpElement.removeChild(grpElement.lastChild);
};

STAP.SVGGraph.prototype.clearGraph = function(skipUnload)
{
	var arr = [this.backdrops, this.titles, this.labels, this.sprites, this.axes];
	for (var i = 0; i < arr.length; i++)
		this._clearGroup(arr[i]);
	if (!skipUnload)
	{
		this._lastRenderer = null;
		this._lastRenderParams = null;
		this.data = null;
	}
	this._fontSizeEstMemo = 0;
};

STAP.SVGGraph.prototype._positionTitles = function()
{
	var pref = STAP.Preferences;
	var fontSize = this._fontSizeEst();

	var hTitle = this.titles.firstChild;
	var vTitle = hTitle.nextSibling;

	hTitle.setAttribute("text-anchor", "middle");
	hTitle.setAttribute("x", (this.clientWidth - fontSize - 2 * this.margin) / 2 + fontSize + this.margin);
	hTitle.setAttribute("y", this.clientHeight - this.margin);
	hTitle.textContent = this.data.horizontalTitle;

	vTitle.setAttribute("text-anchor", "middle");
	var vx = this.margin + fontSize;
	var vy = (this.clientHeight - this.margin - fontSize) / 2;
	vTitle.setAttribute("x", vx);
	vTitle.setAttribute("y", vy);
	vTitle.setAttribute("transform", "rotate(-90 " + vx + " " + vy + ")");
	vTitle.textContent = this.data.verticalTitle;
};

STAP.SVGGraph.prototype._loadGraphCommon = function()
{
	var pref = STAP.Preferences;

	// Create a background rectangle and append to the backdrops tree
	var bkgRect = document.createElementNS(this.xmlns, "rect");
	bkgRect.setAttribute("x", "0");
	bkgRect.setAttribute("y", "0");
	bkgRect.setAttribute("width", this.clientWidth);
	bkgRect.setAttribute("height", this.clientHeight);
	bkgRect.setAttribute("fill", pref.getPreference(pref.keys.drawing.bg_color));
	bkgRect.setAttribute("stroke-width", "0");
	this.backdrops.appendChild(bkgRect);

	// Create a horizontal and vertical title and append to the backdrops
	this.titles.setAttribute("font", pref.getPreferredFontCSS());
	var hTitle = document.createElementNS(this.xmlns, "text");
	var vTitle = document.createElementNS(this.xmlns, "text");
	this.titles.appendChild(hTitle);
	this.titles.appendChild(vTitle);
	this._positionTitles();

	this.labels.setAttribute("font", pref.getPreferredFontCSS());

	this.sprites.setAttribute("fill", pref.getPreference(pref.keys.drawing.fill_color));
	this.sprites.setAttribute("stroke", pref.getPreference(pref.keys.drawing.line_color));
	this.sprites.setAttribute("stroke-width", "1");
};

STAP.SVGGraph.prototype._fontSizeEst = function()
{
	if (!this._fontSizeEstMemo)
		this._fontSizeEstMemo = Math.ceil(STAP.Preferences.getPreference(
				STAP.Preferences.keys.drawing.font_size) * this.ascentFactor);
	return this._fontSizeEstMemo;
};

STAP.SVGGraph.prototype._renderHLabelsCommon = function(xOffset)
{
	var minX = this.data.binStrategy.firstBin;
	var maxX = this.data.binStrategy.numBins * this.data.binStrategy.binSize + minX;
	var fontSize = this._fontSizeEst();

	var leftHLabel = document.createElementNS(this.xmlns, "text");
	leftHLabel.textContent = STAP.Format.formatNumber(minX);
	leftHLabel.setAttribute("x", "" + (fontSize + this.margin + 
						(xOffset ? xOffset : 0)));
	leftHLabel.setAttribute("y", "" + (this.clientHeight - fontSize - this.margin));
	
	var rightHLabel = document.createElementNS(this.xmlns, "text");
	rightHLabel.setAttribute("text-anchor", "end");
	rightHLabel.textContent = STAP.Format.formatNumber(maxX);
	rightHLabel.setAttribute("x", "" + (this.clientWidth - this.margin));
	rightHLabel.setAttribute("y", "" + (this.clientHeight - fontSize - this.margin));

	this.labels.appendChild(leftHLabel);
	this.labels.appendChild(rightHLabel);

	var retval = { left: leftHLabel, right: rightHLabel };
	return retval;
};

STAP.SVGGraph.prototype._renderVLabelsCommon = function(isRelative)
{
	var fontSize = this._fontSizeEst();
	var fontPoints = STAP.Preferences.getPreference(STAP.Preferences.keys.drawing.font_size);
	if (!this.data.binStrategy) return 0;
	if (!this.data.binStrategy.maxFrequency) return 0;
	var vLabel = document.createElementNS(this.xmlns, "text");
	var fnFormat = (isRelative ? STAP.Format.formatProportion : STAP.Format.formatNumber);
	vLabel.textContent = fnFormat(this.data.binStrategy.maxFrequency);
	vLabel.setAttribute("text-anchor", "end");
	vLabel.setAttribute("font", STAP.Preferences.getPreferredFontCSS());
	var xOffset = vLabel.getComputedTextLength();
	vLabel.removeAttribute("font");
	var rightEdge = this.margin + fontSize + xOffset;
	vLabel.setAttribute("x", "" + rightEdge);
	vLabel.setAttribute("y", "" + (this.margin + fontPoints));
	this.labels.appendChild(vLabel);

	var btmLabel = document.createElementNS(this.xmlns, "text");
	btmLabel.textContent = fnFormat(0);
	btmLabel.setAttribute("text-anchor", "end");
	btmLabel.setAttribute("x", "" + rightEdge);
	btmLabel.setAttribute("y", "" + (this.clientHeight - this.margin - 1.5 * fontSize));
	this.labels.appendChild(btmLabel);
	
	// HLabelsCommon expects to know the xOffset
	return xOffset;
};

// Expected params:
// params[0]: boolean - relative frequency or not
STAP.SVGGraph.prototype._renderHist = function(arrParams)
{
	var hLabels = this._renderHLabelsCommon(this._renderVLabelsCommon(
		(arrParams ? (arrParams[0] ? arrParams[0] : false) : false)
		));
	var leftBox = hLabels.left.getBBox();
	var rightBox = hLabels.right.getBBox();
	var xMapDataToClient = new STAP.AxisMapping(
		this.data.binStrategy.firstBin,
		this.data.binStrategy.firstBin + this.data.binStrategy.numBins * this.data.binStrategy.binSize,
		leftBox.x + leftBox.width / 2,
		rightBox.x + rightBox.width / 2
	);
	var yMapDataToClient = new STAP.AxisMapping(
		0,
		this.data.binStrategy.maxFrequency,
		leftBox.y,
		this.margin + this._fontSizeEst() / 2
	);

	// Render each bin
	var currBin = this.data.binStrategy.firstBin;
	var binSize = this.data.binStrategy.binSize;
	for (var i = 0; i < this.data.frequencyMap.length; i++)
	{
		var freq = this.data.frequencyMap[i];
		var rect = document.createElementNS(this.xmlns, "rect");
		rect.setAttribute("title", currBin + " <= x < " + (currBin + binSize) + ": " + freq);
		rect.setAttribute("x", "" + xMapDataToClient.coordAtoB(currBin));
		rect.setAttribute("y", "" + yMapDataToClient.coordAtoB(freq));
		rect.setAttribute("width", "" + xMapDataToClient.intervalAtoB(binSize));
		rect.setAttribute("height", "" + yMapDataToClient.intervalAtoB(-freq));
		rect.setAttribute("class", "hoverable");
		rect.onmouseover = function(){ console.log(this.getAttribute("title")); };
		this.sprites.appendChild(rect);
		currBin += binSize;
	}

	// TODO: Vertical axis with appropriate labeling
	// TODO: Change console log to something else
};

// Expected params:
// params[0]: integer - bin strategy
STAP.SVGGraph.prototype._renderDot = function(arrParams)
{
	var hLabels = this._renderHLabelsCommon();
	var leftBox = hLabels.left.getBBox();
	var rightBox = hLabels.right.getBBox();
	var xMapDataToClient = new STAP.AxisMapping(
		this.data.binStrategy.firstBin,
		this.data.binStrategy.firstBin + this.data.binStrategy.numBins * this.data.binStrategy.binSize,
		leftBox.x + leftBox.width / 2,
		rightBox.x + rightBox.width / 2
	);
	var yMapDataToClient = new STAP.AxisMapping(
		0,
		(leftBox.y - this.margin) /
			((this.data.binStrategy.dotRadius + this._dotPadding) * 2),
		leftBox.y,
		this.margin
	);

	// Render each bin
	var currBin = this.data.binStrategy.firstBin;
	var binSize = this.data.binStrategy.binSize;
	var dataIndex = 0;
	for (var i = 0; i < this.data.frequencyMap.length; i++)
	{
		var freq = this.data.frequencyMap[i];
		for (var j = 0; j < freq; j++)
		{
			var dot = document.createElementNS(this.xmlns, "ellipse");
			if (this.data.caseNames)
				dot.setAttribute("title", "(" + this.data.caseNames[dataIndex]
							+ ", " + this.data.rawData[dataIndex]
							+ ")");
			else
				dot.setAttribute("title", "" + this.data.rawData[dataIndex]);
			dataIndex++;
			dot.setAttribute("cx", "" + xMapDataToClient.coordAtoB(currBin));
			dot.setAttribute("cy", "" + yMapDataToClient.coordAtoB(j + 1));
			dot.setAttribute("rx", "" + this.data.binStrategy.dotRadius);
			dot.setAttribute("ry", "" + this.data.binStrategy.dotRadius);
			dot.setAttribute("class", "hoverable");
			dot.onmouseover = function(){ console.log(this.getAttribute("title")); };
			this.sprites.appendChild(dot);
		}
		currBin += binSize;
	}

	// TODO: Vertical axis with appropriate labeling
	// TODO: Change console log to something else
};

STAP.SVGGraph.prototype._renderers =
{
	hist: STAP.SVGGraph.prototype._renderHist,
	dot: STAP.SVGGraph.prototype._renderDot
};

STAP.SVGGraph.prototype._repaint = function()
{
	this.clearGraph(true);
	this._loadGraphCommon();
	this._lastRenderer(this._lastRenderParams);
};

STAP.SVGGraph.prototype.loadData = function(data, graphType, arrParams)
{
	this.data = data;
	this._lastRenderer = this._renderers[graphType];
	this._lastRenderParams = arrParams.slice(0);
	this._repaint();
};

STAP.SVGGraph.prototype.preferencesChanged = function(key, value)
{
	var pref = STAP.Preferences;
	var repaint = false;

	if (key == pref.keys.drawing.bg_color)
		this.backdrops.firstChild.setAttribute("fill", value);
	else if (key == pref.keys.drawing.font_size)
	{
		this._fontSizeEstMemo = 0;
		repaint = true;
	}
	else if (key == pref.keys.drawing.fill_color)
		this.sprites.setAttribute("fill", value);
	else if (key == pref.keys.drawing.line_color)
		this.sprites.setAttribute("stroke", value);
	else
		repaint = true;

	if (repaint)
		this._repaint();
};

            "quant1v",
            ["txtVariableName", "txtGroup1Data"],
            ["Travel time to work (min)",
             "10 30 5 25 40 20 10 15 30 20 15 20 85 15 65 15 60 60 40 45"]
        );

        else if (name == "1.8")
        {
            if (!STAP.Preloads.validatePageName("quant1v")) return;

            // These exist on source page
            document.getElementById("selNumGroups").selectedIndex = 1;
            handleGroupsChange(document.getElementById("selNumGroups"));

            STAP.Preloads.genericPreload(null,
            ["txtVariableName", "txtGroup1Name", "txtGroup1Data", "txtGroup2Name", "txtGroup2Data"],
            ["Number of texts",
             "Males", "127 44 28 83 0 6 78 6 5 213 73 20 214 28 11",
             "Females", "112 203 102 54 379 305 179 24 127 65 41 27 298 6 130 0"]
            );
        }

        else if (name == "1.SA")
        {
            if (!STAP.Preloads.validatePageName("quant1v")) return;

            // These exist on source page
            document.getElementById("selNumGroups").selectedIndex = 2;
            handleGroupsChange(document.getElementById("selNumGroups"));

            STAP.Preloads.genericPreload(null,
            ["txtVariableName", "txtGroup1Name", "txtGroup1Data", "txtGroup2Name", "txtGroup2Data",
            "txtGroup3Name", "txtGroup3Data"],
            ["Number of bacteria colonies",
             "Soap", "18 10 10 6 6 5 4 4 4 1",
             "Hand sanitizer", "27 23 14 8 7 6 5 4 3 2",
             "Nothing", "108 97 92 81 57 49 41 38 29 3"]
            );
        }
        
        else if (name == "2.2") STAP.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Dash time (s)", "5.41 5.05 7.01 7.17 6.73 5.68 5.78 6.31 6.44 6.50 6.80 7.25",
             "Long-jump distance (in.)", "171 184 90 65 78 130 173 143 92 139 120 110"]
        );

        else if (name == "2.6") STAP.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Miles driven", "70583 129484 29932 29953 24495 75678 8359 4447 34077 58023 44447 68474 144162 140776 29397 131385",
             "Price (in dollars)", "21994 9500 29875 41995 41995 28986 31891 37991 34995 29988 22896 33961 16883 20897 27495 13997"]
        );

        else if (name == "2.8a") STAP.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Age", "29 34 31 29 29 31 27 33 25 28 25 23 22 34 25 24 27 28 28 30 35 28 32 30 41 29 26 38 27 38 24 23",
             "Passing yards", "4710 4700 4620 4370 4002 3970 3922 3900 3705 3653 3622 3512 3451 3377 3301 3291 3274 3200 3116 3018 3001 3000 2734 2686 2509 2387 2370 2365 2065 1823 1576 1558"]
        );

        else if (name == "2.8b") STAP.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Years since 1970", "1 2 4 8 12 15 19 23 25 27 29 30 31 32 33 34 36 38 40 41 42 44",
             "No. of transistors", "2300 3500 4500 29000 134000 275000 1180235 3100000 5500000 7500000 9500000 42000000 45000000 220000000 410000000 592000000 1700000000 1900000000 2300000000 2600000000 5000000000 5560000000"]
        );

        else if (name == "5.2")
        {
            if (!STAP.Preloads.validatePageName("prob")) return;

            // These exist on source page
            document.getElementById("selCalculatorType").selectedIndex = 1;
            handleCalcChange();
            for (var i = 0; i < 9; i++)
                document.getElementById("btnAddRow").click();

            STAP.Preloads.genericPreload(null,
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

        else if (name == "8.6") STAP.Preloads.genericPreload(
            "quant1v",
            ["txtVariableName", "txtGroup1Data"],
            ["Length (in.)",
             "4.50 4.75 4.75 5.00 5.00 5.00 5.50 5.50 5.50 5.50 5.50 5.50 5.75 5.75 5.75 " +
             "6.00 6.00 6.00 6.00 6.00 6.50 6.75 6.75 7.00"]
        );

        else if (name == "10.5a") STAP.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Row", "1 1 1 1 2 2 2 2 3 3 3 3 4 4 4 4 4 5 5 5 5 5 6 6 6 6 7 7 7 7",
             "Score", "76 77 94 99 83 85 74 79 90 88 68 78 94 72 101 70 79 76 65 90 67 96 88 79 90 83 79 76 77 63"]
        );

        else if (name == "10.5b") STAP.Preloads.genericPreload(
            "quant2v",
            ["txtExplanatoryName", "txtExplanatoryData",
             "txtResponseName", "txtResponseData"],
            ["Foot length (cm)", "26 25 26 24 29 26 28 23 23 21 22 30 23 24 22",
             "Height (cm)", "164 175 187 156 177 181 179 164 177 169 164 192 168 163 156"]
        );

        else if (name == "10.6") STAP.Preloads.genericPreload(
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
        if (pagename && !STAP.Preloads.validatePageName(pagename)) return;

        var UI = STAP.UIHandlers;

        for (var i = 0; i < ctlIDarr.length; i++)
            UI.setProperty(ctlIDarr[i], "value", ctlvalarr[i]);
    }
};

/** UIHandlers */
// A collection of functions to make certain UI operations easier.
STAP.UIHandlers =
{
    // If a page accepts preload data (coded below), use this method instead as
    // a convenience to add querystring parsing code to the onload.
    setOnLoadWithPreload: function(func)
    {
        this.setOnLoad(function(){
            func();
            
            var params = STAP.UIHandlers.getQueryString();
            if (params["data"])
                STAP.Preloads.loadData(params["data"]);
        });
    },

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

    clearInputStates: function() { for (var inputID in this.inputStates) this.clearInputState(inputID); }
};

STAP.AxisMapping = function(minA, maxA, minB, maxB)
{
    this.minA = minA;
    this.maxA = maxA;
    this.minB = minB;
    this.maxB = maxB;
};

STAP.AxisMapping.prototype.coordAtoB = function(coord)
{
	return (coord - this.minA) / (this.maxA - this.minA) * (this.maxB - this.minB) + this.minB;
};

STAP.AxisMapping.prototype.coordBtoA = function(coord)
{
	return (coord - this.minB) / (this.maxB - this.minB) * (this.maxA - this.minA) + this.minA;
};

STAP.AxisMapping.prototype.intervalAtoB = function(interval)
{
	return interval / (this.maxA - this.minA) * (this.maxB - this.minB);
};

STAP.AxisMapping.prototype.intervalBtoA = function(interval)
{
	return interval / (this.maxB - this.minB) * (this.maxA - this.minA);
};
