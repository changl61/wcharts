<?php

use Phalcon\Mvc\Model;

// ES集群
class EsIndex extends Model
{
    // 表的所有字段名
    public $id;
    public $name = '';
    public $index;
    public $type;
    public $mapping = [];
    public $defaultDateField;
    public $comment = '';
    public $sort = 100;
    public $clusterId;
    public $createTime;
    public $updateTime;

    // 定义关系
    public function initialize()
    {
        $this->skipAttributesOnCreate(['updateTime']);
        $this->skipAttributesOnUpdate(['createTime', 'clusterId']);
    }

    // 绑定数据库表名
    public function getSource()
    {
        return 'es_index';
    }

    public function beforeSave()
    {
        $this->name = $this->index.'/'.$this->type;
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
        $this->mapping = json_decode($this->mapping, true);
    }

    public static function checkRepeat($model)
    {
        $id = $model->id ? $model->id : 0;
        return !!self::findFirst("id <> {$id} AND index = '{$model->index}' AND type = '{$model->type}' AND clusterId = '{$model->clusterId}'");
    }

    public static function getMyIndices()
    {
        $indices = [];

        $clusterId = EsCluster::fromSession()['id'];
        $records = self::find("clusterId = {$clusterId}");
        foreach ($records as $model) {
            $indices[] = [
                'id' => $model->id,
                'name' => $model->name,
                'mapping'=> $model->mapping,
            ];
        }

        return $indices;
    }
}