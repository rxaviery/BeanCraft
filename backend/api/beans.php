<?php
// Beans CRUD. Every query is scoped to the logged-in user.
//   GET            -> list (newest first)
//   GET    ?id=N   -> one bean
//   POST           -> create
//   PUT    ?id=N   -> update (send only the fields you want to change)
//   DELETE ?id=N   -> delete
require __DIR__ . '/helpers.php';

// The only columns the client may write. Also used to build SQL column lists,
// so user input never becomes a column name.
const BEAN_FIELDS = [
    'name', 'roaster', 'origin', 'farm', 'process_method', 'roast_level', 'roast_date',
    'altitude', 'tasting_notes', 'bag_weight_g', 'remaining_g', 'price', 'rating', 'cupping_notes',
];

// Checks every field. Returns [cleanValues, errors].
function validate_bean(array $in)
{
    $out = [];
    $errors = [];

    // Text fields: field => [max length, required?]
    $text = [
        'name' => [100, true], 'roaster' => [100, true], 'origin' => [100, false],
        'farm' => [100, false], 'process_method' => [50, false], 'roast_level' => [50, false],
        'altitude' => [50, false], 'tasting_notes' => [255, false], 'cupping_notes' => [5000, false],
    ];
    foreach ($text as $field => [$max, $required]) {
        $value = isset($in[$field]) && is_scalar($in[$field]) ? trim((string) $in[$field]) : '';
        if ($value === '') {
            $out[$field] = null;
            if ($required) {
                $errors[$field] = 'This field is required.';
            }
        } elseif (mb_strlen($value) > $max) {
            $errors[$field] = "Maximum $max characters.";
        } else {
            $out[$field] = $value;
        }
    }

    // roast_date: optional, YYYY-MM-DD and a real calendar date.
    $date = trim((string) ($in['roast_date'] ?? ''));
    $parsed = DateTime::createFromFormat('!Y-m-d', $date);
    if ($date === '') {
        $out['roast_date'] = null;
    } elseif (!$parsed || $parsed->format('Y-m-d') !== $date) {
        $errors['roast_date'] = 'Use the format YYYY-MM-DD.';
    } else {
        $out['roast_date'] = $date;
    }

    // bag_weight_g: required whole grams.
    $bag = filter_var($in['bag_weight_g'] ?? null, FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1, 'max_range' => 10000]]);
    if ($bag === false) {
        $errors['bag_weight_g'] = 'Enter whole grams from 1 to 10000.';
    } else {
        $out['bag_weight_g'] = $bag;
    }

    // remaining_g: defaults to the full bag; can't go below 0 or above the bag.
    $remaining = $in['remaining_g'] ?? null;
    if ($remaining === null || $remaining === '') {
        $out['remaining_g'] = $bag === false ? null : $bag;
    } else {
        $remaining = filter_var($remaining, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
        if ($remaining === false || ($bag !== false && $remaining > $bag)) {
            $errors['remaining_g'] = 'Must be between 0 and the bag weight.';
        } else {
            $out['remaining_g'] = $remaining;
        }
    }

    // price and rating: optional numbers.
    foreach (['price' => [999999.99, 2], 'rating' => [5, 1]] as $field => [$max, $decimals]) {
        $value = $in[$field] ?? null;
        if ($value === null || $value === '') {
            $out[$field] = null;
        } elseif (!is_numeric($value) || $value < 0 || $value > $max) {
            $errors[$field] = "Enter a number from 0 to $max.";
        } else {
            $out[$field] = round((float) $value, $decimals);
        }
    }

    return [$out, $errors];
}

// Turns a DB row into clean JSON types (numbers as numbers, no user_id).
function bean_out(array $row)
{
    unset($row['user_id']);
    foreach (['id', 'bag_weight_g', 'remaining_g'] as $key) {
        $row[$key] = (int) $row[$key];
    }
    foreach (['price', 'rating'] as $key) {
        $row[$key] = $row[$key] === null ? null : (float) $row[$key];
    }
    return $row;
}

// One bean owned by this user, or null.
function find_bean($id, $userId)
{
    $stmt = db()->prepare('SELECT * FROM beans WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    $row = $stmt->fetch();
    return $row ? bean_out($row) : null;
}

$user = require_user();
$method = request_method();

$id = id_param('id');
if (($method === 'PUT' || $method === 'DELETE') && $id === null) {
    fail(400, 'Add ?id=N to the URL.');
}

if ($method === 'GET' && $id === null) {
    $stmt = db()->prepare('SELECT * FROM beans WHERE user_id = ? ORDER BY created_at DESC, id DESC');
    $stmt->execute([$user['id']]);
    respond(200, array_map('bean_out', $stmt->fetchAll()));
}

if ($method === 'GET') {
    $bean = find_bean($id, $user['id']);
    if (!$bean) {
        fail(404, 'Bean not found.');
    }
    respond(200, $bean);
}

if ($method === 'POST') {
    [$bean, $errors] = validate_bean(body());
    if ($errors) {
        fail(422, 'Please fix the highlighted fields.', $errors);
    }
    $columns = array_keys($bean);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = 'INSERT INTO beans (user_id, ' . implode(', ', $columns) . ") VALUES (?, $placeholders)";
    db()->prepare($sql)->execute(array_merge([$user['id']], array_values($bean)));
    respond(201, find_bean(db()->lastInsertId(), $user['id']), 'Bean added to your stash.');
}

if ($method === 'PUT') {
    $existing = find_bean($id, $user['id']);
    if (!$existing) {
        fail(404, 'Bean not found.');
    }
    // Partial update: start from the saved bean, overwrite only the fields sent.
    $changes = array_intersect_key(body(), array_flip(BEAN_FIELDS));
    [$bean, $errors] = validate_bean(array_merge($existing, $changes));
    if ($errors) {
        fail(422, 'Please fix the highlighted fields.', $errors);
    }
    $set = implode(', ', array_map(function ($column) {
        return "$column = ?";
    }, array_keys($bean)));
    $sql = "UPDATE beans SET $set WHERE id = ? AND user_id = ?";
    db()->prepare($sql)->execute(array_merge(array_values($bean), [$id, $user['id']]));
    respond(200, find_bean($id, $user['id']), 'Bean updated.');
}

if ($method === 'DELETE') {
    $stmt = db()->prepare('DELETE FROM beans WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $user['id']]);
    if ($stmt->rowCount() === 0) {
        fail(404, 'Bean not found.');
    }
    respond(200, ['id' => $id], 'Bean deleted.');
}

fail(405, 'Method not allowed.');
