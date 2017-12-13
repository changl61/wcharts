//============================================
//  jQuery对象级插件 -- 时间范围拾取
//============================================
(function (window, $, _, moment) {
    // 定义构造函数
    var DatetimeRangePicker = function($input, options) {
        // 元素
        this.$input = $input;
        this.range = '';

        // 载入设置项
        var defaults = {

        };
        this.settings = $.extend(true, {}, defaults, options);

        // 私有属性
        this._initialized = false;

        this.autoWidth();
    };

    // 初始化方法
    DatetimeRangePicker.prototype = {
        $modal: [],
        $absolute: [],
        $relative: [],
        $absoluteStart: [],
        $absoluteEnd: [],

        template: '<div class="modal fade"id="datetime-range-picker"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">绝对时间</h4></div><div class="modal-body"><div class="datetime-absolute"><input type="text"class="form-control"name="start"value=""/>&nbsp;~&nbsp;<input type="text"class="form-control"name="end"value=""/><br/><button type="button"class="btn btn-default"handle="confirm">确定</button></div></div><div class="modal-header sub-header"><h4 class="modal-title">相对时间</h4></div><div class="modal-body"><ul class="datetime-relative"><li class="btns-month"><button value="本月"class="btn btn-default"type="button">本月</button><button value="上个月"class="btn btn-default"type="button">上个月</button><button value="最近3个月"class="btn btn-default"type="button">最近3个月</button><button value="最近6个月"class="btn btn-default"type="button">最近6个月</button><button value="最近12个月"class="btn btn-default"type="button">最近12个月</button></li><li class="btns-day"><button value="今天"class="btn btn-default"type="button">今天</button><button value="昨天"class="btn btn-default"type="button">昨天</button><button value="最近7天"class="btn btn-default"type="button">最近7天</button><button value="最近15天"class="btn btn-default"type="button">最近15天</button><button value="最近30天"class="btn btn-default"type="button">最近30天</button></li><li class="btns-hour"><button value="最近1小时"class="btn btn-default"type="button">最近1小时</button><button value="最近3小时"class="btn btn-default"type="button">最近3小时</button><button value="最近6小时"class="btn btn-default"type="button">最近6小时</button><button value="最近12小时"class="btn btn-default"type="button">最近12小时</button><button value="最近24小时"class="btn btn-default"type="button">最近24小时</button></li><li class="btns-minute"><button value="最近1分钟"class="btn btn-default"type="button">最近1分钟</button><button value="最近5分钟"class="btn btn-default"type="button">最近5分钟</button><button value="最近10分钟"class="btn btn-default"type="button">最近10分钟</button><button value="最近15分钟"class="btn btn-default"type="button">最近15分钟</button><button value="最近30分钟"class="btn btn-default"type="button">最近30分钟</button></li></ul></div><div class="modal-footer"><button type="button"class="btn btn-default"data-dismiss="modal">关闭</button></div></div></div></div>',
        format: 'YYYY-MM-DD HH:mm:ss',

        initialize: function() {
            if (this._initialized) return this.$input;

            this._render()._listen();

            this._initialized = true; return this.$input;
        },

        // 时间表单宽度自适应
        autoWidth: function () {
            var timeRange = this.$input.val();
            if (timeRange.indexOf(' ~ ') >= 0) {
                this.$input.css('width', '275px');
            } else {
                this.$input.css('width', '103px');
            }
        },

        _render: function () {
            this.$modal = $('#datetime-range-picker');
            if (!this.$modal.length) {
                $('body').append(this.template);
                this.$modal = $('#datetime-range-picker');
            }

            this.$absolute = $('#datetime-range-picker .datetime-absolute');
            this.$absoluteStart = this.$absolute.find('input[name="start"]');
            this.$absoluteEnd = this.$absolute.find('input[name="end"]');
            this.$relative = $('#datetime-range-picker .datetime-relative');


            var datetimePickerOptions = {
                format: 'yyyy-mm-dd hh:ii',
                endDate: moment().format('YYYY-MM-DD') + ' 23:59:59',
                autoclose: true,
            }
            this.$absoluteStart.datetimepicker(datetimePickerOptions);
            this.$absoluteEnd.datetimepicker(datetimePickerOptions);

            return this;
        },

        _listen: function () {
            var _this = this;

            // 魔态框展开
            this.$input.click(function () {
                _this._open();
            });

            // 宽度自适应
            this.$input.change(function () {
                _this.autoWidth();
            });

            // 绝对时间 - 开始时间改变
            this.$absoluteStart.change(function () {
                _this._whenAbsoluteStartChange();
            }).bind('show.daterangepicker', function () {
                $(this).prop('disabled', true);
            }).bind('hide.daterangepicker', function () {
                $(this).prop('disabled', false);
            });

            // 绝对时间 - 开始时间改变
            this.$absoluteEnd.change(function () {
                _this._whenAbsoluteEndChange();
            }).bind('show.daterangepicker', function () {
                $(this).prop('disabled', true);
            }).bind('hide.daterangepicker', function () {
                $(this).prop('disabled', false);
            });

            // 绝对时间 - 确定
            this.$absolute.on('click', '[handle="confirm"]', function (e) {
                _this._pickup('absolute');
            });

            // 相对时间 - 点击
            this.$relative.on('click', 'button', function (e) {
                _this._pickup('relative', $(e.target).text());
            });

            // 魔态框关闭
            this.$modal.on('hidden.bs.modal', function () {
                _this._close();
            });

            return this;
        },

        _open: function () {
            this.$modal.modal('show');
            this.$input.prop('disabled', true);
            this.range = this.$input.val();

            // 绝对时间
            if (!$.isRelativeDateTimeRange(this.range)) {
                var range = this.range.split(' ~ ');
                this.$absolute.find('input[name="start"]').val(range[0]);
                this.$absolute.find('input[name="end"]').val(range[1]);
            }

            // 相对时间
            else {
                $('button[value="'+this.range+'"]').addClass('active');
            }

            // 验证
            this._validateAbsoluteValue();
        },

        _whenAbsoluteStartChange: function () {
            var start = this.$absoluteStart.val(), end = this.$absoluteEnd.val()

            // 设置"结束时间"的最小时间为"开始时间"
            this.$absoluteEnd.data('datetimepicker').setStartDate(start + ':59');

            // 如果"开始时间"大于等于"结束时间", "结束时间"置空
            if (moment(start).unix() >= moment(end).unix()) this.$absoluteEnd.val('').trigger('change');

            // 验证
            this._validateAbsoluteValue();
        },

        _whenAbsoluteEndChange: function () {
            this._validateAbsoluteValue();
        },

        _validateAbsoluteValue: function () {
            var error = !(this.$absoluteStart.val() && this.$absoluteEnd.val());
            this.$absolute.find('[handle="confirm"]').prop('disabled', error ? true : false);

            return error
        },

        _pickup: function (type, text) {
            var range = '';
            if (type == 'absolute') {
                range = this.$absoluteStart.val() + ' ~ ' + this.$absoluteEnd.val();
            } else if (type == 'relative') {
                range = text;
            }

            this.$input.val(range).trigger('change');
            this.$modal.modal('hide');
        },

        _close: function () {
            this.$input.prop('disabled', false);
            this.$absolute.find('input:text').val('');
            $('.btn-default', this.$relative).removeClass('active');
        },
    };

    // 成为jquery插件
    $.fn.datetimeRangePicker = function(options) {
        // 创建实体
        var picker = new DatetimeRangePicker(this, options);

        // 调用其方法
        return picker.initialize();
    };
})(window, $, _, moment);