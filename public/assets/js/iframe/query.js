// ====================================
//  查询数据表格展示
// ====================================
$(function () {
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
        param: {url :'', index: '', builder: ''},
        initialized: false,

        $table: $('table'),
        $displayFieldsPicker: $('[handle="pickDisplayFields"]'),
        $pageLoading: $('.page-loading'),
        $total: $('.query-total'),

        init: function () {
            if (this.initialized) return this;

            this.param.url = $.getParam('url');
            this.param.index = $.getParam('index');
            this.param.builder = JSON.parse($.getParam('builder'));

            this.scopeField = this._getScopeField();
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

            // 导出上下文
            this.$table.on('click', '[handle="download"]', function () {
                var index = $(this).closest('tr').data('index'),
                    __download__ = self.list[index].__download__;

                if (!__download__) {
                    $.message.warn('无法导出, 该日志没有@timestamp或fromhost或path字段');
                    return false;
                }
                window.open('/es/search/text?' + __download__);
            });

            return this;
        },

        _getPageDataThenRender: function () {
            if (!this.nextPage) return this;

            var self = this,
                page = this.page++,
                url = '/es/search/query' + window.location.search + '&page='+ page +'&pageSize=' + this.pageSize;

            $.http.get(url, {}, {
                progress: true,
                success: function (data) {
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
            this.$displayFieldsPicker.displayFieldsPicker({fields: fields.sort(), localStorageKey: this.param.url+ '/' + this.param.index});
            this.displayFieldsPicker = this.$displayFieldsPicker.data('instance.displayFieldsPicker');
            return this;
        },

        _getScopeField: function () {
            var builder = this.param.builder;
            return builder.scope.field;
        },

        _formatAfterGetList: function (list) {
            for (var i = 0; i < list.length; i++) {
                var item = list[i];

                // 导出链接
                if (item['@timestamp'] && item.fromhost && item.path) {
                    var builder = {
                        '@timestamp': moment(item['@timestamp']).valueOf(),
                        'fromhost': item.fromhost,
                        'path': item.path,
                    };

                    item['__download__'] = 'url='+ this.param.url + '&index=' + this.param.index + '&builder=' + JSON.stringify(builder);
                } else {
                    item['__download__'] = '';
                }

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