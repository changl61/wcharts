//============================================
//  jQuery对象级插件 -- 自定义显示字段
//============================================
(function (window, $, _) {
    // 定义构造函数
    var DisplayFieldsPicker = function($element, options) {
        this.$wrap = [];
        this.$element = [];
        this.$fields = [];
        this.settings = {};
        this.checked = [];
        this.enabled = false;

        this.initialize($element, options);
    };

    // 初始化方法
    DisplayFieldsPicker.prototype = {
        defaults: {
            fields : [],
            localStorageKey: 'DFP',
        },
        wrap: '<div class="unit-display-fields-picker"></div>',
        tooltip: '<div class="tooltip left hide"><div class="tooltip-arrow"></div><div class="tooltip-inner"><ul class="fields-list"></ul></div></div>',
        templateOfFields:'<%_.each(fields,function(field,index){%><li><label class="label-checkbox"><input type="checkbox"name="__fields__"value="<%= field %>"<%if(_.indexOf(checked,field)>=0){%>checked<%}%>/><span class="input-replacement"></span><span class="input-name">&nbsp;&nbsp;<%=field%></span></label></li><%})%>',

        initialize: function($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend(true, {}, this.defaults, this.$element.data(), options);
            this.enabled = true;

            var localStorage = this._fromLocalStorage();
            this.checked = localStorage.length ? localStorage : _.first(this.settings.fields, 5);

            this._render()._listen();

            return this.$element;
        },

        getChecked: function () {
            return this.checked;
        },

        _render: function () {
            // 包裹
            this.$element.wrap(this.wrap);
            this.$wrap = this.$element.parent();
            this.$wrap.append(this.tooltip);
            this.$fields = this.$wrap.find('.fields-list');

            // 字段
            var li = _.template(this.templateOfFields)({fields: this.settings.fields, checked: this.checked});
            this.$fields.html(li);

            return this;
        },

        _listen: function () {
            var self = this;
            $('[name="__fields__"]').change(function () {
                self.checked = [];
                $('[name="__fields__"]').each(function () {
                    if ($(this).prop('checked')) self.checked.push($(this).val());
                });
                self._toLocalStorage();
                self.$element.trigger('displayFieldsPicker.change');
            });

            this.$element.click(function () {
                $(this).siblings('.tooltip').removeClass('hide');
            });

            $('.tooltip', this.$wrap).mouseleave(function () {
                $(this).addClass('hide');
            });
        },

        _toLocalStorage: function () {
            window.localStorage.setItem(this.settings.localStorageKey, JSON.stringify(this.checked));
        },

        _fromLocalStorage: function () {
            var localStorage = window.localStorage.getItem(this.settings.localStorageKey);
            return localStorage ? JSON.parse(localStorage) : [];
        },
    };

    // 成为jquery插件
    $.fn.displayFieldsPicker = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                instance = $this.data('instance.displayFieldsPicker');

            // 仅限<form>
            if ($(this)[0]['tagName'] != 'BUTTON') return;

            // 创建对象并缓存
            if (!instance) {
                if (option == 'destroy') return; // 无需创建
                instance = new DisplayFieldsPicker($this, options);
                $this.data('instance.displayFieldsPicker', instance);
            }

            // 执行方法
            if (typeof option == 'string') instance[option](param);
        });
    };
})(window, $, _);