//============================================
//  jQuery对象级插件 -- ES图表构造器
//============================================
(function (window, $, _) {
    // 定义构造函数
    var EsChartBuilder = function($element, options) {
        this.$builder = [];
        this.$element = [];
        this.settings = {};
        this.enabled = false;

        this.model = {};
        this.builder = {};

        this.initialize($element, options);
    };

    // 初始化方法
    EsChartBuilder.prototype = {
        defaults: {
            format: 'line',  // 形式
            mapping: {},     // 字段映射
        },
        form: '<form class="form-horizontal unit-form es-chart-builder"></form>',

        initialize: function($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend(true, {}, this.defaults, this.$element.data(), options);
            this.enabled = true;

            this.model = this.$element.val() ? JSON.parse(this.$element.val()) : {};

            return this._render();
        },

        destroy: function () {
            this.$builder.empty().remove();
            this.$element.data('instance.esChartBuilder', '');
        },

        validate: function () {
            var errorNum = 0;
            $('input:text', this.$builder).each(function () {
                if (!$(this).val()) {
                    errorNum++;
                    if (errorNum == 1) $(this).focus();
                }
            });
            if (errorNum) $.message.warn('有'+errorNum+'项为空, 请按提示填写');

            if (this.settings.format == 'table') {
                if (!$('input[name="table.col"]', this.$builder).esFilter().val().length) {
                    $.message.warn('表格至少定义一列'); return false;
                }

                if (!$('input[name="table.row"]', this.$builder).esFilter().val().length) {
                    $.message.warn('表格至少定义一行'); return false;
                }
            }

            return errorNum ? false : true;
        },

        // 获取值
        getValue: function () {
            return this.builder.getValue();
        },

        toString: function () {
            this.$element.val(JSON.stringify(this.getValue()));
        },

        _render: function () {
            this.$element.after(this.form);
            this.$builder = this.$element.siblings('form.es-chart-builder');

            help.mapping = this.settings.mapping;
            switch (this.settings.format) {
                case 'line':  this.builder = new LineBuilder(this.model, this.$builder); break;
                case 'bar':   this.builder = new BarBuilder(this.model, this.$builder); break;
                case 'pie':   this.builder = new PieBuilder(this.model, this.$builder); break;
                case 'panel': this.builder = new PanelBuilder(this.model, this.$builder); break;
                case 'radar': this.builder = new RadarBuilder(this.model, this.$builder); break;
                case 'table': this.builder = new TableBuilder(this.model, this.$builder); break;
                default     : break;
            }

            return this;
        },
    };

    // 辅助方法
    var help = {
        mapping: {},
        methods: {
            count: {text:'计数', types: []},
            sum:   {text:'求和', types: ['numeric']},
            avg:   {text:'平均', types: ['numeric']},
            max:   {text:'最大值', types: ['numeric']},
            min:   {text:'最小值', types: ['numeric']},
        },
        intervals: [
            {value:'1M'  ,seconds:2592000 ,text:'月', default: true,},
            {value:'1w'  ,seconds:604800  ,text:'周', default: true,},
            {value:'1d'  ,seconds:86400   ,text:'天', default: true,},
            {value:'12h' ,seconds:43200   ,text:'12小时',},
            {value:'6h'  ,seconds:21600   ,text:'6小时', },
            //{value:'2h'  ,seconds:7200    ,text:'2小时', },
            {value:'1h'  ,seconds:3600    ,text:'小时', default: true,},
            {value:'30m' ,seconds:1800    ,text:'30分钟',},
            {value:'15m' ,seconds:900     ,text:'15分钟',},
            {value:'10m' ,seconds:600     ,text:'10分钟',},
            {value:'5m'  ,seconds:300     ,text:'5分钟', },
            //{value:'2m'  ,seconds:120     ,text:'2分钟', },
            {value:'1m'  ,seconds:60      ,text:'分钟', default: true,},
            {value:'30s' ,seconds:30      ,text:'30秒钟',},
            {value:'15s' ,seconds:15      ,text:'15秒钟',},
            {value:'10s' ,seconds:10      ,text:'10秒钟',},
            {value:'5s'  ,seconds:5       ,text:'5秒钟', },
            //{value:'2s'  ,seconds:2       ,text:'2秒钟', },
            {value:'1s'  ,seconds:1       ,text:'秒钟', default: true,},
        ],

        // 获取某个字段的类型
        getFieldType: function (field) {
            return this.mapping[field];
        },

        // 获取某些类型的字段
        getFieldsByTypes: function (types) {
            var fields = [];
            for (var field in this.mapping) {
                if ($.inArray(this.mapping[field], types) >= 0) fields.push(field);
            }

            return fields;
        },

        // 获取取值方式选项
        getMethodOptions: function () {
            var options = [];
            for (var method in this.methods) {
                options.push({
                    text : this.methods[method]['text'],
                    value: method,
                });
            }

            return options;
        },

        // 获取取值方式选项 - 饼图
        getMethodOptionsForPie: function () {
            return [
                {text:'计数', value:'count'},
                {text:'求和', value:'sum'},
            ];
        },

        // 获取取值方式支持的数据类型
        getMethodTypes: function (method) {
            return this.methods[method]['types'];
        },

        // 根据时间跨度获得统计粒度
        getIntervalOptions: function (timeRange) {
            timeRange = $.isRelativeDateTimeRange(timeRange) ? $.parseRelativeDateTimeRange(timeRange) : timeRange;

            var minShards = 2,
                maxShards = 240;

            var arr = timeRange.split(' ~ '),
                start = moment(arr[0]).unix(),
                end = moment(arr[1]).unix(),
                totalSeconds = end - start;

            // 筛选出符合条件的
            var options = [];
            for (var i = 0; i < help.intervals.length; i++) {
                var item = help.intervals[i];
                if (totalSeconds/item.seconds >= minShards && totalSeconds/item.seconds <= maxShards) {
                    options.push($.extend(true, {}, item));
                }
            }

            return options;
        },
    };

    // 折线图构造器
    var LineBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    LineBuilder.prototype = {
        name: '折线图',
        template: 'lineBuilder',
        templateOfLine: 'lineBuilder-newLine',
        default: {scope:{field:'', range:'最近1小时', interval:'1m'}, lines:[{name:'日志总量', method:'count', field:'', filters:[]}]},

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field:    $('input[name="scope.field"]', this.$builder).val(),
                    range:    $('input[name="scope.range"]', this.$builder).val(),
                    interval: $('input[name="scope.interval"]', this.$builder).val(),
                },
                lines: this._getLines(),
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            this._renderScope();
            this._deleteBtnShowOrHide();

            var self = this;
            $('.line-item', this.$builder).each(function () { self._renderLine($(this)); });

            return this;
        },

        _renderScope: function () {
            $('input[name="scope.field"]', this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]', this.$builder).datetimeRangePicker();
            $('input[name="scope.interval"]', this.$builder).dropdownSelector({options: help.getIntervalOptions(this.model.scope.range)});
        },

        _renderLine: function ($item) {
            var $name = $('input[name="line.name"]', $item),
                $method = $('input[name="line.method"]', $item),
                $filters = $('input[name="line.filters"]', $item),
                $field = $('input[name="line.field"]', $item);

            $name.tooltip({container:'body'});
            $method.dropdownSelector({options: help.getMethodOptions()});
            $field.dropdownSelector();
            $filters.esFilter({mapping: help.mapping});
            this._updateFieldOptionsByMethod($method);

            return this;
        },

        _listen: function () {
            var self = this;

            // 时间跨度改变
            this.$builder.on('change', 'input[name="scope.range"]', function (e) { self._rangeChange($(e.target).val()); });
            // 增加折线
            this.$builder.on('click',  '[handle="createLine"]', function () { self._createLine(); });
            // 删除折线
            this.$builder.on('click',  '[handle="deleteLine"]', function (e) { self._deleteLine($(e.target).closest('.line-item')); });
            // 切换取值方式
            this.$builder.on('change', '[name="line.method"]', function (e) { self._updateFieldOptionsByMethod($(e.target)); });

            return this;
        },

        _rangeChange: function (range) {
            var intervalOptions = help.getIntervalOptions(range);
            $('input[name="scope.interval"]', this.$builder).dropdownSelector('updateOptions', intervalOptions);
        },

        _createLine: function () {
            var item = $.renderFormTpl('chart', 'lineBuilder-newLine', {}),
                $list = $('.line-list', this.$builder);

            $list.append(item);
            this._renderLine($list.children('.line-item:last'));

            return this._deleteBtnShowOrHide();
        },

        _deleteLine: function ($item) {
            $('input:text', $item).tooltip('destroy');
            $item.remove();

            return this._deleteBtnShowOrHide();
        },

        _deleteBtnShowOrHide: function () {
            var $delete = $('[handle="deleteLine"]', this.$builder);
            $delete.length <= 1 ? $delete.hide() : $delete.show();

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.line-item').find('[name="line.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },

        _getLines: function () {
            var lines = [];

            $('.line-item', this.$builder).each(function () {
                lines.push({
                    name:    $('input[name="line.name"]',    $(this)).val(),
                    method:  $('input[name="line.method"]',  $(this)).val(),
                    field:   $('input[name="line.field"]',   $(this)).val(),
                    filters: $('input[name="line.filters"]', $(this)).esFilter().val(),
                });
            });

            return lines;
        },
    };


    // 柱状图构造器
    var BarBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    BarBuilder.prototype = {
        name: '柱状图',
        template: 'barBuilder',
        default: {
            scope: {field:'', range:'最近1小时', filters:[]},
            statistic: {method:'count', field:''},
            category: {field:'fromhost', bucketing:'Top 20', ranges:[]},
        },

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field: $('input[name="scope.field"]', this.$builder).val(),
                    range: $('input[name="scope.range"]', this.$builder).val(),
                    filters: $('input[name="scope.filters"]', this.$builder).esFilter().val()
                },
                statistic: {
                    method: $('input[name="statistic.method"]', this.$builder).val(),
                    field: $('input[name="statistic.field"]', this.$builder).val(),
                },
                category: {
                    field: $('input[name="category.field"]', this.$builder).val(),
                    bucketing: $('input[name="category.bucketing"]', this.$builder).val(),
                    ranges: JSON.parse($('input[name="category.ranges"]', this.$builder).esTermRanges('toString').val()),
                },
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            // 范围
            $('input[name="scope.field"]',   this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]',   this.$builder).datetimeRangePicker();
            $('input[name="scope.filters"]', this.$builder).esFilter({mapping: help.mapping});

            // 分类
            $('input[name="statistic.method"]',   this.$builder).dropdownSelector({options: help.getMethodOptions()});
            $('input[name="statistic.field"]',    this.$builder).dropdownSelector();
            $('input[name="category.field"]',     this.$builder).dropdownSelector({options: help.getFieldsByTypes(['string', 'numeric'])});
            $('input[name="category.bucketing"]', this.$builder).dropdownSelector();

            // 提示
            $('.glyphicon-info-sign').tooltip({container:'body'});
            return this;
        },

        _listen: function () {
            var self = this;

            // 切换取值方式
            $('[name="statistic.method"]', this.$builder).change(function () {
                self._updateFieldOptionsByMethod($(this));
            }).trigger('change');

            // 切换分类字段
            $('[name="category.field"]', this.$builder).change(function () {
                self._updateBucketingOptionsByField($(this));
            }).trigger('change');

            // 自定义分类
            $('[name="category.bucketing"]', this.$builder).change(function () {
                self._updateCategoryRangesByBucketing($(this));
            }).trigger('change');

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.form-group').find('[name="statistic.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },

        _updateBucketingOptionsByField: function ($field) {
            var type = help.getFieldType($field.val());

            var options = [
                {text:'Top 10', value:'Top 10'},
                {text:'Top 20', value:'Top 20'},
                {divider:true},
                {text:'Bottom 10', value:'Bottom 10'},
                {text:'Bottom 20', value:'Bottom 20'},
            ];

            if (type == 'numeric') {
                options.push({divider:true});
                options.push({text:'自定义分类', value:'Numeric ranges'});
            } else if (type == 'date') {
                options.push({divider:true});
                options.push({text:'自定义分类', value:'Date ranges'});
            }

            $('[name="category.bucketing"]', this.$builder).dropdownSelector('updateOptions', options);

            return this;
        },

        _updateCategoryRangesByBucketing: function ($bucketing) {
            var $categoryRanges = $('[name="category.ranges"]', this.$builder),
                categoryBucketing = $bucketing.val();

            $categoryRanges.esTermRanges('destroy');

            if (categoryBucketing.indexOf('ranges') > 0) {
                $categoryRanges.esTermRanges();
                $categoryRanges.closest('.form-group').show();
            } else {
                $categoryRanges.closest('.form-group').hide();
            }
        },
    };


    // 饼状图构造器
    var PieBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    PieBuilder.prototype = {
        name: '饼装图',
        template: 'pieBuilder',
        default: {
            scope: {field:'', range:'最近1小时', filters:[]},
            statistic: {method:'count', field:''},
            category: {field:'fromhost', bucketing:'Top 20', ranges:[]},
        },

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field: $('input[name="scope.field"]', this.$builder).val(),
                    range: $('input[name="scope.range"]', this.$builder).val(),
                    filters: $('input[name="scope.filters"]', this.$builder).esFilter().val()
                },
                statistic: {
                    method: $('input[name="statistic.method"]', this.$builder).val(),
                    field: $('input[name="statistic.field"]', this.$builder).val(),
                },
                category: {
                    field: $('input[name="category.field"]', this.$builder).val(),
                    bucketing: $('input[name="category.bucketing"]', this.$builder).val(),
                    ranges: JSON.parse($('input[name="category.ranges"]', this.$builder).esTermRanges('toString').val()),
                },
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            // 范围
            $('input[name="scope.field"]',   this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]',   this.$builder).datetimeRangePicker();
            $('input[name="scope.filters"]', this.$builder).esFilter({mapping: help.mapping});

            // 分类
            $('input[name="statistic.method"]',   this.$builder).dropdownSelector({options: help.getMethodOptions()});
            $('input[name="statistic.field"]',    this.$builder).dropdownSelector();
            $('input[name="category.field"]',     this.$builder).dropdownSelector({options: help.getFieldsByTypes(['string', 'numeric'])});
            $('input[name="category.bucketing"]', this.$builder).dropdownSelector();

            // 提示
            $('.glyphicon-info-sign').tooltip({container:'body'});
            return this;
        },

        _listen: function () {
            var self = this;

            // 切换取值方式
            $('[name="statistic.method"]', this.$builder).change(function () {
                self._updateFieldOptionsByMethod($(this));
            }).trigger('change');

            // 切换分类字段
            $('[name="category.field"]', this.$builder).change(function () {
                self._updateBucketingOptionsByField($(this));
            }).trigger('change');

            // 自定义分类
            $('[name="category.bucketing"]', this.$builder).change(function () {
                self._updateCategoryRangesByBucketing($(this));
            }).trigger('change');

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.form-group').find('[name="statistic.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },

        _updateBucketingOptionsByField: function ($field) {
            var type = help.getFieldType($field.val());

            var options = [
                {text:'Top 10', value:'Top 10'},
                {text:'Top 20', value:'Top 20'},
                {divider:true},
                {text:'Bottom 10', value:'Bottom 10'},
                {text:'Bottom 20', value:'Bottom 20'},
            ];

            if (type == 'numeric') {
                options.push({divider:true});
                options.push({text:'自定义分类', value:'Numeric ranges'});
            } else if (type == 'date') {
                options.push({divider:true});
                options.push({text:'自定义分类', value:'Date ranges'});
            }

            $('[name="category.bucketing"]', this.$builder).dropdownSelector('updateOptions', options);

            return this;
        },

        _updateCategoryRangesByBucketing: function ($bucketing) {
            var $categoryRanges = $('[name="category.ranges"]', this.$builder),
                categoryBucketing = $bucketing.val();

            $categoryRanges.esTermRanges('destroy');

            if (categoryBucketing.indexOf('ranges') > 0) {
                $categoryRanges.esTermRanges();
                $categoryRanges.closest('.form-group').show();
            } else {
                $categoryRanges.closest('.form-group').hide();
            }
        },
    };


    // 仪表盘构造器
    var PanelBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    PanelBuilder.prototype = {
        name: '饼装图',
        template: 'panelBuilder',
        default: {
            scope: {field:'', range:'最近1小时', filters:[]},
            statistic: {method:'count', field:''},
            panel: {min: 0, max: 500000000},
        },

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field:   $('input[name="scope.field"]', this.$builder).val(),
                    range:   $('input[name="scope.range"]', this.$builder).val(),
                    filters: $('input[name="scope.filters"]', this.$builder).esFilter().val()
                },
                statistic: {
                    method: $('input[name="statistic.method"]', this.$builder).val(),
                    field:  $('input[name="statistic.field"]', this.$builder).val(),
                },
                panel: {
                    min: $('input[name="panel.min"]', this.$builder).val(),
                    max: $('input[name="panel.max"]', this.$builder).val(),
                },
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            // 范围
            $('input[name="scope.field"]',   this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]',   this.$builder).datetimeRangePicker();
            $('input[name="scope.filters"]', this.$builder).esFilter({mapping: help.mapping});

            // 统计
            $('input[name="statistic.method"]', this.$builder).dropdownSelector({options: help.getMethodOptions()});
            $('input[name="statistic.field"]',  this.$builder).dropdownSelector();

            return this;
        },

        _listen: function () {
            var self = this;

            // 切换取值方式
            $('[name="statistic.method"]', this.$builder).change(function () {
                self._updateFieldOptionsByMethod($(this));
            }).trigger('change');

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.form-group').find('[name="statistic.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },
    };


    // 仪表盘构造器
    var RadarBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    RadarBuilder.prototype = {
        name: '雷达图',
        template: 'radarBuilder',
        templateOfIndicator: 'radarBuilder-newIndicator',
        default: {
            scope: {field:'', range:'最近1小时', filters:[]},
            indicators: [
                {name:'', method:'count', field:'', max:''},
                {name:'', method:'count', field:'', max:''},
                {name:'', method:'count', field:'', max:''},
            ],
        },

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field:   $('input[name="scope.field"]',   this.$builder).val(),
                    range:   $('input[name="scope.range"]',    this.$builder).val(),
                    filters: $('input[name="scope.filters"]', this.$builder).esFilter().val()
                },
                indicators: this._getIndicators(),
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            this._renderScope();
            this._deleteBtnShowOrHide();

            var self = this;
            $('.indicator-item', this.$builder).each(function () { self._renderIndicator($(this)); });

            return this;
        },

        _renderScope: function () {
            $('input[name="scope.field"]',   this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]',   this.$builder).datetimeRangePicker();
            $('input[name="scope.filters"]', this.$builder).esFilter({mapping: help.mapping});
        },

        _renderIndicator: function ($indicator) {
            var $name =   $('input[name="indicator.name"]', $indicator),
                $method = $('input[name="indicator.method"]', $indicator),
                $field =  $('input[name="indicator.field"]', $indicator);

            $name.tooltip({container:'body'});
            $method.dropdownSelector({options: help.getMethodOptions()});
            $field.dropdownSelector();
            this._updateFieldOptionsByMethod($method);

            return this;
        },

        _listen: function () {
            var self = this;

            // 增加维度
            this.$builder.on('click',  '[handle="createIndicator"]', function () { self._createIndicator(); });
            // 删除维度
            this.$builder.on('click',  '[handle="deleteIndicator"]', function () { self._deleteIndicator($(this).closest('.indicator-item')); });
            // 切换取值方式
            this.$builder.on('change', '[name="indicator.method"]',  function () { self._updateFieldOptionsByMethod($(this)); });

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.form-group').find('[name="indicator.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },

        _deleteBtnShowOrHide: function () {
            var $delete = $('[handle="deleteIndicator"]', this.$builder);
            $delete.length <= 3 ? $delete.hide() : $delete.show();

            return this;
        },

        _createIndicator: function () {
            var item = $.renderFormTpl('chart', this.templateOfIndicator, {}),
                $list= $('.indicator-list', this.$builder);

            $list.append(item);
            this._renderIndicator($list.find('.indicator-item:last'));

            return this._deleteBtnShowOrHide();
        },

        _deleteIndicator: function ($indicator) {
            $('input:text', $indicator).tooltip('destroy');
            $indicator.remove();

            return this._deleteBtnShowOrHide();
        },

        _getIndicators: function () {
            var indicators = [];

            $('.indicator-item', this.$builder).each(function () {
                indicators.push({
                    name:   $('input[name="indicator.name"]',   $(this)).val(),
                    method: $('input[name="indicator.method"]', $(this)).val(),
                    field:  $('input[name="indicator.field"]',  $(this)).val(),
                    max:    $('input[name="indicator.max"]',    $(this)).val(),
                });
            });

            return indicators;
        },
    };


    // 表格构造器
    var TableBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    TableBuilder.prototype = {
        name: '表格',
        template: 'tableBuilder',
        default: {
            scope: {field:'', range:'最近1小时', filters:[]},
            statistic: {method:'count', field:''},
            table: {"col":[], "row":[]},
        },

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field:   $('input[name="scope.field"]', this.$builder).val(),
                    range:   $('input[name="scope.range"]', this.$builder).val(),
                    filters: $('input[name="scope.filters"]', this.$builder).esFilter().val()
                },
                statistic: {
                    method: $('input[name="statistic.method"]', this.$builder).val(),
                    field:  $('input[name="statistic.field"]', this.$builder).val(),
                },
                table: {
                    col: $('input[name="table.col"]', this.$builder).esFilter().val(),
                    row: $('input[name="table.row"]', this.$builder).esFilter().val(),
                },
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            // 范围
            $('input[name="scope.field"]',   this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]',   this.$builder).datetimeRangePicker();
            $('input[name="scope.filters"]', this.$builder).esFilter({mapping: help.mapping});

            // 统计
            $('input[name="statistic.method"]', this.$builder).dropdownSelector({options: help.getMethodOptions()});
            $('input[name="statistic.field"]',  this.$builder).dropdownSelector();

            // 仪表设置
            $('input[name="table.col"]', this.$builder).esFilter({mapping: help.mapping});
            $('input[name="table.row"]', this.$builder).esFilter({mapping: help.mapping});

            return this;
        },

        _listen: function () {
            var self = this;

            /// 切换取值方式
            $('[name="statistic.method"]', this.$builder).change(function () {
                self._updateFieldOptionsByMethod($(this));
            }).trigger('change');

            // 增删行列
            $('[name="table.col"], [name="table.row"]', this.$builder).bind('esFilter.create', function () {
                var $filter = $(this).siblings('.es-filter'),
                    $first = $('.filter-item:first', $filter),
                    $last = $('.filter-item:last', $filter);

                if (!$last.is($first)) {
                    $('[name=field]', $last).val($('[name=field]', $first).val()).trigger('change');
                    $('[name=field]', $first.siblings()).siblings('button').prop('disabled', true);
                }

            }).bind('esFilter.delete', function () {
                var $filter = $(this).siblings('.es-filter'),
                    $first = $('.filter-item:first', $filter);

                $('[name=field]', $first).siblings('button').prop('disabled', false);
            }).trigger('esFilter.create');

            this.$builder.on('change', '.filter-item [name="field"]', function () {
                var $filter = $(this).closest('.es-filter'),
                    $first = $('.filter-item:first', $filter);

                if($('[name=field]', $first).is($(this))) $first.siblings().remove();
            });

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.form-group').find('[name="statistic.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },
    };


    // 成为jquery插件
    $.fn.esChartBuilder = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                instance = $this.data('instance.esChartBuilder');

            // 仅限<input>
            if ($(this)[0]['tagName'] != 'INPUT') return;

            // 创建对象并缓存
            if (!instance) {
                if (option == 'destroy') return; // 无需创建
                instance = new EsChartBuilder($this, options);
                $this.data('instance.esChartBuilder', instance);
            }

            // 执行方法
            if (typeof option == 'string') instance[option](param);
        });
    };
})(window, $, _);