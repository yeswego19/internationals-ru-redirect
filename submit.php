<?php
require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$contact = isset($_POST['contact']) ? trim($_POST['contact']) : (isset($_POST['name']) ? trim($_POST['name']) : '');
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if ($contact === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['error' => 'contact and message are required']);
    exit;
}

$audioUrl = null;

// Приём аудиофайла, если он был отправлен
if (isset($_FILES['audio']) && $_FILES['audio']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/audio/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $ext = pathinfo($_FILES['audio']['name'], PATHINFO_EXTENSION);
    if (!$ext) { $ext = 'webm'; }
    $safeExt = preg_replace('/[^a-zA-Z0-9]/', '', $ext);
    $filename = uniqid('audio_', true) . '.' . $safeExt;
    $destPath = $uploadDir . $filename;

    if (move_uploaded_file($_FILES['audio']['tmp_name'], $destPath)) {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $audioUrl = $scheme . '://' . $host . '/audio/' . $filename;
    }
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare(
        'INSERT INTO feedback (contact, message, audio_url, created_at) VALUES (?, ?, ?, NOW())'
    );
    $stmt->execute([$contact, $message, $audioUrl]);

    echo json_encode([
        'success' => true,
        'id' => $pdo->lastInsertId(),
        'audio_url' => $audioUrl
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
