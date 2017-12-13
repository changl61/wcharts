<?php

/**
 * --------------------------------
 * ES 查询功能封装
 * --------------------------------
 * 1.lien, 得到折线图数据
 * 2.bar, 得到"条形图"数据
 * 3.pie, 得到饼状图数据
 * 4.query, 表格形式展示数据
 * 5.过滤条件转化为ES查询语法
 * 6.杂碎的功能
 */
class ElasticSearch
{
    private $api;       // ES API
    private $builder;   // 图表构造器

    private $respond;   // 查询结果
    private $data;      // 图表数据
    private $error;     // 错误信息

    /**
     * 构造函数, 初始化赋值
     * @param $index   string
     * @param $type    string
     * @param $builder array
     */
    public function __construct($url, $index, $builder)
    {
        $this->api = $url.'/'.$index.'/_search?';
        $this->builder = $builder;

        // 相对时间转换
        if (isset($this->builder['scope']['range']) && Utils::isRelativeTimeRangeText($this->builder['scope']['range'])) {
            $this->builder['scope']['range'] = Utils::toTimeRangText($this->builder['scope']['range']);
        }
    }

    public function getError()
    {
        return $this->error;
    }

    /**
     * 获取图表数据
     */
    public function getData()
    {
        // 时间范围
        $this->data['scope']['range'] = $this->builder['scope']['range'];
        $this->data['scope']['field'] = $this->builder['scope']['field'];

        return $this->data;
    }

    /**
     * -------------------------------------------------------
     * 查询ES, 得到折线图数据
     * -------------------------------------------------------
     */
    public function queryForLine()
    {
        // 查询
        $DSL = self::getDSLForLine($this->builder);
        $http = Http::post($this->api, $DSL);
        $this->error = $http['error'];
        $this->respond = json_decode($http['respond'], true);

        // 格式化
        $this->data = ['x'=>[], 'lines'=>[]];
        if (!$this->error) $this->data = self::formatDataForLine($this->builder, $this->respond);
    }

    /**
     * 获取折线图的DSL
     * @param $builder array
     */
    private static function getDSLForLine($builder)
    {
        $dateField = $builder['scope']['field'];
        $DSL = [
            'size'=>0,
            'sort'=>[$dateField=>['order'=>'asc']],
            'query'=>[],
            'aggs'=>['line' =>[]],
        ];

        // 时间范围
        $timeRange = Utils::toMillisecondRange($builder['scope']['range']);
        $DSL['query']['bool']['must']['range'][$dateField] = [
            'gte'=>$timeRange['start'],
            'lte'=>$timeRange['end'],
        ];

        // 按时间分桶
        $DSL['aggs']['line']['date_histogram'] = [
            'field'=>$dateField,
            'interval'=>$builder['scope']['interval'],
            //'pre_zone'=>'+08:00',
            //'pre_zone_adjust_large_interval'=>true,
            'min_doc_count'=>0,
            'extended_bounds'=>[
                'min'=>$timeRange['start'],
                'max'=>$timeRange['end'],
            ],
        ];

        // 子折线
        $childrenLine = [];
        foreach ($builder['lines'] as $child){
            $childrenLine[$child['name']] = ['bool'=>self::filtersToDSL($child['filters'])];
        }
        $DSL['aggs']['line']['aggs']['children']['filters']['filters'] = $childrenLine;

        // 统计方式
        $statics = [];
        foreach ($builder['lines'] as $child){
            if ($child['method'] != 'count') {
                $key = $child['method'].'_'.$child['field'];
                $statics[$key] = [$child['method']=>['field'=>$child['field']]];
            }
        }
        if (!empty($statics)) $DSL['aggs']['line']['aggs']['children']['aggs'] = $statics;

        return $DSL;
    }

    /**
     * 格式化ES返回数据, 方便前端渲染
     * @param $builder array
     * @param $respond array
     */
    private static function formatDataForLine($builder, $respond)
    {
        $lineBuckets = $respond['aggregations'] ? $respond['aggregations']['line']['buckets'] : [];

        // 时间轴数据
        $x = [];
        foreach ($lineBuckets as $bucket) {
            $x[] = date(self::getDateTimeFormat($builder['scope']['interval']), (int)($bucket['key']/1000));
        }
        array_shift($x);  // 删除第一个点, 这个点数据一般不准

        // Y轴数据
        $tmpLines = [];
        foreach ($lineBuckets as $bucket) {
            foreach ($builder['lines'] as $childLine) {
                $childName = $childLine['name'];
                $tmpLines[$childName][] = self::getChildValueForLine($childLine, $bucket['children']['buckets'][$childName]);
            }
        }

        $lines = [];
        foreach ($tmpLines as $name=>$value) {
            array_shift($value);  // 删除第一个点, 这个点数据一般不准
            $lines[] = ['name'=>$name, 'value'=>$value];
        }

        return ['x'=>$x, 'lines'=>$lines];
    }

