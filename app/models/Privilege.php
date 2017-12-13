<?php

use Phalcon\Mvc\Model;
use Phalcon\DI;

class Privilege extends Model
{
    // 表的所有字段名
    public $id;
    public $controller;
    public $action;
    public $role = 'user';
    public $accessible = 'yes';
    public $createTime;
    public $updateTime;

    // 绑定数据库表名
    public function getSource()
    {
        return 'privilege';
    }


}
