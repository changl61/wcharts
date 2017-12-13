<?php

// 表单验证 - 创建用户
class FormForUser extends BaseValidator
{
    // 属性(必填)
    public $name;
    public $sort;
    // 名称(必填)
    protected $_names = [
        'name'=>'用户名称',
        'password'=>'初始密码',
    ];
    // 规则(必填)
    protected $_rules = [
        'name'=>[
            'required'=>true,
            'shortThan'=>['param'=>50],
            'checkUniqueName'=>true,
        ],
        'password'=>[
            'required'=>true,
            'longThan'=>['param'=>5],
        ],
    ];

    /*-----------------------------------
      非基础内置验证方法
    -----------------------------------*/
    protected function checkUniqueName($attr, $key, $param, $message)
    {
        if (!isset($this->$attr) || $this->$attr == '') return true;
        $message || ($message = '重复, 请更换');

        if (User::findFirst("name = '{$this->$attr}' AND role IN ('user', 'admin')")) {
            $this->setError($attr, $key, $message);
        }
    }
}