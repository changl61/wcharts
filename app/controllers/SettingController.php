<?php

class SettingController extends ControllerBase
{
    public function initialize()
    {
        $this->tag->setTitle('设置');
        $this->view->setTemplateAfter('main');

        parent::initialize();
    }

    public function indexAction()
    {
        //$this->jsonView('haha');
    }

    // ====================================
    //  ES集群
    // ====================================
    public function esAction()
    {
        if (!EsCluster::fromSession()['id']) $this->response->redirect("auth/es");

        // 模版传值
        $this->view->setVars([
            'cluster' => EsCluster::fromSession(),
            'indices' => '',
        ]);
    }

    // ====================================
    //  查询管理
    // ====================================
    public function queryAction()
    {
        if (!EsCluster::fromSession()['id']) $this->response->redirect("auth/es");

        $groups = QueryGroup::getMyGroups()->toArray();
        $queries = Query::getMyQueries()->toArray();

        $groupQueries = [];
        foreach ($groups as $index => $group){
            $groupQueries[] = [
                'id' => $group['id'],
                'name' => $group['name'],
                'sort' => $group['sort'],
                'queries' => Collection::find($queries, ['groupId'=> $group['id']]),
            ];
        }

        // 模版传值
        $this->view->setVars([
            'groupQueries' => $groupQueries,
            'groups' => $groups,
        ]);
    }

