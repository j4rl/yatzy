<?php
declare(strict_types=1);

$yatzyConfig = [
    'db_host' => '127.0.0.1',
    'db_user' => 'root',
    'db_pass' => '',
    'db_name' => 'yatzy',
    'table_prefix' => 'yatzy_',
];

$localConfigFile = __DIR__ . DIRECTORY_SEPARATOR . 'config.local.php';
if (is_file($localConfigFile)) {
    $localConfig = require $localConfigFile;
    if (is_array($localConfig)) {
        $yatzyConfig = array_replace($yatzyConfig, $localConfig);
    }
}

return $yatzyConfig;

