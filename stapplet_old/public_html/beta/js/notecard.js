var pageActive = false;

var UI = STAP.UIHandlers;
var stat = STAP.Statistics;
var IV = STAP.InputValidation;
var util = STAP.Utility;
var format = STAP.Format;
var file = STAP.FileIO;
var safenum = STAP.SafeNumber;
var pref = STAP.Preferences;

var numTableDataRows = 2;

// cardArr uses indices into labelArr as its elements
var labelArr = [];
var cardArr = [];

// Map a label to an array of outcomes for simple picking
// For groups, each group is a map which maps each label to an array
var groupSizes = [];
var resultsMap = {};
var resultsCSV = "";

function addNewCountsRow()
{
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
            return;
        deactivatePage();
    }
    
    UI.setProperty("spnDataMsg", "innerHTML", "");
    var row = document.getElementById("tblInputCounts").insertRow(++numTableDataRows);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    cell1.innerHTML = '<LABEL FOR="txtDiscName' + numTableDataRows + '">' + numTableDataRows + '</LABEL>';
    cell2.innerHTML = '<INPUT TYPE="text" CLASS="name" ID="txtDiscName' + numTableDataRows + '" SIZE="10" onChange="return deactivatePage(this)">';
    cell3.innerHTML = '<INPUT TYPE="number" CLASS="data" ID="txtDiscData' + numTableDataRows + '" VALUE="1" MIN="1" STEP="1" onChange="return deactivatePage(this)">';
    cell4.innerHTML = '<INPUT TYPE="button" VALUE="-" CLASS="ctl" ID="txtDiscCtl' + numTableDataRows + '" onClick="removeCountsTableRow(this)">';          
}

function extractCountsTableRow(i, parseDataFn)
{
    var table = document.getElementById("tblInputCounts");
    var nameVal = UI.extractElementClassValue(table.rows[i].cells[1], "name", true);
    var dataVal = UI.extractElementClassValue(table.rows[i].cells[2], "data", true);
    parseDataFn = parseDataFn || parseInt;
    
    return {
        valid: (nameVal !== null && !isNaN(parseDataFn(dataVal))),
        label: nameVal,
        count: parseDataFn(dataVal)
    };
}

function fixCountsTableRowNumbers()
{
    var table = document.getElementById("tblInputCounts");
    // Fix all the row indicators now
    for (var i = 1; i <= numTableDataRows; i++)
    {
        table.rows[i].cells[0].innerHTML = '<LABEL FOR="txtDiscName' + i + '">' + i + '</LABEL>';
        UI.extractElement(table.rows[i].cells[1], "name").id = "txtDiscName" + i;
        UI.extractElement(table.rows[i].cells[2], "data").id = "txtDiscData" + i;
        UI.extractElement(table.rows[i].cells[3], "ctl").id = "txtDiscCtl" + i;
    }
}

