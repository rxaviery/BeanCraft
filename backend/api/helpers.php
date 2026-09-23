<?php
require __DIR__ . '/config.php';

// Every response is JSON. CORS headers only matter for Expo web / browsers.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Any uncaught error: log the details, send the client a generic 500.
set_exception_handler(function ($e) {
    error_log((string) $e);
    respond(500, null, 'Server error. Please try again later.');
});

// Sends {"success", "data", "message"} with the given HTTP status and stops.
function respond($status, $data = null, $message = '')
{
    http_response_code($status);
    echo json_encode([
        'success' => $status < 400,
        'data' => $data,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Shortcut for errors. For 422, $errors is {"field": "what is wrong"}.
function fail($status, $message, $errors = null)
{
    respond($status, $errors === null ? null : ['errors' => $errors], $message);
}

// The request body as an array (JSON, or form fields as a fallback). Read once.
function body()
{
    static $data = null;
    if ($data === null) {
        if (!empty($_POST)) {
            $data = $_POST;
        } else {
            $raw = file_get_contents('php://input');
            $data = $raw === '' ? [] : json_decode($raw, true);
            if (!is_array($data)) {
                fail(400, 'Request body must be a JSON object.');
            }
        }
    }
    return $data;
}

// The real method. Hosts that block PUT/DELETE can send POST with
// "_method": "PUT" / "DELETE" in the body, or ?_method=PUT in the URL.
function request_method()
{
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'POST') {
        $override = strtoupper($_GET['_method'] ?? (body()['_method'] ?? ''));
        if (in_array($override, ['PUT', 'DELETE'], true)) {
            return $override;
        }
    }
    return $method;
}

function require_method($method)
{
    if (request_method() !== $method) {
        fail(405, "Use $method for this endpoint.");
    }
}

// Token from "X-Auth-Token: <t>" or "Authorization: Bearer <t>".
function auth_token()
{
    $token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    if ($token === '') {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
            $token = $m[1];
        }
    }
    return $token;
}

function new_token()
{
    return bin2hex(random_bytes(32));
}

// Auth guard: returns the logged-in user or stops with 401.
function require_user()
{
    $token = auth_token();
    if ($token === '') {
        fail(401, 'Missing token. Please log in.');
    }
    $stmt = db()->prepare('SELECT id, name, email, created_at FROM users WHERE api_token = ?');
    $stmt->execute([hash('sha256', $token)]);
    $user = $stmt->fetch();
    if (!$user) {
        fail(401, 'Session expired. Please log in again.');
    }
    $user['id'] = (int) $user['id'];
    return $user;
}

// Saves a fresh token for the user and returns the login/register payload.
function issue_token(array $user)
{
    $token = new_token();
    db()->prepare('UPDATE users SET api_token = ? WHERE id = ?')
        ->execute([hash('sha256', $token), $user['id']]);
    return ['user' => $user, 'token' => $token];
}
