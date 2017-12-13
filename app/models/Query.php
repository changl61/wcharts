<?php

use Phalcon\Mvc\Model;
use Phalcon\DI;

class Query extends Model
{
    // 表的所有字段名
    public $id;
    public $name;
    public $indexId;
    public $builder = '{}';
    public $groupId;
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
        return 'query';
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

    public static function getMyQueries()
    {
        $groups = QueryGroup::getMyGroups()->toArray();
        $groupIds = join(',', Collection::pluck($groups, 'id'));

        return self::find([
            'conditions' => "groupId IN ({$groupIds})",
            'order' => 'sort ASC',
        ]);
    }
}
