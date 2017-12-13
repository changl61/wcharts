<?php

class AuthController extends ControllerBase
{
    public function initialize()
    {
        parent::initialize();
        $this->tag->setTitle('登录');
    }

    public function indexAction()
    {
        $this->dispatcher->forward([
            "controller" => "auth",
            "action"     => "login"
        ]);
    }

    // ====================================
    //  用户登录
    // ====================================
    public function loginAction()
    {
        if ($this->request->isPost()) {
            return $this->login();
        }
    }

    protected function login()
    {
        $name = $this->request->getPost('name');
        $password = $this->request->getPost('password');
        $user = User::findFirst([
            "name = :name: AND role IN ('admin', 'user')",
            "bind" => ['name' => $name],
        ]);

        // 验证
        if (!$user) $this->jsonView('用户不存在', 403);
        if ($user->status == 0) $this->jsonView('您的使用权限已被管理员收回', 403);
        if ($user->password != md5($password)) $this->jsonView('密码错误, 请检查', 403);

        // 记录登录时间
        $user->loginTime = date('Y-m-d h:i:s', time());
        $user->save();

        // 会话控制
        User::toSession($user);
        $esCluster = EsCluster::getUsing();
        EsCluster::toSession($esCluster);

        $this->jsonView('SUCCESS', 200, [
            'hasTeamAccounts' => $this->hasTeamAccounts(),
            'hasEsCluster' => $this->hasEsCluster(),
        ]);
    }

    protected function welcome($userName)
    {
        // 用户登记
        $user = User::findFirst("name = '{$userName}' AND role = 'user'");
        if (!$user) {
            $user = new User();
            $user->name = $userName;
        }
        $user->loginTime = date('Y-m-d h:i:s', time());
        $user->save();

        // 会话控制
        User::toSession($user);
        $esCluster = EsCluster::getUsing();
        EsCluster::toSession($esCluster);

        return $this;
    }

    protected function hasTeamAccounts()
    {
        return count(UserTeam::getMyTeams()) > 0;
    }

    protected function hasEsCluster()
    {
        return !!EsCluster::fromSession()['id'];
    }

    // ====================================
    //  新用户-设置ES地址
    // ====================================
    public function esAction()
    {
        if (EsCluster::fromSession()['id']) $this->response->redirect("setting/es");

        // 模版传值
        $this->view->setVars([
            'hasTeamAccount' => !!UserTeam::getMyTeams(),
        ]);
    }

    // ====================================
    //  退出登录
    // ====================================
    public function logoutAction()
    {
        $this->session->destroy();
        $this->response->redirect("auth/login");
    }

    // ====================================
    //  切换账号
    // ====================================
    public function switchAction($id)
    {
        $id = (int)$id;
        if ($id == User::fromSession()['prototype']['id']) {
            $user = (object) User::fromSession()['prototype'];
        } else {
            $user = UserTeam::getTeam($id);
            if (empty($user)) $this->jsonView('参数错误', 400);
        }

        // 会话控制
        User::toSessionWhenSwitch($user);
        $esCluster = EsCluster::getUsing();
        EsCluster::toSession($esCluster);

        // 没有设置ES集群
        if (!$esCluster) {
            $this->jsonView('已切换至"'.User::fromSession()['name'].'"', 302, ['redirectUrl' => '/auth/es']);
        } else {
            $this->jsonView('已切换至"'.User::fromSession()['name'].'"', 302, ['redirectUrl' => '/setting/es']);
        }
    }
}