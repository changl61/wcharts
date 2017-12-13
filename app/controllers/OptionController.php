<?php

class OptionController extends ControllerBase
{
    public function initialize()
    {
        $this->tag->setTitle('option');
        $this->view->setTemplateAfter('main');

        parent::initialize();
    }

    public function esTypesAction()
    {
        $types = [];
        $url = $this->request->get('url');
        $index = $this->request->get('index');

        $http = Http::get($url.'/'.$index.'/_mapping');
        if (!$http['error']) {
            $http['respond'] = json_decode($http['respond'], true);

            if (!empty($http['respond']) && !isset($http['respond']['error'])) {
                $firstIndex = current($http['respond']);
                foreach ($firstIndex['mappings'] as $type => $value) {
                    if ($type != '_default_') {
                        $types[] = $type;
                    }
                }
            }
        }

        $this->jsonView('SUCCESS', 200, $types);
    }

    public function esMappingAction()
    {
        $mapping = [];

        $url = $this->request->get('url');
        $index = $this->request->get('index');
        $type = $this->request->get('type');

        // 查询映射
        if ($url && $index && $type) $mapping = ElasticSearch::queryMapping($url, $index, $type);

        $this->jsonView('SUCCESS', 200, $mapping);
    }

    public function dashboardAction($groupId)
    {
        $groupId = (int)$groupId;

        $group = DashboardGroup::findFirst("id = {$groupId}");
        if ($group->clusterId != EsCluster::fromSession()['id']) $this->jsonView('SUCCESS', 200, []);

        $this->jsonView('SUCCESS', 200, Dashboard::find("groupId = {$groupId}")->toArray());
    }
}