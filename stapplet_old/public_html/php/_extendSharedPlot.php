<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);

$tblPS = $pdo->prepare("UPDATE tblMaster SET ExpDate = DATE_ADD(NOW(), INTERVAL 3 DAY) WHERE ClassCode = ?");
$tblPS->execute([$classcode]);
if ($tblPS->rowCount() == 0)
    echo "No matching class found.";
?>