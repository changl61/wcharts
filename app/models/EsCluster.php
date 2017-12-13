<?php

use Phalcon\Mvc\Model;
use Phalcon\DI;

// ES集群
class EsCluster extends Model
{
    // 表的所有字段名
    public $id;
    public $url;
    public $version;
    public $status = 1;
    public $userId;
    public $createTime;
    public $updateTime;

    // 定义关系
    public function initialize()
    {
        $this->skipAttributesOnCreate(['updateTime']);
        $this->skipAttributesOnUpdate(['createTime', 'userId']);
    }

    // 绑定数据库表名
    public function getSource()
    {
        return 'es_cluster';
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

    // 获取ES版本
    public static function getVersion($url)
    {
        $http = Http::get($url);
        if ($http['error']) return null;

        $respond = json_decode($http['respond'], true);
        if ($respond && isset($respond['cluster_name']) && isset($respond['version'])) {
            return $respond['version']['number'];
        }
    }

    // 获取集群健康
    public static function getHealth($url)
    {
        $http = Http::get($url . '/_cluster/health');
        if ($http['error']) return null;

        $respond = json_decode($http['respond'], true);
        if ($respond) {
            return [
                'primaryShards' => $respond['active_primary_shards'] + $respond['unassigned_shards'] + $respond['initializing_shards'],
                'activeShards' => $respond['active_shards'],
                'status' => $respond['status'],
            ];
        }

        return null;
    }

    // 使用中的ES
    public static function getUsing()
    {
        $userId = User::fromSession()['id'];
        return self::findFirst("userId = {$userId} AND status = '1'");
    }

    // 设置使用中的ES
    public static function setUsing($id)
    {
        $db = DI::getDefault()->getDb();
        $userId = User::fromSession()['id'];

        $sql0 = "UPDATE `es_cluster` SET `status` = '0' WHERE `userId` = {$userId} AND `status` = '1'";
        $sql1 = "UPDATE `es_cluster` SET `status` = '1' WHERE `id` = {$id}";

        return $db->execute($sql0) && $db->execute($sql1);
    }

    // 读取SESSION缓存
    public static function fromSession()
    {
        $session = DI::getDefault()->getSession();
        return $session->has('esCluster') ? $session->get('esCluster') : [
            'id'  => 0,
            'url' => '',
        ];
    }

    // 设置SESSION缓存
    public static function toSession($model)
    {
        $model || $model = (object) array('id' => 0, 'url' => '');
        $session = DI::getDefault()->getSession();
        $session->set('esCluster', [
            'id'  => $model->id,
            'url' => $model->url,
        ]);
    }

    // 设置Cookie缓存
    public static function toCookie($model)
    {
        $model || $model = (object) array('id' => 0, 'url' => '');
        $cookie = DI::getDefault()->getCookies();
        $cookie->useEncryption(false);
        $cookie->set('esCluster', '{"id":'.$model->id.', "url":"'.$model->url.'"}', time()+ 2400*3600);
        $cookie->send();
    }
}