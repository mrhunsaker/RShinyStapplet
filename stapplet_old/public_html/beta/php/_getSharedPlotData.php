<?php
include '_login.php';

$classcode = substr($_GET['c'], 0, 6);
$groupID = (isset($_GET['g']) ? $_GET['g'] : "1");

$tblPS = $pdo->prepare("SELECT * FROM tblMaster WHERE ClassCode = ?");
$tblPS->execute([$classcode]);
if ($tblPS->rowCount() > 0)
{
    $tblparams = $tblPS->fetch();
    $isquant = ($tblparams["Quant"] == "1");
    $tblname = ($isquant ? "tblQuant" : "tblCat") . $tblparams["NumVar"] . "V";
    $is2var = ($tblparams["NumVar"] == "2");
    
    echo $tblparams["Enabled"] . $tblparams["Var1Name"] . ($is2var ?  "," . $tblparams["Var2Name"] : "") . "\n";

    $dataPS = ($is2var ? $pdo->prepare("SELECT Var1, Var2 FROM " . $tblname . " WHERE ClassCode = ?") : $pdo->prepare("SELECT Var1" . ($isquant ? "" : ", Frequency") . " FROM " . $tblname . " WHERE ClassCode = ? AND GroupID = ?"));

    $args = ($is2var ? [$classcode] : [$classcode, $groupID]);
    $dataPS->execute($args);
    foreach ($dataPS as $row)
        echo $row["Var1"] . ($is2var ? "," . $row["Var2"] : ($isquant ? "" : ",". $row["Frequency"])) . "\n";
}
?>