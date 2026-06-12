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

// Query distinct station
$strSQL = "
    SELECT DISTINCT stationName
    FROM datalogger
    WHERE stationName IS NOT NULL AND stationName != ''
    ORDER BY stationName
";

$objQuery = $conn->query($strSQL);

if (!$objQuery) {
    echo json_encode([
        'error' => true,
        'message' => 'SQL Error: ' . $conn->error
    ]);
    exit;
}

$data = [];
while ($row = $objQuery->fetch_assoc()) {
    $data[] = $row['stationName'];
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);

$conn->close();

