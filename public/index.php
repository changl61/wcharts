<?php

error_reporting(E_ALL);
ini_set('date.timezone','Asia/Shanghai');

use Phalcon\Mvc\Application;
use Phalcon\Config\Adapter\Ini as ConfigIni;

try {
    // 定义目录
    define('APP_PATH', realpath('..') . '/');

    // 配置文件
    $configPath = APP_PATH . 'app/config/config.ini';
    $configPathForDev = APP_PATH . 'app/config/config-dev.ini';

    // 开发配置覆盖生产配置
    $config = new ConfigIni($configPath);
    if (is_readable($configPathForDev)) {
        $override = new ConfigIni($configPathForDev);
        $config->merge($override);
    }

    // 自动加载配置的目录
    require APP_PATH . 'app/config/loader.php';

    // 启动应用, 输出内容
    $application = new Application(new Services($config));
    echo $application->handle()->getContent();

} catch (Exception $e){
    // 输出异常
    echo $e->getMessage() . '<br>';
    echo '<pre>' . $e->getTraceAsString() . '</pre>';
}