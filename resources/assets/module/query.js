// ====================================
//  查询创建、删除、复制
// ====================================
$(function () {
    var query = {
        default: {id:'', name:'', builder:'', indexId:'', groupId:''},
        validator: {},
        template: 'query',
        initialized: false,

        $modal: $('#modal-createQuery'),
        $builder: $('.chart-builder'),
        $preview:   $('.chart-container .chart-preview'),
        $form: {},

        init: function () {
            if (this.initialized) return this;

            this._render()._listen();

            this.initialized = true; return this;
        },

        _render: function () {
            // 查询页面
            if (!app.query) {
                $('[handle="createQuery"]').tooltip('show');
                $('.no-query-tips').removeClass('hide');
            } else {
                $('.chart-container').removeClass('hide');
            }

            return this;
        },

        _renderForm: function (model) {
            var form = $.render(this.template, model);
            $('.modal-body', this.$modal).html(form);
            this.$form = $('#modal-createQuery form');


            $('[name="indexId"]', this.$form).select({options: app.indices});
            $('[name="groupId"]', this.$form).select({options: app.groups});

            return this._setValidator();
        },

        _listen: function () {
            var self = this;

            // 创建查询
            $('[handle="createQuery"]').click(function () {
                self._create();
            });

            // 删除查询
            $('[handle="deleteQuery"]').click(function () {
                self._delete(app.query);
            });

            // 复制查询
            $('[handle="copyQuery"]').click(function () {
                self._copy(app.query);
            });

            // 复制查询
            $('[handle="shareQuery"]').click(function () {
                self._share(app.query);
            });

            // 构造器的高度
            $(window).resize(_.debounce(function(){
                self.$builder.height($(window).height() - 87);
                self.$preview.height($(window).height() - 56);
            }, 300)).trigger('resize');

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
            $('.modal-title', this.$modal).text('创建查询');
            this._renderForm(this.default);
            this.$modal.modal('show');

            return this;
        },

        _delete: function (model) {
            $.message.confirm('确认删除这个查询吗?', {
                content: model.name,
                yes: function () {
                    $.http.get('/query/delete/'+model.id, {}, {
                        success: function (data) {
                            $.message.tip('删除成功', function () {
                                window.location.href = '/query/detail/'+model.groupId;
                            });
                        },
                        error: function (data, status, msg) {
                            $.message.warn(msg);
                        },
                    });
                },
            });
        },

        _copy: function (model) {
            $('.modal-title', this.$modal).text('复制查询');
            this._renderForm(model);
            this.$modal.modal('show');

            return this;
        },

        _share: function (model) {
            $.makeShareUrl('query', model.id);
            return this;
        },

        _setValidator: function () {
            this.validator = this.$form.validator({
                rules : {
                    name: 'required|maxLength:50',
                    indexId: 'required',
                    groupId: 'required',
                },
            }).data('instance.validator');

            return this;
        },

        _submit: function () {
            if (!this.validator.isValid()) return false;

            var self = this;

            $.http.post('/query/create', $.getValByNames(['name', 'indexId', 'groupId', 'builder'], this.$form), {
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

    query.init();
});

// ====================================
//  查询构造器
// ====================================
$(function () {
    // 字段相关
    app.getFieldsByTypes = function (types) {
        var fields = [];
        for (var field in this.mapping) {
            if ($.inArray(this.mapping[field], types) >= 0) fields.push(field);
        }

        return fields;
    };
    app.getFieldsTop5 = function () {
        var fields = _.keys(this.mapping);
        return _.first(fields, 5);
    };

    // 查询构造器
    var queryBuilder = {
        $panel: $('.chart-container .chart-panel'),
        $builder:   $('.chart-container .chart-builder form'),
        $preview:   $('.chart-container .chart-preview'),

        builder: {},

        _initialized: false,

        init: function () {
            if (this._initialized) return this;

            this._render()._listen()._run();

            this._initialized = true; return this;
        },

        _render: function () {
            var self = this;

            // 时间范围
            $('input[name="scopeField"]', this.$builder).dropdownSelector({options: app.getFieldsByTypes(['date'])});
            $('input[name="scopeRange"]', this.$builder).datetimeRangePicker();

            // 筛选条件
            $('input[name="filters"]', this.$builder).esFilter({mapping: app.mapping});

            // 显示字段
            $('input[name="fields"]', this.$builder).each(function () {
                var field = $(this).attr('name');
                if ($.inArray(field, self.table.fields) >= 0) $(this).prop('checked', true);
            });

            // 数据列表

            return this;
        },

        _listen: function () {
            var self = this;

            // 预览数据
            $('[handle="runQuery"]').click(function () {
                self._save()._run();
            });

            // 隐藏/显示左侧
            $('[handle="builderDrawer"]').click(function () {
                var $icon = $(this).children('.iconfont');
                if ($icon.hasClass('icon-drawer-left')) {
                    $icon.removeClass('icon-drawer-left').addClass('icon-drawer-right');
                    self.$panel.css('width', '14px');
                    self.$preview.css('margin-left', '24px');
                } else {
                    $icon.removeClass('icon-drawer-right').addClass('icon-drawer-left');
                    self.$panel.css('width', '400px');
                    self.$preview.css('margin-left', '410px');
                }
            });

            return this;
        },

        _getBuilder: function () {
            return {
                scope: {
                    field: $('input[name="scopeField"]', this.$builder).val(),
                    range: $('input[name="scopeRange"]', this.$builder).val(),
                },
                filters: $('input[name="filters"]', this.$builder).esFilter().val(),
            };
        },

        _validate: function () {
            var errorNum = 0;
            $('input:text', this.$builder).each(function () {
                if (!$(this).val()) {
                    $(this).tooltip('show');
                    errorNum++;
                }
            });
            if (errorNum) $.ffanTips.show({content:'有'+errorNum+'项为空, 请按提示填写', rank:'warning'});

            return errorNum ? false : true;
        },

        _save: function () {
            if (!this._validate()) return;

            var self = this,
                builder = self._getBuilder();

            $.http.post('/query/save/' + app.query.id, {
                builder: JSON.stringify(builder),
            }, {
                success: function () {
                    app.query.builder = builder;
                },
                error: function (data, status, msg) {
                    $.message.warn(msg);
                },
            });

            return this;
        },

        _run: function () {
            var index = app.query.index.name,
                url = app.query.cluster.url,
                builder = JSON.stringify(this._getBuilder());
            var src = '/query/table?url='+ url +'&index='+ index +'&builder=' + builder;

            if (!this.$preview.children('iframe').length) {
                this.$preview.append('<iframe src="'+ encodeURI(src) +'" width="100%" height="100%" frameborder="0"></iframe>');
            } else {
                this.$preview.children('iframe').attr('src', src);
            }

            return this;
        },
    }

    queryBuilder.init();
});