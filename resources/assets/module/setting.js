// ============================
// 设置 - ES集群
// ============================
$(function () {
    if ($('body').data('location') != 'setting/es') return;
    // 当前地址
    var esCluster = app.cluster;

    // 集群地址
    var cluster = {
        default: {id: '', protocol: 'http', host: '', port: '9200'},
        template: 'cluster',
        templateForHistory: 'clusterHistory',
        validator: {},
        initialized: false,

        $modal: $('#modal-cluster'),
        $tab: $('#modal-cluster .unit-tab'),
        $submitBtn: $('#modal-cluster [handle="submit"]'),
        $form: [],

        init: function () {
            if (this.initialized) return this;

            this._listen();

            this.initialized = true; return this;
        },

        _listen: function () {
            var self = this;

            // 创建
            $('[handle="createUrl"]').click(function () {
                self.$tab.hide();
                self._create();
            });

            // 设置
            $('[handle="configUrl"]').click(function () {
                self.$tab.show();
                $('[handle="selectHistory"]', self.$tab).trigger('click');
            });

            // 切换
            $('.tab-item', this.$tab).click(function () {
                $(this).addClass('active').siblings('.active').removeClass('active');
                switch ($(this).attr('handle')) {
                    case 'update': self._update(); break;
                    case 'create': self._create(); break;
                    case 'selectHistory': self._selectHistory(); break;
                }
            });

            // 提交
            self.$submitBtn.click(function () {
                self.$form.trigger('submit');
            });

            return this;
        },

        _create: function () {
            var model = $.extend(true, {}, this.default);
            this._render(model);
        },

        _update: function () {
            var arr = esCluster.url.split('://');

            var model = {
                id: esCluster.id,
                protocol: arr[0],
                host: arr[1].split(':')[0],
                port: arr[1].split(':')[1],
            };

            this._render(model);
        },

        _selectHistory: function () {
            var self = this;
            $.http.get('/es/cluster', {}, {
                success: function (data) {
                    self._renderHistory(data.list);
                },
            });
        },

        _render: function (model) {
            var form = $.render(this.template, model);
            this.$modal.find('.modal-body').html(form);
            this.$form = this.$modal.find('form');
            this.$modal.modal('show').find('[handle="submit"]').show();

            $('[name="protocol"]', this.$form).select({options: ['http', 'https']});

            return this._validate()._submit();
        },

        _renderHistory: function (list) {
            var form = $.render(this.templateForHistory, {list: list});
            this.$modal.find('.modal-body').html(form);
            this.$form = this.$modal.find('form');
            this.$modal.modal('show').find('[handle="submit"]').hide();

            return this._submitSelectHistory();
        },

        _validate: function () {
            this.$form.validator({
                rules : {
                    host : 'required',
                    port : 'required',
                },
            });

            this.validator = this.$form.data('instance.validator');

            return this;
        },

        _submit: function () {
            var self = this;
            this.$form.submit(function () {
                if (!self.validator.isValid()) return false;

                self.$submitBtn.loading('start');
                $.http.post('/es/cluster', {
                   id: $.getValByName('id', $(this)),
                   url: $.getValByName('protocol', $(this)) + '://' + $.getValByName('host', $(this)) + ':' + $.getValByName('port', $(this)),
                }, {
                    success: function () {
                        self.$modal.modal('hide');
                        $.message.tip('保存成功', function () {
                            window.location.reload();
                        });
                    },

                    error: function (data, status, message) {
                        $.message.warn(message);
                    },

                    complete: function () {
                        self.$submitBtn.loading('done');
                    },
                });

                return false;
            });

            return this;
        },

        _submitSelectHistory: function () {
            var self = this;

            this.$form.find('[handle="switchCluster"]').click(function () {
                if ($(this).hasClass('active')) return false;

                $.http.get('/es/switch/' + $(this).data('id'), {}, {
                    success: function () {
                        self.$modal.modal('hide');
                        $.message.tip('正在切换', function () {
                            window.location.reload();
                        });
                    },

                    error: function (data, status, message) {
                        $.message.warn(message);
                    },
                });

                return false;
            });

            return this;
        },
    };

    cluster.init();


    // 集群统计
    var statistics = {
        model: {activeShards: 0, primaryShards: 0, indexNum: 0, chartNum: 0, queryNum: 0},
        initialized: false,

        init: function () {
            if (this.initialized) return this;

            this.render();

            this.initialized = true; return this;
        },

        render: function () {
            var self = this;
            $.http.get('/es/statistics', {}, {
                success: function (data) {
                    var options = {
                        targets: self.model,
                        activeShards: data.activeShards,
                        primaryShards: data.primaryShards,
                        indexNum: data.indexNum,
                        chartNum: data.chartNum,
                        queryNum: data.queryNum,
                        round: 1,
                        easing: 'linear',
                        delay: 300,
                        duration: 1500,
                        update: function() {
                            document.querySelector('#index-num').innerHTML = self.model.indexNum;
                            document.querySelector('#chart-num').innerHTML = self.model.chartNum;
                            document.querySelector('#query-num').innerHTML = self.model.queryNum;
                            document.querySelector('#primary-shards').innerHTML = self.model.primaryShards;
                            document.querySelector('#active-shards').innerHTML = self.model.activeShards;
                        }
                    };
                    anime(options);
                },
                error: function (data, status, msg) {
                    $.message.alert(msg);
                }
            });
        }
    };

    if (esCluster.id) statistics.init();


    // 录入索引
    var index = {
        default: {id: null, index:'', type: '', defaultDateField: '', mapping: '', comment: '', sort: 100},
        template: 'index',
        templateForList: 'index-list',
        initialized: false,

        $el: $('#table-index'),
        $modal: $('#modal-index'),
        $submitBtn: $('#modal-index [handle="submit"]'),
        $form: [],

        init: function () {
            if (this.initialized) return this;

            this._listen()._getListThenRender();

            this.initialized = true; return this;
        },

        _listen: function () {
            var self = this;

            // 创建索引
            $('[handle="create"]', this.$el).click(function () {
                self._create();
            });

            // 更新索引
            this.$el.on('click', 'tbody [handle="update"]', function () {
                self._update($(this).closest('tr').data('model'));
            });

            // 删除索引
            this.$el.on('click', 'tbody [handle="delete"]', function () {
                self._delete($(this).closest('tr').data('model'));
            });

            // 编辑-索引值改变
            this.$modal.on('change', '[name="index"]', function () {
                $.http.get('/option/esTypes', {
                    url: esCluster.url,
                    index: $(this).val(),
                }, {
                    async: false,
                    success: function (data) {
                        if (!data.length) {
                            self.validator.addError('index', '索引不存在, 或者该索引下没有文档数据');
                        } else {
                            self.validator.removeError('index');
                        }
                        $('[name="type"]', self.$form).select('updateOptions', data);
                    },
                });
            });

            // 编辑-文档类型改变
            this.$modal.on('change', '[name="type"]', function () {
                $.http.get('/option/esMapping', {
                    url: esCluster.url,
                    index: $.getValByName('index', self.$modal),
                    type: $(this).val(),
                }, {
                    async: false,
                    success: function (data) {
                        $('[name="mapping"]', self.$form).val(JSON.stringify(data));

                        var dataFields = [];
                        for (var field in data) {
                            if (data[field] == 'date') dataFields.push(field);
                        }

                        if (data.length && !dataFields.length) {
                            self.validator.addError('type', '该类型下的文档数据没有日期字段');
                        } else {
                            self.validator.removeError('type');
                        }

                        $('[name="defaultDateField"]', self.$form).select('updateOptions', dataFields);
                    },
                });
            });

            // 编辑-提交
            self.$submitBtn.click(function () {
                self.$form.trigger('submit');
            });

            return this;
        },

        _getListThenRender: function () {
            var self = this;
            $.http.get('/es/index', {}, {
                success: function (data) {
                    var html = $.render(self.templateForList, data);
                    self.$el.find('tbody').html(html);
                },
            });

            return this;
        },

        _create: function () {
            var model = $.extend(true, {}, this.default);
            this._renderDetail(model);
        },

        _update: function (model) {
            this._renderDetail(model);
        },

        _delete: function (model) {
            var self = this;
            $.message.confirm('确认删除这个索引吗?', {
                content: model.name,
                yes: function () {
                    $.http.delete('/es/index/'+model.id, {}, {
                        success: function () {
                            self._getListThenRender();
                        },
                        error: function (data, status, msg) {
                            $.message.warn(msg);
                        },
                    });
                },
            });
        },

        _renderDetail: function (model) {
            var form = $.render(this.template, model);
            this.$modal.find('.modal-body').html(form);
            this.$form = this.$modal.find('form');
            this.$modal.modal('show');

            $('[name="type"]', this.$form).select();
            $('[name="defaultDateField"]', this.$form).select();
            $('[data-toggle="tooltip"]').tooltip();

            return this._validate()._submit();
        },

        _validate: function () {
            this.$form.validator({
                rules : {
                    index : 'required',
                    type : 'required',
                    defaultDateField : 'required',
                },
            });

            this.validator = this.$form.data('instance.validator');

            return this;
        },

        _submit: function () {
            var self = this;
            this.$form.submit(function () {
                if (!self.validator.isValid()) return false;

                $.http.post('/es/index', $.getValByNames(_.keys(self.default), self.$form), {
                    success: function (data, status, msg) {
                        self.$modal.modal('hide');
                        self._getListThenRender();
                    },
                    error: function (data, status, msg) {
                        $.message.warn(msg);
                    },
                })

                return false;
            });

            return this;
        },
    };

    index.init();
});


