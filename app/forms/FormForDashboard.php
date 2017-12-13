<?php

// 表单验证 - 创建查询
class FormForDashboard extends BaseValidator
{
    // 属性(必填)
    public $id = 0;
    public $name;
    public $groupId;
    public $sort;
    // 名称(必填)
    protected $_names = [
        'id'=>'ID',
        'name'=>'统计面板名称',
        'groupId'=>'分组',
        'sort'=>'排序值',
    ];
    // 规则(必填)
    protected $_rules = [
        'id'=>[
            'int'=>['param'=>true, 'message'=>'提交数据有误'],
        ],
        'name'=>[
            'required'=>true,
            'shortThan'=>['param'=>50],
            'checkUniqueName'=>true,
        ],
        'groupId'=>[
            'required'=>true,
            'checkMyGroup'=>true,
        ],
        'sort'=>[
            'int'=>['param'=>true],
            'required'=>true,
        ],
    ];

    /*-----------------------------------
      非基础内置验证方法
    -----------------------------------*/
    protected function checkUniqueName($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;
        $message || ($message = '名称重复, 请更换');

        $id = $this->id ? $this->id : 0;
        if (Dashboard::findFirst("name = '{$this->$attr}' AND groupId = '{$this->groupId}' AND id != {$id}")) {
            $this->setError($attr, $key, $message);
        }
    }

    protected function checkMyGroup($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;
        $message || ($message = '该分组不是我的');

        $clusterId = EsCluster::fromSession()['id'];
        if (!DashboardGroup::findFirst("id = '{$this->$attr}' AND clusterId = {$clusterId}")) {
            $this->setError($attr, $key, $message);
        }
    }
}