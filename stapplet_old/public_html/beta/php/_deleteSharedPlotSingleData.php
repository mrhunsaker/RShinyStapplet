<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);
$groupID = (isset($_POST['g']) ? $_POST['g'] : "1");

$tblPS = $pdo->prepare("SELECT Quant, NumVar FROM tblMaster WHERE ClassCode = ?");
$tblPS->execute([$classcode]);
if ($tblPS->rowCount() > 0)
{
    $tblparams = $tblPS->fetch();

    $isquant = ($tblparams["Quant"] == "1");
    $is2var = ($tblparams["NumVar"] == "2");

    $tblname = ($isquant ? "tblQuant" : "tblCat") . $tblparams["NumVar"] . "V";

    if (!isset($_POST['v1'])) exit();
    if ($is2var && !isset($_POST['v2'])) exit();
    
    $var1 = $_POST['v1'];
    $var2 = $is2var ? $_POST['v2'] : "";
    
    if ($isquant)
    {
        if (!is_numeric($var1)) exit();
        if ($is2var && !is_numeric($var2)) exit();

        $toltext = "0.0000001";
        $querytext = "DELETE FROM " . $tblname . " WHERE `ClassCode` = '" . $classcode . "' AND ABS(`Var1` - " . $var1 . ") < " . $toltext . ($is2var ? " AND ABS(`Var2` - " . $var2 . ") < " . $toltext : " AND `GroupID` = " . $groupID) . " LIMIT 1";
        
        $dataQ = $pdo->query($querytext); 
        if ($dataQ->rowCount() == 0)
            echo "No matching datum found. (Data may not have synchronized yet.)";
    }
    else
    {
        $args = array($classcode, $var1);
        if ($is2var) array_push($args, $var2);

        $dataPS = $pdo->prepare("DELETE FROM " . $tblname . " WHERE `ClassCode` = ? AND `Var1` = ? " . ($is2var ? " AND `Var2` = ? " : " ") . "LIMIT 1");
        $dataPS->execute($args);
        if ($dataPS->rowCount() == 0)
            echo "No matching datum found. (Data may not have synchronized yet.)";
    }
}
else
    echo "No matching class found.";
?>