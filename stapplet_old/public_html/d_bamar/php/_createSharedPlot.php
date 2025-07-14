<?php
include '_login.php';

$postquant = (isset($_POST['q']) ? $_POST['q'] : 1);
$postvar = (isset($_POST['v']) ? $_POST['v'] : 1);

$postquant = (!is_numeric($postquant) ? 1 : intval($postquant));
$postvar = (!is_numeric($postvar) ? 1 : intval($postvar));

$tblPS = $pdo->prepare("CALL STAP_new_class_code(?,?)");
$tblPS->execute([$postquant,$postvar]);
if ($tblPS->rowCount() > 0)
{
    $result = $tblPS->fetch();
    echo $result["ClassCode"] . $result["AdminCode"];
}
?>