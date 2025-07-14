<?php
include '_login.php';

$classcode = substr($_GET['c'], 0, 6);

$tblPS = $pdo->prepare("SELECT * FROM tblMaster WHERE ClassCode = ?");
$tblPS->execute([$classcode]);
if ($tblPS->rowCount() > 0)
{
    $tblparams = $tblPS->fetch();
    $isquant = ($tblparams["Quant"] == "1");
    $tblname = ($isquant ? "tblQuant" : "tblCat") . $tblparams["NumVar"] . "V";
    $is2var = ($tblparams["NumVar"] == "2");
    
    echo $tblparams["Enabled"] . $tblparams["Var1Name"] . ($is2var ?  "," . $tblparams["Var2Name"] : "") . "\n";

    $groupnames = [];
    if (!$is2var)
    {
        $groupPS = $pdo->prepare("SELECT GroupID, GroupName FROM tblGroupName WHERE ClassCode = ? ORDER BY GroupID");
        $groupPS->execute([$classcode]);
        foreach ($groupPS as $row)
        {
            while (count($groupnames) < (intval($row["GroupID"]) - 1))
                $groupnames[] = "Group " . (count($groupnames) + 1);
            $groupnames[] = $row["GroupName"];          
        }
    }

    $dataPS = ($is2var ? $pdo->prepare("SELECT Var1, Var2 FROM " . $tblname . " WHERE ClassCode = ?") : $pdo->prepare("SELECT Var1, GroupID" . ($isquant ? "" : ", Frequency") . " FROM " . $tblname . " WHERE ClassCode = ?"));

    $dataPS->execute([$classcode]);
    
    if ($is2var)
        foreach ($dataPS as $row)
            echo $row["Var1"] . "," . $row["Var2"] . "\n";
    else
        foreach ($dataPS as $row)
        {
            $grpid = intval($row["GroupID"]);
            $grpname = (count($groupnames) < $grpid ? "Group " . $grpid : $groupnames[$grpid - 1]);
            echo $grpid . "," . $grpname . "," . $row["Var1"] . ($isquant ? "" : "," . $row["Frequency"]) . "\n";
        }
}
?>