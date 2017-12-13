//============================================
//  jQuery对象级插件 -- 加载等待
//============================================
(function (window, $, _) {
    // 定义构造函数
    var Loading = function($element, options) {
        this.$element = [];
        this.tagName = '';
        this.settings = {};
        this.enabled = false;

        this.initialize($element, options);
    };

    // 初始化方法
    Loading.prototype = {
        defaults: {
            loadingTag: '<i class="iconfont icon-loading2 animation-spin"></i>',
        },

        initialize: function($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.tagName = $element[0]['tagName'];
            this.settings = $.extend(true, {}, this.defaults, this.$element.data(), options);
            this.enabled = true;

            return this.$element;
        },

        start: function () {
            if (this.tagName == 'BUTTON') {
                this.$element.prop('disabled', true);
                this.$element.append(' ' + this.settings.loadingTag);
            }
        },

        done: function () {
            if (this.tagName == 'BUTTON') {
                this.$element.prop('disabled', false);
                this.$element.find('i.animation-spin').remove();
            }
        },

        destroy: function () {


            return this.$element;
        },
    };

    // 成为jquery插件
    $.fn.loading = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                loading = $this.data('$.loading');

            // 创建对象并缓存
            if (!loading) {
                if (option == 'destroy') return; // 无需创建
                loading = new Loading($this, options);
                $this.data('$.loading', loading);
            }

            // 执行方法
            if (typeof option == 'string') loading[option](param);
        });
    };
})(window, $, _);