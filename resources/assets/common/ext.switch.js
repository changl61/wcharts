//============================================
//  jQuery对象级插件 -- 开关
//============================================
(function (window, $, _) {
    // 定义构造函数
    var Switch = function($element, options) {
        this.$wrap = [];
        this.$element = [];
        this.settings = {};
        this.enabled = false;

        this.initialize($element, options);
    };

    // 静态方法
    Switch.prototype = {
        defaults: {
            on: 'yes', // 打开状态时的值
            off: 'no', // 关闭状态时的值
        },
        wrap: '<span class="switch"></span>',
        template: '<span class="slider"></span>',

        initialize: function($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend(true, {}, this.defaults, this.$element.data(), options);
            this.enabled = true;

            return this._render()._listen();
        },

        on: function () {
            this.$element.val(this.settings.on).trigger('change');
            this.$element.trigger('switch-on');

            return this;
        },

        off: function () {
            this.$element.val(this.settings.off).trigger('change');
            this.$element.trigger('switch-off');

            return this;
        },

        rollback: function () {
            var value = this.$element.val() == this.settings.on ? this.settings.off : this.settings.on;
            this.$element.val(value).trigger('change');

            return this;
        },

        disable: function (bool) {
            this.$element.prop('disabled', !!bool).trigger('change');
            this.$element.trigger('switch-disable');

            return this;
        },

        _render: function () {
            this.$element.hide().wrap(this.wrap);
            this.$wrap = this.$element.parent();
            this._renderSwitch();
            this.$wrap.prepend(this.template);

            return this;
        },

        _renderSwitch: function () {
            this.$element.val() === this.settings.on
                ? this.$wrap.removeClass('switch-off').addClass('switch-on')
                : this.$wrap.removeClass('switch-on').addClass('switch-off')
            ;

            this.$element.prop('disabled')
                ? this.$wrap.addClass('switch-disabled')
                : this.$wrap.removeClass('switch-disabled')
            ;
        },

        _listen: function () {
            var self = this;
            
            this.$element.change(function () {
                self._renderSwitch();
            });

            this.$wrap.click(function () {
                if ($(this).hasClass('switch-disabled')) return;
                $(this).hasClass('switch-on') ? self.off() :  self.on();
            });

            return this;
        },
    };

    // 成为jquery插件
    $.fn.switch = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                instance = $this.data('instance.switch');

            // 仅限<input:hidden>
            if ($(this)[0]['tagName'].toLowerCase() != 'input') return;

            // 创建对象并缓存
            if (!instance) {
                if (option == 'destroy') return; // 无需创建
                instance = new Switch($this, options);
                $this.data('instance.switch', instance);
            }

            // 执行方法
            if (typeof option == 'string') instance[option](param);
        });
    };
})(window, $, _);