    /**
     * 获取子线条统计数据
     * @param $childLine
     * @param $childBucket
     * @return int
     */
    private static function getChildValueForLine($childLine, $childBucket)
    {
        if ($childLine['method'] == 'count') {
            return $childBucket['doc_count'];
        }

        else if ($childLine['method'] == 'sum') {
            return $childBucket['sum_'.$childLine['field']]['value'];
        }

        else if ($childLine['method'] == 'avg') {
            return $childBucket['avg_'.$childLine['field']]['value'];
        }

        else if ($childLine['method'] == 'max') {
            return $childBucket['max_'.$childLine['field']]['value'];
        }

        else if ($childLine['method'] == 'min') {
            return $childBucket['min_'.$childLine['field']]['value'];
        }

        else{
            return 0;
        }
    }

    /**
     * -------------------------------------------------------
     * 查询ES, 得到"条形图"数据
     * -------------------------------------------------------
     */
    public function queryForBar()
    {
        // 查询
        $DSL = self::getDSLForBar($this->builder);
        $http = Http::post($this->api, $DSL);
        $this->error = $http['error'];
        $this->respond = json_decode($http['respond'], true);

        // 格式化
        $this->data = ['x'=>[], 'bar'=>null];
        if (!$this->error) $this->data = self::formatDataForBar($this->builder, $this->respond);
    }

    /**
     * 获取"条形图"的DSL
     * @param $builder array
     */
    private static function getDSLForBar($builder)
    {

        $DSL = [
            'size'=>0,
            'query'=>[],
            'aggs'=>['bar' =>[]],
        ];

        // 统计范围
        $filters = $builder['scope']['filters'];
        array_unshift($filters, ['field'=>$builder['scope']['field'], 'operator'=>'date_range', 'value'=>$builder['scope']['range']]);
        //$DSL['query']['filtered']['filter']['bool'] = self::filtersToDSL($filters);
        $DSL['query']['bool'] = self::filtersToDSL($filters);

        // 分类
        $statisticKey = $builder['statistic']['method'].'_'.$builder['statistic']['field'];
        $orderField = $builder['statistic']['method'] == 'count' ? '_count' : $statisticKey;
        switch ($builder['category']['bucketing']) {
            case 'Top 10' :
                $DSL['aggs']['bar']['terms']['field'] = $builder['category']['field'];
                $DSL['aggs']['bar']['terms']['size'] = 10;
                $DSL['aggs']['bar']['terms']['order'] = [$orderField=>'desc'];
                break;
            case 'Top 20' :
                $DSL['aggs']['bar']['terms']['field'] = $builder['category']['field'];
                $DSL['aggs']['bar']['terms']['size'] = 20;
                $DSL['aggs']['bar']['terms']['order'] = [$orderField=>'desc'];
                break;
            case 'Bottom 10' :
                $DSL['aggs']['bar']['terms']['field'] = $builder['category']['field'];
                $DSL['aggs']['bar']['terms']['size'] = 10;
                $DSL['aggs']['bar']['terms']['order'] = [$orderField=>'asc'];
                break;
            case 'Bottom 20' :
                $DSL['aggs']['bar']['terms']['field'] = $builder['category']['field'];
                $DSL['aggs']['bar']['terms']['size'] = 20;
                $DSL['aggs']['bar']['terms']['order'] = [$orderField=>'asc'];
                break;
            case 'Numeric ranges' :
                $DSL['aggs']['bar']['range']['field'] = $builder['category']['field'];
                $DSL['aggs']['bar']['range']['ranges'] = self::formatCategoryRangesForBar($builder['category']['ranges']);
                break;
            default :
                $DSL['aggs']['bar']['terms']['field'] = $builder['category']['field'];
                $DSL['aggs']['bar']['terms']['size'] = 10;
                $DSL['aggs']['bar']['terms']['order'] = [$orderField=>'desc'];
                break;
        }

        // 统计方式
        if ($builder['statistic']['method'] != 'count') {
            $DSL['aggs']['bar']['aggs'][$statisticKey] = [$builder['statistic']['method']=>['field'=>$builder['statistic']['field']]];
        }

        return $DSL;
    }

