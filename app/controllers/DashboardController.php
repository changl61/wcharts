<?php

class DashboardController extends ControllerBase
{
    public function initialize()
    {
        $this->tag->setTitle('统计面板');
        $this->view->setTemplateAfter('main');

        parent::initialize();
    }

    public function indexAction()
    {
        $this->dispatcher->forward([
            "controller" => "dashboard",
            "action"     => "detail"
        ]);
    }

    public function detailAction($groupId = 0, $id = 0)
    {
        if (!EsCluster::fromSession()['id']) $this->response->redirect("auth/es");

        $groupId = (int)$groupId;
        $id = (int)$id;

        // 不指定分组取第一个
        $myGroups = DashboardGroup::getMyGroups()->toArray();
        if (!$groupId) {
            $group = $myGroups[0];
        } else {
            $group = Collection::findFirst($myGroups, ['id'=>$groupId]);
            if (!$group) $this->dispatcher->forward(["controller" => "errors", "action"=> "show403"]);
        }

        // 不指定图表面板取第一个
        $dashboards = Dashboard::find("groupId = {$group['id']} ORDER BY sort ASC")->toArray();
        if (!$id) {
            $dashboard = $dashboards[0];
        } else {
            $dashboard = Collection::findFirst($dashboards, ['id'=>$id]);
            if (!$dashboard) $this->dispatcher->forward(["controller" => "errors", "action"=> "show403"]);
        }

        // 面板下图表
        $charts = $dashboard ? Chart::find("dashboardId = {$dashboard['id']}")->toArray() : [];

        $this->view->setVars([
            'charts' => $charts,         // 所有图表
            'dashboard' => $dashboard,   // 当前统计面板
            'dashboards' => $dashboards, // 分组下所有统计面板
            'group' => $group,           // 当前分组
            'groups' => $myGroups,       // 用户所有分组
            'indices' => EsIndex::getMyIndices(),
            'cluster' => EsCluster::fromSession(),
        ]);
    }

    public function createAction()
    {
        // 表单验证
        $form = new FormForDashboard($this->request->getPost());
        if ($form->validate()->getErrors()) {
            $this->jsonView($form->getErrorString(), 400, []);
        }

        // 保存入库
        $model = new Dashboard();
        $model->name = $form->name;
        $model->groupId = $form->groupId;
        $model->sort = $form->sort;

        try {
            if (!$model->save()) {
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('创建成功', 302, ['redirectUrl' => '/dashboard/detail/'. $model->groupId.'/'.$model->id]);
    }

    public function saveAction()
    {
        // 表单验证
        $form = new FormForDashboard($this->request->getPost());
        if ($form->validate()->getErrors()) {
            $this->jsonView($form->getErrorString(), 400, []);
        }

        // 保存入库
        $model = Dashboard::findFirst("id = {$form->id}");
        $model->name = $form->name;
        $model->groupId = $form->groupId;
        $model->sort = $form->sort;

        try {
            if (!$model->save()) {
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('SUCCESS', 200);
    }

    public function saveGridAction($id)
    {
        $id = (int)$id;
        $model = Dashboard::findFirst("id = {$id}");
        if (!$model ) $this->jsonView('该统计统计面板不存在', 500);

        // 保存入库
        $model->grid = $this->request->getPost('grid');

        try {
            if (!$model->save()) {
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('SUCCESS', 200);
    }

    public function deleteAction($id)
    {
        $id = (int)$id;
        $model = Dashboard::findFirst("id = {$id}");
        if (!$model ) $this->jsonView('该统计统计面板不存在', 500);

        $group = DashboardGroup::findFirst("id = {$model->groupId}");
        if ($group->clusterId != EsCluster::fromSession()['id']) {
            $this->jsonView('没有权限操作', 403);
        }

        if (Chart::findFirst("dashboardId = {$id}")) {
            $this->jsonView('删除失败, 请先删除该统计面板下的图表', 400);
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
}