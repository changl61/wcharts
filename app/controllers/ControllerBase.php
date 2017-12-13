<?php

use Phalcon\Mvc\Controller;
use Phalcon\Http\Response;

class ControllerBase extends Controller
{

    protected function initialize()
    {
        $this->tag->prependTitle('wcharts-');
        $this->view->setVar("controller", $this->dispatcher->getControllerName());
        $this->view->setVar("action", $this->dispatcher->getActionName());
        $this->view->setVar("userRole", User::fromSession()['role']);
    }

    public function jsonView($msg, $status = 200, $data = [])
    {
        $response = new Response();
        $response->setHeader("Content-Type", "application/json; charset=utf-8");
        $response->setStatusCode($status);
        $response->setJsonContent([
            'data' => $data,
            'status' => $status,
            'msg' => $msg,
        ]);

        $response->send();
        exit;
    }
}