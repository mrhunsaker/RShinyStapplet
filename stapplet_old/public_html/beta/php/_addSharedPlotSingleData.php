<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);
$groupID = (isset($_POST['g']) ? $_POST['g'] : "1");

$tblPS = $pdo->prepare("SELECT Quant, NumVar FROM tblMaster WHERE ClassCode = ? AND Enabled = 1");
$tblPS->execute([$classcode]);
if ($tblPS->rowCount() > 0)
{
    $tblparams = $tblPS->fetch();

    $isquant = ($tblparams["Quant"] == "1");
    $is2var = ($tblparams["NumVar"] == "2");

    $tblname = ($isquant ? "tblQuant" : "tblCat") . $tblparams["NumVar"] . "V";
    
    $var1 = isset($_POST['v1']) ? $_POST['v1'] : "";
    $var2 = isset($_POST['v2']) ? $_POST['v2'] : "";
    
    if ($isquant)
    {
        if (!is_numeric($var1)) exit();
        if ($is2var && !is_numeric($var2)) exit();
    }
    
    if (!is_numeric($groupID)) exit();
    
    $args = array($classcode, $var1);
    if ($is2var)
        array_push($args, $var2);
    else
        array_push($args, $groupID);
    
    $dataPS = ($isquant ? $pdo->prepare("INSERT INTO " . $tblname . " (`ClassCode`,`Var1`" . ($is2var ? ",`Var2`)" : ",`GroupID`)") . " VALUES (?,?,?)") : $pdo->prepare("UPDATE " . $tblname . " SET Frequency = Frequency + 1 WHERE `ClassCode` = ? AND `Var1` = ? AND `GroupID` = ?"));
        $dataPS->execute($args);

    if ($dataPS->rowCount() == 0)
        echo "There was an error adding the data to the plot.";
}
else
    echo "There is no enabled plot with that code.";
?>