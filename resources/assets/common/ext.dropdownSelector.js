//============================================
//  jQuery对象级插件 -- 下拉菜单选择器
//============================================
(function (window, $) {
    // 定义构造函数
    var DropdownSelector = function($element, options) {
        this.$wrap = [];
        this.$element = [];
        this.settings = {};
        this.enabled = false;

        this.initialize($element, options);
    };

    // 初始化方法
    DropdownSelector.prototype = {
        defaults: {
            options:[{text : '请选择', value: ''}], // 或者 ['选项1', '选项2']
        },
        wrapTemplate:'<div class="btn-group"></div>',
        template:'<button class="btn btn-default dropdown-toggle"data-toggle="dropdown"type="button"><span class="text">请选择</span>&nbsp;<span class="caret font-gray"></span></button><ul class="dropdown-menu"><li value="" text="选项1"><a href="javascript:void(0)">请选择</a></li></ul>',

        initialize: function($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend(true, {}, this.defaults, this.$element.data(), options);
            this.enabled = true;

            return this._render()._listen();
        },

        // 设置禁用
        setDisabled: function (options) {
            for (var i = 0; i < options.length; i++) {
                $('.dropdown-menu li[value="'+ options[i] +'"]', this.$wrap).addClass('disabled');
            }
        },

        // 更新选项
        updateOptions: function (options) {
            this.settings.options = options;
            this._renderOptions();

            this.$element.trigger('pick.dropdownSelector');

            return this;
        },

        _render: function () {
            // 包裹
            this.$element.wrap(this.wrapTemplate);
            this.$wrap = this.$element.parent();
            this.$wrap.prepend(this.template);

            // 选项
            this._renderOptions();

            return this;
        },

        _renderOptions: function () {
            var options = this.settings.options;

            var optionTags = '';
            for (var i = 0; i < options.length; i++) {
                var option = options[i];

                // 简单方式
                if (typeof option == 'string'){
                    optionTags += '<li value="'+ option +'" text="'+ option +'"><a href="javascript:void(0)">'+ option +'</a></li>';
                }

                // 复杂方式
                else{
                    if (option.divider) {
                        optionTags += '<li class="divider"></li>';
                    } else {
                        optionTags += '<li class="'+ (option.disabled ? 'disabled' : '') +'" value="'+ option.value +'" text="'+ option.text +'" default="'+ (option.default ? 'true' : 'false') +'"><a href="javascript:void(0)">'+ option.text +'</a></li>';
                    }
                }
            }
            this.$wrap.find('.dropdown-menu').html(optionTags);

            return this;
        },

        _listen: function () {
            var self = this;

            // 取值改变
            this.$element.change(function () {
                $(this).trigger('pick.dropdownSelector');
            });

            // 拾取选项
            this.$element.bind('pick.dropdownSelector', function () {
                self._pick();
            }).trigger('pick.dropdownSelector');

            // 点击选项
            this.$wrap.on('click', '.dropdown-menu li', function () {
                var $this = $(this);
                if ($this.hasClass('disabled') || $this.hasClass('active')) return;

                self.$element.val($this.attr('value')).trigger('change');
            });

            return this;
        },

        _pick: function () {
            var value = this.$element.val(),
                $li = $('.dropdown-menu li[value="'+ value +'"]', this.$wrap);

            // 如果表单值不在选项列表中
            if (!$li.length) {
                var $default = $('.dropdown-menu li[default="true"]', this.$wrap);
                if (!$default.length) $default = $('.dropdown-menu li:first', this.$wrap);

                this.$element.val($default.attr('value')).trigger('change');

                return this;
            };

            // 显示文本和活动选项样式
            $('.dropdown-toggle .text', this.$wrap).text($li.attr('text'));
            $li.addClass('active').siblings().removeClass('active');

            return this;
        },
    };

    // 成为jquery插件
    $.fn.dropdownSelector = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                dropdownSelector = $this.data('obj.dropdownSelector');

            // 仅限input:hidden
            if ($(this)[0]['tagName'] != 'INPUT' || $(this)[0]['type'] != 'hidden') return;

            // 创建对象并缓存
            if (!dropdownSelector) {
                if (option == 'destroy') return; // 无需创建
                dropdownSelector = new DropdownSelector($this, options);
                $this.data('obj.dropdownSelector', dropdownSelector);
            }

            // 执行方法
            if (typeof option == 'string') dropdownSelector[option](param);
        });
    };
})(window, $);