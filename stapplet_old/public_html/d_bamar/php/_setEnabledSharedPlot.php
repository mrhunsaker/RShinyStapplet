<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);
$admincode = substr($_POST['a'], 0, 4);
$enabled = (isset($_POST['e']) ? substr($_POST['e'], 0, 1) : '0');

$tblPS = ($enabled == '0' ? $pdo->prepare("UPDATE tblMaster SET Enabled = FALSE WHERE ClassCode = ? AND AdminCode = ?") : $pdo->prepare("UPDATE tblMaster SET Enabled = TRUE, LastEnabledDate = NOW() WHERE ClassCode = ? AND AdminCode = ?"));
$tblPS->execute([$classcode, $admincode]);
if ($tblPS->rowCount() == 0)
    echo "No matching class found.";
?>