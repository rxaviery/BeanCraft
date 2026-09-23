<?php
// Database settings: copy them from Freehostia -> MySQL Databases.
// Edit the password only in the copy on the server, so it never lands in git.
const DB_HOST = 'localhost';
const DB_NAME = 'renpas12_db';
const DB_USER = 'renpas12_db';
const DB_PASS = 'CHANGE_ME';

// Production: never show PHP errors to the app, write them to error.log instead.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/error.log');
date_default_timezone_set('Asia/Manila');

// Returns one shared PDO connection, created the first time it is needed.
function db()
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '+08:00'",
        ]);
    }
    return $pdo;
}
