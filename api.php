<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

$config = require __DIR__ . DIRECTORY_SEPARATOR . 'config.php';
$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0775, true);
}

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function read_json(string $file, array $fallback): array
{
    if (!is_file($file)) {
        return $fallback;
    }

    $content = file_get_contents($file);
    if ($content === false || trim($content) === '') {
        return $fallback;
    }

    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function write_json(string $file, array $payload): void
{
    $lockFile = $file . '.lock';
    $lockHandle = fopen($lockFile, 'c');
    if ($lockHandle === false) {
        respond(['ok' => false, 'error' => 'Kunde inte låsa datafilen.'], 500);
    }

    flock($lockHandle, LOCK_EX);
    file_put_contents($file, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
}

function db_config(string $key): string
{
    global $config;
    return (string)($config[$key] ?? '');
}

function table_name(string $base): string
{
    $prefix = db_config('table_prefix');
    if (!preg_match('/^[A-Za-z0-9_]*$/', $prefix)) {
        respond(['ok' => false, 'error' => 'Ogiltigt tabellprefix i config.'], 500);
    }
    return '`' . $prefix . $base . '`';
}

function sql_identifier(string $identifier): string
{
    if (!preg_match('/^[A-Za-z0-9_]+$/', $identifier)) {
        respond(['ok' => false, 'error' => 'Ogiltigt databasnamn i config.'], 500);
    }
    return '`' . $identifier . '`';
}

function db(): mysqli
{
    static $mysqli = null;
    if ($mysqli instanceof mysqli) {
        return $mysqli;
    }

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $dbName = db_config('db_name');
    try {
        $mysqli = new mysqli(
            db_config('db_host'),
            db_config('db_user'),
            db_config('db_pass'),
            $dbName,
        );
        $mysqli->set_charset('utf8mb4');
    } catch (mysqli_sql_exception $error) {
        if ((int)$error->getCode() !== 1049) {
            respond(['ok' => false, 'error' => 'Kunde inte ansluta till databasen: ' . $error->getMessage()], 500);
        }

        try {
            $mysqli = new mysqli(
                db_config('db_host'),
                db_config('db_user'),
                db_config('db_pass'),
            );
            $mysqli->set_charset('utf8mb4');
            $mysqli->query('CREATE DATABASE IF NOT EXISTS ' . sql_identifier($dbName) . ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            $mysqli->select_db($dbName);
        } catch (mysqli_sql_exception $createError) {
            respond(['ok' => false, 'error' => 'Kunde inte skapa eller välja databasen: ' . $createError->getMessage()], 500);
        }
    }

    return $mysqli;
}

function ensure_tables(): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    $usersTable = table_name('users');
    $gamesTable = table_name('games');

    db()->query("
        CREATE TABLE IF NOT EXISTS {$usersTable} (
            id VARCHAR(24) NOT NULL PRIMARY KEY,
            username VARCHAR(80) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL,
            INDEX username_idx (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    db()->query("
        CREATE TABLE IF NOT EXISTS {$gamesTable} (
            id VARCHAR(24) NOT NULL PRIMARY KEY,
            user_id VARCHAR(24) NOT NULL,
            ruleset_id VARCHAR(120) NOT NULL,
            ruleset_name VARCHAR(160) NOT NULL,
            player_name VARCHAR(160) NOT NULL DEFAULT '',
            total INT NOT NULL DEFAULT 0,
            upper_total INT NOT NULL DEFAULT 0,
            bonus INT NOT NULL DEFAULT 0,
            penalty INT NOT NULL DEFAULT 0,
            players_json LONGTEXT NOT NULL,
            winner_json TEXT NULL,
            scores_json LONGTEXT NULL,
            turns_json LONGTEXT NULL,
            finished_at DATETIME NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX user_finished_idx (user_id, finished_at),
            INDEX ruleset_idx (ruleset_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    migrate_json_data();
    $ready = true;
}

function migrate_json_data(): void
{
    static $migrated = false;
    if ($migrated) {
        return;
    }

    $dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
    $users = read_json($dataDir . DIRECTORY_SEPARATOR . 'users.json', []);
    if ($users) {
        $stmt = db()->prepare('INSERT IGNORE INTO ' . table_name('users') . ' (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)');
        foreach ($users as $user) {
            if (!is_array($user) || empty($user['id']) || empty($user['username']) || empty($user['passwordHash'])) {
                continue;
            }
            $id = (string)$user['id'];
            $username = (string)$user['username'];
            $passwordHash = (string)$user['passwordHash'];
            $createdAt = db_datetime((string)($user['createdAt'] ?? gmdate('c')));
            $stmt->bind_param('ssss', $id, $username, $passwordHash, $createdAt);
            $stmt->execute();
        }
    }

    $games = read_json($dataDir . DIRECTORY_SEPARATOR . 'games.json', []);
    if ($games) {
        $stmt = db()->prepare(
            'INSERT IGNORE INTO ' . table_name('games') . ' (
                id, user_id, ruleset_id, ruleset_name, player_name, total, upper_total, bonus, penalty,
                players_json, winner_json, scores_json, turns_json, finished_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($games as $game) {
            if (!is_array($game) || empty($game['id']) || empty($game['userId'])) {
                continue;
            }

            $id = (string)$game['id'];
            $userId = (string)$game['userId'];
            $rulesetId = (string)($game['rulesetId'] ?? '');
            $rulesetName = (string)($game['rulesetName'] ?? '');
            $playerName = (string)($game['playerName'] ?? ($game['winner']['name'] ?? ''));
            $total = (int)($game['total'] ?? 0);
            $upperTotal = (int)($game['upperTotal'] ?? 0);
            $bonus = (int)($game['bonus'] ?? 0);
            $penalty = (int)($game['penalty'] ?? 0);
            $playersJson = json_encode(is_array($game['players'] ?? null) ? $game['players'] : [], JSON_UNESCAPED_UNICODE);
            $winnerJson = json_encode(is_array($game['winner'] ?? null) ? $game['winner'] : null, JSON_UNESCAPED_UNICODE);
            $scoresJson = json_encode(is_array($game['scores'] ?? null) ? $game['scores'] : [], JSON_UNESCAPED_UNICODE);
            $turnsJson = json_encode(is_array($game['turns'] ?? null) ? $game['turns'] : [], JSON_UNESCAPED_UNICODE);
            $finishedAt = db_datetime((string)($game['finishedAt'] ?? gmdate('c')));

            $stmt->bind_param(
                'sssssiiiisssss',
                $id,
                $userId,
                $rulesetId,
                $rulesetName,
                $playerName,
                $total,
                $upperTotal,
                $bonus,
                $penalty,
                $playersJson,
                $winnerJson,
                $scoresJson,
                $turnsJson,
                $finishedAt,
            );
            $stmt->execute();
        }
    }

    $migrated = true;
}

function db_datetime(string $utcDate): string
{
    $timestamp = strtotime($utcDate);
    return gmdate('Y-m-d H:i:s', $timestamp === false ? time() : $timestamp);
}

function user_by_id(?string $userId): ?array
{
    if (!$userId) {
        return null;
    }

    ensure_tables();
    $stmt = db()->prepare('SELECT id, username, password_hash AS passwordHash, created_at AS createdAt FROM ' . table_name('users') . ' WHERE id = ? LIMIT 1');
    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    return $user ?: null;
}

function game_from_row(array $row): array
{
    $winner = json_decode((string)($row['winner_json'] ?? ''), true);
    $players = json_decode((string)($row['players_json'] ?? '[]'), true);
    $scores = json_decode((string)($row['scores_json'] ?? '[]'), true);
    $turns = json_decode((string)($row['turns_json'] ?? '[]'), true);

    return [
        'id' => $row['id'],
        'userId' => $row['user_id'],
        'rulesetId' => $row['ruleset_id'],
        'rulesetName' => $row['ruleset_name'],
        'playerName' => $row['player_name'],
        'players' => is_array($players) ? $players : [],
        'winner' => is_array($winner) ? $winner : null,
        'total' => (int)$row['total'],
        'upperTotal' => (int)$row['upper_total'],
        'bonus' => (int)$row['bonus'],
        'penalty' => (int)$row['penalty'],
        'scores' => is_array($scores) ? $scores : [],
        'turns' => is_array($turns) ? $turns : [],
        'finishedAt' => gmdate('c', strtotime((string)$row['finished_at']) ?: time()),
    ];
}

function input_json(): array
{
    $body = file_get_contents('php://input');
    $decoded = json_decode($body ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}

function clean_username(string $username): string
{
    return trim(strtolower($username));
}

function public_user(array $user): array
{
    return [
        'id' => $user['id'],
        'username' => $user['username'],
        'createdAt' => $user['createdAt'] ?? null,
    ];
}

$action = $_GET['action'] ?? '';

if ($action === 'me') {
    respond(['ok' => true, 'user' => ($user = user_by_id($_SESSION['user_id'] ?? null)) ? public_user($user) : null]);
}

if ($action === 'register') {
    ensure_tables();
    $payload = input_json();
    $username = clean_username((string)($payload['username'] ?? ''));
    $password = (string)($payload['password'] ?? '');

    if (strlen($username) < 3 || strlen($password) < 6) {
        respond(['ok' => false, 'error' => 'Användarnamn kräver minst 3 tecken och lösenord minst 6.'], 422);
    }

    $stmt = db()->prepare('SELECT id FROM ' . table_name('users') . ' WHERE username = ? LIMIT 1');
    $stmt->bind_param('s', $username);
    $stmt->execute();
    if ($stmt->get_result()->fetch_assoc()) {
        respond(['ok' => false, 'error' => 'Användarnamnet finns redan.'], 409);
    }

    $user = [
        'id' => bin2hex(random_bytes(12)),
        'username' => $username,
        'passwordHash' => password_hash($password, PASSWORD_DEFAULT),
        'createdAt' => gmdate('c'),
    ];

    $createdAt = db_datetime($user['createdAt']);
    $stmt = db()->prepare('INSERT INTO ' . table_name('users') . ' (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('ssss', $user['id'], $user['username'], $user['passwordHash'], $createdAt);
    $stmt->execute();

    $_SESSION['user_id'] = $user['id'];
    respond(['ok' => true, 'user' => public_user($user)]);
}

if ($action === 'login') {
    ensure_tables();
    $payload = input_json();
    $username = clean_username((string)($payload['username'] ?? ''));
    $password = (string)($payload['password'] ?? '');

    $stmt = db()->prepare('SELECT id, username, password_hash AS passwordHash, created_at AS createdAt FROM ' . table_name('users') . ' WHERE username = ? LIMIT 1');
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if ($user && password_verify($password, $user['passwordHash'])) {
        $_SESSION['user_id'] = $user['id'];
        respond(['ok' => true, 'user' => public_user($user)]);
    }

    respond(['ok' => false, 'error' => 'Fel användarnamn eller lösenord.'], 401);
}

if ($action === 'logout') {
    session_destroy();
    respond(['ok' => true]);
}

if ($action === 'save_game') {
    ensure_tables();
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        respond(['ok' => false, 'error' => 'Logga in för att spara statistik.'], 401);
    }

    $payload = input_json();
    $players = is_array($payload['players'] ?? null) ? $payload['players'] : [];
    $winner = is_array($payload['winner'] ?? null) ? $payload['winner'] : null;
    $game = [
        'id' => bin2hex(random_bytes(12)),
        'userId' => $userId,
        'rulesetId' => (string)($payload['rulesetId'] ?? ''),
        'rulesetName' => (string)($payload['rulesetName'] ?? ''),
        'playerName' => trim((string)($payload['playerName'] ?? ($winner['name'] ?? ''))),
        'players' => $players,
        'winner' => $winner,
        'total' => (int)($payload['total'] ?? 0),
        'upperTotal' => (int)($payload['upperTotal'] ?? 0),
        'bonus' => (int)($payload['bonus'] ?? 0),
        'penalty' => (int)($payload['penalty'] ?? 0),
        'scores' => is_array($payload['scores'] ?? null) ? $payload['scores'] : [],
        'turns' => is_array($payload['turns'] ?? null) ? $payload['turns'] : [],
        'finishedAt' => gmdate('c'),
    ];

    $playersJson = json_encode($game['players'], JSON_UNESCAPED_UNICODE);
    $winnerJson = json_encode($game['winner'], JSON_UNESCAPED_UNICODE);
    $scoresJson = json_encode($game['scores'], JSON_UNESCAPED_UNICODE);
    $turnsJson = json_encode($game['turns'], JSON_UNESCAPED_UNICODE);
    $finishedAt = db_datetime($game['finishedAt']);

    $stmt = db()->prepare(
        'INSERT INTO ' . table_name('games') . ' (
            id, user_id, ruleset_id, ruleset_name, player_name, total, upper_total, bonus, penalty,
            players_json, winner_json, scores_json, turns_json, finished_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param(
        'sssssiiiisssss',
        $game['id'],
        $game['userId'],
        $game['rulesetId'],
        $game['rulesetName'],
        $game['playerName'],
        $game['total'],
        $game['upperTotal'],
        $game['bonus'],
        $game['penalty'],
        $playersJson,
        $winnerJson,
        $scoresJson,
        $turnsJson,
        $finishedAt,
    );
    $stmt->execute();

    respond(['ok' => true, 'game' => $game]);
}

if ($action === 'stats') {
    ensure_tables();
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        respond(['ok' => true, 'summary' => null, 'recent' => []]);
    }

    $stmt = db()->prepare('SELECT * FROM ' . table_name('games') . ' WHERE user_id = ? ORDER BY finished_at DESC');
    $stmt->bind_param('s', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $games = [];
    while ($row = $result->fetch_assoc()) {
        $games[] = game_from_row($row);
    }

    $totals = array_map(fn(array $game): int => (int)($game['winner']['total'] ?? $game['total'] ?? 0), $games);
    $summary = [
        'games' => count($games),
        'best' => $totals ? max($totals) : 0,
        'average' => $totals ? round(array_sum($totals) / count($totals), 1) : 0,
    ];

    respond(['ok' => true, 'summary' => $summary, 'recent' => array_slice($games, 0, 3)]);
}

respond(['ok' => false, 'error' => 'Okänd åtgärd.'], 404);
