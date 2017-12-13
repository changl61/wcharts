<?php
use Phalcon\Mvc\View;
class ShareController extends ControllerBase
{
    public function initialize()
    {
        $this->tag->setTitle('分享链接');
        $this->view->setTemplateAfter('main');

        parent::initialize();
    }

    public function detailAction($uuid)
    {
        $this->view->disableLevel(4);

        $model = Share::findFirst("uuid = '{$uuid}'");
        if ($model && $model->status == '1') {
            switch ($model->type) {
                case 'query'     : $this->detailOfQuery($model); break;
                case 'chart'     : $this->detailOfChart($model); break;
                case 'dashboard' : $this->detailOfDashboard($model); break;
                default          : break;
            }
            $this->view->setVar('uuid', $model->uuid);
        }

        else {
            $this->view->pick('share/error');
        }
    }

    private function detailOfQuery($model)
    {
        $query = Query::findFirst("id = {$model->prototypeId}");
        if ($query) {
            $model->count++;
            $model->save();

            $this->view->pick('share/query');
            $this->view->setVar('action', 'query');
        } else {
            $this->view->pick('share/error');
        }
    }

    private function detailOfChart($model)
    {
        $chart = Chart::findFirst("id = {$model->prototypeId}");
        if ($chart) {
            $model->count++;
            $model->save();

            $this->view->pick('share/chart');
            $this->view->setVar('action', 'chart');
            $this->view->setVar('chart', $chart->toArray());
        } else {
            $this->view->pick('share/error');
        }
    }

    private function detailOfDashboard($model)
    {
        $dashboard = Dashboard::findFirst("id = {$model->prototypeId}");
        if ($dashboard) {
            $model->count++;
            $model->save();

            $charts = Chart::find("dashboardId = {$dashboard->id}")->toArray();

            $this->view->pick('share/dashboard');
            $this->view->setVar('action', 'dashboard');
            $this->view->setVar('dashboard', $dashboard->toArray());
            $this->view->setVar('charts', Collection::thin($charts, ['id', 'name', 'format']));
        } else {
            $this->view->pick('share/error');
        }
    }

    public function createAction()
    {
        $type = $this->request->getPost('type');
        $prototypeId = (int)$this->request->getPost('prototypeId');
        if (!in_array($type, ['query', 'chart', 'dashboard']) || !$prototypeId) $this->jsonView('参数错误', 400);

        $url = 'http://' . $_SERVER['HTTP_HOST'] . '/share/detail/';
        $model = Share::findFirst("type = '{$type}' AND prototypeId = {$prototypeId}");

        if ($model) {
            $this->jsonView('SUCCESS', 200, ['url'=> $url . $model->uuid]);
        }

        else {
            $model = new Share();
            $model->name = '1';
            $model->uuid = rand(123, 999).uniqid();
            $model->type = $type;
            $model->prototypeId = $prototypeId;
            $model->clusterId = EsCluster::fromSession()['id'];

            try {
                if (!$model->save()) {
                    $this->jsonView('保存失败', 500);
                }
            } catch (Exception $e) {
                $this->jsonView('数据库访问异常', 500);
            }

            $this->jsonView('SUCCESS', 200, ['url'=> $url . $model->uuid]);
        }
    }

    public function updateAction($id)
    {
        $id = (int)$id;
        $clusterId = EsCluster::fromSession()['id'];
        $model = Share::findFirst("id = {$id}");
        if (!$model || $model->clusterId != $clusterId) {
            $this->jsonView('没有权限操作', 403);
        }

        $model->status = $this->request->getPost('status');


        // 保存入库
        try {
            if (!$model->save()) {
                $this->jsonView('更新失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('SUCCESS', 200);
    }

    public function deleteAction($id)
    {
        $id = (int)$id;
        $clusterId = EsCluster::fromSession()['id'];
        $model = Share::findFirst("id = {$id}");
        if (!$model || $model->clusterId != $clusterId) {
            $this->jsonView('没有权限操作', 403);
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

    public function searchAction($uuid)
    {
        $model = Share::findFirst("uuid = '{$uuid}'");
        if (!$model || $model->status == '0') {
            $this->jsonView('参数有误', 500);
            return;
        }

        switch ($model->type) {
            case 'query'     : $this->searchForQuery($model); break;
            case 'chart'     : $this->searchForChart($model); break;
            case 'dashboard' : $this->searchForDashboard($model); break;
            default          : $this->jsonView('参数有误', 500);
        }
    }

    private function searchForQuery($model)
    {
        $query = share::getQuery($model->id);
        if (!$query)  $this->jsonView('分享已失效', 500);

        $_REQUEST['page'] = $_REQUEST['page'] ? (int)$_REQUEST['page'] : 1;
        $_REQUEST['pageSize'] = $_REQUEST['pageSize'] ? (int)$_REQUEST['pageSize'] : 50;

        $query['builder'] = json_decode($query['builder'], true);
        $query['builder']['from'] = ($_REQUEST['page'] - 1) * $_REQUEST['pageSize'];
        $query['builder']['size'] = $_REQUEST['pageSize'];

        // 查询ES
        $elasticSearch = new ElasticSearch($query['url'], $query['index'], $query['builder']);
        $elasticSearch->queryForQuery();
        $this->jsonView('SUCCESS', 200, $elasticSearch->getData());
    }

    private function searchForChart($model)
    {
        $chart = share::getChart($model->id);
        if (!$chart)  $this->jsonView('分享已失效', 500);
        $chart['builder'] = json_decode($chart['builder'], true);

        // 查询ES
        $elasticSearch = new ElasticSearch($chart['url'], $chart['index'], $chart['builder']);

        switch ($chart['format']) {
            case 'line'  : $elasticSearch->queryForLine(); break;
            case 'bar'   : $elasticSearch->queryForBar(); break;
            case 'pie'   : $elasticSearch->queryForPie(); break;
            case 'panel' : $elasticSearch->queryForPanel(); break;
            case 'radar' : $elasticSearch->queryForRadar(); break;
            case 'table' : $elasticSearch->queryForTable(); break;
            default      : $this->jsonView('wrong format', 500); break;
        }

        $this->jsonView('SUCCESS', 200, $elasticSearch->getData());
    }

    private function searchForDashboard($model)
    {
        $chartId = (int)$_REQUEST['chartId'];
        $chart = share::getDashboardChart($model->id, $chartId);
        if (!$chart)  $this->jsonView('SUCCESS', 200, []);
        $chart['builder'] = json_decode($chart['builder'], true);

        // 查询ES
        $elasticSearch = new ElasticSearch($chart['url'], $chart['index'], $chart['builder']);

        switch ($chart['format']) {
            case 'line'  : $elasticSearch->queryForLine(); break;
            case 'bar'   : $elasticSearch->queryForBar(); break;
            case 'pie'   : $elasticSearch->queryForPie(); break;
            case 'panel' : $elasticSearch->queryForPanel(); break;
            case 'radar' : $elasticSearch->queryForRadar(); break;
            case 'table' : $elasticSearch->queryForTable(); break;
            default      : $this->jsonView('wrong format', 500); break;
        }

        $this->jsonView('SUCCESS', 200, $elasticSearch->getData());
    }
}