    public function saveGroupAction()
    {
        // 表单验证
        $form = new FormForQueryGroup($this->request->getPost());

        if ($form->validate()->getErrors()) {
            $this->jsonView($form->getErrorString(), 400, []);
        }

        // 保存入库
        if ($form->id) {
            $model = QueryGroup::findFirst("id = {$form->id}");
        } else {
            $model = new QueryGroup();
            $model->clusterId = EsCluster::fromSession()['id'];
        }

        $model->name = $form->name;
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

    public function deleteGroupAction($id)
    {
        $id = (int)$id;
        $clusterId = EsCluster::fromSession()['id'];
        $model = QueryGroup::findFirst("id = {$id}");
        if (!$model || $model->clusterId != $clusterId) {
            $this->jsonView('没有权限操作', 403);
        }

        if (Query::findFirst("groupId = {$id}")) {
            $this->jsonView('删除失败, 请先删除该分组下的查询', 400);
        }

        // 至少保留一个分组
        $count = count(QueryGroup::find("clusterId = {$clusterId}"));
        if ($count == 1) {
            $this->jsonView('不能删除, 至少保留1个分组', 400);
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


    // ====================================
    //  面板管理
    // ====================================
    public function dashboardAction()
    {
        if (!EsCluster::fromSession()['id']) $this->response->redirect("auth/es");

        $groups = DashboardGroup::getMyGroups()->toArray();
        $dashboards = Dashboard::getMyDashboards()->toArray();

        $groupDashboards = [];
        foreach ($groups as $index => $group){
            $groupDashboards[] = [
                'id' => $group['id'],
                'name' => $group['name'],
                'sort' => $group['sort'],
                'dashboards' => Collection::find($dashboards, ['groupId'=> $group['id']]),
            ];
        }

        $dashboardIds = join(',', Collection::pluck($dashboards, 'id'));

        if ($dashboardIds) {
            // 图表数量
            $sql = "SELECT dashboardId as id, COUNT(*) as num FROM `chart` WHERE dashboardId IN ({$dashboardIds}) GROUP BY dashboardId";
            $results = $this->db->query($sql)->fetchAll();
            $chartNum = Collection::indexBy($results, 'id');
        }

        // 模版传值
        $this->view->setVars([
            'groupDashboards' => $groupDashboards,
            'groups' => $groups,
            'chartNum' => $chartNum,
        ]);
    }

    public function saveDashboardGroupAction()
    {
        // 表单验证
        $form = new FormForDashboardGroup($this->request->getPost());

        if ($form->validate()->getErrors()) {
            $this->jsonView($form->getErrorString(), 400, []);
        }

        // 保存入库
        if ($form->id) {
            $model = DashboardGroup::findFirst("id = {$form->id}");
        } else {
            $model = new DashboardGroup();
            $model->clusterId = EsCluster::fromSession()['id'];
        }

        $model->name = $form->name;
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

    public function deleteDashboardGroupAction($id)
    {
        $id = (int)$id;
        $clusterId = EsCluster::fromSession()['id'];
        $model = DashboardGroup::findFirst("id = {$id}");
        if (!$model || $model->clusterId != $clusterId) {
            $this->jsonView('没有权限操作', 403);
        }

        if (Dashboard::findFirst("groupId = {$id}")) {
            $this->jsonView('删除失败, 请先删除该分组下的统计面板', 400);
        }

        // 至少保留一个分组
        $count = count(DashboardGroup::find("clusterId = {$clusterId}"));
        if ($count == 1) {
            $this->jsonView('不能删除, 至少保留1个分组', 400);
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


    // ====================================
    //  分享链接管理
    // ====================================
    public function shareAction()
    {
        $shareList = [
            'query'=> Share::getQueryList(),
            'dashboard'=> Share::getDashboardList(),
            'chart'=> Share::getChartList(),
        ];

        // 模版传值
        $this->view->setVars([
            'shareList' => $shareList,
            'url' => 'http://' . $_SERVER['HTTP_HOST'] . '/share/detail/',
        ]);
    }


    // ====================================
    //  用户管理
    // ====================================
    public function userAction()
    {
        $keywords = $this->request->get('keywords');

        // 模版传值
        $this->view->setVars([
            'users' => User::find("role = 'user'" . ($keywords ? "AND name LIKE '%{$keywords}%'" : ''))->toArray(),
            'keywords' => $keywords,
        ]);
    }

    public function createUserAction()
    {
        // 表单验证
        $form = new FormForUser($this->request->getPost());

        if ($form->validate()->getErrors()) {
            $this->jsonView($form->getErrorString(), 403, []);
        }

        $model = new User();
        $model->name = $form->name;
        $model->password = md5($form->password);

        try {
            if (!$model->save()) {
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('SUCCESS', 200);
    }

    public function updateUserAction($id)
    {
        $id = (int)$id;
        $model = User::findFirst("id = {$id}");
        if (!$model) $this->jsonView('用户不存在', 401);


        $status = (string) $this->request->getPost('status');
        $password = (int) $this->request->getPost('password');

        if ($status != '') $model->status = $status;
        if ($password) $model->password = md5($password);

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

    // ====================================
    //  账号管理
    // ====================================
    public function accountAction()
    {

    }

    public function resetPasswordAction()
    {
        $userId = User::fromSession()['id'];
        $currentPassword = $this->request->getPost('currentPassword');
        $newPassword = $this->request->getPost('newPassword');
        $user = User::findFirst("id = {$userId}");

        // 验证
        if ($user->password != md5($currentPassword)) $this->jsonView('当前密码不匹配', 403);
        if (strlen($newPassword) < 6) $this->jsonView('新密码至少6位字符', 403);

        // 保存入库
        $user->password = md5($newPassword);
        try {
            if (!$user->save()) {
                $this->jsonView('更新失败', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->session->destroy();
        $this->jsonView('已修改登录密码, 请重新登录', 302, ['redirectUrl' => '/auth/login']);
    }

    // ====================================
    //  用户组管理
    // ====================================
    public function teamAction()
    {
        // 我的团队
        $teams = UserTeam::getMyTeams();
        $teamIds = Collection::pluck($teams, 'id');

        // 团队成员
        $teamUsers = UserTeam::getTeamUsers($teamIds);
        $teamAdmins = UserTeam::getTeamAdmins($teamIds);
        foreach ($teams as $k=>$team) {
            $teams[$k]['users'] = implode('、', Collection::pluck($teamUsers[$team['id']], 'name'));
            $teams[$k]['admin'] = implode('、', Collection::pluck($teamAdmins[$team['id']], 'name'));
        }


        $createdTeams = [];  // 我创建的团队
        $joinedTeams = [];   // 我加入的团队
        foreach ($teams as $team) {
            if ($team['role'] == 'team.admin') {
                $createdTeams[] = $team;
            } else {
                $joinedTeams[] = $team;
            }
        }

        $this->view->setVars([
            'createdTeams' => $createdTeams,
            'joinedTeams' => $joinedTeams,
        ]);
    }

    public function teamUserAction()
    {
        $teamId = User::fromSession()['id'];
        $teamIds = [$teamId];
        $teamUsers = UserTeam::getTeamUsers($teamIds)[$teamId];
        $teamAdmin = UserTeam::getTeamAdmins($teamIds)[$teamId][0];

        $this->view->setVars([
            'teamUsers' => $teamUsers,
            'teamAdmin' => $teamAdmin,
        ]);
    }
}