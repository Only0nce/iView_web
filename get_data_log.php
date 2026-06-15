<?php
header('Content-Type: application/json; charset=utf-8');

// DB config
$dbHost = 'localhost';
$dbUsername = 'userData';
$dbPassword = 'Ifz8zean6868**';
$dbName = 'RFPowerMonitors';

$conn = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);
if ($conn->connect_error) {
    echo json_encode([
        'error' => true,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$conn->set_charset('utf8mb4');

$strSQL = "
    SELECT
        id,
        txIndex,
        site,
        fwdPowerWatt,
        fwdPowerDB,
        maxPowerWatt,
        rwdPowerWatt,
        rwdPowerDB,
        vswr,
        rssi,
        thresholdWatt,
        connectionStatus,
        stationName,
        frequency,
        duration,
        startLog,
        endLog
    FROM datalogger
    ORDER BY id DESC
    LIMIT 300
";

$objQuery = $conn->query($strSQL);

if (!$objQuery) {
    echo json_encode([
        'error' => true,
        'message' => 'SQL Error: ' . $conn->error
    ], JSON_UNESCAPED_UNICODE);
    $conn->close();
    exit;
}

function nullableFloat($value) {
    return $value === null ? null : floatval($value);
}

function nullableInt($value) {
    return $value === null ? null : intval($value);
}

function splitDatePart($datetime, $index) {
    if ($datetime === null || trim($datetime) === '') {
        return '';
    }
    $parts = explode(' ', $datetime);
    return $parts[$index] ?? '';
}

$data = [];

while ($row = $objQuery->fetch_assoc()) {
    $startLog = $row['startLog'] ?? '';
    $endLog = $row['endLog'] ?? '';

    $data[] = [
        'databaseId' => nullableInt($row['id']),
        'id' => nullableInt($row['id']),
        'txIndex' => nullableInt($row['txIndex']),
        'site' => $row['site'] ?? '',

        'startLog' => $startLog,
        'endLog' => $endLog,
        'dateList' => splitDatePart($startLog, 0),
        'timeList' => splitDatePart($startLog, 1),
        'endDateList' => splitDatePart($endLog, 0),
        'endTimeList' => splitDatePart($endLog, 1),

        'stationName' => $row['stationName'] ?? '',
        'frequency' => nullableInt($row['frequency']),
        'connectionStatus' => nullableInt($row['connectionStatus']),
        'duration' => nullableInt($row['duration']),
        'durationSec' => nullableInt($row['duration']),

        'fwdPowerWatt' => nullableFloat($row['fwdPowerWatt']),
        'fwdPowerDB' => nullableFloat($row['fwdPowerDB']),
        'maxPowerWatt' => nullableFloat($row['maxPowerWatt']),
        'rwdPowerWatt' => nullableFloat($row['rwdPowerWatt']),
        'rwdPowerDB' => nullableFloat($row['rwdPowerDB']),
        'vswr' => nullableFloat($row['vswr']),
        'rssi' => nullableFloat($row['rssi']),
        'rssiDbm' => nullableFloat($row['rssi']),
        'thresholdWatt' => nullableFloat($row['thresholdWatt']),
        'threshold' => nullableFloat($row['thresholdWatt']),

        // Legacy aliases used by the current JS log table.
        'fwdWattList' => nullableFloat($row['fwdPowerWatt']),
        'fwd_dBmList' => nullableFloat($row['fwdPowerDB']),
        'rwdWattList' => nullableFloat($row['rwdPowerWatt']),
        'rwd_dBmList' => nullableFloat($row['rwdPowerDB']),
        'vswrList' => nullableFloat($row['vswr']),
        'rssiList' => nullableFloat($row['rssi'])
    ];
}

$conn->close();

echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);