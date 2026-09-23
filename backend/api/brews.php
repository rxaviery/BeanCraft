<?php
// Brew journal CRUD. Every query is scoped to the logged-in user.
//   GET              -> list, newest first (add &bean_id=N for one bean's brews)
//   GET    ?id=N     -> one brew
//   POST             -> create
//   PUT    ?id=N     -> update (send only the fields you want to change)
//   DELETE ?id=N     -> delete
// Brewing uses coffee, so the bean's remaining_g follows the dose:
// create takes the dose out, update applies the difference, delete puts it back.
require __DIR__ . '/helpers.php';

// The only columns the client may write (bean_id only when creating).
const BREW_FIELDS = [
    'bean_id', 'method', 'dose_g', 'water_g', 'brew_time_s', 'water_temp_c', 'grind', 'rating', 'notes',
];

// Checks every field. Returns [cleanValues, errors].
function validate_brew(array $in, $userId)
{
    $out = [];
    $errors = [];

    // bean_id: required, and the bean must belong to this user.
    $beanId = filter_var($in['bean_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $stmt = db()->prepare('SELECT id FROM beans WHERE id = ? AND user_id = ?');
    $stmt->execute([$beanId ?: 0, $userId]);
    if (!$stmt->fetch()) {
        $errors['bean_id'] = 'Choose one of your beans.';
    } else {
        $out['bean_id'] = $beanId;
    }

    // Text fields: field => [max length, required?]
    $text = ['method' => [50, true], 'grind' => [50, false], 'notes' => [2000, false]];
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

    // Numbers: field => [min, max, required?, decimals]
    $numbers = [
        'dose_g' => [1, 100, true, 1],
        'water_g' => [1, 3000, false, 0],
        'brew_time_s' => [1, 3600, false, 0],
        'water_temp_c' => [50, 100, false, 0],
        'rating' => [0, 5, false, 1],
    ];
    foreach ($numbers as $field => [$min, $max, $required, $decimals]) {
        $value = $in[$field] ?? null;
        if ($value === null || $value === '') {
            $out[$field] = null;
            if ($required) {
                $errors[$field] = 'This field is required.';
            }
        } elseif (!is_numeric($value) || $value < $min || $value > $max) {
            $errors[$field] = "Enter a number from $min to $max.";
        } else {
            $out[$field] = $decimals ? round((float) $value, $decimals) : (int) round($value);
        }
    }

    return [$out, $errors];
}

// Turns a DB row into clean JSON types.
function brew_out(array $row)
{
    unset($row['user_id']);
    foreach (['id', 'bean_id', 'water_g', 'brew_time_s', 'water_temp_c'] as $key) {
        $row[$key] = $row[$key] === null ? null : (int) $row[$key];
    }
    foreach (['dose_g', 'rating'] as $key) {
        $row[$key] = $row[$key] === null ? null : (float) $row[$key];
    }
    return $row;
}

// Brews joined with their bean's name, for lists and details.
const BREW_SELECT = 'SELECT br.*, b.name AS bean_name, b.roaster AS bean_roaster
    FROM brews br JOIN beans b ON b.id = br.bean_id';

function find_brew($id, $userId)
{
    $stmt = db()->prepare(BREW_SELECT . ' WHERE br.id = ? AND br.user_id = ?');
    $stmt->execute([$id, $userId]);
    $row = $stmt->fetch();
    return $row ? brew_out($row) : null;
}

// Takes $grams out of a bean's remaining coffee (negative puts it back).
// The result always stays between 0 and the bag weight.
function use_coffee($beanId, $userId, $grams)
{
    db()->prepare(
        'UPDATE beans
         SET remaining_g = LEAST(bag_weight_g, GREATEST(0, ROUND(CAST(remaining_g AS SIGNED) - ?)))
         WHERE id = ? AND user_id = ?'
    )->execute([$grams, $beanId, $userId]);
}

$user = require_user();
$method = request_method();
$id = id_param('id');

if (($method === 'PUT' || $method === 'DELETE') && $id === null) {
    fail(400, 'Add ?id=N to the URL.');
}

if ($method === 'GET' && $id === null) {
    $beanId = id_param('bean_id');
    $sql = BREW_SELECT . ' WHERE br.user_id = ?' . ($beanId ? ' AND br.bean_id = ?' : '') . ' ORDER BY br.brewed_at DESC, br.id DESC';
    $stmt = db()->prepare($sql);
    $stmt->execute($beanId ? [$user['id'], $beanId] : [$user['id']]);
    respond(200, array_map('brew_out', $stmt->fetchAll()));
}

if ($method === 'GET') {
    $brew = find_brew($id, $user['id']);
    if (!$brew) {
        fail(404, 'Brew not found.');
    }
    respond(200, $brew);
}

if ($method === 'POST') {
    [$brew, $errors] = validate_brew(body(), $user['id']);
    if ($errors) {
        fail(422, 'Please fix the highlighted fields.', $errors);
    }
    // The brew and the stock change are saved together or not at all.
    db()->beginTransaction();
    $columns = array_keys($brew);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = 'INSERT INTO brews (user_id, ' . implode(', ', $columns) . ") VALUES (?, $placeholders)";
    db()->prepare($sql)->execute(array_merge([$user['id']], array_values($brew)));
    $newId = db()->lastInsertId();
    use_coffee($brew['bean_id'], $user['id'], $brew['dose_g']);
    db()->commit();
    respond(201, find_brew($newId, $user['id']), 'Brew logged.');
}

if ($method === 'PUT') {
    $existing = find_brew($id, $user['id']);
    if (!$existing) {
        fail(404, 'Brew not found.');
    }
    // Partial update. A brew can't be moved to a different bean.
    $changes = array_intersect_key(body(), array_flip(BREW_FIELDS));
    unset($changes['bean_id']);
    [$brew, $errors] = validate_brew(array_merge($existing, $changes), $user['id']);
    if ($errors) {
        fail(422, 'Please fix the highlighted fields.', $errors);
    }
    unset($brew['bean_id']);
    db()->beginTransaction();
    $set = implode(', ', array_map(function ($column) {
        return "$column = ?";
    }, array_keys($brew)));
    db()->prepare("UPDATE brews SET $set WHERE id = ? AND user_id = ?")
        ->execute(array_merge(array_values($brew), [$id, $user['id']]));
    use_coffee($existing['bean_id'], $user['id'], $brew['dose_g'] - $existing['dose_g']);
    db()->commit();
    respond(200, find_brew($id, $user['id']), 'Brew updated.');
}

if ($method === 'DELETE') {
    $existing = find_brew($id, $user['id']);
    if (!$existing) {
        fail(404, 'Brew not found.');
    }
    db()->beginTransaction();
    db()->prepare('DELETE FROM brews WHERE id = ? AND user_id = ?')->execute([$id, $user['id']]);
    use_coffee($existing['bean_id'], $user['id'], -$existing['dose_g']);
    db()->commit();
    respond(200, ['id' => $id], 'Brew deleted.');
}

fail(405, 'Method not allowed.');
