<?php

use Phalcon\Mvc\Model;
use Phalcon\DI;

class User extends Model
{
    // 表的所有字段名
    public $id;
    public $name;
    public $password = '';
    public $role = 'user';
    public $sessionId = '';
    public $status = '1';
    public $loginLastTime = [];
    public $loginTime;
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
        return 'user';
    }

    public function beforeSave()
    {
        $this->loginLastTime = !empty($this->loginLastTime) ? json_encode($this->loginLastTime) : '';
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
        $this->loginLastTime = $this->loginLastTime ? json_decode($this->loginLastTime, true) : [];
    }

    public function delete()
    {
        $this->status = '-1';
        return $this->save();
    }

    // 读取SESSION缓存
    public static function fromSession()
    {
        $session = DI::getDefault()->getSession();
        return $session->has('user') ? $session->get('user') : [
            'id'   => null,
            'name' => '',
            'role' => 'guest',
            'prototype' => [], // 登录账户
        ];
    }

    // 设置SESSION缓存
    public static function toSession($model)
    {
        $session = DI::getDefault()->getSession();
        $session->set('user', [
            'id'   => $model->id,
            'name' => $model->name,
            'role' => $model->role,
            'prototype' => [
                'id'   => $model->id,
                'name' => $model->name,
                'role' => $model->role,
            ],
        ]);
    }

    // 切换账户时 设置SESSION缓存
    public static function toSessionWhenSwitch($model)
    {
        $session = DI::getDefault()->getSession();
        $prototype = self::fromSession()['prototype'];

        $session->set('user', [
            'id'   => $model->id,
            'name' => $model->name,
            'role' => $model->role,
            'prototype' => $prototype,
        ]);

        // 记录上次登录的帐户
        $prototypeUser = self::findFirst("id = {$prototype['id']}");
        $prototypeUser->loginLastTime = [
            'id'   => $model->id,
            'role' => $model->role,
        ];
        $prototypeUser->save();
    }
}