// ============================
// 设置 - 统计面板管理
// ============================
$(function () {
    if ($('body').data('location') != 'setting/dashboard') return;

    var dashboard = {
        $modalOfGroup: $('#modal-group'),
        $templateOfGroup: 'dashboard',

        $modalOfDashboard: $('#modal-dashboard'),
        $templateOfDashboard: 'dashboard',

        initialized: false,

        init: function () {
            if (this.initialized) return this;

            this._listen();

            this.initialized = true; return this;
        },

        _listen: function () {
            var self = this;

            // 分组展开
            $('[handle="showDashboards"]').click(function () {
                $(this).addClass('hide');
                $(this).siblings('[handle="hideDashboards"]').removeClass('hide');
                $(this).closest('.unit-table').children('.table-body').removeClass('hide');
            });

            // 分组收起
            $('[handle="hideDashboards"]').click(function () {
                $(this).addClass('hide');
                $(this).siblings('[handle="showDashboards"]').removeClass('hide');
                $(this).closest('.unit-table').children('.table-body').addClass('hide');
            });

            // 分组创建
            $('[handle="createGroup"]').click(function () {
                self.$modalOfGroup.find('.modal-title').text('创建分组');
                self._saveGroup({id: '', name:'', sort: 100});
            });

            // 分组编辑
            $('[handle="updateGroup"]').click(function () {
                self.$modalOfGroup.find('.modal-title').text('编辑分组');
                self._saveGroup($(this).closest('li').data('model'));
            });

            // 分组提交
            $('[handle="submit"]', this.$modalOfGroup).click(function () {
                $('form', self.$modalOfGroup).trigger('submit');
            });

            this.$modalOfGroup.on('submit', 'form', function () {
                self._submitGroup($(this));
                return false;
            });

            // 分组删除
            $('[handle="deleteGroup"]').click(function () {
                self._deleteGroup($(this).closest('li').data('model'));
            });

            // 查询编辑
            $('[handle="updateDashboard"]').click(function () {
                self._updateDashboard($(this).closest('tr').data('model'))
            });

            // 查询提交
            $('[handle="submit"]', this.$modalOfDashboard).click(function () {
                $('form', self.$modalOfDashboard).trigger('submit');
            });

            this.$modalOfDashboard.on('submit', 'form', function () {
                self._submitDashboard($(this));
                return false;
            });

            // 查询删除
            $('[handle="deleteDashboard"]').click(function () {
                self._deleteDashboard($(this).closest('tr').data('model'));
            });
        },

        _saveGroup: function (model) {
            var form = $.render('group', model);
            var $form = this.$modalOfGroup.find('.modal-body').html(form).find('form');

            $form.validator({
                rules : {
                    name: 'required|maxLength:50',
                    sort: 'required',
                },
            });

            this.$modalOfGroup.modal('show');
        },

        _submitGroup: function ($form) {
            if (!$form.data('instance.validator').isValid()) return false;

            var self = this;
            $.http.post('/setting/saveDashboardGroup', $.getValByNames(['id', 'name', 'sort'], $form), {
                success: function (data) {
                    self.$modalOfGroup.modal('hide');
                    $.message.tip('保存成功', function () {
                        window.location.reload();
                    });
                },

                error: function (data, status, msg) {
                    $.message.warn(msg);
                },
            });
        },

        _deleteGroup: function (model) {
            $.message.confirm('确认删除这个分组吗?', {
                content: model.name,
                yes: function () {
                    $.http.get('/setting/deleteDashboardGroup/'+model.id, {}, {
                        success: function (data) {
                            $.message.tip('删除成功', function () {
                                window.location.reload();
                            });
                        },
                        error: function (data, status, msg) {
                            $.message.warn(msg);
                        },
                    });
                },
            });
        },

        _updateDashboard: function (model) {
            var form = $.render('dashboard', model);
            var $form = this.$modalOfDashboard.find('.modal-body').html(form).find('form');

            $('[name="groupId"]', $form).select({options: app.groups});
            $('[name="groupId"]', $form).select('check', model.groupId);
            $form.validator({
                rules : {
                    name: 'required|maxLength:50',
                    sort: 'required',
                    groupId: 'required',
                },
            });

            this.$modalOfDashboard.modal('show');
        },

        _submitDashboard: function ($form) {
            if (!$form.data('instance.validator').isValid()) return false;

            var self = this;
            $.http.post('/dashboard/save/', $.getValByNames(['id', 'name', 'sort', 'groupId'], $form), {
                success: function (data) {
                    self.$modalOfDashboard.modal('hide');
                    $.message.tip('保存成功', function () {
                        window.location.reload();
                    });
                },

                error: function (data, status, msg) {
                    $.message.warn(msg);
                },
            });
        },

        _deleteDashboard: function (model) {
            $.message.confirm('确认删除这个查询吗?', {
                content: model.name,
                yes: function () {
                    $.http.get('/dashboard/delete/'+model.id, {}, {
                        success: function (data) {
                            $.message.tip('删除成功', function () {
                                window.location.reload();
                            });
                        },
                        error: function (data, status, msg) {
                            $.message.warn(msg);
                        },
                    });
                },
            });
        },
    }

    dashboard.init();
});


