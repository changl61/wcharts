<?php

use Phalcon\Mvc\Model;
use Phalcon\DI;

class Dashboard extends Model
{
    // 表的所有字段名
    public $id;
    public $name;
    public $grid = '<div class="dashboard-row" data-content="" style="height: 190px;"><div class="dashboard-cell" style="width: 100%"></div></div>';
    public $sort = 100;
    public $groupId;
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
        return 'dashboard';
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

    public static function getMyDashboards()
    {
        $groups = DashboardGroup::getMyGroups()->toArray();
        $groupIds = join(',', Collection::pluck($groups, 'id'));

        return self::find([
            'conditions' => "groupId IN ({$groupIds})",
            'order' => 'sort ASC',
        ]);
    }
}