    /**
     * 获取子线条统计数据
     * @param  $childLine
     * @param  $childBucket
     * @return array
     */
    private static function formatDataForBar($builder, $respond)
    {
        $barBuckets = $respond['aggregations'] ? $respond['aggregations']['bar']['buckets'] : [];

        // X轴数据
        $x = [];
        foreach ($barBuckets as $bucket) {
            $x[] = $bucket['key'];
        }

        // Y轴数据
        $name = $builder['statistic']['method'] == 'count' ? 'count' : $builder['statistic']['method'].' of '.$builder['statistic']['field'];

        $bar = ['name'=>$name, 'value'=>[]];
        foreach ($barBuckets as $bucket) {
            $bar['value'][] = self::getCategoryValueForBar($builder['statistic'], $bucket);
        }

        // 显示"其它"
        if ($respond['aggregations'] && $builder['statistic']['method'] == 'count' && isset($respond['aggregations']['bar']['sum_other_doc_count'])) {
            $x[] = '其它';
            $bar['value'][] = $respond['aggregations']['bar']['sum_other_doc_count'];
        }

        return ['x'=>$x, 'bar'=>$bar];
    }

    private static function getCategoryValueForBar($statistic, $bucket)
    {
        if ($statistic['method'] == 'count') {
            return $bucket['doc_count'];
        }

        else {
            $statisticKey = $statistic['method'].'_'.$statistic['field'];
            return $bucket[$statisticKey]['value'];
        }
    }

    /**
     * 格式化自定义分类范围, 使之符合"ES Range Aggregation"
     * @param  $originRanges
     * @return array
     */
    private static function formatCategoryRangesForBar($originRanges)
    {
        $ranges = [];

        foreach ($originRanges as $item) {
            $item['key'] = $item['from'].'~'.$item['to'];
            if ($item['from'] == '*') unset($item['from']);
            if ($item['to'] == '*') unset($item['to']);

            $ranges[] = $item;
        }

        return $ranges;
    }

    /**
     * -------------------------------------------------------
     * 查询ES, 得到饼状图数据
     * -------------------------------------------------------
     */
    public function queryForPie()
    {
        // 查询 - 同于条形图
        $DSL = self::getDSLForBar($this->builder);
        $http = Http::post($this->api, $DSL);
        $this->error = $http['error'];
        $this->respond = json_decode($http['respond'], true);

        // 格式化 - 同于条形图
        $this->data = ['x'=>[], 'pie'=>null];
        $data = self::formatDataForBar($this->builder, $this->respond);
        $data['pie'] = $data['bar'];
        unset($data['bar']);

        if (!$this->error) $this->data = $data;
    }

    /**
     * -------------------------------------------------------
     * 查询ES, 得到饼状图数据
     * -------------------------------------------------------
     */
    public function queryForPanel()
    {
        // 查询 - 同于条形图
        $DSL = self::getDSLForPanel($this->builder);
        $http = Http::post($this->api, $DSL);
        $this->error = $http['error'];
        $this->respond = json_decode($http['respond'], true);

        $this->data = [
            'min'=> $this->builder['panel']['min'],
            'max'=> $this->builder['panel']['max'],
            'value' => 0,
            'name' => $this->builder['statistic']['method'] == 'count'
                ? 'count' : $this->builder['statistic']['method'].' of '.$this->builder['statistic']['field'],
        ];

        if (!$this->error) $this->data['value'] = self::formatDataForPanel($this->builder, $this->respond);
    }

    private static function getDSLForPanel($builder)
    {
        $DSL = [
            'size'=>0,
            'query'=>[],
        ];

        // 统计范围
        $filters = $builder['scope']['filters'];
        array_unshift($filters, ['field'=>$builder['scope']['field'], 'operator'=>'date_range', 'value'=>$builder['scope']['range']]);
        $DSL['query']['bool'] = self::filtersToDSL($filters);

        // 取值
        $statisticKey = $builder['statistic']['method'].'_'.$builder['statistic']['field'];
        if ($builder['statistic']['method'] != 'count') {
            $DSL['aggs'][$statisticKey] = [$builder['statistic']['method']=>['field'=>$builder['statistic']['field']]];
        }

        return $DSL;
    }

