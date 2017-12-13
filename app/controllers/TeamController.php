<?php

class TeamController extends ControllerBase
{
    public function initialize()
    {
        $this->tag->setTitle('团队');
        $this->view->setTemplateAfter('main');

        parent::initialize();
    }

    // *****************************
    //  团队管理
    // *****************************
    public function createAction()
    {
        $name = $this->request->getPost('name');
        if (!$name) $this->jsonView('请输入团队名称', 400);
        if (User::findFirst("name = '{$name}' AND role = 'team' AND status = '1'")) $this->jsonView('团队名称系统中已存在, 请更换', 400);

        // 团队角色的用户
        $team = new User();
        $team->name = $name;
        $team->role = 'team';

        // 团队的管理员
        $teamAdmin = new UserTeam();
        $teamAdmin->userId = User::fromSession()['id'];
        $teamAdmin->role = 'team.admin';

        // 保存入库
        $this->db->begin();
        try {
            if (!$team->save()) {
                $this->db->rollback();
                $this->jsonView('保存失败', 500);
            } else {
                $teamAdmin->teamId = $team->id;
            }

            if (!$teamAdmin->save()) {
                $this->db->rollback();
                $this->jsonView('保存失败', 500);
            }
        } catch (Exception $e) {
            $this->db->rollback();
            $this->jsonView('数据库访问异常', 500);
        }
        $this->db->commit();

        $this->jsonView('SUCCESS', 200);
    }

    public function updateAction($id)
    {
        $id = (int)$id;
        $name = $this->request->getPost('name');
        $userId = User::fromSession()['id'];
        if (!$name) $this->jsonView('请输入团队名称', 400);
        if (!UserTeam::findFirst("userId = '{$userId}' AND role = 'admin' AND teamId = {$id}")) $this->jsonView('没有操作权限', 403);
        if (User::findFirst("name = '{$name}' AND role = 'team' AND status = '1' AND id != {$id}")) $this->jsonView('团队名称系统中已存在, 请更换', 400);

        $model = User::findFirst("id = {$id}");
        $model->name = $name;

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
        $userId = User::fromSession()['id'];
        if (!UserTeam::findFirst("userId = '{$userId}' AND role = 'team.admin' AND teamId = {$id}")) $this->jsonView('没有操作权限', 403);

        $teamUsers = UserTeam::getTeamUsers([$id])[$id];
        if (count($teamUsers) > 0) $this->jsonView('请先切换到团队账号, 删除此团队下的其他成员', 400);

        // 执行删除
        $this->db->begin();
        try {
            UserTeam::findFirst("teamId = {$id}")->delete() && User::findFirst("id = {$id}")->delete();
        } catch (Exception $e) {
            $this->db->rollback();
            $this->jsonView('数据库访问异常', 500);
        }
        $this->db->commit();

        $this->jsonView('SUCCESS', 200);
    }

    public function quitAction($id)
    {
        $id = (int)$id;
        $userId = User::fromSession()['loginUser']['id'];
        $teamUser = UserTeam::findFirst("userId = '{$userId}' AND teamId = {$id}");
        if (!$teamUser || $teamUser->role != 'user') $this->jsonView('没有操作权限', 403);

        // 执行删除
        try {
            if (!$teamUser->delete()) {
                $this->jsonView('数据库访问异常', 500);
            }
        } catch (Exception $e) {
            $this->jsonView('数据库访问异常', 500);
        }

        $this->jsonView('SUCCESS', 200);
    }

    public function accountsAction()
    {
        $teams = UserTeam::getMyTeams();
        $this->jsonView('SUCCESS', 200, [
            'team' => $teams,
            'prototype' => User::fromSession()['prototype'],
            'activeId' => User::fromSession()['id'],
        ]);
    }

    // *****************************
    //  团队成员管理
    // *****************************
    public function createUserAction()
    {
        $names = $this->request->getPost('name');
        $role= $this->request->getPost('role');
        $teamId = User::fromSession()['id'];

        $this->db->begin();
        try {
            foreach ($names as $name) {
                $user = User::findFirst("name = '{$name}' AND role = 'user'");

                if ($user) {
                    if (UserTeam::findFirst("teamId = {$teamId} AND userId = {$user->id}")) {
                        $this->db->rollback();
                        $this->jsonView('"'.$name.'"已在这个团队中', 400);
                    }
                } else {
                    $user = new User();
                    $user->name = $name;
                    $user->role = 'user';
                    if (!$user->save()) {
                        $this->db->rollback();
                        $this->jsonView('保存失败', 500);
                    }
                }

                $userTeam = new UserTeam();
                $userTeam->teamId = $teamId;
                $userTeam->userId = $user->id;
                $userTeam->role = $role;
                if (!$userTeam->save()) {
                    $this->db->rollback();
                    $this->jsonView('保存失败', 500);
                }
            }
        } catch (Exception $e) {
            $this->db->rollback();
            $this->jsonView('数据库访问异常', 500);
        }
        $this->db->commit();

        $this->jsonView('SUCCESS', 200);
    }

    public function updateUserAction($userId)
    {
        $role = $this->request->getPost('role');
        $teamId = User::fromSession()['id'];
        $userId = (int)$userId;

        $userTeam = UserTeam::findFirst("teamId = {$teamId} AND userId = {$userId}");
        if (!$userTeam) $this->jsonView('提交数据有误', 400);

        $userTeam->role = $role;
        if (!$userTeam->save()) $this->jsonView('保存失败', 500);

        $this->jsonView('SUCCESS', 200);
    }

    public function deleteUserAction($userId)
    {
        $userId = (int)$userId;
        $teamId = User::fromSession()['id'];

        $userTeam = UserTeam::findFirst("teamId = {$teamId} AND userId = {$userId}");
        if (!$userTeam) $this->jsonView('提交数据有误', 400);
        if (!$userTeam->delete()) $this->jsonView('删除失败', 500);

        $this->jsonView('SUCCESS', 200);
    }
}