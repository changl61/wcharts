<?php

class FileController extends ControllerBase
{
    public function initialize()
    {
        $this->tag->setTitle('dashboard');

        parent::initialize();
    }

    public function indexAction()
    {

    }

    public function uploadAction()
    {
        if ($this->request->hasFiles()) {

            $this->jsonView($_FILES);
        }
    }
}