    private static function formatDataForPanel($builder, $respond)
    {
        if ($builder['statistic']['method'] == 'count') {
            return $respond['hits']['total'];
        } else {
            $statisticKey = $builder['statistic']['method'].'_'.$builder['statistic']['field'];
            return $respond['aggregations'] ?  $respond['aggregations'][$statisticKey]['value'] : 0;
        }
    }


    /**
     * -------------------------------------------------------
     * 查询ES, 得到雷达图数据
     * -------------------------------------------------------
     */
    public function queryForRadar()
    {
        // 查询 - 同于条形图
        $DSL = self::getDSLForRadar($this->builder);
        $http = Http::post($this->api, $DSL);
        $this->error = $http['error'];
        $this->respond = json_decode($http['respond'], true);

        $this->data = [
            'indicators' => [],
        ];

        if (!$this->error) $this->data['indicators'] = self::formatDataForRadar($this->builder, $this->respond);
    }

    private static function getDSLForRadar($builder)
    {
        $DSL = [
            'size'=>0,
            'query'=>[],
        ];

        // 统计范围
        $filters = $builder['scope']['filters'];
        array_unshift($filters, ['field'=>$builder['scope']['field'], 'operator'=>'date_range', 'value'=>$builder['scope']['range']]);
        $DSL['query']['bool'] = self::filtersToDSL($filters);

        // 统计维度
        $builder['indicators'] || $builder['indicators'] = [];
        foreach ($builder['indicators'] as $indicator) {
            if ($indicator['method'] == 'count') continue;
            $statisticKey = $indicator['name'];
            $DSL['aggs'][$statisticKey] = [$indicator['method']=>['field'=>$indicator['field']]];
        }

        return $DSL;
    }

    private static function formatDataForRadar($builder, $respond)
    {
        $indicators = [];
        if (!isset($respond['hits'])) return $indicators;

        foreach ($builder['indicators'] as $indicator) {
            $name = $indicator['name'];

            if ($indicator['method'] == 'count') {
                $indicators[] = [
                    'name' => $name . '(count)',
                    'value'=> $respond['hits']['total'],
                    'max'  => (float)$indicator['max'],
                ];

            } else {
                $indicators[] = [
                    'name' => $name,
                    'value'=> $respond['aggregations'][$name] ? $respond['aggregations'][$name]['value'] : 0,
                    'max'  => (float)$indicator['max'],
                ];
            }

            $statisticKey = $indicator['name'];
            $DSL['aggs'][$statisticKey] = [$indicator['method']=>['field'=>$indicator['field']]];
        }

        return $indicators;
    }


    /**
     * -------------------------------------------------------
     * 查询ES, 得到数据表数据
     * -------------------------------------------------------
     */
    public function queryForTable()
    {
        // 查询 - 同于条形图
        $DSL = self::getDSLForTable($this->builder);
        $http = Http::post($this->api, $DSL);
        $this->error = $http['error'];

        $this->respond = json_decode($http['respond'], true);

        $this->data = ['table'=> $this->builder['table']];
        if (!$this->error) $this->data['value'] = self::formatDataForTale($this->builder, $this->respond);
    }

    private static function getDSLForTable($builder)
    {
        $DSL = [
            'size'=>0,
            'query'=>[],
        ];

        // 统计范围
        $filters = $builder['scope']['filters'];
        array_unshift($filters, ['field'=>$builder['scope']['field'], 'operator'=>'date_range', 'value'=>$builder['scope']['range']]);
        $DSL['query']['bool'] = self::filtersToDSL($filters);

        // 聚合
        $filterAggs = [];

        $col = $builder['table']['col'];
        $row = $builder['table']['row'];
        foreach ($row as $kr=>$fr) {
            foreach ($col as $kc=>$fc) {
                $filterAggs[$kr.'-'.$kc] = ['bool'=>self::filtersToDSL([$fc, $fr])];
            }
        }

        $DSL['aggs']['table']['filters']['filters'] = $filterAggs;

        // 取值
        $statisticKey = $builder['statistic']['method'].'_'.$builder['statistic']['field'];
        if ($builder['statistic']['method'] != 'count') {
            $DSL['aggs']['table']['aggs'][$statisticKey] = [$builder['statistic']['method']=>['field'=>$builder['statistic']['field']]];
        }

        return $DSL;
    }

