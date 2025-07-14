<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);
$admincode = substr($_POST['a'], 0, 4);
$groupID = (isset($_POST['g']) ? $_POST['g'] : "1");

$tblPS = $pdo->prepare("SELECT Quant, NumVar FROM tblMaster WHERE ClassCode = ? AND AdminCode = ?");
$tblPS->execute([$classcode,$admincode]);
if ($tblPS->rowCount() > 0)
{
    $tblparams = $tblPS->fetch();

    $isquant = ($tblparams["Quant"] == "1");
    $is2var = ($tblparams["NumVar"] == "2");

    $tblname = ($isquant ? "tblQuant" : "tblCat") . $tblparams["NumVar"] . "V";

    if (!$is2var)
    {
        $querytext = "DELETE FROM " . $tblname . " WHERE `ClassCode` = '" . $classcode . "' AND `GroupID` = " . $groupID;
        $pdo->query($querytext);
    
        $grouptext = "DELETE FROM `tblGroupName` WHERE `ClassCode` = '" . $classcode . "' AND `GroupID` = " . $groupID;
        $pdo->query($grouptext);
    
        $decr1text = "UPDATE `tblGroupName` SET GroupID = GroupID - 1 WHERE `ClassCode` = '" . $classcode . "' AND `GroupID` > " . $groupID;
        $pdo->query($decr1text);
    
        $decr2text = "UPDATE " . $tblname . " SET GroupID = GroupID - 1 WHERE `ClassCode` = '" . $classcode . "' AND `GroupID` > " . $groupID;
        $pdo->query($decr2text);
    }
}
else
    echo "The credentials supplied are not correct.";
?>