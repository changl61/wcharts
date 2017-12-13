// ============================
// 分享 - 主题
// ============================
$(function () {
    app.theme = $.getParam('theme') == 'bright' ? 'bright' : 'dark';
    $('body').addClass('theme-' + app.theme);
});


// ============================
// 分享 - 查询
// ============================
$(function () {
    if ($('body').data('location') != 'share/query') return;

    var queryList = {
        list:[],
        fields:[],
        page: 1,
        pageSize: 50,
        nextPage: true,
        total: 0,
        scopeField: '',
        displayFieldsPicker: null,
        templateOfHead: 'listHead',
        templateOfBody: 'listBody',
        initialized: false,

        $table: $('table'),
        $displayFieldsPicker: $('[handle="pickDisplayFields"]'),
        $pageLoading: $('.page-loading'),
        $total: $('.query-total'),

        init: function () {
            if (this.initialized) return this;

            this._getPageDataThenRender();
            this._listen();

            this.initialized = true; return this;
        },

        _listen: function () {
            var self = this;

            // 加载更多
            $(window).scroll(_.debounce(function () {
                var seePageLoading = $(this).scrollTop() + $(this).height() - self.$pageLoading.offset().top > 0;
                if(seePageLoading) {
                    self._getPageDataThenRender();
                };
            }, 300));

            // 切换显示字段
            this.$displayFieldsPicker.bind('displayFieldsPicker.change', function () {
                self.fields = self.displayFieldsPicker.getChecked();
                self._renderHead();
                self._renderBody();
            });

            // 查看源数据
            this.$table.on('click', '[handle="showSource"]', function () {
                var $tr = $(this).closest('tr').addClass('source-top'),
                    index = $tr.data('index'),
                    source = self.list[index];

                var sourceStr = '{\n';
                for (var key in source) {
                    if (key.indexOf('_') == 0) continue;
                    sourceStr+='    "<span style="color: #0ac">'+ key +'</span>":"'+ source[key] +'"\n';
                }
                sourceStr += '}';

                $tr.after('<tr class="source"><td colspan="100"><pre>' + sourceStr + '</pre></td></tr>');
                $(this).addClass('hide');
                $(this).siblings('[handle="hideSource"]').removeClass('hide');
            });

            // 隐藏源数据
            this.$table.on('click', '[handle="hideSource"]', function () {
                var $tr = $(this).closest('tr').removeClass('source-top');
                $tr.next('.source:first').remove();
                $(this).addClass('hide');
                $(this).siblings('[handle="showSource"]').removeClass('hide');
            });

            return this;
        },

        _getPageDataThenRender: function () {
            if (!this.nextPage) return this;

            var self = this,
                page = this.page++,
                url = '/share/search/' + app.uuid + '&page='+ page +'&pageSize=' + this.pageSize;

            $.http.get(url, {}, {
                progress: true,
                success: function (data) {
                    self.scopeField = data.scope.field;
                    data.list = self._formatAfterGetList(data.list);
                    self.list = self.list.concat(data.list);

                    if (page == 1) {
                        self._renderFieldsPicker(data.list.length ? _.keys(data.list[0]) : []);
                        self.fields = self.displayFieldsPicker.getChecked();
                        self._renderHead();
                    }
                    self._appendBody(data.list, (page-1)*self.pageSize);
                    self.nextPage = !!data.list.length;


                    self.$total.text(data.total);
                    if (!self.nextPage) self.$pageLoading.text('数据已全部加载');
                },

                error: function (data, status, msg) {
                    $.message.warn(msg);
                },
            });

            return this;
        },

        _renderHead: function () {
            var html = $.render(this.templateOfHead, {fields: this.fields});
            $('thead', this.$table).empty().html(html);
            $('thead [data-toggle="tooltip"]', this.$table).tooltip();
            return this;
        },

        _renderBody: function () {
            var html = $.render(this.templateOfBody, {list:this.list, fields:this.fields, from:0});
            $('tbody', this.$table).html(html);

            return this;
        },

        _appendBody: function (list, from) {
            var html = $.render(this.templateOfBody, {list:list, fields:this.fields, from:from});
            $('tbody', this.$table).append(html);

            return this;
        },

        _renderFieldsPicker: function (fields) {
            this.$displayFieldsPicker.displayFieldsPicker({fields: fields.sort(), localStorageKey: app.uuid});
            this.displayFieldsPicker = this.$displayFieldsPicker.data('instance.displayFieldsPicker');
            return this;
        },

        _formatAfterGetList: function (list) {
            for (var i = 0; i < list.length; i++) {
                var item = list[i];

                // 时间格式化
                if (item[this.scopeField]) {
                    item[this.scopeField] = moment(item[this.scopeField]).format('YYYY-MM-DD HH:mm:ss');
                }
            }

            return list;
        },
    };

    queryList.init();
});


// ============================
// 分享 - 图表
// ============================
$(function () {
    if ($('body').data('location') != 'share/chart') return;

    var chart = {
        $el: $('.chart-item'),
        initialized: false,

        init: function () {
            if (this.initialized) return this;

            this._render()._listen();

            this.initialized = true; return this;
        },

        _render: function () {
            var self = this;

            this.$el.css('height', $(window).height()-1);

            this.$el.find('.chart-body').esChart({
                theme: app.theme,
                url: '/share/search/'+app.uuid,
                format: app.chart.format,
                loadingStart: function () {
                    self.$el.find('[handle="refresh"] .icon-refresh').addClass('hide');
                    self.$el.find('[handle="refresh"] .icon-loading').removeClass('hide');
                },
                loadingDone: function () {
                    self.$el.find('[handle="refresh"] .icon-refresh').removeClass('hide');
                    self.$el.find('[handle="refresh"] .icon-loading').addClass('hide');
                },
                $scopeRange: $('.chart-datetime .datetime-range', self.$el),
            });

            return this;
        },

        _listen: function () {
            var self = this;

            // 刷新
            this.$el.on('click', '[handle="refresh"]', function () {
                if ($(this).children('.icon-refresh').hasClass('hide')) return;
                self.$el.find('.chart-body').data('instance.esChart').refresh();
            });

            // 图表高度
            $(window).resize(_.debounce(function(){
                self.$el.css('height', $(window).height()-1);
                self.$el.find('.chart-body').data('instance.esChart').resize();
            }, 300)).trigger('resize');

            return this;
        },
    };

    chart.init();
});


// ============================
// 分享 - 统计面板
// ============================
$(function () {
    if ($('body').data('location') != 'share/dashboard') return;

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
                content: self.templateOfItem,
                empty: self.templateOfEmpty,
            });

            return this;
        },

        _listen: function () {
            var self = this;

            // 绘图
            this.$dashboard.on('render.dashboardGrid', '.dashboard-cell', function () {
                self._drawEsChart($(this).children());
            });

            // 刷新
            this.$dashboard.on('click', '[handle="refresh"]', function () {
                if ($(this).children('.icon-refresh').hasClass('hide')) return;
                $(this).closest('.chart-item').children('.chart-body').data('instance.esChart').refresh();
            });

            return this;
        },


        // 画图
        _drawEsChart: function ($item) {
            var chart = this._getChartModelById($item.data('id'));

            $item.find('.chart-title').text(chart.name);
            $item.find('.chart-body').esChart({
                theme: app.theme,
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

        _getChartModelById: function (id) {
            return _.findWhere(app.charts, {id: id + ''});
        },

        _getEsChartUrl: function (chart) {
            return '/share/search/' + app.uuid + '/?chartId=' + chart.id;
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