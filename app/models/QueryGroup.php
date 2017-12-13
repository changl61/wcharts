<?php

use Phalcon\Mvc\Model;
use Phalcon\DI;

class QueryGroup extends Model
{
    // 表的所有字段名
    public $id;
    public $name;
    public $clusterId;
    public $sort = 100;
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
        return 'query_group';
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

    public static function getMyGroups()
    {
        $clusterId = EsCluster::fromSession()['id'];
        return self::find([
            'conditions' => "clusterId = {$clusterId}",
            'order' => 'sort ASC',
        ]);
    }
}
