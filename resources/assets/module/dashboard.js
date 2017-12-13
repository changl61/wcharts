// ============================
// 图表面板
// ============================
$(function () {
    var dashboard = {
        default: {id:'', name:'', sort:100, groupId:''},
        validator: {},
        initialized: false,

        $modal: $('#modal-createDashboard'),
        $form: $('#modal-createDashboard form'),

        init: function () {
            if (this.initialized) return this;

            this._render()._listen();

            this.initialized = true; return this;
        },

        _render: function () {
            // 查询页面
            if (!app.dashboard) {
                $('.no-dashboard-tips').removeClass('hide');
                $('[handle="createChart"]').hide();
            } else {
                $('.chart-container').removeClass('hide');
                if (!app.charts.length) $('[handle="createChart"]').tooltip('show');
            }

            return this;
        },

        _listen: function () {
            var self = this;

            // 创建面板
            $('[handle="createDashboard"]').click(function () {
                self._create();
            });

            // 分享统计面板
            $('[handle="shareDashboard"]').click(function () {
                $.makeShareUrl('dashboard', app.dashboard.id);
            });

            // 提交
            $('[handle="submit"]', this.$modal).click(function () {
                self.$form.trigger('submit');
            });

            this.$modal.on('submit', 'form', function () {
                self._submit();
                return false;
            });

            return this;
        },

        _create: function () {
            this.validator = this.$form.validator({
                rules : {
                    name: 'required|maxLength:50',
                    sort: 'required|int',
                },
            }).data('instance.validator');

            this.$modal.modal('show');

            return this;
        },

        _submit: function () {
            if (!this.validator.isValid()) return false;

            var self = this;

            $.http.post('/dashboard/create', $.getValByNames(['name', 'groupId', 'sort'], this.$form), {
                success: function (data) {
                    self.$modal.modal('hide');
                    $.message.tip('保存成功', function () {
                        window.location.reload();
                    });
                },

                error: function (data, status, msg) {
                    $.message.warn(msg);
                },
            });
        },
    };

    dashboard.init();
});


