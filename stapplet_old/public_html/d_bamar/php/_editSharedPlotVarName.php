<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);
$varname = "Var" . $_POST['v'] . "Name";

$tblPS = $pdo->prepare("UPDATE tblMaster SET " . $varname . " = ? WHERE ClassCode = ?");
$tblPS->execute([$_POST['n'], $classcode]);
if ($tblPS->rowCount() == 0)
    echo "No matching class found.";
?>