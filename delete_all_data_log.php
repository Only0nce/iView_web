<?php
/**
 * delete_oldest_300.php
 * ลบข้อมูล "เก่าสุด" ออกจากตาราง datalogger จำนวน 300 แถว
 * โดยพยายามเลือกคอลัมน์สำหรับจัดเรียงตามลำดับดังนี้:
 *   1) startLog (DATETIME)    → เก่าก่อน
 *   2) dateList + timeList    → เก่าก่อน
 *   3) id (PK/auto)           → เก่าก่อน
 *
 * ส่งคืน JSON: { success: true, deleted: <จำนวนแถวที่ลบได้>, orderBy: "<คอลัมน์ที่ใช้>" }
 */

header('Content-Type: application/json; charset=utf-8');

// ---- DB CONFIG (แก้ตามจริงของคุณ) ----
$dbHost = 'localhost';
$dbUsername = 'userData';
$dbPassword = 'Ifz8zean6868**';
$dbName = 'RFPowerMonitors';

$mysqli = @new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);
if ($mysqli->connect_error) {
  echo json_encode(['success' => false, 'message' => 'Database connection failed: '.$mysqli->connect_error]);
  exit;
}
$mysqli->set_charset('utf8mb4');

$table = 'datalogger';

// ฟังก์ชันเช็คว่าตารางมีคอลัมน์หรือไม่
function column_exists($mysqli, $dbName, $table, $column) {
  $sql = "SELECT 1
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME   = ?
            AND COLUMN_NAME  = ?
          LIMIT 1";
  if (!$stmt = $mysqli->prepare($sql)) return false;
  $stmt->bind_param("sss", $dbName, $table, $column);
  $stmt->execute();
  $stmt->store_result();
  $exists = ($stmt->num_rows > 0);
  $stmt->free_result();
  $stmt->close();
  return $exists;
}

// ตัดสินใจ ORDER BY อิงจากคอลัมน์ที่มีจริง
$orderBy = '';
if (column_exists($mysqli, $dbName, $table, 'startLog')) {
  $orderBy = 'ORDER BY `startLog` ASC';
} elseif (column_exists($mysqli, $dbName, $table, 'dateList') && column_exists($mysqli, $dbName, $table, 'timeList')) {
  // รวมวันที่+เวลาเพื่อให้ได้ลำดับที่ถูกต้อง
  $orderBy = 'ORDER BY `dateList` ASC, `timeList` ASC';
} elseif (column_exists($mysqli, $dbName, $table, 'id')) {
  $orderBy = 'ORDER BY `id` ASC';
} else {
  // ถ้าไม่รู้จะเรียงอะไรจริง ๆ ก็ยอมลบแบบไม่ order (ไม่แนะนำ แต่กันกรณีสุดทาง)
  $orderBy = '';
}

// สร้างคำสั่งลบ (LIMIT 300)
$sql = "DELETE FROM `{$table}` {$orderBy} LIMIT 300";
$ok = $mysqli->query($sql);
$deleted = $ok ? $mysqli->affected_rows : 0;

if (!$ok) {
  echo json_encode([
    'success' => false,
    'message' => 'Delete failed: '.$mysqli->error,
    'orderBy' => trim($orderBy)
  ], JSON_UNESCAPED_UNICODE);
  $mysqli->close();
  exit;
}

echo json_encode([
  'success' => true,
  'deleted' => (int)$deleted,
  'orderBy' => trim($orderBy)
], JSON_UNESCAPED_UNICODE);

$mysqli->close();
