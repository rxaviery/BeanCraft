<?php
// POST {name, email, password} -> 201 {user, token}
require __DIR__ . '/helpers.php';
require_method('POST');

$in = body();
$name = trim((string) ($in['name'] ?? ''));
$email = strtolower(trim((string) ($in['email'] ?? '')));
$password = (string) ($in['password'] ?? '');

$errors = [];
if ($name === '' || mb_strlen($name) > 100) {
    $errors['name'] = 'Name is required (max 100 characters).';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 191) {
    $errors['email'] = 'Enter a valid email address.';
}
if (strlen($password) < 8) {
    $errors['password'] = 'Password must be at least 8 characters.';
}
if (!$errors) {
    $stmt = db()->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $errors['email'] = 'This email is already registered.';
    }
}
if ($errors) {
    fail(422, 'Please fix the highlighted fields.', $errors);
}

db()->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    ->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);

$user = [
    'id' => (int) db()->lastInsertId(),
    'name' => $name,
    'email' => $email,
    'created_at' => date('Y-m-d H:i:s'),
];
respond(201, issue_token($user), 'Account created.');
