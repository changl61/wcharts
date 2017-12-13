<?php

// 表单验证 - 创建查询
class FormForChart extends BaseValidator
{
    // 属性(必填)
    public $id = 0;
    public $name;
    public $format;
    public $indexId;
    public $builder = '{}';
    public $style;
    public $dashboardId;
    // 名称(必填)
    protected $_names = [
        'id'=>'ID',
        'name'=>'图表名称',
        'format'=>'图表形式',
        'indexId'=>'索引',
        'builder '=>'构造器',
        'style '=>'样式',
        'dashboardId '=>'统计面板',
    ];
    // 规则(必填)
    protected $_rules = [
        'id'=>[
            'int'=>['param'=>true, 'message'=>'提交数据有误'],
        ],
        'name'=>[
            'required'=>true,
        ],
        'format'=>[
            'required'=>true,
            'in'=>['param'=>['line', 'bar', 'pie', 'panel', 'radar', 'table'], 'message'=>'提交数据有误'],
        ],
        'indexId'=>[
            'required'=>true,
            'int'=>['param'=>true],
            'checkMyIndex'=>true,
        ],
        'builder'=>[
            'required'=>true,
        ],
        'dashboardId'=>[
            'required'=>true,
            'int'=>['param'=>true],
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
        if (Chart::findFirst("name = '{$this->$attr}' AND dashboardId = '{$this->dashboardId}' AND id != {$id}")) {
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
}