function removeCountsTableRow(btn)
{
    if (numTableDataRows === 2)    // There must be at least two values for this page to work
    {
        UI.setProperty("spnDataMsg", "innerHTML", "At least two values are required.");
        return;
    }
    else
        UI.setProperty("spnDataMsg", "innerHTML", "");
    
    if (pageActive)
    {
        if (!confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
            return;
        deactivatePage();
    }
    
    // The parent of the parent should be the <TR>
    var table = document.getElementById("tblInputCounts");
    var rowIndex = btn.parentNode.parentNode.rowIndex;
    table.deleteRow(rowIndex);
    numTableDataRows--;
    
    fixCountsTableRowNumbers();
}

function validateInputBuildData()
{
    var errRows = [];
    labelArr = [];
    cardArr = [];
    
    UI.setProperty("spnDataMsg", "innerHTML", "");
    UI.setProperty("spnPairDataMsg", "innerHTML", "");
    UI.setProperty("spnOptionsMsg", "innerHTML", "");

    if (UI.getProperty("selDeck", "value") == "paired")
    {
        var inputArr1 = util.splitString(UI.getProperty("txtPairInput1", "value"));
        var inputArr2 = util.splitString(UI.getProperty("txtPairInput2", "value"));        

        if (inputArr1.length !== inputArr2.length)
        {
            UI.setProperty("spnPairDataMsg", "innerHTML",
                "Your card lists are of different lengths. Please verify you have included a pair for every individual.");
            return false;
        }
        for (var i = 0; i < inputArr1.length; i++)
            cardArr.push([inputArr1[i], inputArr2[i]]);
    }
    else
    {
        if (UI.getProperty("selInput", "value") == "table")
        {
            // in each row, cell index 1 is the category name and cell index 2 is the input data
            var rows = UI.getProperty("tblInputCounts", "rows");
            for (var i = 1; i < numTableDataRows + 1; i++)
            {
                var rowData = extractCountsTableRow(i);
        
                // Be robust against repeat labels
                if (rowData.valid)
                {
                    var index = labelArr.indexOf(rowData.label);
                    if (index < 0)
                    {
                        labelArr.push(rowData.label);
                        index = labelArr.length - 1;
                    }
                    for (var j = 0; j < rowData.count; j++)
                        cardArr.push(index);
                }
                else
                    errRows.push(i);
            }
            if (errRows.length > 0)
            {
                var errmsg = "Non-numeric entries in the following rows: ";
                for (var i = 0; i < errRows.length; i++)
                {
                    errmsg += errRows[i];
                    if (i < errRows.length - 1)
                        errmsg += ", ";
                }
                UI.setProperty("spnDataMsg", "innerHTML", errmsg);
                return false;
            }
        }
        else
        {
            var inputArr = util.splitString(UI.getProperty("txtRawInput", "value"));
            
            for (var i = 0; i < inputArr.length; i++)
            {
                var index = labelArr.indexOf(inputArr[i]);
                if (index < 0)
                {
                    labelArr.push(inputArr[i]);
                    index = labelArr.length - 1;
                }
                cardArr.push(index);
            }
        }
        
        if (UI.getProperty("selOperation", "value") == "groupcount")
        {
            if (!IV.validateInputInt("txtGroupCount", 2, Number.MAX_VALUE, false, "spnOptionsMsg", "", "There must be at least two groups."))
                return false;
            if (!IV.validateInputFloatArray("txtGroupSizes", "spnOptionsMsg", "Group sizes"))
                return false;
            
            groupSizes = util.splitStringGetArray(UI.getProperty("txtGroupSizes", "value"));
            
            resultsMap = {};
            for (var i = 1; i <= groupSizes.length; i++)
                resultsMap["Group " + i] = {};
            
            if (safenum.compareToWithinTolerance(jStat.sum(groupSizes), cardArr.length))
            {
                UI.setProperty("spnOptionsMsg", "innerHTML", "Group sizes must total to the number of notecards.");
                return false;
            }
        }
        else
        {
            if (!IV.validateInputInt("txtPickCount", 1, cardArr.length, false, "spnOptionsMsg", "Number of cards"))
                return false;
    
            groupSizes = [parseInt(UI.getProperty("txtPickCount", "value"))];
            resultsMap = {};
        }
    }
    return true;
}

function rebuildTable()
{
    // Remove all rows except the first and last one.
    var table = document.getElementById("tblInputCounts");
    while (table.rows.length > 2)
        table.deleteRow(1); // the first and last rows are essential to the table structure.  Row index 1
                            // is always the first row that is data entry.

    // Add two blank rows to the table
    for (var i = 0; i < 2; i++)
    {
        var row = table.insertRow(1 + i);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        cell1.innerHTML = '<LABEL FOR="txtDiscName' + (1 + i) + '">' + (1 + i) + '</LABEL>';
        cell2.innerHTML = '<INPUT TYPE="text" CLASS="name" ID="txtDiscName' + (1 + i) + '" SIZE="10" onChange="return deactivatePage(this)">';
        cell3.innerHTML = '<INPUT TYPE="number" CLASS="data" ID="txtDiscData' + (1 + i) + '" VALUE="1" MIN="1" STEP="1" onChange="return deactivatePage(this)">';
        cell4.innerHTML = '<INPUT TYPE="button" VALUE="-" CLASS="ctl" ID="txtDiscCtl' + (1 + i) + '" onClick="removeCountsTableRow(this)">';          
    }
}

function resetApplet()
{
    if (confirm("Are you sure? All entries and unsaved results will be lost."))
    {
        // Clear inputs and deactivate the page
        deactivatePage();
        rebuildTable();
        UI.batchSetProperty(["txtPickCount", "txtMultipleTrials"], "value","1");
        UI.setProperty("txtGroupCount", "value", "2");
        UI.batchSetProperty(["txtGroupSizes", "txtRawInput", "txtPairInput1", "txtPairInput2"], "value", "");
        numTableDataRows = 2;
        UI.batchSetProperty(["selOperation", "selInput", "selDeck"], "selectedIndex", 0);
        handleOperationChange();
        handleInputChange();
        handleDeckChange();
    }
}

function deactivatePage(obj)
{
    if (pageActive)
    {
        if (obj && !confirm("Are you sure? Unsaved results will be lost. (The entries will remain.)"))
        {
            if (obj.value && obj.defaultValue && obj.defaultValue.length > 0)
                obj.value = obj.defaultValue;
            return false;
        }

	    resultsMap = {};
	    groupSizes = [];
	    resultsCSV = "";
	    labelArr = [];
	    cardArr = [];
        UI.batchSetStyleProperty(["divRecentResult", "divAllResults"], "display", "none");
        UI.batchSetProperty(["divResultsTables", "spnRecentOutcome", "spnDataMsg", "spnOptionsMsg"], "innerHTML", "");
        pageActive = false;
        return true;
    }
    return true;
}

function doSingle(bSilent)
{
    var resultsHTML = "";
    if (UI.getProperty("selDeck", "value") == "paired")
    {
        for (var i = 0; i < cardArr.length; i++)
            if (Math.random() < 0.5) util.arraySwap(cardArr[i], 0, 1);
        resultsMap["Trials"]++;

        if (!bSilent) resultsHTML = "<TABLE><TR><TH>First</TH>";
        var newTableHTML = '<TR><TD COLSPAN="' + (cardArr.length + 2)
            + '"> </TD></TD>' + '<TR><TH ROWSPAN="2">' 
            + resultsMap["Trials"] + '</TH><TH>First</TH>';
        resultsCSV += resultsMap["Trials"];
        
        for (var i = 0; i < cardArr.length; i++)
        {
            if (!bSilent) resultsHTML += '<TD>' + cardArr[i][0] + '</TD>';
            newTableHTML += '<TD>' + cardArr[i][0] + '</TD>';
            resultsCSV += ',' + cardArr[i][0];
        }
        if (!bSilent) resultsHTML += "</TR><TR><TH>Second</TH>";
        newTableHTML += "</TR><TR><TH>Second</TH>";
        resultsCSV += "\n";
        for (var i = 0; i < cardArr.length; i++)
        {
            if (!bSilent) resultsHTML += '<TD>' + cardArr[i][1] + '</TD>';
            newTableHTML += '<TD>' + cardArr[i][1] + '</TD>';
            resultsCSV += ',' + cardArr[i][1];
        }
        if (!bSilent) resultsHTML += "</TR></TABLE>"
        newTableHTML += "</TR>";
        resultsCSV += "\n";
        for (var i = 0; i < cardArr.length; i++)
            resultsCSV += ',';
        resultsCSV += "\n";

        document.getElementById("tblResults")
                .insertAdjacentHTML("beforeend", newTableHTML);
    }
    else
    {
        var updateMap = function(map, groupArr) {
            var labelCounts = [];
            for (var i = 0; i < labelArr.length; i++)
                labelCounts.push(0);
            for (var j = 0; j < groupArr.length; j++)
                labelCounts[groupArr[j]]++;
            
            for (var i = 0; i < labelArr.length; i++)
                map[labelArr[i]].push(labelCounts[i]);
        };
    
        util.knuthShuffle(cardArr);
        var groups = [];
        var startindex = 0;
        var endindex = 0;
        for (var i = 0; i < groupSizes.length; i++)
        {
            endindex += groupSizes[i];
            groups.push(cardArr.slice(startindex, endindex));
            startindex += groupSizes[i];
        }
    
        if (UI.getProperty("selOperation", "value") == "groupcount")
        {
            resultsCSV += (resultsMap["Group 1"][labelArr[0]].length + 1);
            for (var i = 0; i < groupSizes.length; i++)
            {
                var map = resultsMap["Group " + (i+1)];
                var table = document.getElementById("tblResults" + (i + 1));
                updateMap(map, groups[i]);
    
                var trialnode = document.createElement("TH");
                trialnode.textContent = map[labelArr[0]].length;
                table.rows[1].appendChild(trialnode);
                
                
                if (!bSilent) resultsHTML += "Group " + (i+1) + ": ";
                for (var j = 0; j < labelArr.length; j++)
                {
                    var arr = map[labelArr[j]];
                    if (!bSilent)
                    {
                        resultsHTML += arr[arr.length - 1] + " " + labelArr[j];
                        if (j < labelArr.length - 1)
                            resultsHTML += ", ";
                        else
                            resultsHTML += "<BR>";
                    }
                    var node = document.createElement("TD");
                    node.textContent = arr[arr.length - 1];
                    table.rows[j + 2].appendChild(node);
                    
                    resultsCSV += "," + arr[arr.length - 1];
                }
            }
            resultsCSV += "\n";
        }
        else if (UI.getProperty("selOperation", "value") == "pickcount")
        {
            var map = resultsMap;
            var table = document.getElementById("tblResults");
            updateMap(map, groups[0]);
    
            var trialnode = document.createElement("TH");
            trialnode.textContent = map[labelArr[0]].length;
            table.rows[0].appendChild(trialnode);
    
            resultsCSV += map[labelArr[0]].length;
    
            for (var j = 0; j < labelArr.length; j++)
            {
                var arr = map[labelArr[j]];
                if (!bSilent)
                {
                    resultsHTML += arr[arr.length - 1] + " " + labelArr[j];
                    if (j < labelArr.length - 1)
                        resultsHTML += ", ";
                }
                var node = document.createElement("TD");
                node.textContent = arr[arr.length - 1];
                table.rows[j + 1].appendChild(node);
    
                resultsCSV += "," + arr[arr.length - 1];
            }
            resultsCSV += "\n";
        }
        else
        {
            var map = resultsMap;
            updateMap(map, groups[0]);
            var table = document.getElementById("tblResults");
            for (var i = 0; i < groups[0].length; i++)
            {
                resultsHTML += labelArr[groups[0][i]];
                if (i < groups[0].length - 1)
                    resultsHTML += ", ";
            }
    
            var trialnode = document.createElement("TH");
            trialnode.textContent = map[labelArr[0]].length;
            table.insertRow(-1);
            table.rows[table.rows.length - 1].appendChild(trialnode);
            
            var resultsnode = document.createElement("TD");
            resultsnode.textContent = resultsHTML;
            table.rows[table.rows.length - 1].appendChild(resultsnode);
            
            resultsCSV += resultsHTML + "\n";
        }
    }
    
    UI.setProperty("txtResultsCSV", "value", resultsCSV);
    if (!bSilent)
        UI.setProperty("spnRecentOutcome", "innerHTML", resultsHTML);
}

function doMultiple()
{
    var count = parseInt(UI.getProperty("txtMultipleTrials", "value"));
    for (var i = 0; i < count - 1; i++)
        doSingle(true);
    doSingle();
}

function beginAnalysis()
{
    if (!pageActive)
    {
        if (!validateInputBuildData()) return;
        pageActive = true;

        resultsCSV = "";
        var resultsTableHTML = "";
        if (UI.getProperty("selDeck", "value") == "paired")
        {
            resultsCSV = "Trial #, Cards";
            for (var i = 0; i < (cardArr.length - 1); i++)
                resultsCSV += ",";
            resultsCSV += "\n";
            resultsMap["Trials"] = 0;
            resultsTableHTML += '<TABLE ID="tblResults"></TABLE>';
        }
        else
        {
            if (UI.getProperty("selOperation", "value") == "groupcount")
            {
                resultsCSV = ",";
                for (var i = 0; i < groupSizes.length; i++)
                {
                    resultsMap["Group " + (i+1)] = {};
                    resultsCSV += "Group " + (i+1);
                    resultsTableHTML += 
                        '<TABLE ID="tblResults' + (i+1) + '">' +
                        '<TR><TH>Group ' + (i+1) + '</TH></TR>' +
                        '<TR><TH>Trial #</TH></TR><TR><TH>' + labelArr[0] +
                        '</TH></TR>';
                    resultsMap["Group " + (i+1)][labelArr[0]] = [];
                    for (var j = 1; j < labelArr.length; j++)
                    {                
                        resultsCSV += ",";
                        resultsTableHTML += '<TR><TH>' + labelArr[j] +
                            '</TH></TR>';
                        resultsMap["Group " + (i+1)][labelArr[j]] = [];
                    }
                    resultsTableHTML += "</TABLE>";
                    if (i < (groupSizes.length - 1))
                    {
                        resultsCSV += ",";
                        resultsTableHTML += "<BR>";
                    }
                }
                resultsCSV += "\n";
            }
            else if (UI.getProperty("selOperation", "value") == "pickcount")
            {
                resultsTableHTML += '<TABLE ID="tblResults"><TR><TH>Trial #</TH></TR>';
                for (var j = 0; j < labelArr.length; j++)
                {
                    resultsTableHTML += '<TR><TH>' + labelArr[j] +
                        '</TH></TR>';
                    resultsMap[labelArr[j]] = [];
                }
                resultsTableHTML += "</TABLE></P>";
            }
            else
            {
                for (var j = 0; j < labelArr.length; j++)
                    resultsMap[labelArr[j]] = [];
                resultsTableHTML += '<TABLE ID="tblResults"><TR><TH>Trial #</TH><TH>Cards</TH></TR></TABLE>';
            }

            if (UI.getProperty("selOperation", "value") !== "picklist")
            {
                resultsCSV += "Trial #";
                for (var i = 0; i < groupSizes.length; i++)
                    for (var j = 0; j < labelArr.length; j++)
                        resultsCSV += ("," + labelArr[j]);
                resultsCSV += "\n";
            }
        }
        UI.setProperty("divResultsTables", "innerHTML", resultsTableHTML);
        UI.setProperty("txtResultsCSV", "value", resultsCSV);
        UI.batchSetStyleProperty(["divRecentResult", "divAllResults"],
                                "display", "block");
    }
    doSingle();
}

function handleDeckChange()
{
    if (deactivatePage(this))
    {
        if (UI.getProperty("selDeck", "value") == "single")
        {
            UI.setStyleProperty("divNotecardsSingle", "display", "block");
            UI.setStyleProperty("divNotecardsPaired", "display", "none");
        }
        else
        {
            UI.setStyleProperty("divNotecardsSingle", "display", "none");
            UI.setStyleProperty("divNotecardsPaired", "display", "block");
        }
    }
}

function handleInputChange()
{
    if (deactivatePage(this))
    {
        if (UI.getProperty("selInput", "value") == "raw")
        {
            UI.setStyleProperty("divRawInput", "display", "block");
            UI.setStyleProperty("divTableInput", "display", "none");
        }
        else
        {
            UI.setStyleProperty("divRawInput", "display", "none");
            UI.setStyleProperty("divTableInput", "display", "block");
        }
    }
}

function handleOperationChange()
{
    if (deactivatePage(this))
    {
        if (UI.getProperty("selOperation", "value") == "groupcount")
        {
            UI.setStyleProperty("spnPickOptions", "display", "none");
            UI.setStyleProperty("spnGroupOptions", "display", "inline");
        }
        else
        {
            UI.setStyleProperty("spnPickOptions", "display", "inline");
            UI.setStyleProperty("spnGroupOptions", "display", "none");
        }
    }
}

function exportResults()
{
	file.saveCSV("txtResultsCSV", "notecard_results");
}

function initializePage()
{
	graph = new STAP.SVGGraph("divPlot");
    
    UI.batchSetStyleProperty(["divRecentResult", "divAllResults", "spnGroupOptions", "divRawInput", "divNotecardsPaired"], "display", "none");
    UI.writeLinkColorOriginRules();
}

STAP.UIHandlers.setOnLoad(initializePage);