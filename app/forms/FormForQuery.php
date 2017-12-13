<?php

// 表单验证 - 创建查询
class FormForQuery extends BaseValidator
{
    // 属性(必填)
    public $id = 0;
    public $name;
    public $indexId;
    public $builder = '{}';
    public $groupId;
    // 名称(必填)
    protected $_names = [
        'id'=>'ID',
        'name'=>'查询名称',
        'indexId'=>'索引',
        'builder'=>'构造器',
        'groupId'=>'分组',
    ];
    // 规则(必填)
    protected $_rules = [
        'id'=>[
            'int'=>['param'=>true, 'message'=>'提交数据有误'],
        ],
        'name'=>[
            'required'=>true,
            'shortThan'=>['param'=>5],
            'checkUniqueName'=>true,
        ],
        'builder'=>[
            'json'=>true,
        ],

        'indexId'=>[
            'int'=>['param'=>true, 'message'=>'提交数据有误'],
            'required'=>true,
            'checkMyIndex'=>true,
        ],
        'groupId'=>[
            'int'=>['param'=>true, 'message'=>'提交数据有误'],
            'required'=>true,
            'checkMyGroup'=>true,
        ],
    ];

    /*-----------------------------------
      非基础内置验证方法
    -----------------------------------*/
    protected function checkUniqueName($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;
        $message || ($message = '所选分组中已存在, 请更换');

        if (Query::findFirst("name = '{$this->$attr}' AND groupId = '{$this->groupId}' AND id != {$this->id}")) {
            $this->setError($attr, $key, $message);
        }
    }

    protected function checkMyIndex($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;
        $message || ($message = '该索引不是我的');

        $clusterId = EsCluster::fromSession()['id'];
        if (!EsIndex::findFirst("id = '{$this->$attr}' AND clusterId = {$clusterId}")) {
            $this->setError($attr, $key, $message);
        }
    }

    protected function checkMyGroup($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;
        $message || ($message = '该分组不是我的');

        $clusterId = EsCluster::fromSession()['id'];
        if (!QueryGroup::findFirst("id = '{$this->$attr}' AND clusterId = {$clusterId}")) {
            $this->setError($attr, $key, $message);
        }
    }
}