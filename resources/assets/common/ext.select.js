//============================================
//  jQuery对象级插件 -- 选择器(支持单选和多选)
//============================================
(function (window, $, _) {
    // 定义构造函数
    var Select = function($element, options) {
        this.$wrap = [];
        this.$element = [];
        this.$btn = [];       // 按钮
        this.$dropdown = [];  // 弹出框
        this.$keywords = [];  // 关键字
        this.checked = [];    // 已选项
        this.page = 0;        // 当前页数
        this.more = false;    // 是否还有下一页
        this.multiple;        // 是否多选
        this.settings = {};
        this.enabled = false;

        this.initialize($element, options);
    };

    // 静态方法
    Select.prototype = {
        defaults: {
            placeholder: '请选择',                   // 空值占位符
            options: [],                            // 选项, 通常形式: [{name : '请选择', value(id): ''}] 或者 简单形式:['选项1', '选项2']
            search: false,                          // 是否开启搜索框
            separator: ' , ',                       // 多选时选项分割符

            // ajax: {                              // 从服务端获取选项
            //     url: '/options/user',
            //     type: 'GET',
            //     cache: true,
            //     dataType: 'json',
            //     data: function (params) {
            //         return {
            //             keywords: params.keywords,  // 搜索关键字
            //             page: params.page,          // 当前页
            //             pagesize: 25                // 分页大小
            //         };
            //     },
            //     success: function (respond, params) {
            //         return {
            //             options: respond.data.list,      // 选项
            //             more: respond.data.count >= params.page*25,       // 总数
            //         }
            //     },
            // },

        },

        template: '<button class="btn btn-default dropdown-toggle"type="button"><span class="text">请选择</span>&nbsp;<span class="caret font-gray"></span></button><div class="dropdown-menu"><div class="form-keywords option-keywords hide"><i class="glyphicon glyphicon-search"></i><input class="form-control" name="__keywords__" /></div><ul class="option-list"></ul><div class="tips">暂无纪录</div></div>',
        templateOfWrap: '<div class="btn-group unselectable"></div>',
        templateOfLi: '<%_.each(options,function(item){%><li value="<%= item.value ? item.value : item.id %>"name="<%= item.name %>"class="<% if (item.divider) { %> divider<% } %> <% if (item.disabled) { %> disabled<% } %> <% if (item.checked) { %> active<% } %>"><%if(!item.divider){%><%=item.name%><i class="glyphicon glyphicon-ok"></i><%}%></li><%})%>',
        templateOfSelectOption: '<%_.each(options,function(item){%><option value="<%= item.value %>"<%if(item.disabled){%>disabled<%}%>><%=item.name%></option><%})%>',

        initialize: function($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend(true, {}, this.defaults, this.$element.data(), options);
            this.enabled = true;
            this.multiple = $element.prop('multiple');

            return this._setChecked()._render()._listen();
        },

        open: function () {
            if (this.settings.ajax && this.page == 0) {
                this.page = 1;
                this.more = true;
                this._getPageDataThenRender();
            }

            this.$wrap.addClass('open');
            this.$element.trigger('select.open');

            return this;
        },

        close: function () {
            this.$wrap.removeClass('open');
            this.$element.trigger('select.close');

            return this;
        },

        check: function ($item) {
            if (typeof $item == 'string') {
                $item = this.$dropdown.find('.option-list [value="' + $item + '"]');
            }

            var option = {value: $item.attr('value'), name: $item.attr('name')};
            var optionTag = '<option value="' + option.value + '" selected>' + option.name + '</option>';

            if (this.multiple) {
                $item.addClass('active');
                this.$element.append(optionTag).trigger('change');
            } else {
                $item.addClass('active').siblings('.active').removeClass('active');
                this.$element.html(optionTag).trigger('change');
                this.close();
            }

            return this;
        },

        checkout: function ($item) {
            if (!this.multiple) return this;

            $item.removeClass('active')
            this.$element.children('[value="'+ $item.attr('value') +'"]').remove();
            this.$element.trigger('change');

            return this;
        },

        getChecked: function (value) {
            var checked = [];

            this.$element.children(':selected').each(function () {
                checked.push({
                    name: $(this).text(),
                    value: $(this).attr('value'),
                });
            });

            return checked;
        },

        // 设置禁用
        disabled: function (bool) {
            this.$btn.prop('disabled', !!bool);
        },

        // 更新选项
        updateOptions: function (options) {
            this._renderOptions(options);

            // 删除无效的值
            var self = this, value = '';
            this.$element.children('option:selected').each(function () {
                value = $(this).val();
                if (!$('li[value=""]', self.$dropdown).length) $(this).remove();
            });

            // 占位符
            var $first = this.$dropdown.find('.option-list li:first');
            if ($first.length) {
                $first.trigger('click');
            } else {
                this.$btn.children('.text').text(this.settings.placeholder);
                this.$element.trigger('change');
            }

            return this;
        },

        _render: function () {
            // 包裹
            this.$element.hide().wrap(this.templateOfWrap);
            this.$wrap = this.$element.parent();
            this.$wrap.prepend(this.template);
            this.$btn = this.$wrap.children('button');
            this.$dropdown = this.$wrap.children('.dropdown-menu');
            this.$keywords = this.$dropdown.find('[name="__keywords__"]');

            if (this.multiple) this.$dropdown.children('.option-list').addClass('multiple');

            // 选项
            if (!this.settings.ajax) this._renderOptionsFromSelectAndSetting();

            // 搜索
            if (this.settings.search) this.$keywords.parent().removeClass('hide');

            return this._renderChecked();
        },

        // 载入选项 - 从标签和设置中
        _renderOptionsFromSelectAndSetting: function () {
            var options = [], name = '', item = {};

            this.$element.children('option').each(function () {
                name = $(this).text();

                if (name == '____') {
                    options.push({divider: true});
                } else {
                    options.push({name: name, value: $(this).val(), disabled: $(this).prop('disabled')});
                }
            });

            for (var i = 0; i < this.settings.options.length; i++) {
                item = this.settings.options[i];
                name = typeof item == 'string' ? item : item.name;

                // 去重
                if (!_.findWhere(options, {name:name})) {
                    options.push(item);
                }
            }

            return this._renderOptions(options);
        },

        // 载入选项 - 从服务端
        _renderOptionsFromServer: function (keywords, page) {
            if (!this.more) return;

            var ajaxSettings = $.extend(true, {}, this.settings.ajax),
                params = {
                    keywords: keywords,
                    page: page,
                },
                self = this;

            ajaxSettings.data = self.settings.ajax.data(params);
            ajaxSettings.success = function (respond) {
                var rsp = self.settings.ajax.success(respond, params);

                self._appendOptions(rsp.options);
                self.more = !!rsp.more;
            };

            $.ajax(ajaxSettings);
        },

        _renderOptions: function (options) {
            this.$dropdown.children('.option-list').empty();
            return this._appendOptions(options);
        },

        _appendOptions: function (options) {
            if (this.settings.placeholder) {
                if (this.settings.ajax && !keywords && page == 1) options.unshift({name: this.settings.placeholder, value:''});
                if (!this.settings.ajax) options.unshift({name: this.settings.placeholder, value:''});
            }

            var liTags = _.template(this.templateOfLi)({options: this._formatOptions(options)});
            this.$dropdown.children('.option-list').append(liTags);

            return this;
        },

        _formatOptions: function (options) {
            for (var i = 0; i < options.length; i++) {
                var option = options[i];

                if (typeof option == 'string') options[i] = {name: option, value: option};
                options[i].checked = !!_.findWhere(this.checked, {value: options[i].value});
            }

            return options;
        },

        _setChecked: function () {
            this.checked = this.getChecked();
            return this;
        },

        _renderChecked: function () {
            var $text = this.$btn.children('.text'),
                names = _.pluck(this.checked, 'name');

            $text.text(names.join(this.settings.separator) || this.settings.placeholder);

            return this;
        },

        _listen: function () {
            var self = this;

            // 下拉按钮点击
            this.$btn.click(function () {
                self.$wrap.hasClass('open') ? self.close() : self.open();
            });

            // 点击选框以外地方
            $(window).bind('click', function (e) {
                if ($(e.target).is(self.$btn)) return;
                if ($(e.target).closest('.btn-group').is(self.$wrap)) return;

                self.$wrap.hasClass('open') && self.close();
            });

            // 滚动分页
            this.$dropdown.children('.option-list').scroll(_.throttle(function () {
                var $this = $(this),
                    contentHeight = $this.get(0).scrollHeight,
                    viewHeight = $this.height(),
                    scrollTop = $this.scrollTop();

                // 滚动到底部
                if (contentHeight - viewHeight - scrollTop <= 40) {
                    self._getPageDataThenRender();
                }
            }, 500, {leading: false}));

            // 关键字搜索
            this.$keywords.change(function () {
                self._search();
            }).keydown(function (event) {
                if (event.keyCode == 13) {
                    $(this).trigger('change');
                    return false;
                }
            });

            // 点击选项
            this.$dropdown.on('click', 'li', function () {
                if ($(this).hasClass('disabled') || $(this).hasClass('divider')) return;
                if ($(this).hasClass('active') && !self.multiple) return;

                if ($(this).hasClass('active')) {
                    self.checkout($(this));
                } else {
                    self.check($(this));
                }
            });

            // 取值改变
            this.$element.change(function () {
                self._setChecked()._renderChecked();
            });

            return this;
        },

        _getPageDataThenRender: function () {
            this._renderOptionsFromServer(this.$keywords.val(), this.page++);
        },

        _search: function () {
            this.page = 1;
            this.more = true;
            this.$dropdown.children('.option-list').empty();
            this._getPageDataThenRender();
        },
    };

    // 成为jquery插件
    $.fn.select = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                instance = $this.data('instance.select');

            // 仅限<select>
            if ($(this)[0]['tagName'].toLowerCase() != 'select') return;

            // 创建对象并缓存
            if (!instance) {
                if (option == 'destroy') return; // 无需创建
                instance = new Select($this, options);
                $this.data('instance.select', instance);
            }

            // 执行方法
            if (typeof option == 'string') instance[option](param);
        });
    };
})(window, $, _);