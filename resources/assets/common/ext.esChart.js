//============================================
//  jQuery对象级插件 -- ES图表(基于eCharts)
//============================================
(function (window, $, _) {
    // 定义构造函数
    var EsChart = function($element, options) {
        this.$element = [];
        this.settings = {};
        this.enabled = false;

        this.echart = {};
        this.builder = {};

        this.initialize($element, options);
    };

    // 初始化方法
    EsChart.prototype = {
        defaults: {
            format: 'line',  // 形式
            url: '',         // 数据链接
            theme: 'dark',   // 主题
            loadingStart: function () {},  // 加载开始
            loadingDone: function () {},   // 加载结束
            $scopeRange: [],               // 时间范围
        },

        initialize: function($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend(true, {}, this.defaults, this.$element.data(), options);
            this.enabled = true;

            return this._render();
        },

        destroy: function () {
            this.$element.empty();
            this.$element.data('instance.esChart', '');
        },

        setUrl: function (url) {
            this.settings.url = url;
            return this;
        },

        refresh: function (clear) {
            if (!this.settings.url) return this;

            var self = this;

            if (typeof this.settings.loadingStart == 'function') this.settings.loadingStart();
            $.http.get(this.settings.url, {}, {
                success: function (data) {
                    clear ? self.echart.clearThenDraw(data) : self.echart.draw(data);
                    if (self.settings.$scopeRange.length) self.settings.$scopeRange.text(data.scope.range);
                },

                error: function (data, status, msg) {
                    $.message.warn(msg);
                },

                complete: function () {
                    if (typeof self.settings.loadingDone == 'function') self.settings.loadingDone();
                },
            });

            return this;
        },

        resize: function () {
            this.echart.instance.resize();
        },

        _render: function () {
            var element = this.$element[0], theme = this.settings.theme;
            switch (this.settings.format) {
                case 'line'  : this.echart = new LineChart(element, theme); break;
                case 'bar'   : this.echart = new BarChart(element, theme); break;
                case 'pie'   : this.echart = new PieChart(element, theme); break;
                case 'panel' : this.echart = new PanelChart(element, theme); break;
                case 'radar' : this.echart = new RadarChart(element, theme); break;
                case 'table' : this.echart = new TableChart(element, theme); break;
            }

            return this.refresh();
        },
    };


    // ES图表 - 折线图
    var LineChart = function (element, theme) {
        this.instance = {};  // echart 实例
        this.option = {};    // echart 配置
        this._initialized = false;

        return this.initialize(element, theme).draw({x:[], lines:[]});
    };
    LineChart.prototype = {
        _defaultOption: {
            title:   {text:'折线图示例', show: false},
            tooltip: {trigger:'axis',},
            legend:  {data:[/*'销量'*/], bottom:0},
            grid:    {left:'12px', right:'12px', bottom:'11%', top:'12px', containLabel:true},
            xAxis :  {type:'category', data:[/*'周一','周二','周三','周四','周五','周六','周日'*/]},
            yAxis :  {type:'value', axisLabel:{}},
            series : [], //[{name:'销量', type:'line', data:[120, 132, 101, 134, 90, 230, 210]}]
        },

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.instance = echarts.init(element, theme);

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            this.instance.clear(); // 清空
            this.draw(data);

            return this;
        },

        draw: function (data) {
            this._setOption(data);
            this.instance.setOption(this.option);

            return this;
        },

        _setOption: function (data) {
            this.option = $.extend(true, {}, this._defaultOption);
            this.option.yAxis.axisLabel.formatter = this._axisLabelFormatter;
            this.option.xAxis.data = data.x;

            for (var i = 0; i < data.lines.length; i++) {
                var item = data['lines'][i];

                this.option.series.push({
                    name: item.name,
                    type: 'line',
                    data: item.value,
                });

                this.option.legend.data.push(item.name);
            }

            return this;
        },

        _axisLabelFormatter: function (value, index) {
            if (value >= 100000000) {
                value = value/100000000 + '亿';
            } else if (value >= 10000) {
                value = value/10000 + '万';
            }

            return value;
        },
    };


    // ES图表 - 条形图
    var BarChart = function (element, theme) {
        this.instance = {};  // echart 实例
        this.option = {};    // echart 配置
        this._initialized = false;

        return this.initialize(element, theme).draw({x:[], bar: null});
    };
    BarChart.prototype = {
        _defaultOption: {
            title:   {text:'条形图示例', show: false},
            tooltip: {},
            legend:  {data:[/*'销量'*/], bottom:0, show:false},
            grid:    {left:'12px', right:'12px', bottom:'11%', top:'12px', containLabel:true},
            xAxis :  {type:'category', boundaryGap:true, axisLabel:{interval:0, rotate:-45, margin:10}, data:[/*'周一','周二','周三','周四','周五','周六','周日'*/]},
            yAxis :  {type:'value', axisLabel:{}},
            series : [], //[{name:'销量', type:'var', data:[120, 132, 101, 134, 90, 230, 210]}]
        },

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.instance = echarts.init(element, theme);

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            this.instance.clear(); // 清空
            this.draw(data);

            return this;
        },

        draw: function (data) {
            this._setOption(data);
            this.instance.setOption(this.option);

            return this;
        },

        _setOption: function (data) {
            this.option = $.extend(true, {}, this._defaultOption);
            this.option.yAxis.axisLabel.formatter = this._axisLabelFormatter;
            this.option.xAxis.data = data.x;

            if (data.bar) {
                this.option.series.push({
                    name: data.bar.name,
                    data: data.bar.value,
                    type: 'bar',
                    barWidth: '60%',
                });
                this.option.legend.data.push(data.bar.name);
            }

            return this;
        },

        _axisLabelFormatter: function (value, index) {
            if (value >= 100000000) {
                value = value/100000000 + '亿';
            } else if (value >= 10000) {
                value = value/10000 + '万';
            }

            return value;
        },
    };


    // ES图表 - 饼状图
    var PieChart = function (element, theme) {
        this.instance = {};  // echart 实例
        this.option = {};    // echart 配置
        this._initialized = false;

        return this.initialize(element, theme).draw({x:[], pie: null});
    };
    PieChart.prototype = {
        _defaultOption: {
            title : {text:'饼状图示例', show:false},
            tooltip: {trigger:'item', formatter:"{a} <br/>{b} : {c} ({d}%)"},
            legend: {orient:'horizontal', bottom: 0, data:[/*'直接访问'*/]},
            series : [
                /*{
                 type: 'pie',
                 radius : '50%',
                 center: ['50%', '60%'],
                 itemStyle: {emphasis: {shadowBlur:10, shadowOffsetX:0, shadowColor:'rgba(0, 0, 0, 0.5)'}},
                 name: '访问来源',
                 data:[{value:335, name:'直接访问'}],
                 }*/
            ]
        },

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.instance = echarts.init(element, theme);

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            this.instance.clear(); // 清空
            this.draw(data);

            return this;
        },

        draw: function (data) {
            this._setOption(data);
            this.instance.setOption(this.option);

            return this;
        },

        _setOption: function (data) {
            this.option = $.extend(true, {}, this._defaultOption);

            if (data.pie) {
                var values = [];

                for (var j = 0; j < data.pie.value.length; j++) {
                    values.push({
                        value:data.pie.value[j],
                        name:data.x[j],
                    });
                }

                this.option.series.push({
                    name: data.pie.name,
                    data: values,
                    type: 'pie',
                    //radius : '70%',
                    radius : ['20%', '70%'],
                    center: ['50%', '50%'],
                    itemStyle: {emphasis: {shadowBlur:10, shadowOffsetX:0, shadowColor:'rgba(0, 0, 0, 0.5)'}},
                });
            }

            return this;
        },

        _axisLabelFormatter: function (value, index) {
            if (value >= 100000000) {
                value = value/100000000 + '亿';
            } else if (value >= 10000) {
                value = value/10000 + '万';
            }

            return value;
        },
    };


    // ES图表 - 仪表盘
    var PanelChart = function (element, theme) {
        this.instance = {};  // echart 实例
        this.option = {};    // echart 配置
        this._initialized = false;

        return this.initialize(element, theme).draw({});
    };
    PanelChart.prototype = {
        _defaultOption: {
            title : {text:'仪表盘示例', show:false},
            tooltip : {formatter: "{b} : {c}"},
            series: [
                {
                    type: 'gauge', axisLabel: {}, axisTick:{lineStyle:{color: 'auto'}}, splitLine: {length: 14, lineStyle:{color: 'auto'}}, radius: '100%', center: ['50%', '57%'],
                    axisLine: {lineStyle: {width: 10, color:[[0.2, '#1aa844'], [0.8, '#0098d9'], [1, '#ff715e']]}},
                    title: {offsetCenter:[0, '30%'], color:'#ddd'},
                    detail: {offsetCenter:[0, '50%'], textStyle: {fontSize: 16}},
                    data: [{value: 0}]
                }
            ]
        },

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.instance = echarts.init(element, theme);
            this._setOption({});

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            this.instance.clear(); // 清空
            this._setOption({});
            this.draw(data);

            return this;
        },

        draw: function (data) {
            this._setOptionAboutPanel(data);
            this.instance.setOption(this.option);

            return this;
        },

        _setOption: function (data) {
            this.option = $.extend(true, {}, this._defaultOption);
            this.option.series[0].axisLabel.formatter = this._axisLabelFormatter;
            this.option.series[0].detail.formatter = this._detailFormatter;
            return this._setOptionAboutPanel(data);
        },

        _setOptionAboutPanel: function (data) {
            if (data.min) this.option.series[0].min = data.min;
            if (data.max) this.option.series[0].max = data.max;
            this.option.series[0].data[0].value = data.value || 0;
            this.option.series[0].data[0].name = data.name || 0;

            return this;
        },

        _axisLabelFormatter: function (value, index) {
            if (value >= 100000000) {
                value = value/100000000 + '亿';
            } else if (value >= 10000) {
                value = value/10000 + '万';
            }

            return value;
        },

        _detailFormatter: function (value, index) {
            if (value >= 100000000) {
                value = (value/100000000).toFixed(2) + '亿';
            } else if (value >= 10000) {
                value = (value/10000).toFixed(2) + '万';
            } else if ((''+value).length >= 8) {
                value = value.toFixed(4);
            }

            return value;
        },
    };


    // ES图表 - 雷达图
    var RadarChart = function (element, theme) {
        this.instance = {};  // echart 实例
        this.option = {};    // echart 配置
        this._initialized = false;

        return this.initialize(element, theme).draw({indicators: []});
    };
    RadarChart.prototype = {
        _defaultOption: {
            title : {text:'雷达图示例', show:false},
            tooltip: {trigger: 'axis'},
            radar : {
                shape: 'circle',
                indicator:[{ name: '-', max: 100}],
                splitArea:{show: false},
                splitLine:{lineStyle: {color: ['#333', '#444', '#555', '#666', '#777', '#888', '#999']}},
                axisLine: {lineStyle: {color: '#999'}},
            },
            series: [{
                type: 'radar',
                tooltip: {trigger: 'item'},
                itemStyle: {normal: {areaStyle: {type: 'default'}}},
                data: [{
                    value : [0],
                }],
            }],
        },

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.instance = echarts.init(element, theme);

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            this.instance.clear(); // 清空
            this.draw(data);

            return this;
        },

        draw: function (data) {
            this._setOption(data);
            this.instance.setOption(this.option);

            return this;
        },

        _setOption: function (data) {
            this.option = $.extend(true, {}, this._defaultOption);
            var indicators = [], value = [];

            for (var i = 0; i < data.indicators.length; i++) {
                var indicator = data.indicators[i];

                indicators.push({
                    name: indicator.name,
                    max: Math.max(indicator.max, indicator.value),
                });

                value.push(indicator.value);
            }

            if (data.indicators.length) {
                this.option.radar.indicator = indicators;
                this.option.series[0].data[0].value = value;
            }

            return this;
        },
    };


    // ES图表 - 表格
    var TableChart = function (element, theme) {
        this.$element = [];
        this.instance = this;  // table 实例
        this._initialized = false;

        return this.initialize(element, theme);
    };
    TableChart.prototype = {
        _defaultOption: {},
        template: '<table class="table-chart"width="100%"><tr><th><%=table.row[0].field%>&nbsp;\\&nbsp;<%=table.col[0].field%></th><%_.each(table.col,function(col,c){%><th><%=col.value%><i>&nbsp;(<%=col.operator.split("_")[1]%>)</i></th><%})%></tr><%_.each(table.row,function(row,r){%><tr><%_.each(table.col,function(col,c){%><%if(!c){%><th><%=row.value%><i>&nbsp;(<%=row.operator.split("_")[1]%>)</i></th><%}%><td><%=value[r+"-"+c]%></td><%})%></tr><%})%></table>',

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.$element = $(element);
            this.$element.addClass('table-chart-' + theme);

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            return this.draw(data);
        },

        draw: function (data) {
            if (!data) return this._showBlank();

            var table = _.template(this.template)(data);
            this.$element.html(table);

            return this;
        },

        _showBlank: function () {
            this.$element.find('td').text('');
            return this;
        },

        resize: function () {

        },
    };


    // 成为jquery插件
    $.fn.esChart = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                instance = $this.data('instance.esChart');

            // 仅限<div>
            if ($(this)[0]['tagName'] != 'DIV') return;

            // 创建对象并缓存
            if (!instance) {
                if (option == 'destroy') return; // 无需创建
                instance = new EsChart($this, options);
                $this.data('instance.esChart', instance);
            }

            // 执行方法
            if (typeof option == 'string') instance[option](param);
        });
    };
})(window, $, _);