// ============================
// 设置 - 查询管理
// ============================
$(function () {
    if ($('body').data('location') != 'setting/query') return;

    var query = {
        $modalOfGroup: $('#modal-group'),
        $templateOfGroup: 'group',

        $modalOfQuery: $('#modal-query'),
        $templateOfQuery: 'query',

        initialized: false,

        init: function () {
            if (this.initialized) return this;

            this._listen();

            this.initialized = true; return this;
        },

        _listen: function () {
            var self = this;

            // 分组展开
            $('[handle="showQueries"]').click(function () {
                $(this).addClass('hide');
                $(this).siblings('[handle="hideQueries"]').removeClass('hide');
                $(this).closest('.unit-table').children('.table-body').removeClass('hide');
            });

            // 分组收起
            $('[handle="hideQueries"]').click(function () {
                $(this).addClass('hide');
                $(this).siblings('[handle="showQueries"]').removeClass('hide');
                $(this).closest('.unit-table').children('.table-body').addClass('hide');
            });

            // 分组创建
            $('[handle="createGroup"]').click(function () {
                self.$modalOfGroup.find('.modal-title').text('创建分组');
                self._saveGroup({id: '', name:'', sort: 100});
            });

            // 分组编辑
            $('[handle="updateGroup"]').click(function () {
                self.$modalOfGroup.find('.modal-title').text('编辑分组');
                self._saveGroup($(this).closest('li').data('model'));
            });

            // 分组提交
            $('[handle="submit"]', this.$modalOfGroup).click(function () {
                $('form', self.$modalOfGroup).trigger('submit');
            });

            this.$modalOfGroup.on('submit', 'form', function () {
                self._submitGroup($(this));
                return false;
            });

            // 分组删除
            $('[handle="deleteGroup"]').click(function () {
                self._deleteGroup($(this).closest('li').data('model'));
            });

            // 查询编辑
            $('[handle="updateQuery"]').click(function () {
                self._updateQuery($(this).closest('tr').data('model'))
            });

            // 查询提交
            $('[handle="submit"]', this.$modalOfQuery).click(function () {
                $('form', self.$modalOfQuery).trigger('submit');
            });

            this.$modalOfQuery.on('submit', 'form', function () {
                self._submitQuery($(this));
                return false;
            });

            // 查询删除
            $('[handle="deleteQuery"]').click(function () {
                self._deleteQuery($(this).closest('tr').data('model'));
            });
        },

        _saveGroup: function (model) {
            var form = $.render('group', model);
            var $form = this.$modalOfGroup.find('.modal-body').html(form).find('form');

            $form.validator({
                rules : {
                    name: 'required|maxLength:50',
                    sort: 'required',
                },
            });

            this.$modalOfGroup.modal('show');
        },

        _submitGroup: function ($form) {
            if (!$form.data('instance.validator').isValid()) return false;

            var self = this;
            $.http.post('/setting/saveGroup', $.getValByNames(['id', 'name', 'sort'], $form), {
                success: function (data) {
                    self.$modalOfGroup.modal('hide');
                    $.message.tip('保存成功', function () {
                        window.location.reload();
                    });
                },

                error: function (data, status, msg) {
                    $.message.warn(msg);
                },
            });
        },

        _deleteGroup: function (model) {
            $.message.confirm('确认删除这个分组吗?', {
                content: model.name,
                yes: function () {
                    $.http.get('/setting/deleteGroup/'+model.id, {}, {
                        success: function (data) {
                            $.message.tip('删除成功', function () {
                                window.location.reload();
                            });
                        },
                        error: function (data, status, msg) {
                            $.message.warn(msg);
                        },
                    });
                },
            });
        },

        _updateQuery: function (model) {
            var form = $.render('query', model);
            var $form = this.$modalOfQuery.find('.modal-body').html(form).find('form');

            $('[name="groupId"]', $form).select({options: app.groups});
            $('[name="groupId"]', $form).select('check', model.groupId);
            $form.validator({
                rules : {
                    name: 'required|maxLength:50',
                    sort: 'required',
                    groupId: 'required',
                },
            });

            this.$modalOfQuery.modal('show');
        },

        _submitQuery: function ($form) {
            if (!$form.data('instance.validator').isValid()) return false;

            var self = this;
            var id = $.getValByName('id', $form);
            $.http.post('/query/save/' + id, $.getValByNames(['name', 'sort', 'groupId'], $form), {
                success: function (data) {
                    self.$modalOfQuery.modal('hide');
                    $.message.tip('保存成功', function () {
                        window.location.reload();
                    });
                },

                error: function (data, status, msg) {
                    $.message.warn(msg);
                },
            });
        },

        _deleteQuery: function (model) {
            $.message.confirm('确认删除这个查询吗?', {
                content: model.name,
                yes: function () {
                    $.http.get('/query/delete/'+model.id, {}, {
                        success: function (data) {
                            $.message.tip('删除成功', function () {
                                window.location.reload();
                            });
                        },
                        error: function (data, status, msg) {
                            $.message.warn(msg);
                        },
                    });
                },
            });
        },
    }

    query.init();
});


