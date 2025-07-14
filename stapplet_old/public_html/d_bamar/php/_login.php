<?php
$host = 'localhost';
$db   = 'STAPSharedPlots_Prod';
$user = 'STAPClient';
$pass = 'stap_client';
$charset = 'latin1';

//     PDO::ATTR_PERSISTENT         => true,

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

$pdo = new PDO($dsn, $user, $pass, $options);
?>