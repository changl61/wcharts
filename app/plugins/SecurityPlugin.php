<?php

use Phalcon\Events\Event;
use Phalcon\Mvc\User\Plugin;
use Phalcon\Mvc\Dispatcher;

class SecurityPlugin extends Plugin
{
    // 访问控制列表
    private static $acl = [
        'auth' => ['index', 'login', 'logout', 'es', 'switch'],
        'errors' => ['show403', 'show404', 'show500'],
        'index' => ['index'],
        'dashboard' => ['index', 'detail', 'create', 'save', 'delete', 'saveGrid'],
        'chart' => ['index' , 'detail', 'create', 'update', 'delete', 'copy', 'move'],
        'query' => ['index', 'detail', 'create', 'delete', 'save', 'builder', 'table'],
        'share' => ['detail', 'search', 'create', 'update', 'delete'],
        'setting' => ['index', 'es', 'query', 'saveGroup', 'deleteGroup', 'dashboard', 'saveDashboardGroup',
            'deleteDashboardGroup', 'share', 'team', 'teamUser', 'ui'
        ],
        'team' => ['create', 'update', 'delete', 'quit', 'accounts', 'createUser', 'updateUser', 'deleteUser'],
        'es' => ['cluster', 'index', 'switch', 'statistics', 'search'],
        'option' => ['user', 'esTypes', 'esMapping', 'dashboard'],
    ];

    /**
     * 路由分派前--访问控制
     *
     * @param  Event $event
     * @param  Dispatcher $dispatcher
     * @return bool
     */
    public function beforeDispatch(Event $event, Dispatcher $dispatcher)
    {
        $user = User::fromSession();
        $controller = $dispatcher->getControllerName();
        $action = $dispatcher->getActionName();

        // 如果资源不存在
        if (!self::isResource($controller, $action)) {
            $dispatcher->forward([
                'controller' => 'errors',
                'action'     => 'show404'
            ]);

            return false;
        }

        // 如果资源不允许操作
        if (!self::isAllowed($controller, $action, $user['role'])) {

            if ($user['role'] == 'guest') {
                $dispatcher->forward([
                    'controller' => 'auth',
                    'action'     => 'login'
                ]);
            }

            else {
                $dispatcher->forward([
                    'controller' => 'errors',
                    'action'     => 'show403'
                ]);
            }

            return false;
        }
    }

    private static function isResource($controller, $action)
    {
        return !!Privilege::findFirst("controller = '{$controller}' AND action = '{$action}'");
    }

    private static function isAllowed($controller, $action, $role)
    {
        $privilege = Privilege::findFirst("controller = '{$controller}' AND action = '{$action}' AND role = '{$role}'");
        return $privilege && $privilege->accessible == 'yes';
    }
}
