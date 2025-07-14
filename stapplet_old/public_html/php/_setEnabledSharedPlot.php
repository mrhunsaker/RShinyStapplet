<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);
$admincode = substr($_POST['a'], 0, 4);
$enabled = substr($_POST['e'], 0, 1);

$tblPS = $pdo->prepare("UPDATE tblMaster SET Enabled = ? WHERE ClassCode = ? AND AdminCode = ?");
$tblPS->execute([$enabled, $classcode, $admincode]);
if ($tblPS->rowCount() == 0)
    echo "No matching class found.";
?>