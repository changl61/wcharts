<?php

class ChartController extends ControllerBase
{
    public function initialize()
    {
        $this->tag->setTitle('图表');
        $this->view->setTemplateAfter('main');

        parent::initialize();
    }

    public function indexAction()
    {
        $this->dispatcher->forward([
            "controller" => "chart",
            "action"     => "detail"
        ]);
    }

    public function detailAction($id)
    {

    }

    public function createAction()
    {
        // 表单验证
        $form = new FormForChart($this->request->getPost());
        if ($form->validate()->getErrors()) {
            $this->jsonView($form->getErrorString(), 400, []);
        }

        // 保存入库
        $model = new Chart();
        $model->userId = User::fromSession()['id'];
        $form->assignToObjectExcept($model, ['id']);
        try {
            if (!$model->save()) {
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('SUCCESS', 200, ['detail'=>$model->toArray()]);
    }

    public function copyAction($id)
    {
        $id = (int)$id;
        $model = Chart::findFirst("id = {$id}");
        $dashboardId = (int)$this->request->getPost('dashboardId');
        if (!$model || $model->userId != User::fromSession()['id'] || !$dashboardId) $this->jsonView('非法操作', 500);

        $dashboard = Dashboard::findFirst("id = {$dashboardId}");
        $new = new Chart();
        $new->name = $model->name . '_copy';
        $new->format = $model->format;
        $new->indexId = $model->indexId;
        $new->builder = $model->builder;
        $new->dashboardId = $dashboardId;
        $new->userId = User::fromSession()['id'];

        // 保存
        $this->db->begin();
        try {
            if (!$new->save()) {
                $this->db->rollback();
                $this->jsonView('保存失败', 500);
            }

            $dashboard->grid .= '<div class="dashboard-row" style="height: 250px;"><div class="dashboard-cell" data-content="'.$new->id.'" style="width: 100%;"></div></div>';
            if (!$dashboard->save()) {
                $this->db->rollback();
                $this->jsonView('保存失败', 500);
            }

        } catch (Exception $e) {
            $this->db->rollback();
            $this->jsonView('数据库访问异常', 500);
        }
        $this->db->commit();

        $this->jsonView('SUCCESS', 200, []);
    }

    public function moveAction($id)
    {
        $id = (int)$id;
        $model = Chart::findFirst("id = {$id}");
        $dashboardId = (int)$this->request->getPost('dashboardId');
        if (!$model || $model->userId != User::fromSession()['id'] || !$dashboardId) $this->jsonView('非法操作', 500);
        if ($model->dashboardId == $dashboardId) $this->jsonView('图表没有改变位置, 目标统计面板与当前统计面板相同', 400);

        $model->dashboardId = $dashboardId;
        $dashboard = Dashboard::findFirst("id = {$dashboardId}");
        $dashboard->grid .= '<div class="dashboard-row" style="height: 250px;"><div class="dashboard-cell" data-content="'.$model->id.'" style="width: 100%;"></div></div>';

        // 保存
        $this->db->begin();
        try {
            if (!($model->save() && $dashboard->save())) {
                $this->db->rollback();
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->db->rollback();
            $this->jsonView('数据库访问异常', 500);
        }
        $this->db->commit();

        $this->jsonView('SUCCESS', 200, []);
    }

    public function updateAction($id)
    {
        $id = (int)$id;
        $model = Chart::findFirst("id = {$id}");
        if (!$model || $model->userId != User::fromSession()['id']) $this->jsonView('非法操作', 500);

        // 设置值
        $post = $this->request->getPost();
        if ($post['builder']) $model->builder = $post['builder'];
        if ($post['name']) $model->name = $post['name'];

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

    public function deleteAction($id)
    {
        $id = (int)$id;
        $model = Chart::findFirst("id = {$id}");
        if (!$model || $model->userId != User::fromSession()['id']) $this->jsonView('非法操作', 500);

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