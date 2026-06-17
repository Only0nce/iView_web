<?php
header('Content-Type: application/json; charset=utf-8');

// Safe delete endpoint for Event Log page.
// Supported modes:
// 1) deleteAll=true + confirm="DELETE_ALL_DATALOGGER" -> delete all datalogger rows.
// 2) ids=[...] -> delete only explicit datalogger.id rows.

$dbHost = 'localhost';
$dbUsername = 'userData';
$dbPassword = 'Ifz8zean6868**';
$dbName = 'RFPowerMonitors';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'POST method required.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody, true);

if (!is_array($payload)) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload. No data was deleted.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$mysqli = @new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);
if ($mysqli->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $mysqli->connect_error], JSON_UNESCAPED_UNICODE);
    exit;
}
$mysqli->set_charset('utf8mb4');

// Mode 1: delete all rows. This requires an explicit confirmation token from the UI.
if (!empty($payload['deleteAll'])) {
    if (($payload['confirm'] ?? '') !== 'DELETE_ALL_DATALOGGER') {
        echo json_encode(['success' => false, 'message' => 'Delete-all confirmation token is invalid. No data was deleted.'], JSON_UNESCAPED_UNICODE);
        $mysqli->close();
        exit;
    }

    $sql = 'DELETE FROM datalogger';
    if (!$mysqli->query($sql)) {
        echo json_encode(['success' => false, 'message' => 'Delete all failed: ' . $mysqli->error], JSON_UNESCAPED_UNICODE);
        $mysqli->close();
        exit;
    }

    echo json_encode([
        'success' => true,
        'mode' => 'deleteAll',
        'deleted' => intval($mysqli->affected_rows)
    ], JSON_UNESCAPED_UNICODE);
    $mysqli->close();
    exit;
}

// Mode 2: delete explicit row ids. Kept for compatibility with older UI versions.
if (!isset($payload['ids']) || !is_array($payload['ids'])) {
    echo json_encode(['success' => false, 'message' => 'Missing ids array or deleteAll flag. No data was deleted.'], JSON_UNESCAPED_UNICODE);
    $mysqli->close();
    exit;
}

$ids = [];
foreach ($payload['ids'] as $id) {
    if (is_numeric($id)) {
        $intId = intval($id);
        if ($intId > 0) $ids[$intId] = $intId;
    }
}
$ids = array_values($ids);

if (count($ids) === 0) {
    echo json_encode(['success' => false, 'message' => 'No valid ids. No data was deleted.'], JSON_UNESCAPED_UNICODE);
    $mysqli->close();
    exit;
}

$placeholders = implode(',', array_fill(0, count($ids), '?'));
$sql = "DELETE FROM datalogger WHERE id IN ($placeholders)";
$stmt = $mysqli->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $mysqli->error], JSON_UNESCAPED_UNICODE);
    $mysqli->close();
    exit;
}

$types = str_repeat('i', count($ids));
$stmt->bind_param($types, ...$ids);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Delete failed: ' . $stmt->error], JSON_UNESCAPED_UNICODE);
    $stmt->close();
    $mysqli->close();
    exit;
}

$deleted = $stmt->affected_rows;
$stmt->close();
$mysqli->close();

echo json_encode([
    'success' => true,
    'mode' => 'ids',
    'requested' => count($ids),
    'deleted' => intval($deleted)
], JSON_UNESCAPED_UNICODE);