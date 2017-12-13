//============================================
//  jQuery对象级插件 -- ES筛选条件
//============================================
(function (window, $) {
    // 定义构造函数
    var EsFilter = function($input, options) {
        // 元素
        this.$input = $input;
        this.$filters = [];
        this.$createBtn = [];

        // 载入设置项
        var defaults = {
            mapping: {}, // 字段映射
        };
        this.settings = $.extend(true, {}, defaults, options);

        // 私有属性
        this._initialized = false;
    };

    // 初始化方法
    EsFilter.prototype = {
        template: '<ul class="es-filter"></ul><button class="btn btn-default"type="button"handle="create"title="添加"><i class="glyphicon glyphicon-plus text-primary"></i></button>',
        itemTemplate: '<li class="filter-item"><input type="hidden"name="field"format=""value=""/>&nbsp;<input type="hidden"name="operator"value=""/>&nbsp;<span class="filter-value"><input class="form-control"type="text"name="value"format=""value=""title=""/><i class="glyphicon glyphicon-minus-sign delete-filter"handle="delete"title="删除"></i></span></li>',
        fields: [],
        operatorMap: {
            date: [
                {text:'at', value:'date_at'},
                {text:'range', value:'date_range'}
            ],
            string: [
                {text:'=', value:'string_='},
                {text:'!=', value:'string_!='},
                {text:'like', value:'string_like'},
                {text:'match', value:'string_match'},
                {text:'in', value:'string_in'},
            ],
            numeric: [
                {text:'=', value:'numeric_='},
                {text:'!=', value:'numeric_!='},
                {text:'>=', value:'numeric_>='},
                {text:'<=', value:'numeric_<='},
                {text:'>', value:'numeric_>'},
                {text:'<', value:'numeric_<'},
                {text:'in', value:'numeric_in'},
                {text:'range', value:'numeric_range'},
            ],
        },
        valueMap: {
            'date_at':      {tooltip:'某个时间, 如: 2017-05 或 2017-05-01 或 2017-05-01 08 或 2017-05-01 08:30 或 2017-05-01 08:30:10',},
            'date_range':   {tooltip:'在某个时间范围中, 如: 2017-05-01 08:30 ~ 2017-05-02 08:30',},
            'string_=':     {tooltip:'完全匹配',},
            'string_!=':    {tooltip:'完全不匹配',},
            'string_like':  {tooltip:'通配符匹配, "?"代表某一个字符, "*"代表任意多个字符',},
            'string_match': {tooltip:'正则匹配, 如: .*\\.ffan\\.com',},
            'string_in':    {tooltip:'完全匹配其一, 多个逗号分割, 格式如: a,b,c',},
            'numeric_=':    {tooltip:'数字',},
            'numeric_!=':   {tooltip:'数字',},
            'numeric_>=':   {tooltip:'数字',},
            'numeric_<=':   {tooltip:'数字',},
            'numeric_>':    {tooltip:'数字',},
            'numeric_<':    {tooltip:'数字',},
            'numeric_in':   {tooltip:'等于其一, 多个逗号分割, 格式如: 1,2,3',},
            'numeric_range':{tooltip:'在某个范围中, 格式如: 10~100',},
        },

        initialize: function() {
            if (this._initialized) return this;

            this.fields = this._getFields();
            this._render()._listen();

            this._initialized = true; return this;
        },

        val: function () {
            var filters = [];

            $('li.filter-item', this.$filters).each(function () {
                filters.push({
                    field: $('[name=field]', $(this)).val(),
                    operator: $('[name=operator]', $(this)).val(),
                    value: $('[name=value]', $(this)).val(),
                });
            });
            this.$input.val(JSON.stringify(filters));

            return filters;
        },

        _render: function () {
            this.$input.parent().append(this.template);
            this.$filters = this.$input.siblings('.es-filter');
            this.$createBtn = this.$input.siblings('button[handle="create"]');

            var filters = JSON.parse(this.$input.val());
            for (var i = 0; i < filters.length; i++) {
                this._renderItem(filters[i]);
            }

            return this;
        },

        _renderItem: function (filter) {
            var $item  = this.$filters.append(this.itemTemplate).children('li:last'),
                format = this.settings.mapping[filter.field],
                valueFormat = filter.operator;

            $item.find('[name="field"]').val(filter.field).attr('format', format).dropdownSelector({options: this.fields});
            $item.find('[name="operator"]').val(filter.operator).dropdownSelector({options: this._getFieldOperators(filter.field)});
            $item.find('[name="value"]').val(filter.value).attr('format', valueFormat);
            $item.find('[name="value"]').attr('title', this.valueMap[valueFormat]['tooltip']).tooltip({container:'body'}); // 输入提示

            return this;
        },

        _listen: function () {
            var self = this;

            // 增加规则
            this.$createBtn.click(function () { self._create(); });

            // 删除规则
            this.$filters.on('click', '[handle="delete"]', function (e) { self._delete($(e.target).closest('.filter-item')); });

            // 字段改变
            this.$filters.on('change', '[name="field"]', function (e) { self._changeField($(e.target).closest('.filter-item')); });

            // 运算符改变
            this.$filters.on('change', '[name="operator"]', function (e) { self._changeOperator($(e.target).closest('.filter-item')); });

            return this;
        },

        // 增加规则
        _create: function () {
            var operators = this._getFieldOperators(this.fields[0]);
            this._renderItem({
                field: this.fields[0],
                operator: operators[0]['value'],
                value: ''
            });

            this.$input.trigger('esFilter.create');
            return this;
        },

        // 删除规则
        _delete: function ($item) {
            $('input:text', $item).tooltip('destroy');
            $item.remove();

            this.$input.trigger('esFilter.delete');
            return this;
        },

        // 字段改变
        _changeField: function ($item) {
            var $field = $item.find('[name="field"]'),
                $operator = $item.find('[name="operator"]'),
                $value = $item.find('[name="value"]'),

                format = this.settings.mapping[$field.val()],
                valueFormat = $operator.val();

            // 字段类型改变
            if (format != $field.attr('format')) {
                $field.attr('format', format);
                this._updateValue($value, valueFormat);  // 更新条件的值
                this._updateOperator($operator, format); // 更新运算符
            }

            this.$input.trigger('esFilter.changeField');
            return this;
        },

        // 运算符改变
        _changeOperator: function ($item) {
            var $operator = $item.find('[name="operator"]'),
                $value = $item.find('[name="value"]'),
                valueFormat = $operator.val();

            this._updateValue($value, valueFormat);  // 更新条件的值
        },

        // 更新运算符
        _updateOperator: function ($operator, format) {
            $operator.dropdownSelector('updateOptions', this.operatorMap[format]);
        },


        // 更新条件的值
        _updateValue: function ($value, valueFormat) {
            $value.val('');
            $value.attr('format', valueFormat).attr('data-original-title', this.valueMap[valueFormat] ? this.valueMap[valueFormat]['tooltip'] : '');
        },

        // 获取字段
        _getFields: function () {
            var fields = [];

            for (var key in this.settings.mapping) {
                if (key != '@timestamp') fields.push(key);
            }

            // @timestamp 放在最后
            if (this.settings.mapping['@timestamp']) fields.push('@timestamp');

            return fields;
        },

        // 获取字段对应的运算符
        _getFieldOperators: function (field) {
            var format = this.settings.mapping[field] ? this.settings.mapping[field] : 'string';
            return this.operatorMap[format];
        },
    };

    // 成为jquery插件
    $.fn.esFilter = function(options) {
        // 已创建, 直接返回
        if (this.data('instance.esfilter')) return this.data('instance.esfilter');

        // 创建实例, 初始化
        var filter = new EsFilter(this, options);
        filter.initialize();

        // 暂存, 并返回实例
        if (this.data('instance.esfilter', filter)) return filter;
    };
})(window, $);