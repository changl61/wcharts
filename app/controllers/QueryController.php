<?php
use Phalcon\Mvc\View;
class QueryController extends ControllerBase
{
    public function initialize()
    {
        $this->tag->setTitle('查询');
        $this->view->setTemplateAfter('main');

        parent::initialize();
    }

    public function indexAction()
    {
        $this->dispatcher->forward([
            "controller" => "query",
            "action"     => "detail"
        ]);
    }

    public function detailAction($groupId = 0, $id = 0)
    {
        if (!EsCluster::fromSession()['id']) $this->response->redirect("auth/es");

        $groupId = (int)$groupId;
        $id = (int)$id;

        // 不指定分组取第一个
        $myGroups = QueryGroup::getMyGroups()->toArray();
        if (!$groupId) {
            $group = $myGroups[0];
        } else {
            $group = Collection::findFirst($myGroups, ['id'=>$groupId]);
            if (!$group) $this->dispatcher->forward(["controller" => "errors", "action"=> "show403"]);
        }

        // 不指定查询取第一个
        $queries = Query::find("groupId = {$group['id']} ORDER BY sort ASC")->toArray();
        if (!$id) {
            $query = $queries[0];
        } else {
            $query = Collection::findFirst($queries, ['id'=>$id]);
            if (!$query) $this->dispatcher->forward(["controller" => "errors", "action"=> "show403"]);
        }

        if ($query) {
            $query['builder'] = json_decode($query['builder'], true);
            $query['index'] = EsIndex::findFirst("id = {$query['indexId']}")->toArray();
            $query['cluster'] = EsCluster::fromSession();
        }

        $this->view->setVars([
            'query' => $query,
            'queries' => $queries,
            'group' => $group,
            'groups' => $myGroups,
            'indices' => EsIndex::getMyIndices(),
        ]);
    }

    public function createAction()
    {
        // 表单验证
        $form = new FormForQuery($this->request->getPost());
        if ($form->validate()->getErrors()) {
            $this->jsonView($form->getErrorString(), 400, []);
        }

        // 保存入库
        $index = EsIndex::findFirst("id = {$form->indexId}");
        $model = new Query();
        $model->name = $form->name;
        $model->indexId = $form->indexId;
        $model->groupId = $form->groupId;
        $model->builder = $form->builder ? $form->builder : json_encode([
            'scope'=> ['field'=>$index->defaultDateField, 'range'=>'最近1小时'],
            'filters'=> [],
        ]);

        try {
            if (!$model->save()) {
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('创建成功, 即将跳转', 302, ['redirectUrl' => '/query/detail/'. $model->groupId.'/'.$model->id]);
    }

    public function deleteAction($id)
    {
        $id = (int)$id;
        $model = Query::findFirst("id = {$id}");
        $group = QueryGroup::findFirst("id = {$model->groupId}");
        if (!$model || $group->clusterId != EsCluster::fromSession()['id']) {
            $this->jsonView('没有权限操作', 403);
        }

        try {
            if (!$model->delete()) {
                $this->jsonView('删除失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('SUCCESS', 200, []);
    }

    public function saveAction($id)
    {
        $id = (int)$id;
        $model = Query::findFirst("id = {$id}");
        $group = QueryGroup::findFirst("id = {$model->groupId}");
        if (!$model || $group->clusterId != EsCluster::fromSession()['id']) {
            $this->jsonView('没有权限操作', 403);
        }

        // 设置值
        $post = $this->request->getPost();
        if ($post['groupId']) $model->groupId = $post['groupId'];
        if ($post['name']) {
            if (Query::findFirst("name = '{$post['name']}' AND groupId = '{$model->groupId}'")) {
                $this->jsonView('"查询名称"重复, 请更换', 400);
            }
            $model->name = $post['name'];
        }
        if ($post['builder']) $model->builder = $post['builder'];
        if ($post['sort']) $model->sort = $post['sort'];

        // 保存
        try {
            if (!$model->save()) {
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('SUCCESS', 200, []);
    }

    public function builderAction()
    {
        $this->view->setTemplateAfter('iframe');
        $this->view->disableLevel(View::LEVEL_MAIN_LAYOUT);
        $this->view->disableLevel(View::LEVEL_LAYOUT);
    }

    public function tableAction()
    {
        $this->view->setTemplateAfter('iframe');
        $this->view->disableLevel(View::LEVEL_MAIN_LAYOUT);
        $this->view->disableLevel(View::LEVEL_LAYOUT);
    }
}