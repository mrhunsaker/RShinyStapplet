<?php
ini_set("include_path", '/home/whkobxnuf536/php:' . ini_get("include_path") );

$host = 'localhost';
$db   = 'STAPSharedPlots_Prod';
$user = 'STAPAll';
$pass = 'VTnm[7F4rRMe';
$charset = 'latin1';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

$pdo = new PDO($dsn, $user, $pass, $options);

$delPSQ1V = $pdo->prepare("DELETE FROM tblQuant1V WHERE ClassCode = ?");
$delPSQ2V = $pdo->prepare("DELETE FROM tblQuant2V WHERE ClassCode = ?");
$delPSC1V = $pdo->prepare("DELETE FROM tblCat1V WHERE ClassCode = ?");
$delGrp = $pdo->prepare("DELETE FROM tblGroupName WHERE ClassCode = ?");
$delPSM = $pdo->prepare("DELETE FROM tblMaster WHERE ClassCode = ?");


foreach ($pdo->query("SELECT ClassCode FROM tblMaster WHERE ExpDate < NOW()")
    as $row)
{
    $expcode = $row['ClassCode'];
    $delPSQ1V->execute([$expcode]);
    $delPSQ2V->execute([$expcode]);
    $delPSC1V->execute([$expcode]);
    $delGrp->execute([$expcode]);
    $delPSM->execute([$expcode]);
}

// If a remaining plot has been enabled too long, disable it
$pdo->query("UPDATE tblMaster SET Enabled = FALSE WHERE LastEnabledDate < DATE_ADD(NOW(), INTERVAL -10 MINUTE)");

// Clean up any old cache files from old class codes
// Include the package
require_once('Cache/Lite.php');

// Set a few options -- conservatively clean files older than 30 seconds
$options = array(
    'cacheDir' => '/home/whkobxnuf536/cache/',
    'lifeTime' => 30
);
$Cache_Lite = new Cache_Lite($options);
$Cache_Lite->clean(false,"old");

/* Deep cleaning syntax - shouldn't be necessary?
foreach ($pdo->query("SELECT DISTINCT a.ClassCode FROM `tblQuant1V` AS a LEFT JOIN `tblMaster` AS b ON a.ClassCode = b.ClassCode WHERE b.ClassCode IS NULL") as $row)
{
    $expcode = $row['ClassCode'];
    $delPSQ1V->execute([$expcode]);
}
*/
?>