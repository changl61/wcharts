//============================================
//  jQuery对象级插件 -- ES条件范围
//============================================
(function (window, $) {
    /**
     * 定义构造函数
     * @param $element jQuery
     * @param options  obj
     */
    var EsTermRanges = function($element, options) {
        this.$element = [];
        this.$wrap = [];
        this.settings = {};
        this.enabled  = false;

        this.initialize($element, options);
    }

    /**
     * 静态属性和方法
     */
    EsTermRanges.prototype = {
        templateOfWrap: '<ul class="es-term-ranges"></ul>',
        templateOfCreate: '<li class="add-range-item"><button class="btn btn-default btn-block"type="button"handle="create"><i class="glyphicon glyphicon-plus text-primary"handle="create"></i></button></li>',
        defaults: {
            model: [{from:'*', to:100}, {from:101, to:'*'}],
        },

        initialize: function ($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend({}, this.defaults, this.$element.data(), options);
            this.enabled  = true;

            var model = this.$element.val() ? JSON.parse(this.$element.val()) : [];
            if (model.length) this.settings.model = model;

            return this._render()._listen();
        },

        createItem: function (item) {
            var itemHtml = this._getItemHtml(item || {from:'', to:''});
            $('[handle="create"]', this.$wrap).closest('li').before(itemHtml);

            this.$wrap.find('.range-item:last input:text').tooltip({title:'请输入数字或"*"', container:'body'});

            return this;
        },

        deleteItem: function ($item) {
            $item.remove();

            return this;
        },

        toString: function () {
            var ranges = [];

            $('li.range-item', this.$wrap).each(function () {
                ranges.push({
                    from: $(this).find('[name="from"]').val(),
                    to: $(this).find('[name="to"]').val(),
                });
            });
            this.$element.val(JSON.stringify(ranges));

            return this;
        },

        destroy: function () {
            this.$wrap.find('li').remove();
            this.$element.unwrap().val('[]').data('obj.esTermRanges', null);

            return this;
        },

        _render: function () {
            this.$element.wrap(this.templateOfWrap);
            this.$wrap = this.$element.parent();

            var itemHtml = '';
            for (var i = 0; i < this.settings.model.length; i++) {
                var item = this.settings.model[i];
                itemHtml += this._getItemHtml(item);
            }
            itemHtml += this.templateOfCreate;

            this.$wrap.append(itemHtml);
            this.$wrap.find('input:text').tooltip({title:'请输入数字或"*"', container:'body'});

            return this;
        },

        _getItemHtml: function (item) {
            return '' +
                '<li class="range-item">' +
                '<input class="form-control"name="from"value="'+item.from+'"/>&nbsp;~&nbsp;<input class="form-control"name="to"value="'+item.to+'"/>' +
                '<i class="glyphicon glyphicon-minus-sign text-danger"handle="delete"></i>' +
                '</li>';
        },

        _listen: function () {
            var self = this;

            // 增加一条
            this.$wrap.on('click', '[handle="create"]', function () {
                self.createItem();
            });

            // 删除一条
            this.$wrap.on('click', '[handle="delete"]', function () {
                self.deleteItem($(this).closest('li'));
            });

            return this;
        },
    };


    /**
     * 成为jquery插件
     * @param  option object or string
     * @param  param  multy
     * @return jQuery
     */
    $.fn.esTermRanges = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                esTermRanges = $this.data('obj.esTermRanges');

            if (!esTermRanges) {
                if (option == 'destroy') return;                   // 无需创建
                esTermRanges = new EsTermRanges($this, options);   // 创建对象并缓存
                $this.data('obj.esTermRanges', esTermRanges);
            }

            if (typeof option == 'string') esTermRanges[option](param); // 执行方法
        });
    };
})(window, $);