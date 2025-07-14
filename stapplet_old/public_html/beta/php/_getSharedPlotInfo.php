<?php
include '_login.php';

$classcode = substr($_GET['c'], 0, 6);
$admincode = isset($_GET['a']) ? $_GET['a'] : "";
$whichvar = isset($_GET['v']) ? intval($_GET['v']) : 1;
if (($whichvar < 1) || ($whichvar > 2)) $whichvar = 1;

$varname = 'Var' . $whichvar;

$tblPS = $pdo->prepare("SELECT ExpDate, Quant, NumVar, Enabled FROM tblMaster WHERE ClassCode = ?" . (($admincode == "") ? "" : " AND AdminCode = ?"));
if ($admincode == "")
    $tblPS->execute([$classcode]);
else
    $tblPS->execute([$classcode,$admincode]);

if ($tblPS->rowCount() > 0)
{
    $tblparams = $tblPS->fetch();
    echo $tblparams["ExpDate"] . "\n";
    echo $tblparams["Quant"] . "\n";
    echo $tblparams["NumVar"] . "\n";
    echo $tblparams["Enabled"] . "\n";
}
?>