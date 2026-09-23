<?php
// Health check for Postman: GET /status.php
require __DIR__ . '/helpers.php';
require_method('GET');

try {
    db()->query('SELECT 1');
} catch (PDOException $e) {
    error_log((string) $e);
    respond(500, ['status' => 'error', 'db' => 'unreachable', 'time' => date('c')], 'Database connection failed.');
}

respond(200, ['status' => 'ok', 'db' => 'connected', 'time' => date('c')], 'API is running.');
