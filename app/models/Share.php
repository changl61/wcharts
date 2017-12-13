<?php

use Phalcon\Mvc\Model;
use Phalcon\DI;

class Share extends Model
{
    // 表的所有字段名
    public $id;
    public $name;
    public $uuid;
    public $type;
    public $prototypeId;
    public $count = 0;
    public $status = '1';
    public $clusterId;
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
        return 'share';
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

    public static function getQuery($id)
    {
        $db = DI::getDefault()->getDb();
        $sql = "SELECT `es_index`.name as `index`, `es_cluster`.url as `url`, `query`.builder as `builder` FROM `share` 
                LEFT JOIN `query` ON `share`.prototypeId = `query`.id 
                LEFT JOIN `es_index` ON `query`.indexId = `es_index`.id 
                LEFT JOIN `es_cluster` ON `share`.clusterId = `es_cluster`.id 
                WHERE `share`.id = {$id}";

        $result = $db->fetchOne($sql);

        return $result['index'] ? $result : null;
    }

    public static function getChart($id)
    {
        $db = DI::getDefault()->getDb();
        $sql = "SELECT `es_index`.name as `index`, `es_cluster`.url as `url`, `chart`.builder as `builder`, `chart`.format as `format` FROM `share` 
                LEFT JOIN `chart` ON `share`.prototypeId = `chart`.id 
                LEFT JOIN `es_index` ON `chart`.indexId = `es_index`.id 
                LEFT JOIN `es_cluster` ON `share`.clusterId = `es_cluster`.id 
                WHERE `share`.id = {$id}";
        $result = $db->fetchOne($sql);

        return $result['index'] ? $result : null;
    }

    public static function getDashboardChart($id, $chartId)
    {
        $db = DI::getDefault()->getDb();
        $sql = "SELECT `es_index`.name as `index`, `es_cluster`.url as `url`, `chart`.builder as `builder`, `chart`.format as `format` FROM `share` 
                LEFT JOIN `dashboard` ON `share`.prototypeId = `dashboard`.id
                LEFT JOIN `chart` ON `dashboard`.id = `chart`.dashboardId 
                LEFT JOIN `es_index` ON `chart`.indexId = `es_index`.id 
                LEFT JOIN `es_cluster` ON `share`.clusterId = `es_cluster`.id 
                WHERE `share`.id = {$id} AND `chart`.id = {$chartId}";
        $result = $db->fetchOne($sql);

        return $result['index'] ? $result : null;
    }

    public static function getQueryList()
    {
        $db = DI::getDefault()->getDb();
        $clusterId = EsCluster::fromSession()['id'];
        $sql = "SELECT `share`.id, `share`.uuid, `share`.count, `share`.`status`, `query_group`.`name` as `groupName`, `query`.`name` as `queryName` FROM `share` 
                LEFT JOIN `query` ON `share`.prototypeId = `query`.id 
		        LEFT JOIN `query_group` ON `query_group`.id = `query`.groupId 
                WHERE `share`.type = 'query' AND `share`.clusterId = {$clusterId}";

        return $db->fetchAll($sql);
    }

    public static function getDashboardList()
    {
        $db = DI::getDefault()->getDb();
        $clusterId = EsCluster::fromSession()['id'];
        $sql = "SELECT `share`.id, `share`.uuid, `share`.count, `share`.`status`, `dashboard_group`.`name` as `groupName`, `dashboard`.`name` as `dashboardName` FROM `share` 
                LEFT JOIN `dashboard` ON `share`.prototypeId = `dashboard`.id 
		        LEFT JOIN `dashboard_group` ON `dashboard_group`.id = `dashboard`.groupId 
                WHERE `share`.type = 'dashboard' AND `share`.clusterId = {$clusterId}";

        return $db->fetchAll($sql);
    }

    public static function getChartList()
    {
        $db = DI::getDefault()->getDb();
        $clusterId = EsCluster::fromSession()['id'];
        $sql = "SELECT `share`.id, `share`.uuid, `share`.count, `share`.`status`, `dashboard_group`.`name` as `groupName`, `dashboard`.`name` as `dashboardName`, `chart`.`name` as `chartName` FROM `share` 
                LEFT JOIN `chart` ON `share`.prototypeId = `chart`.id 
                LEFT JOIN `dashboard` ON `chart`.dashboardId = `dashboard`.id 
		        LEFT JOIN `dashboard_group` ON `dashboard_group`.id = `dashboard`.groupId 
                WHERE `share`.type = 'chart' AND `share`.clusterId = {$clusterId}";

        return $db->fetchAll($sql);
    }
}