// ============================
// 设置 - 分享管理
// ============================
$(function () {
    if ($('body').data('location') != 'setting/share') return;

    // 分组展开
    $('[handle="show"]').click(function () {
        $(this).addClass('hide');
        $(this).siblings('[handle="hide"]').removeClass('hide');
        $(this).closest('.unit-table').children('.table-body').removeClass('hide');
    });

    // 分组收起
    $('[handle="hide"]').click(function () {
        $(this).addClass('hide');
        $(this).siblings('[handle="show"]').removeClass('hide');
        $(this).closest('.unit-table').children('.table-body').addClass('hide');
    });

    // 查看开关
    $('[name="status"]').switch().bind('switch-on', function () {
        var id = $(this).closest('tr').data('id'), $this = $(this);

        $.http.post('/share/update/'+id, {
            status : '1',
        }, {
            error: function (data, status, msg) {
                $.message.warn(msg);
                $this.switch('rollback');
            },
            async: false
        });
    }).bind('switch-off', function () {
        var id = $(this).closest('tr').data('id'), $this = $(this);

        $.http.post('/share/update/'+id, {
            status : '0',
        }, {
            error: function (data, status, msg) {
                $.message.warn(msg);
                $this.switch('rollback');
            },
            async: false
        });
    });

    // 删除
    $('[handle="delete"]').click(function () {
        var $tr = $(this).closest('tr'),
            id = $tr.data('id');

        $.message.confirm('确认删除这个分享链接吗?', {
            yes: function () {
                $.http.get('/share/delete/'+id, {}, {
                    success: function (data) {
                        $.message.tip('删除成功', function () {
                            $tr.remove();
                        });
                    },
                    error: function (data, status, msg) {
                        $.message.warn(msg);
                    },
                });
            },
        });
    });
});


