<?php
// POST {email, password} -> 200 {user, token}
require __DIR__ . '/helpers.php';
require_method('POST');

$in = body();
$email = strtolower(trim((string) ($in['email'] ?? '')));
$password = (string) ($in['password'] ?? '');

$errors = [];
if ($email === '') {
    $errors['email'] = 'Email is required.';
}
if ($password === '') {
    $errors['password'] = 'Password is required.';
}
if ($errors) {
    fail(422, 'Please fix the highlighted fields.', $errors);
}

$stmt = db()->prepare('SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Same message for "no such email" and "wrong password", so emails can't be probed.
if (!$user || !password_verify($password, $user['password_hash'])) {
    fail(401, 'Incorrect email or password.');
}

unset($user['password_hash']);
$user['id'] = (int) $user['id'];
respond(200, issue_token($user), 'Logged in.');
