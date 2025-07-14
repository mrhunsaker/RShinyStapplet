<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);
$groupID = (isset($_POST['g']) ? $_POST['g'] : "1");

$tblPS = $pdo->prepare("SELECT * FROM tblMaster WHERE ClassCode = ? AND Enabled = 1 AND Quant = 0 AND NumVar = 1");
$tblPS->execute([$classcode]);
if ($tblPS->rowCount() > 0)
{
    $tblparams = $tblPS->fetch();

    if (!isset($_POST['v1'])) exit();
    
    $var1 = $_POST['v1'];

    if (!is_numeric($groupID)) exit();
    
    $args = array($classcode, $var1, $groupID);

    $dataPS = $pdo->prepare("UPDATE tblCat1V SET Frequency = Frequency - 1 WHERE `ClassCode` = ? AND `Var1` = ? AND `GroupID` = ?");
    $dataPS->execute($args);

    if ($dataPS->rowCount() == 0)
        echo "That category was not found in the data.";
}
else
    echo "There is no enabled plot with that code.";
?>