// ============================
// 设置 - 团队管理
// ============================
$(function () {
    if ($('body').data('location') != 'setting/team') return;

    // 创建
    $('[handle="create"]').click(function () {
        $('#modal-team').find('input[name="id"]').val('');
        $('#modal-team').find('input[name="name"]').val('');
        $('#modal-team').find('.modal-title').text('创建团队');
        $('#modal-team').modal('show');
    });

    // 修改
    $('[handle="update"]').click(function () {
        var model = $(this).closest('tr').data('model');
        $('#modal-team').find('input[name="id"]').val(model.id);
        $('#modal-team').find('input[name="name"]').val(model.name);
        $('#modal-team').find('.modal-title').text('编辑团队');
        $('#modal-team').modal('show');
    });

    // 删除
    $('[handle="delete"]').click(function () {
        var model = $(this).closest('tr').data('model');

        $.message.confirm('确认解散这个"团队"吗?', {
            content: model.name,
            yes: function () {
                $.http.post('/team/delete/'+model.id, {}, {
                    success: function () {
                        $.message.tip('解散成功', function () {
                            window.location.reload();
                        });
                    },
                    error: function (data, status, msg) {
                        $.message.warn(msg);
                    },
                });
            },
        });
    });

    // 退出
    $('[handle="quit"]').click(function () {
        var model = $(this).closest('tr').data('model');

        $.message.confirm('确认退出这个"团队"吗?', {
            content: model.name,
            yes: function () {
                $.http.post('/team/quit/'+model.id, {}, {
                    success: function () {
                        $.message.tip('操作成功', function () {
                            window.location.reload();
                        });
                    },
                    error: function (data, status, msg) {
                        $.message.warn(msg);
                    },
                });
            },
        });
    });

    // 提交
    $('#modal-team [handle="submit"]').click(function () {
        var form = $.getValByNames(['id', 'name'], $('#modal-team'));

        if (!form.name) {
            $.message.warn('请输入团队名称');
            return false;
        }

        $.http.post(form.id ? '/team/update/'+form.id : '/team/create', form, {
            success: function () {
                $.message.tip('操作成功', function () {
                    window.location.reload();
                });
            },

            error: function (data, status, msg) {
                $.message.warn(msg);
            },
        });

        return false;
    });
});


