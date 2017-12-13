<?php

use Phalcon\Mvc\Model;
use Phalcon\DI;

class Chart extends Model
{
    // 表的所有字段名
    public $id;
    public $name;
    public $format;
    public $indexId;
    public $builder = '{}';
    public $dashboardId;
    public $userId;
    public $createTime;
    public $updateTime;

    // 定义关系
    public function initialize()
    {
        $this->skipAttributesOnCreate(['updateTime']);
        $this->skipAttributesOnUpdate(['createTime']);
    }

    // 绑定数据库表名
    public function getSource()
    {
        return 'chart';
    }

    public function beforeSave()
    {

    }

    public function beforeCreate()
    {
        $this->createTime = date('Y-m-d h:i:s', time());
    }

    public function beforeUpdate()
    {
        $this->updateTime = date('Y-m-d H:i:s', time());
    }

    public function afterFetch()
    {

    }
}