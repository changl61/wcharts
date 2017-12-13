<?php

use Phalcon\Mvc\Model;
use Phalcon\DI;

class UserTeam extends Model
{
    // 表的所有字段名
    public $id;
    public $userId;
    public $role;
    public $teamId;
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
        return 'user_team';
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

    public static function getTeam($id)
    {
        $db = DI::getDefault()->getDb();
        $userId = User::fromSession()['prototype']['id'];
        $sql = "SELECT `user`.name as `name`, `user`.id as `id`, `user_team`.role as `role`
                FROM `user` LEFT JOIN `user_team` ON `user`.id = `user_team`.teamId 
                WHERE `user_team`.userId = {$userId} AND `user`.id = {$id}";

        $result = $db->fetchOne($sql);
        if ($result) {
            return (object)$result;
        } else {
            return null;
        }
    }

    public static function getMyTeams()
    {
        $db = DI::getDefault()->getDb();
        $userId = User::fromSession()['prototype']['id'];
        $sql = "SELECT `user`.name as `name`, `user`.id as `id`, `user_team`.role as `role`
                FROM `user` LEFT JOIN `user_team` ON `user`.id = `user_team`.teamId 
                WHERE `user`.status = '1' AND `user_team`.userId = {$userId}";

        return $db->fetchAll($sql);
    }

    public static function getTeamUsers($teamIds)
    {
        $result = [];
        if (empty($teamIds)) return $result;

        $db = DI::getDefault()->getDb();
        $joinedTeamIds = implode(',', $teamIds);
        $sql = "SELECT `user`.name as `name`, `user`.id as `id`, `user_team`.role as `role`, `user_team`.teamId as `teamId`
                FROM `user` LEFT JOIN `user_team` ON `user`.id = `user_team`.userId 
                WHERE `user_team`.role != 'team.admin' AND `user_team`.teamId IN ({$joinedTeamIds})
                ORDER BY `user_team`.id";
        $records = $db->fetchAll($sql);

        // 按团队分组
        foreach ($records as $record) {
            $result[$record['teamId']][] = $record;
        }

        foreach ($teamIds as $teamId) {
            if (!isset($result[$teamId])) $result[$teamId] = [];
        }

        return $result;
    }

    public static function getTeamAdmins($teamIds)
    {
        $result = [];
        if (empty($teamIds)) return $result;

        $db = DI::getDefault()->getDb();
        $joinedTeamIds = implode(',', $teamIds);
        $sql = "SELECT `user`.name as `name`, `user`.id as `id`, `user_team`.role as `role`, `user_team`.teamId as `teamId`
                FROM `user` LEFT JOIN `user_team` ON `user`.id = `user_team`.userId 
                WHERE `user_team`.role = 'team.admin' AND `user_team`.teamId IN ({$joinedTeamIds})
                ORDER BY `user_team`.id";
        $records = $db->fetchAll($sql);

        // 按团队分组
        $result = [];
        foreach ($records as $record) {
            $result[$record['teamId']][] = $record;
        }

        foreach ($teamIds as $teamId) {
            if (!isset($result[$teamId])) $result[$teamId] = [];
        }

        return $result;
    }
}