// ============================
// 设置 - 用户管理
// ============================
$(function () {
    if ($('body').data('location') != 'setting/user') return;

    // 登录开关
    $('[name="status"]').switch().bind('switch-on', function () {
        var id = $(this).closest('tr').data('id'), $this = $(this);

        $.http.post('/setting/updateUser/'+id, {
            status : '1',
        }, {
            error: function (data, status, msg) {
                $.message.warn(msg);
                $this.switch('rollback');
            },
            success: function () {
                $this.closest('tr').removeClass('forbidden');
            }
        });
    }).bind('switch-off', function () {
        var id = $(this).closest('tr').data('id'), $this = $(this);

        $.http.post('/setting/updateUser/'+id, {
            status : '0',
        }, {
            error: function (data, status, msg) {
                $.message.warn(msg);
                $this.switch('rollback');
            },
            success: function () {
                $this.closest('tr').addClass('forbidden');
            }
        });
    });

    // 重置密码
    $('[handle="resetPassword"]').click(function () {
        var id = $(this).closest('tr').data('id'),
            name = $(this).closest('tr').data('name'),
            password = parseInt(Math.random()*1000000);

        $.message.confirm('确认重置该用户的密码?', {
            content: name,
            yes: function () {
                $.http.post('/setting/updateUser/'+id, {
                    password : password,
                }, {
                    error: function (data, status, msg) {
                        $.message.warn(msg);
                    },
                    success: function () {
                        $.message.notify('重置成功, '+name+'的新密码是 "'+ password +'"');
                    }
                });
            }
        });
    });

    // 新增用户
    $('[handle="create"]').click(function () {
        $('#modal-user').modal('show');
        $('#modal-user [name="name"]').val('');
        $('#modal-user [name="password"]').val(parseInt(Math.random()*1000000));
    });

    // 提交用户
    $('#modal-user [handle="submit"]').click(function () {
        var form = $.getValByNames(['name', 'password'], $('#modal-user'));
        if (!form.name) {
            $.message.warn('用户名不能为空');
            return;
        }

        if (!/^[a-z]+[0-9]*$/.test(form.name)) {
            $.message.warn('请输入正确的用户名(字母或字母+数字)');
            return;
        }

        $.http.post('/setting/createUser', form, {
            success: function () {
                $('#modal-user').modal('hide');
                $.message.tip('创建成功', function () {
                    window.location.reload();
                });
            },
            error: function (data, status, msg) {
                $.message.warn(msg);
            },
        });
    });
});