    private static function formatDataForTale($builder, $respond)
    {
        $data = [];
        if (!$respond['aggregations']) return $data;

        $buckets = $respond['aggregations']['table']['buckets'];

        if ($builder['statistic']['method'] == 'count') {
            foreach ($buckets as $k=>$v) {
                $data[$k] = $v['doc_count'];
            }
        }

        else {
            $statisticKey = $builder['statistic']['method'].'_'.$builder['statistic']['field'];
            foreach ($buckets as $k=>$v) {
                $data[$k] = $v[$statisticKey]['value'];
            }
        }

        return $data;
    }


    /**
     * -------------------------------------------------------
     * 查询ES, 表格形式展示数据
     * -------------------------------------------------------
     */
    public function queryForQuery()
    {
        // 查询
        $DSL = self::getDSLForQuery($this->builder);
        $http = Http::post($this->api, $DSL);
        $this->error = $http['error'];
        $this->respond = json_decode($http['respond'], true);

        // 格式化
        $this->data = ['list'=>[], 'page'=>0, 'count'=>0];
        if (!$this->error) $this->data = self::formatDataForQuery($this->builder, $this->respond);
    }


    private static function getDSLForQuery($builder)
    {
        $DSL = [
            'size'=>$builder['size'],
            'from'=>$builder['from'],
            'query'=>[],
            'sort'=>[$builder['scope']['field']=>['order'=>'desc']],
        ];

        // 统计范围
        $filters = $builder['filters'];
        array_unshift($filters, ['field'=>$builder['scope']['field'], 'operator'=>'date_range', 'value'=>$builder['scope']['range']]);
        $DSL['query']['bool'] = self::filtersToDSL($filters);

        return $DSL;
    }

    private static function formatDataForQuery($builder, $respond)
    {
        $data = ['list'=>[], 'total'=>0];
        if (!isset($respond['hits'])) return $data;

        $data['total'] = $respond['hits']['total'];

        foreach ($respond['hits']['hits'] as $hit) {
            $item = $hit['_source'];
            $item['_id'] = $hit['_id'];
            $data['list'][] = $item;
        }

        return $data;
    }


    /**
     * -------------------------------------------------------
     * 导出上下文
     * -------------------------------------------------------
     */
    public function queryForText()
    {
        $text = "-----------------------------------------------------------------------------\r\n";
        $text .= "   fromhost: {$this->builder['fromhost']}\r\n";
        $text .= "   path: {$this->builder['path']}\r\n";
        $text .= "-----------------------------------------------------------------------------\r\n";

        $DSL = ['size'=>5000, 'from'=>0, '_source'=>['message', '@timestamp']];
        $DSL['query']['bool']['must'][0] = ['term'=>['fromhost'=> $this->builder['fromhost']]];
        $DSL['query']['bool']['must'][1] = ['term'=>['path'=> $this->builder['path']]];

        // 查询前5000条数据
        $DSL['sort'] = ['@timestamp'=>['order'=>'desc']];
        $DSL['query']['bool']['must'][2] = ['range'=>['@timestamp'=> ['lte'=>$this->builder['@timestamp']]]];

        $http = Http::post($this->api, $DSL);
        $this->error = $http['error'];
        $this->respond = json_decode($http['respond'], true);

        if (!$this->error) $text .= self::formatDataForText($this->builder, $this->respond, 'before');

        // 查询后5000条数据
        $DSL['sort'] = ['@timestamp'=>['order'=>'asc']];
        unset($DSL['query']['bool']['must'][2]);
        $DSL['query']['bool']['must'][2] = ['range'=>['@timestamp'=> ['gt'=>$this->builder['@timestamp']]]];

        $http = Http::post($this->api, $DSL);
        $this->error = $http['error'];
        $this->respond = json_decode($http['respond'], true);

        if (!$this->error) $text .= self::formatDataForText($this->builder, $this->respond, 'after');

        // 格式化
        $this->data = [
            'text'=>$text,
            'fileName'=>end(explode('/', $this->builder['path'])),
        ];
    }

    public function formatDataForText($builder, $respond, $position)
    {
        $log = '';
        if (!isset($respond['hits'])) return $log;

        $hits = $respond['hits']['hits'];

        while (!empty($hits)) {
            if ($position == 'before') {
                $hit = array_pop($hits);
            } else {
                $hit = array_shift($hits);
            }

            $log .= $hit['_source']['message']."\r\n\r\n";
        }

        return $log;
    }

