<?php
header('Content-Type: application/json; charset=utf-8');

// DB config
$dbHost = 'localhost';
$dbUsername = 'userData';
$dbPassword = 'Ifz8zean6868**';
$dbName = 'RFPowerMonitors';

// connect
$conn = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);
if ($conn->connect_error) {
    die(json_encode([
        'error' => true,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// SQL
$strSQL = "
    SELECT 
        fwdPowerWatt,
        fwdPowerDB,
        rwdPowerWatt,
        rwdPowerDB,
        vswr,
        connectionStatus,
        stationName,
        frequency,
        duration,
        startLog
    FROM datalogger
    ORDER BY id DESC
    LIMIT 300
";

$objQuery = $conn->query($strSQL);

if (!$objQuery) {
    echo json_encode([
        'error' => true,
        'message' => 'SQL Error: ' . $conn->error
    ]);
    exit;
}

// เตรียม array เก็บผลลัพธ์
$data = [];

while ($row = $objQuery->fetch_assoc()) {
    $data[] = [
        "dateList" => explode(" ", $row['startLog'])[0],
        "timeList" => explode(" ", $row['startLog'])[1] ?? "",
        "stationName" => $row['stationName'],
        "frequency" => floatval($row['frequency']),
        "fwdWattList" => floatval($row['fwdPowerWatt']),
        "fwd_dBmList" => floatval($row['fwdPowerDB']),
        "rwdWattList" => floatval($row['rwdPowerWatt']),
        "rwd_dBmList" => floatval($row['rwdPowerDB']),
        "vswrList" => floatval($row['vswr']),
        "durationSec" => intval($row['duration']),
        "connectionStatus" => intval($row['connectionStatus'])
    ];
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);

$conn->close();
