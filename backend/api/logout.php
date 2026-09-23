<?php
// POST (with token) -> clears the token so it can't be used again.
require __DIR__ . '/helpers.php';
require_method('POST');

$user = require_user();
db()->prepare('UPDATE users SET api_token = NULL WHERE id = ?')->execute([$user['id']]);
respond(200, null, 'Logged out.');
