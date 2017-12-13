<?php

// ES集群
class EsController extends ControllerBase
{
    public function initialize()
    {
        $this->view->disable();
        parent::initialize();
    }

    // ====================================
    //  ES集群
    // ====================================

    // ES集群-增删改查
    public  function clusterAction($id = null)
    {
        $method = $this->request->getMethod();
        $post = $this->request->getPost();

        if ($method == 'POST' && !$post['id']) {
            return $this->clusterCreate($post);
        }

        else if ($method == 'POST' && $post['id']) {
            return $this->clusterUpdate($post);
        }

        else if ($method == 'GET' && !$id) {
            return $this->clusterList();
        }
    }

    private function clusterCreate($post)
    {
        $model = new EsCluster();
        $this->clusterSave($model, $post);

        EsCluster::setUsing($model->id);
        EsCluster::toSession($model);

        // 默认分组
        $queryGroup = new QueryGroup();
        $queryGroup->clusterId = $model->id;
        $queryGroup->name = '默认分组';
        $queryGroup->save();

        $dashboardGroup = new DashboardGroup();
        $dashboardGroup->clusterId = $model->id;
        $dashboardGroup->name = '默认分组';
        $dashboardGroup->save();

        $this->jsonView('SUCCESS', 200);
    }

    private function clusterUpdate($post)
    {
        $id = (int)$post['id'];
        $model = EsCluster::findFirst("id = {$id}");
        if (!$model || $model->userId != User::fromSession()['id']) {
            $this->jsonView('没有权限操作', 403);
        }

        $this->clusterSave($model, $post);

        EsCluster::toSession($model);

        $this->jsonView('SUCCESS', 200);
    }