// ============================
// 图表创建
// ============================
$(function () {
    var chart = {
        $modalOfCreate: $('#modal-createChart'),
        $step: $('#modal-createChart .unit-step'),
        $btnCreateChart2: $('#modal-createChart [handle="createChart2"]'),
        $btnCreateChart3: $('#modal-createChart [handle="createChart3"]'),
        $btnSubmit:  $('#modal-createChart [handle="submit"]'),

        model:{},
        default:{id: '', name:'', format:'', index: {id:'', name:'', mapping:{}}, builder:{}, dashboardId:''},
        esChart:{},
        esChartBuilder:{},
        formats: [
            {key:'line',  name:'折线图'},
            {key:'bar',   name:'柱状图'},
            {key:'pie',   name:'饼状图'},
            {key:'panel', name:'仪表盘'},
            {key:'radar', name:'雷达图'},
            {key:'table', name:'表格'},
        ],
        initialized: false,

        init: function () {
            if (this.initialized) return this;

            this._listen();

            this.initialized = true; return this;
        },

        _listen: function () {
            var self = this, $chart = [];

            // 创建按钮
            $('#dashboard').on('click', '[handle="createChart"]', function () {
                $cell = $(this).closest('.dashboard-cell');
                self._create();
            });

            // 选择形式
            this.$modalOfCreate.on('click', '.chart-format-item .format-icon', function () {
                $(this).siblings('label').children('input:radio').prop('checked', true).trigger('change');
            });

            // 选择索引
            this.$modalOfCreate.on('click', '.chart-index-list li', function () {
                $('input:radio', $(this)).prop('checked', true).trigger('change');
            });

            // 下一步 - 2
            this.$btnCreateChart2.click(function () {
                if (self.model.format) self._create2();
            });

            // 下一步 - 3
            this.$btnCreateChart3.click(function () {
                if (self.model.index.id) self._create3();
            });

            // 运行
            this.$modalOfCreate.on('click', '[handle="runChart"]', function () {
                self._run();
            });

            // 提交保存
            this.$btnSubmit.click(function () {
                self._createSubmit($cell);
            });
        },

        // 三步走创建图表
        _create: function () {
            // 重置
            this.model = $.extend(true, {}, this.default);
            this.$step.children('li').removeClass('done').removeClass('active');
            this.$modalOfCreate.find('.modal-footer .btn-primary').hide().prop('disabled', true);

            this.$modalOfCreate.modal('show');

            return this._create1();
        },

        _create1: function () {
            this.$step.children(':eq(0)').addClass('active');
            this.$btnCreateChart2.show();

            // 渲染
            var html = $.renderFormTpl('chart', 'createChart-1', {formats: this.formats});
            $('.modal-body', this.$modalOfCreate).html(html);

            // 选择形式
            var self = this;
            $('input[name="format"]', this.$modalOfCreate).change(function () {
                self.model.format = $(this).val();
                self.$btnCreateChart2.prop('disabled', !self.model.format);
            }).first().prop('checked', true).trigger('change');

            return this;
        },

        _create2: function () {
            this.$step.children(':eq(0)').removeClass('active').addClass('done');
            this.$step.children(':eq(1)').addClass('active');
            this.$btnCreateChart2.hide();
            this.$btnCreateChart3.show();

            // 渲染
            var html = $.renderFormTpl('chart', 'createChart-2', {indices: app.indices});
            $('.modal-body', this.$modalOfCreate).html(html);

            // 选择索引
            var self = this;
            $('input[name="index"]', this.$modalOfCreate).change(function () {
                self.model.index = _.findWhere(app.indices, {id: $(this).val()});
                self.$btnCreateChart3.prop('disabled', !self.model.index.id);
            }).first().prop('checked', true).trigger('change');
        },

        _create3: function () {
            this.$step.children(':eq(1)').removeClass('active').addClass('done');
            this.$step.children(':eq(2)').addClass('active');
            this.$btnCreateChart3.hide();
            this.$btnSubmit.show().prop('disabled', false);

            // 渲染
            var html = $.renderFormTpl('chart', 'createChart-3', {builder: this.model.builder});
            $('.modal-body', this.$modalOfCreate).html(html);

            // 渲染图表构造器
            this.esChartBuilder = $('input[name="builder"]', this.$modalOfCreate).esChartBuilder({
                format: this.model.format,
                mapping: this.model.index.mapping,
            }).data('instance.esChartBuilder');

            // 渲染图表
            var self = this;
            this.esChart = $('.chart-body', this.$modalOfCreate).esChart({
                format: this.model.format,
                loadingStart: function () {
                    $('[handle="runChart"]', self.$modalOfCreate).prop('disabled', true).children('.iconfont').show();
                },
                loadingDone: function () {
                    $('[handle="runChart"]', self.$modalOfCreate).prop('disabled', false).children('.iconfont').hide();
                },
            }).data('instance.esChart');
        },

        _createSubmit: function ($cell) {
            // 验证构造
            if (!this.esChartBuilder.validate()){
                return this;
            } else {
                this.model.builder = JSON.stringify(this.esChartBuilder.getValue());
            }

            // 验证名称
            if (!$('.chart-name input[name="name"]').val()) {
                $.message.warn('请输入图表名称');
                return this;
            } else {
                this.model.name = $('.chart-name input[name="name"]').val();
            }

            // 其它
            this.model.dashboardId = app.dashboard.id;
            this.model.indexId = this.model.index.id;

            // 保存
            var self = this;
            $.http.post('/chart/create', this.model, {
                success: function (data) {
                    $.message.tip('图表创建成功', function () {
                        self.$modalOfCreate.modal('hide');
                        app.charts.push(data.detail);
                        $cell.data('content', data.detail.id).trigger('render');
                    });
                },

                error: function (data, status, msg) {
                    $.message.warn(msg);
                },
            });
        },

        _run: function () {
            if (!this.esChartBuilder.validate()) return this;

            var builder = this.esChartBuilder.getValue(),
                url = '/es/search/';
            url += this.model.format;
            url += '?url=' + app.cluster.url;
            url += '&index=' + this.model.index.name;
            url += '&builder=' + JSON.stringify(builder);

            this.esChart.setUrl(url).refresh(true);

            return this;
        },
    };

    chart.init();
});


