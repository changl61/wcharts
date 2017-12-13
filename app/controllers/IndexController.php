<?php

class IndexController extends ControllerBase
{
    public function initialize()
    {
        $this->tag->setTitle('index');
        parent::initialize();
    }

    public function indexAction()
    {
        $this->dispatcher->forward([
            "controller" => "dashboard",
            "action"     => "index"
        ]);
    }
}