    private function clusterSave($model, $post)
    {
        $model->url = $post['url'];
        $model->version = EsCluster::getVersion($post['url']);
        if (!$model->version) $this->jsonView($model->url .'<br>不是正确的ES地址', 400);
        $model->userId = User::fromSession()['id'];
        if (EsCluster::findFirst("url = '{$model->url}' AND userId = {$model->userId}")) $this->jsonView($model->url .'<br>您已添加过该ES地址, 可以在"历史"中切换', 400);

        try {
            if (!$model->save()) {
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        return true;
    }

    private function clusterList()
    {
        $userId = User::fromSession()['id'];
        $list = EsCluster::find("userId = {$userId}")->toArray();

        $this->jsonView('SUCCESS', 200, ['list' => $list]);
    }

    private function clusterDetail($id)
    {


    }

    // ES集群-切换
    public  function switchAction($id)
    {
        $id = (int) $id;
        $userId = User::fromSession()['id'];
        $model = EsCluster::findFirst("id = {$id} AND userId = {$userId} AND status = '0'");
        if (!$model) $this->jsonView('无效操作', 400, []);

        EsCluster::setUsing($id);
        EsCluster::toSession($model);

        $this->jsonView('SUCCESS', 200);
    }

    // ES集群-统计信息
    public  function statisticsAction()
    {
        // 集群健康
        $health = EsCluster::getHealth( EsCluster::fromSession()['url'] );

        // 录入索引
        $indices = EsIndex::getMyIndices();
        $indexIds = join(',', Collection::pluck($indices, 'id'));

        if ($indexIds) {
            // 图表数量
            $sql = "SELECT COUNT(*) as chartNum FROM `chart` WHERE indexId IN ({$indexIds});";
            $result = $this->db->query($sql)->fetchAll()[0];
            $chartNum = $result['chartNum'];

            // 查询数量
            $sql = "SELECT COUNT(*) as queryNum FROM `query` WHERE indexId IN ({$indexIds});";
            $result = $this->db->query($sql)->fetchAll()[0];
            $queryNum = $result['queryNum'];

        } else {
            $chartNum = 0;
            $queryNum = 0;
        }

        if ($health) {
            $this->jsonView('SUCCESS', 200, [
                'status' => $health['status'],
                'activeShards' => $health['activeShards'],
                'primaryShards' => $health['primaryShards'],
                'indexNum' => count($indices),
                'chartNum' => $chartNum,
                'queryNum' => $queryNum,
            ]);
        } else {
            $this->jsonView('ES集群访问失败, 请确认是否启动应用', 500, []);
        }
    }

    // ====================================
    //  ES索引
    // ====================================
    public  function indexAction($id = null)
    {
        $method = $this->request->getMethod();
        $post = $this->request->getPost();

        if ($method == 'POST' && !$post['id']) {
            $this->indexCreate($post);
        }

        else if ($method == 'POST' && $post['id']) {
            $this->indexUpdate($post);
        }

        else if ($method == 'GET' && !$id) {
            $this->indexList();
        }

        else if ($method == 'DELETE' && $id) {
            $this->indexDelete($id);
        }
    }

    private function indexCreate($post)
    {
        $model = new EsIndex();
        $this->indexSave($model, $post);
        $this->jsonView('SUCCESS', 200);
    }

    private function indexUpdate($post)
    {
        $id = (int)$post['id'];
        $model = EsIndex::findFirst("id = {$id}");
        if (!$model || $model->clusterId != EsCluster::fromSession()['id']) {
            $this->jsonView('没有权限操作', 403);
        }

        $this->indexSave($model, $post);
        $this->jsonView('SUCCESS', 200);
    }

    private function indexSave($model, $post)
    {
        $model->index = $post['index'];
        $model->type = $post['type'];
        $model->mapping = $post['mapping'];
        $model->defaultDateField = $post['defaultDateField'];
        $model->comment = $post['comment'];
        $model->sort = $post['sort'];
        $model->clusterId = EsCluster::fromSession()['id'];

        if (EsIndex::checkRepeat($model)) {
            $this->jsonView('该索引系统中已存在, 不能重复录入', 400);
        }

        try {
            if (!$model->save()) {
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }
    }

    private function indexDelete($id)
    {
        $id = (int)$id;
        $model = EsIndex::findFirst("id = {$id}");
        if (!$model || $model->clusterId != EsCluster::fromSession()['id']) {
            $this->jsonView('没有权限操作', 403);
        }

        if (Chart::findFirst("indexId = {$id}")) {
            $this->jsonView('删除失败, 请先删除该索引下的图表', 400);
        }

        if (Query::findFirst("indexId = {$id}")) {
            $this->jsonView('删除失败, 请先删除该索引下的查询', 400);
        }

        try {
            if (!$model->delete()) {
                $this->jsonView('删除失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('SUCCESS', 200);
    }

    private function indexList()
    {
        $clusterId = EsCluster::fromSession()['id'];
        $list = EsIndex::find("clusterId = {$clusterId}")->toArray();
        $indexIds = join(',', Collection::pluck($list, 'id'));

        if ($indexIds) {
            // 图表数量
            $sql = "SELECT indexId as id, COUNT(*) as num FROM `chart` WHERE indexId IN ({$indexIds}) GROUP BY indexId";
            $results = $this->db->query($sql)->fetchAll();
            $chartNum = Collection::indexBy($results, 'id');

            // 查询数量
            $sql = "SELECT indexId as id, COUNT(*) as num FROM `query` WHERE indexId IN ({$indexIds}) GROUP BY indexId";
            $results = $this->db->query($sql)->fetchAll();
            $queryNum = Collection::indexBy($results, 'id');
        }

        // 结果汇总
        foreach ($list as $k=>&$item) {
            $id = $item['id'];
            $item['chartNum'] = isset($chartNum[$id]) ? $chartNum[$id]['num']: 0;
            $item['queryNum'] = isset($queryNum[$id]) ? $queryNum[$id]['num']: 0;
        }

        $this->jsonView('SUCCESS', 200, ['list' => $list]);
    }

    // ====================================
    //  ES查询
    // ====================================
    public  function searchAction($format)
    {
        $_REQUEST['builder'] = json_decode($_REQUEST['builder'], true);

        if ($format == 'query') {
            $_REQUEST['page'] = $_REQUEST['page'] ? (int)$_REQUEST['page'] : 1;
            $_REQUEST['pageSize'] = $_REQUEST['pageSize'] ? (int)$_REQUEST['pageSize'] : 50;
            $_REQUEST['builder']['from'] = ($_REQUEST['page'] - 1) * $_REQUEST['pageSize'];
            $_REQUEST['builder']['size'] = $_REQUEST['pageSize'];
        }

        $elasticSearch = new ElasticSearch($_REQUEST['url'], $_REQUEST['index'], $_REQUEST['builder']);
        switch ($format) {
            case 'line'  : $elasticSearch->queryForLine(); break;
            case 'bar'   : $elasticSearch->queryForBar(); break;
            case 'pie'   : $elasticSearch->queryForPie(); break;
            case 'panel' : $elasticSearch->queryForPanel(); break;
            case 'radar' : $elasticSearch->queryForRadar(); break;
            case 'table' : $elasticSearch->queryForTable(); break;
            case 'query' : $elasticSearch->queryForQuery(); break;
            case 'text'  : $elasticSearch->queryForText(); break;
            default      : $this->jsonView('wrong format', 500); break;
        }

        if ($format == 'text') {
            $data = $elasticSearch->getData();
            Utils::respondText($data['fileName'].'.text', $data['text']);
        } else{
            $this->jsonView('SUCCESS', 200, $elasticSearch->getData());
        }
    }
}