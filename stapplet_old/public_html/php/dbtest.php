<?php
# Fill our vars and run on cli
# $ php -f db-connect-test.php

#$dbname = 'STAPSharedPlots';
#$dbuser = 'client';
#$dbpass = 'stap_client';
#$dbhost = 'localhost';

#$link = mysqli_connect($dbhost, $dbuser, $dbpass) or die("Unable to Connect to '$dbhost'");
#mysqli_select_db($link, $dbname) or die("Could not open the db '$dbname'");

#$test_query = "SHOW TABLES FROM $dbname";
#$result = mysqli_query($link, $test_query);

#$tblCnt = 0;
#while($tbl = mysqli_fetch_array($result)) {
#  $tblCnt++;
  #echo $tbl[0]."<br />\n";
#}

$host = 'localhost';
$db   = 'STAPSharedPlots';
$user = 'client';
$pass = 'stap_client';
$charset = 'latin1';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    $stmt = $pdo->prepare('SHOW TABLES');
    $stmt->execute();
    var_dump($stmt->fetchAll());

} catch (\PDOException $e) {
    echo $e->getMessage();
    echo $e->getCode();
#    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}

?>