    /**
     * -------------------------------------------------------
     * 过滤条件转化为ES查询语法
     * -------------------------------------------------------
     * @param  $filters 多个过滤条件
     * @return array    ES bool查询
     */
    private static function filtersToDSL($filters)
    {
        $bool = [];

        foreach ($filters as $filter) {
            $tmp  = explode('_', $filter['operator']);
            $format = $tmp[0];
            $operator = $tmp[1];

            switch ($format) {
                case 'string'  : $child = self::stringFilterToDSL($filter['field'], $operator, $filter['value']); break;
                case 'numeric' : $child = self::numericFilterToDSL($filter['field'], $operator, $filter['value']); break;
                case 'date'    : $child = self::dateFilterToDSL($filter['field'], $operator, $filter['value']); break;
                default : break;
            }

            $bool = array_merge_recursive($bool, $child);
        }

        return !empty($bool) ? $bool : ['must'=>[]];
    }

    /**
     * 数字类型的过滤条件转化为ES查询语法
     * @param  $field    字段
     * @param  $operator 运算符
     * @param  $value    值
     * @return array
     */
    private static function numericFilterToDSL($field, $operator, $value)
    {
        if ($operator == '=') {
            return ['must'=>[0=>['term'=>[$field=>$value]]]];
        }

        else if ($operator == '!=')
        {
            return ['must_not'=>[0=>['term'=>[$field=>$value]]]];
        }

        else if ($operator == '>=')
        {
            return ['must'=>[0=>['range'=>[$field=>['gte'=>$value]]]]];
        }

        else if ($operator == '<=')
        {
            return ['must'=>[0=>['range'=>[$field=>['lte'=>$value]]]]];
        }

        else if ($operator == '>')
        {
            return ['must'=>[0=>['range'=>[$field=>['gt'=>$value]]]]];
        }

        else if ($operator == '<')
        {
            return ['must'=>[0=>['range'=>[$field=>['lt'=>$value]]]]];
        }

        else if ($operator == 'range')
        {
            $value = Utils::explodeThenTrim('~', $value);
            return ['must'=>[0=>['range'=>[$field=>['gte'=>$value[0], 'lte'=>$value[1]]]]]];
        }

        else if ($operator == 'in')
        {
            return ['must'=>[0=>['terms'=>[$field=>Utils::explodeThenTrim(',', $value)]]]];
        }
    }

    /**
     * 字符串类型的过滤条件转化为ES查询语法
     * @param  $field    字段
     * @param  $operator 运算符
     * @param  $value    值
     * @return array
     */
    private static function stringFilterToDSL($field, $operator, $value)
    {
        if ($operator == '=') {
            return ['must'=>[0=>['term'=>[$field=>$value]]]];
        }

        else if ($operator == '!=')
        {
            return ['must_not'=>[0=>['term'=>[$field=>$value]]]];
        }

        else if ($operator == 'like')
        {
            return ['must'=>[0=>['wildcard'=>[$field=>$value]]]];
        }

        else if ($operator == 'match')
        {
            return ['must'=>[0=>['regexp'=>[$field=>$value]]]];
        }

        else if ($operator == 'in')
        {
            return ['must'=>[0=>['terms'=>[$field=>Utils::explodeThenTrim(',', $value)]]]];
        }
    }

    /**
     * 日期类型的过滤条件转化为ES查询语法
     * @param  $field    字段
     * @param  $operator 运算符
     * @param  $value    值
     * @return array
     */
    private static function dateFilterToDSL($field, $operator, $value)
    {
        if ($operator == 'at') {
            $range = self::momentToRange($value);
            return ['must'=>[0=>['range'=>[$field=>['gte'=>$range['start'], 'lte'=>$range['end']]]]]];
        }

        else if ($operator == 'range')
        {
            $range = Utils::toMillisecondRange($value);
            return ['must'=>[0=>['range'=>[$field=>['gte'=>$range['start'], 'lte'=>$range['end']]]]]];
        }
    }

    /**
     * -------------------------------------------------------
     * 查询ES, 得到映射关系
     * -------------------------------------------------------
     * @param $index string
     * @param $type  string
     */
    public static function queryMapping($url, $index, $type)
    {
        $properties = [];

        $http = Http::get($url.'/'.$index.'/'.$type.'/_mapping');
        if (!$http['error']) {
            $http['respond'] = json_decode($http['respond'], true);

            if (!empty($http['respond']) && !isset($http['respond']['error'])) {
                $firstIndex = current($http['respond']);
                unset($firstIndex['mappings'][$type]['properties']['@version']);

                $properties = $firstIndex['mappings'][$type]['properties'];
            }
        }

        return self::formatMapping($properties);
    }

