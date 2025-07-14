<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);
$admincode = substr($_POST['a'], 0, 4);
$groupID = (isset($_POST['g']) ? intval($_POST['g']) : 0);
$newname = (isset($_POST['n']) ? $_POST['n'] : null);

$credPS = $pdo->prepare("SELECT * FROM tblMaster WHERE ClassCode = ? AND AdminCode = ?");
$credPS->execute([$classcode, $admincode]);
if ($credPS->rowCount() > 0)
{
    if ($groupID > 0)
    {
        if (is_null($newname)) exit();
        $tblPS = $pdo->prepare("UPDATE tblGroupName SET GroupName = ? WHERE ClassCode = ? AND GroupID = ?");
        $tblPS->execute([$newname, $classcode, $groupID]);
    }
    else
    {
        $countPS = $pdo->prepare("SELECT * FROM tblGroupName WHERE ClassCode = ?");
        $countPS->execute([$classcode]);
        
        $insPS = $pdo->prepare("INSERT INTO tblGroupName (`ClassCode`, `GroupID`, `GroupName`) VALUES (?,?,?)");
        $insPS->execute([$classcode,($countPS->rowCount() + 1),$newname]);
    }
}
else
    echo "No matching class found.";
?>