// ============================
// 图表列表
// ============================
$(function () {
    var chartList = {
        $dashboard: $('#dashboard'),

        templateOfItem: $('#template-chart-item').html(),
        templateOfEmpty : $('#template-chart-empty').html(),
        initialized: false,

        init: function () {
            if (this.initialized) return this;

            this._listen()._render();

            this.initialized = true; return this;
        },

        _render: function () {
            var self = this;

            // 统计面板格子布局
            this.$dashboard.dashboardGrid({
                dragger: '.chart-head',
                rightResizer: '.chart-resize-right',
                content: self.templateOfItem,
                empty: self.templateOfEmpty,
            });

            // 复制和移动相关
            $('#modal-copyChart [name="groupId"]').select({options: app.groups});
            $('#modal-copyChart [name="dashboardId"]').select();

            return this;
        },

        _listen: function () {
            var self = this;

            // 布局改变
            this.$dashboard.bind('change.dashboardGrid', function () {
                self._saveGrid();
            });

            // 缩放
            this.$dashboard.on('resized.dashboardGrid', '.dashboard-cell', function () {
                self._resize($(this).children('.chart-item'));
            });

            // 栅格渲染
            this.$dashboard.on('render', '.dashboard-cell', function () {
                self.$dashboard.data('instance.dashboardGrid').renderCell($(this));
                self.$dashboard.trigger('change.dashboardGrid');
            });

            // 绘图
            this.$dashboard.on('render.dashboardGrid', '.dashboard-cell', function () {
                self._drawEsChart($(this).children());
            });

            // 刷新
            this.$dashboard.on('click', '[handle="refresh"]', function () {
                if ($(this).children('.icon-refresh').hasClass('hide')) return;
                $(this).closest('.chart-item').children('.chart-body').data('instance.esChart').refresh();
            });

            // 编辑
            this.$dashboard.on('click', '[handle="update"]', function () {
                var chart = self._getChartModelById($(this).closest('.chart-item').data('id'));
                self._update(chart);
            });

            $('#modal-updateChart').bind('hidden.bs.modal', function () {
                $(this).find('[name="builder"]').esChartBuilder('destroy');
                $(this).find('.chart-body').esChart('destroy');
            });

            $('#modal-updateChart').bind('shown.bs.modal', function () {
                var chart = self._getChartModelById($('#modal-updateChart [name="id"]').val());

                $('#modal-updateChart .chart-body').esChart({
                    url: self._getEsChartUrl(chart),
                    format: chart.format,
                    loadingStart: function () {
                        $('#modal-updateChart [handle="runChart"]').prop('disabled', true).children('.iconfont').show();
                    },
                    loadingDone: function () {
                        $('#modal-updateChart [handle="runChart"]').prop('disabled', false).children('.iconfont').hide();
                    },
                });
            });

            // 编辑 - 提交
            $('#modal-updateChart [handle="submit"]').click(function () {
                self._submitUpdate();
            });

            // 编辑 - 运行
            $('#modal-updateChart [handle="runChart"]').click(function () {
                var chart = self._getChartModelById($('#modal-updateChart [name="id"]').val());
                self._runUpdate(chart);
            });

            // 复制
            this.$dashboard.on('click', '[handle="copy"]', function () {
                self._copy($(this).closest('.chart-item').data('id'));
            });

            // 移动
            this.$dashboard.on('click', '[handle="move"]', function () {
                self._move($(this).closest('.chart-item').data('id'));
            });

            // 复制/移动 - 选择分组
            $('#modal-copyChart [name="groupId"]').change(function () {
                var groupId = $(this).val();

                if (groupId) {
                    $.http.get('/option/dashboard/' + groupId, {}, {
                        async: false,
                        success: function (data) {
                            $('#modal-copyChart [name="dashboardId"]').select('updateOptions', data);
                        },
                    });
                } else {
                    $('#modal-copyChart [name="dashboardId"]').select('updateOptions', []);
                }
            });

            // 复制/移动 - 验证
            $('#modal-copyChart form').validator({
                rules : {
                    groupId: 'required',
                    dashboardId: 'required',
                },
            });

            // 复制 - 提交
            $('#modal-copyChart [handle="submitCopy"]').click(function () {
                self._submitCopy();
            });

            // 移动 - 提交
            $('#modal-copyChart [handle="submitMove"]').click(function () {
                self._submitMove();
            });

            // 分享图表
            this.$dashboard.on('click', '[handle="share"]', function () {
                var chartId = $(this).closest('.chart-item').data('id');
                $.makeShareUrl('chart', chartId);
            });

            // 删除
            this.$dashboard.on('click', '[handle="delete"]', function () {
                var $item = $(this).closest('.chart-item'),
                    chartId = $item.data('id'),
                    chart = _.findWhere(app.charts, {id: chartId + ''});

                $.message.confirm('您确定删除该图表吗', {
                    content: chart.name,
                    yes: function () {
                        $.http.post('/chart/delete/'+chart.id, {}, {
                            success: function () {
                                $.message.tip('删除成功', function () {
                                    self.$dashboard.data('instance.dashboardGrid').removeCell($item.parent());
                                });
                            },
                        });
                    },
                });
            });

            // (退出)全屏
            $('.app-right').bind('resize', function () {
                $('.chart-item', self.$dashboard).each(function () {
                    self._resize($(this));
                });
            });

            return this;
        },

        // 图表大小自适应
        _resize: function ($chart) {
            if (!$chart.length) return;
            var esChart = $chart.children('.chart-body').data('instance.esChart');
            if (esChart) esChart.resize();
        },

        // 保存统计面板栅格布局
        _saveGrid: _.debounce(function () {
            var grid = this.$dashboard.data('instance.dashboardGrid').toString();

            $.http.post('/dashboard/saveGrid/' + app.dashboard.id, {grid: grid}, {
                error: function () {
                    $.message.warn('保存布局失败');
                },
            });
        }, 300),

        // 画图
        _drawEsChart: function ($item) {
            var chart = this._getChartModelById($item.data('id'));

            $item.find('.chart-title').text(chart.name);
            $item.find('.chart-body').esChart({
                url: this._getEsChartUrl(chart),
                format: chart.format,
                loadingStart: function () {
                    $item.find('[handle="refresh"] .icon-refresh').addClass('hide');
                    $item.find('[handle="refresh"] .icon-loading').removeClass('hide');
                },
                loadingDone: function () {
                    $item.find('[handle="refresh"] .icon-refresh').removeClass('hide');
                    $item.find('[handle="refresh"] .icon-loading').addClass('hide');
                },
                $scopeRange: $('.chart-datetime .datetime-range', $item),
            });

            return this;
        },

        // 重绘
        _reDrawEsChart: function ($item, builder, name) {
            var id = $item.data('id'),
                chartIndex = _.findIndex(app.charts, function (chart) {
                    return chart.id == id;
                });

            app.charts[chartIndex].builder = builder;
            app.charts[chartIndex].name = name;
            $item.find('.chart-body').esChart('destroy');
            $item.find('.chart-title').text(name);

            return this._drawEsChart($item);
        },

        _update: function (chart) {
            var index = _.findWhere(app.indices, {id: chart.indexId + ''});

            $('#modal-updateChart [name="id"]').val(chart.id);
            $('#modal-updateChart [name="name"]').val(chart.name);
            $('#modal-updateChart [name="builder"]').val(chart.builder).esChartBuilder({
                format: chart.format,
                mapping: index.mapping,
            });

            $('#modal-updateChart').modal('show');
        },

        _submitUpdate: function () {
            var esChartBuilder = $('#modal-updateChart [name="builder"]').data('instance.esChartBuilder');
            if (!esChartBuilder.validate()) return false;

            var builder = JSON.stringify(esChartBuilder.getValue());
            var id = $('#modal-updateChart [name="id"]').val();
            var name = $('#modal-updateChart [name="name"]').val();

            if (!name) {
                $.message.warn('图表名称不能为空');
                return this;
            }

            // 保存
            var self = this;
            $.http.post('/chart/update/'+ id, {
                builder: builder,
                name: name,
            }, {
                success: function () {
                    $.message.tip('保存成功', function () {
                        $('#modal-updateChart').modal('hide');
                        self._reDrawEsChart($('.chart-item[data-id="'+id+'"]'), builder, name);
                    });
                },
                error: function (data, status, msg) {
                    $.message.warn(msg);
                },
            });
        },

        _runUpdate: function (chart) {
            var esChartBuilder = $('#modal-updateChart [name="builder"]').data('instance.esChartBuilder');
            if (!esChartBuilder.validate()) return this;

            chart.builder = JSON.stringify(esChartBuilder.getValue());
            var url = this._getEsChartUrl(chart);

            var esChart = $('#modal-updateChart .chart-body').data('instance.esChart');
            esChart.setUrl(url).refresh(true);

            return this;
        },

        _copy: function (id) {
            $('#modal-copyChart').find('.modal-title').text('复制图表');
            $('#modal-copyChart [handle="submitCopy"]').removeClass('hide');
            $('#modal-copyChart [handle="submitMove"]').addClass('hide');
            $('#modal-copyChart [name="id"]').val(id);
            $('#modal-copyChart').modal('show');
        },

        _submitCopy: function () {
            var $form = $('#modal-copyChart form').trigger('submit'),
                formData = $.getValByNames(['id', 'groupId', 'dashboardId'], $form);

            if ($form.data('instance.validator').isValid()) {
                $.http.post('/chart/copy/'+ formData.id, {
                    dashboardId: formData.dashboardId,
                }, {
                    success: function () {
                        $.message.tip('图表复制成功, 正在跳转到目标统计面板', function () {
                            window.location.href = '/dashboard/detail/'+formData.groupId+'/'+formData.dashboardId;
                        });
                    },
                    error: function (data, status, msg) {
                        $.message.warn(msg)
                    },
                });
            }
        },

        _move: function (id) {
            $('#modal-copyChart').find('.modal-title').text('移动图表');
            $('#modal-copyChart [handle="submitCopy"]').addClass('hide');
            $('#modal-copyChart [handle="submitMove"]').removeClass('hide');
            $('#modal-copyChart [name="id"]').val(id);
            $('#modal-copyChart').modal('show');
        },

        _submitMove: function () {
            var self = this;
                $form = $('#modal-copyChart form').trigger('submit'),
                formData = $.getValByNames(['id', 'groupId', 'dashboardId'], $form),
                $chart = $('.chart-item[data-id="'+formData.id+'"]', self.$dashboard);

            if ($form.data('instance.validator').isValid()) {
                $.http.post('/chart/move/'+ formData.id, {
                    dashboardId: formData.dashboardId,
                }, {
                    success: function () {
                        self.$dashboard.data('instance.dashboardGrid').removeCell($chart.parent());
                        $.message.tip('图表移动成功, 正在跳转到目标统计面板', function () {
                            window.location.href = '/dashboard/detail/'+formData.groupId+'/'+formData.dashboardId;
                        });
                    },
                    error: function (data, status, msg) {
                        $.message.warn(msg)
                    },
                });
            }
        },

        _getChartModelById: function (id) {
            return _.findWhere(app.charts, {id: id + ''});
        },

        _getEsChartUrl: function (chart) {
            var index = _.findWhere(app.indices, {id: chart.indexId + ''});
            return '/es/search/'+chart.format+'?url='+app.cluster.url+'&index='+index.name+'&builder='+chart.builder;
        },
    };

    chartList.init();


    // 图表自动刷新
    var authRefresh = {
        $el: $('#auto-refresh'),
        intervalId: null,
        initialized: false,

        init: function () {
            if (this.initialized) return this;

            this._listen();

            var value = this._fromLocalStorage() ? this._fromLocalStorage() : 0;
            $('.dropdown-menu li[value="'+value+'"]', this.$el).trigger('click');

            this.initialized = true; return this;
        },

        _listen: function () {
            var self = this;
            $('.dropdown-menu li', this.$el).click(function () {
                if ($(this).hasClass('active')) return;

                self._pick($(this).attr('value'));
                $(this).addClass('active').siblings().removeClass('active');
                $('button .text', self.$el).text($(this).find('a').text());
            });
        },

        _pick: function (value) {
            if (this.intervalId) window.clearInterval(this.intervalId);

            this.intervalId = window.setInterval(function () {
                $('.chart-item [handle="refresh"]').trigger('click');
            }, parseInt(value) ? parseInt(value)*1000 : 100000000000);

            this._toLocalStorage(value);
        },

        _toLocalStorage: function (value) {
            window.localStorage.setItem('auto-refresh', value);
            return this;
        },

        _fromLocalStorage: function () {
            return window.localStorage.getItem('auto-refresh');
        },
    }

    authRefresh.init();
});