    /**
     * 处理字段映射
     * @param $interval string 统计粒度
     */
    private static function formatMapping($properties)
    {
        $mapping = [];

        self::setMapping($mapping, $properties);

        return $mapping;
    }

    private static function setMapping(&$mapping, $properties, $parentField = '')
    {
        foreach ($properties as $field=>$property) {
            if (isset($property['properties']) && $property['properties']) {
                self::setMapping($mapping, $property['properties'], $field);
            }

            else if (isset($property['type']) && $property['type']) {
                $field = $parentField ? $parentField.'.'.$field : $field;
                $mapping[$field] = self::getMappingType($property['type']);
                if (isset($property['fields']) && $property['fields']) {
                    self::setMapping($mapping, $property['fields'], $field);
                }
            }
        }
    }

    private static function getMappingType($type)
    {
        switch ($type) {
            case 'date'   : $type = 'date';    break;
            case 'string' : $type = 'string';  break;
            case 'keyword': $type = 'string';  break;
            case 'text'   : $type = 'string';  break;
            case 'long'   : $type = 'numeric'; break;
            case 'short'  : $type = 'numeric'; break;
            case 'integer': $type = 'numeric'; break;
            case 'double' : $type = 'numeric'; break;
            case 'float'  : $type = 'numeric'; break;
            default       : $type = 'string';  break;
        }

        return $type;
    }

    /**
     * -------------------------------------------------------
     * 查询ES, 得到映射关系
     * -------------------------------------------------------
     * 不同的统计粒度显示不同的日期格式
     * @param $interval string 统计粒度
     */
    private static function getDateTimeFormat($interval)
    {
        $dateTimeFormat = [
            '1M' => 'Y-m',
            '1w' => 'Y-m-d',
            '1d' => 'Y-m-d',
            '12h' => 'm-d H:i',
            '6h' => 'm-d H:i',
            '2h' => 'm-d H:i',
            '1h' => 'm-d H:i',
            '1h' => 'm-d H:i',
            '30m' => 'm-d H:i',
            '15m' => 'm-d H:i',
            '10m' => 'm-d H:i',
            '5m' => 'H:i',
            '2m' => 'H:i',
            '1m' => 'H:i',
            '30s' => 'H:i:s',
            '15s' => 'H:i:s',
            '10s' => 'H:i:s',
            '5s' => 'i:s',
            '2s' => 'i:s',
            '1s' => 'i:s',
        ];

        return $dateTimeFormat[$interval] ? $dateTimeFormat[$interval] : 'm-d H:i:s';
    }


    private static function momentToRange($moment)
    {
        $range = ['start'=>0, 'end'=>0];
        $month  = '([0-9]{4})\-([0-9]{2})';
        $day    = $month.'\-([0-9]{2})';
        $hour   = $day.' ([0-9]{2})';
        $minute = $hour.'\:([0-9]{2})';
        $second = $minute.'\:([0-9]{2})';

        if (preg_match('/^'.$month.'$/', $moment)) {
            $range['start'] = strtotime($moment);
            $range['end'] = strtotime('+1 month', $range['start'])*1000 - 1;
            $range['start'] *= 1000;

        } else if (preg_match('/^'.$day.'$/', $moment)) {
            $range['start'] = strtotime($moment);
            $range['end'] = strtotime('+1 day', $range['start'])*1000 - 1;
            $range['start'] *= 1000;

        } else if (preg_match('/^'.$hour.'$/', $moment)) {
            $range['start'] = strtotime($moment.':00');
            $range['end'] = strtotime('+1 hour', $range['start'])*1000 - 1;
            $range['start'] *= 1000;

        } else if (preg_match('/^'.$minute.'$/', $moment)) {
            $range['start'] = strtotime($moment);
            $range['end'] = strtotime('+1 minute', $range['start'])*1000 - 1;
            $range['start'] *= 1000;

        } else if (preg_match('/^'.$second.'$/', $moment)) {
            $range['start'] = strtotime($moment)*1000;
            $range['end'] = $range['start'] + 999;
        }

        return $range;
    }
}