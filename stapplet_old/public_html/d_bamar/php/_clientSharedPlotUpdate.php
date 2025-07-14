<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);
$addnum = (isset($_POST['a'])) ? intval($_POST['a']) : 0;
$delnum = (isset($_POST['d'])) ? intval($_POST['d']) : 0;

$tblPS = $pdo->prepare("SELECT Quant, NumVar FROM tblMaster WHERE ClassCode = ?");
$tblPS->execute([$classcode]);
if ($tblPS->rowCount() > 0)
{
    $tblparams = $tblPS->fetch();

    $isquant = ($tblparams["Quant"] == "1");
    $is2var = ($tblparams["NumVar"] == "2");

    $tblname = ($isquant ? "tblQuant" : "tblCat") . $tblparams["NumVar"] . "V";

    $var1 = isset($_POST['d1']) ? json_decode($_POST['d1']) : "";
    $var2 = isset($_POST['d2']) ? json_decode($_POST['d2']) : "";
    
    if ($tblparams["Quant"] == "1")
    {
        if (count($var1) != count(array_filter($var1, 'is_numeric' )))
        {
            echo "Data is not numeric.";
            exit();
        };
        if ($is2var && (count($var2) != count(array_filter($var2, 'is_numeric' ))))
        {
            echo "Data is not numeric.";
            exit();
        };
    }
    
    if ($is2var && (count($var1) != count($var2)))
    {
        echo "Unequal numbers of observations in each group.";
        exit();
    };
    
    $args = [];
    $template = " ('" . $classcode . "',?" . ($is2var ? ",?)" : "," . $groupID . ")");
    $valuestr = "";
    for ($i = 0; $i < count($var1) ; $i++)
    {
        array_push($args, $var1[$i]);
        if ($is2var) array_push($args, $var2[$i]);
        $valuestr .= $template;
        if (($i + 1) < count($var1)) $valuestr .= ",";
    }

    $querytext = "INSERT INTO " . $tblname . " (`ClassCode`,`Var1`" . ($is2var ? ",`Var2`) VALUES" : ",`GroupID`) VALUES") . $valuestr . ";";
    $dataPS = $pdo->prepare($querytext);
    $dataPS->execute($args);
}
else
    echo "The credentials supplied were incorrect."
?>