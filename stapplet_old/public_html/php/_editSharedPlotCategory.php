<?php
include '_login.php';

$classcode = substr($_POST['c'], 0, 6);
$admincode = substr($_POST['a'], 0, 4);
$groupID = intval($_POST['g']);
$freq = (isset($_POST['f']) ? intval($_POST['f']) : 1);
$oldname = (isset($_POST['o']) ? $_POST['o'] : null);
$newname = (isset($_POST['n']) ? $_POST['n'] : null);

$credPS = $pdo->prepare("SELECT * FROM tblMaster WHERE ClassCode = ? AND AdminCode = ?");
$credPS->execute([$classcode, $admincode]);
if ($credPS->rowCount() > 0)
{
    if (!is_null($oldname))
    {
        if (is_null($newname)) $newname = $oldname;
        $tblPS = $pdo->prepare("UPDATE tblCat1V SET Var1 = ?, Frequency = ? WHERE Var1 = ? AND ClassCode = ? AND GroupID = ?");
        $tblPS->execute([$newname, $freq, $oldname, $classcode, $groupID]);
    }
    else
    {
        $insPS = $pdo->prepare("INSERT INTO tblCat1V (`ClassCode`, `GroupID`, `Var1`, `Frequency`) VALUES (?,?,?,?)");
        $insPS->execute([$classcode,$groupID,$newname,$freq]);
    }
}
else
    echo "No matching class found.";
?>