// ============================
// 设置 - 帐户管理
// ============================
$(function () {
    if ($('body').data('location') != 'setting/account') return;

    $('#form-reset-password').validator({
        rules : {
            currentPassword : 'required',
            newPassword : 'required|minLength:6',
            repeatPassword : 'required|minLength:6',
        },
    }).submit(function () {
        // 是否验证通过
        if (!$(this).data('instance.validator').isValid()) return false;

        var form = $.getValByNames(['currentPassword', 'newPassword', 'repeatPassword'], $('#form-reset-password'));
        if (form.newPassword != form.repeatPassword) {
            $.message.warn('两次输入的新密码不一致');
            return false;
        }


        // 异步提交
        var $submit = $('button[type="submit"]', $(this)).loading('start');

        $.http.post('/setting/resetPassword', {
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
        }, {
            progress: true,
            error: function (data, status, msg) {
                $.message.warn(msg);
            },
            complete: function () {
                $submit.loading('done');
            },
        });

        return false;
    });

    $('#form-reset-password').find('input').val('');
});


// ============================
// 设置 - 团队成员管理
// ============================
$(function () {
    if ($('body').data('location') != 'setting/teamUser') return;

    var $modal = $('#modal-teamUser');

    // 创建
    $('[handle="create"]').click(function () {
        $modal.find('[name="id"]').val('');
        $modal.find('[name="name"]').val('').prop('disabled', false);
        $modal.find('[name="role"][value="team.user.write"]').prop('checked', true);
        $modal.find('.modal-title').text('添加团队成员');
        $modal.modal('show');
    });

    // 修改
    $('[handle="update"]').click(function () {
        var model = $(this).closest('tr').data('model');
        $modal.find('[name="id"]').val(model.id);
        $modal.find('[name="name"]').val(model.name).prop('disabled', true);
        $modal.find('[name="role"][value="'+model.role+'"]').prop('checked', true);
        $modal.find('.modal-title').text('编辑团队成员');
        $modal.modal('show');
    });

    // 删除
    $('[handle="delete"]').click(function () {
        var model = $(this).closest('tr').data('model');

        $.message.confirm('确认将此用户踢出团队?', {
            content: model.name,
            yes: function () {
                $.http.post('/team/deleteUser/'+model.id, {}, {
                    success: function () {
                        $.message.tip('删除成功', function () {
                            window.location.reload();
                        });
                    },
                    error: function (data, status, msg) {
                        $.message.warn(msg);
                    },
                });
            },
        });
    });

    // 提交
    $('[handle="submit"]', $modal).click(function () {
        var form = $.getValByNames(['id', 'name', 'role'], $modal);

        if (!form.name) {
            $.message.warn('请输入团队名称');
            return false;
        }

        if (!form.id) {
            var rows = form.name.replace(/\r/g, '').split('\n');

            form.name = [];
            for (var i = 0; i < rows.length; i++) {
                if (rows[i]) {
                    var item = rows[i].trim();

                    if (_.indexOf(form.name, item) >= 0) {
                        $.message.warn('第'+(i+1)+'行重复输入');
                        return false;
                    }

                    if (!/^[a-z]+[0-9]*$/.test(item)) {
                        $.message.warn('第'+(i+1)+'行不是有效的用户名');
                        return false;
                    }

                    form.name.push(item);
                }
            }
        }

        $.http.post(form.id ? '/team/updateUser/'+form.id : '/team/createUser', form, {
            success: function () {
                $.message.tip('保存成功', function () {
                    window.location.reload();
                });
            },

            error: function (data, status, msg) {
                $.message.warn(msg);
            },
        });

        return false;
    });
});