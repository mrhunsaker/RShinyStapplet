var map = {};

map["rect1"] = 
{
	name: "Test1",
	value: 1
};
map["rect2"] = 
{
	name: "Test2",
	value: 2
};
map["rect3"] = 
{
	name: "Test3",
	value: 3
};
map["rect4"] = 
{
	name: "Test4",
	value: 1
};

function associateRectangles( )
{
	associate("rect1");
	associate("rect2");
	associate("rect3");
	associate("rect4");
};

function associate(id)
{
	var rect = document.getElementById(id);

	rect.setAttribute("class", "hoverable");

	rect.addEventListener("mouseover", function (e)
	{
		var result = map[id];
		
		var ttText = document.getElementById("textTT");
		ttText.textContent = "(" + result.name + ", " + result.value + ")";

		var ttRect = document.getElementById("rectTT");
		var ttBox = ttText.getBBox();
		ttRect.setAttribute("width", ttBox.width);
		ttRect.setAttribute("height", ttBox.height);
		
		ttText.setAttribute("x", e.clientX - document.documentElement.scrollLeft);
		ttText.setAttribute("y", e.clientY - document.documentElement.scrollTop);
		ttRect.setAttribute("x", e.clientX - document.documentElement.scrollLeft);
		ttRect.setAttribute("y", e.clientY - document.documentElement.scrollTop
						   - ttBox.height);
	});

	rect.addEventListener("mouseout", function (e)
	{
		var ttText = document.getElementById("textTT");
		ttText.textContent = "";
		var ttRect = document.getElementById("rectTT");
		ttRect.setAttribute("width", 0);
		ttRect.setAttribute("height", 0);		
	});
};

function downloadSVG(id)
{
	STAP.FileIO.saveSVG(document.getElementById(id));
};

var catData = "Famous Healthy Healthy Famous Happy Famous Happy Happy Famous " +
              "Rich Happy Happy Rich Happy Happy Happy Rich Happy " +
              "Famous Healthy Rich Happy Happy Rich Happy Happy Rich " +
              "Healthy Happy Happy Rich Happy Happy Rich Happy Famous " +
              "Famous Happy Happy Happy";

var quantData1 = "3.4 6.2 13.4 4.3 27.1 9.7 13.3 8.6 19.4 9.6 18.2 5.9 13.9 4.6 4.3 6.7 3.3 3.8 3.3 13.7 " +
             "14.9 6.1 7.4 2.3 4.1 2.0 6.2 19.2 5.3 21.3 10.2 22.2 7.3 2.4 3.9 5.5 9.5 5.9 13.5 4.7 " +
             "2.9 4.7 16.5 8.4 3.9 11.1 13.4 1.3 4.8 2.9";

var quantData2 = "9 3 11 6 55 9 7 3 3 29 16 4 4 20 11 6 6 8 8 4 10 11 16 10 6 10 3 15 " +
             "5 6 4 14 5 29 3 18 7 7 20 4 13 12 9 3 11 38 6 3 5 10 3";

var quantData3 = "10 30 5 25 40 20 10 15 30 20 15 20 85 15 65 15 60 60 40 45";

function testDynamicHist()
{
	var data = new STAP.GraphData1Var("Electoral Votes", "Frequency");
	data.loadQuantitativeForHist(STAP.Utility.splitStringGetArray(quantData2), null);
	var graph = new STAP.SVGGraph("svgDynGraph");
	graph.loadData(data, "hist", [false]);
};

function testDynamicDot()
{
	var data = new STAP.GraphData1Var("Percent Foreign-Born", "");
	data.loadQuantitativeForDot(STAP.Utility.splitStringGetArray(quantData1), null,
						600, 400);
	var graph = new STAP.SVGGraph("svgDynGraph");
	graph.loadData(data, "dot", [1]);
};

function testPartition(ht, vt, dataset, isCat, isHist)
{
	var data = new STAP.GraphData1Var(ht, vt);
	var spn = document.getElementById("spnPartitionTest");
	var html = "Raw data: " + dataset + "<BR>Horizontal title: " +
		data.horizontalTitle + "<BR>Vertical title: " +
		data.verticalTitle + "<BR>Partitioning:";
	if (isCat)
	{
		data.loadCategorical(STAP.Utility.splitString(dataset));
		for (var i = 0; i < data.caseNames.length; i++)
			html += "<BR>" + data.caseNames[i] + ": " +
				data.frequencyMap[data.caseNames[i]];
	}
	else
	{
		if (isHist)
			data.loadQuantitativeForHist(
			STAP.Utility.splitStringGetArray(dataset));
		else
			data.loadQuantitativeForDot(
			STAP.Utility.splitStringGetArray(dataset), null, 500, 300);
		html += " Left edge = " + data.binStrategy.firstBin;
		if (!isHist)
			html += "<BR>Dot radius = " + data.binStrategy.dotRadius;
		for (var i = 0; i < data.frequencyMap.length; i++)
			html += "<BR>&lt; "
				+ (data.binStrategy.firstBin + (i + 1) * data.binStrategy.binSize)
				+ ": " + data.frequencyMap[i];
	}
	spn.innerHTML = html;
};