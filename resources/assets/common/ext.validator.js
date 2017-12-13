//============================================
//  jQuery对象级插件 -- 表单验证
//============================================
(function (window, $, _) {
    // 定义构造函数
    var Validator = function($element, options) {
        this.$element = [];
        this.settings = {};
        this.enabled = false;

        this.rules = {};
        this.errors = {};
        this.submitted = false;

        this.initialize($element, options);
    };

    // 初始化方法
    Validator.prototype = {
        defaults: {
            rules: {},
            showError: function (field, message, $form) {
                var $field = $('[name="'+field+'"]', $form), $errorParent = $field.closest('.form-input'),
                    $error = $errorParent.children('.validator-error').length
                        ? $errorParent.children('.validator-error')
                        : $errorParent.append('<p class="validator-error"></p>').children('.validator-error');

                $field.focus();
                $field.closest('.form-group').addClass('has-error');
                $error.text(message);
            },
            hideError: function (field, $form) {
                var $field = $('[name="'+field+'"]', $form),
                    $error = $field.closest('.form-input').children('.validator-error');

                $field.closest('.form-group').removeClass('has-error');
                $error.empty();
            },
        },

        // 验证方法
        methods: {
            // 是否必填
            required: function (value, $field, param) {
                return value.length > 0;
            },

            // 数字类型
            number: function (value, $field, param) {
                if (!value.length) return true;

                return /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test( value );
            },

            // 整数类型
            int: function (value, $field, param) {
                if (!value.length) return true;

                return /^\d+$/.test( value );
            },

            // 字符长度(选项个数)范围[min, max]
            length: function (value, $field, param) {
                if (!value.length) return true;
                
                return value.length >= parseInt(param[0]) && value.length <= parseInt(param[1]);
            },

            // 最小字符长度(选项个数)
            minLength: function (value, $field, param) {
                if (!value.length) return true;

                return value.length >= parseInt(param);
            },

            // 最大字符长度(选项个数)
            maxLength: function (value, $field, param) {
                if (!value.length) return true;

                return value.length <= parseInt(param);
            },

            // 数字大小范围[min, max]
            range: function (value, $field, param) {
                if (!value.length || typeof value != 'string') return true;

                return parseFloat(value) >= parseFloat(param[0]) && parseFloat(value) <= parseFloat(param[1]);
            },

            // 最小数值
            min: function (value, $field, param) {
                if (!value.length || typeof value != 'string') return true;

                return parseFloat(value) >= parseFloat(param);
            },

            // 最大数值
            max: function (value, $field, param) {
                if (!value.length || typeof value != 'string') return true;

                return parseFloat(value) <= parseFloat(param);
            },

            // 是否相等
            equal: function (value, $field, param) {
                if (!value.length) return true;

                return value == param;
            },

            // 邮件格式
            email: function (value, $field, param) {
                if (!value.length) return true;

                return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test( value );
            },

            // 手机号格式
            mobile: function (value, $field, param) {
                if (!value.length) return true;

                return /^1[34578][0-9]{9}$/.test(value);
            },

            // 日期格式
            date: function (value, $field, param) {
                if (!value.length) return true;

                if (param == 'yyyy-dd-mm' || param == 'yyyy/dd/mm') {
                    return /^(\d{4})[\/\-](0\d{1}|1[0-2])[\/\-](0\d{1}|[12]\d{1}|3[01])$/.test( value );
                }

                else if (param == 'yyyy-dd' || param == 'yyyy/dd') {
                    return /^(\d{4})[\/\-](0\d{1}|1[0-2])$/.test( value );
                }

                else if (param == 'yyyy') {
                    return /^(\d{4})$/.test( value );
                }

                else {
                    return /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test( value );
                }
            },

            // 时间格式
            time: function (value, $field, param) {
                if (!value.length) return true;

                if (param == 'hh') {
                    return /^(0\d{1}|1\d{1}|2[0-3])$/.test( value );
                }

                else if (param == 'hh:mm') {
                    return /^(0\d{1}|1\d{1}|2[0-3]):([0-5]\d{1})$/.test( value );
                }

                else if (param == 'hh:mm:ss') {
                    return /^(0\d{1}|1\d{1}|2[0-3]):[0-5]\d{1}:([0-5]\d{1})$/.test( value );
                }

                else {
                    return /^(0\d{1}|1\d{1}|2[0-3]):[0-5]\d{1}(:([0-5]\d{1}))?$/.test( value );
                }
            },

            // 用户名
            userName: function (value, $field, param) {
                if (!value.length) return true;

                return /^[a-z]+[0-9]*$/.test( value );
            }
        },

        // 错误消息
        messages: {
            required: '这是必填项',
            number: '请输入整数或小数',
            int: '请输入整数',
            mobile: '请输入手机号',
            length: '请输入{p0}至{p1}位字符',
            minLength: '请输入至少{p0}位字符',
            maxLength: '最多输入{p0}位字符',
            range: '输入值大小在{p0}到{p1}之间',
            min: '输入值需大于或等于{p0}',
            max: '输入值需小于或等于{p0}',
            equal: '输入值需等于{p0}',
            email: '邮件格式不正确',
            date: '日期格式不正确',
            time: '时间格式不正确',
            userName: '请输入正确的用户名(字母或字母+数字)',
        },

        initialize: function($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend(true, {}, this.defaults, this.$element.data(), options);
            this.enabled = true;
            this._setRules()._listen();

            return this.$element;
        },

        destroy: function () {
            this.enabled = false;
            this.$element.data('$.validator', null);

            return this.$element;
        },

        // 执行验证
        valid: function (field) {
            // 单个字段
            if (field) {
                this._checkField(field);

                return !!(this.errors[field]);
            }

            // 整体表单
            else {
                this.submitted = true;

                for (var field in this.rules) {
                    this._checkField(field);
                }

                return this.isValid();
            }
        },

        // 是否通过验证
        isValid: function () {
            return $.isEmptyObject(this.errors);
        },

        // 增加错误
        addError: function (field, message) {
            this.errors[field] = message;

            if (typeof this.settings.showError == 'function') {
                this.settings.showError(field, message, this.$element);
            }
        },

        // 移除错误
        removeError: function (field) {
            delete this.errors[field];

            if (typeof this.settings.showError == 'function') {
                this.settings.hideError(field, this.$element);
            }
        },

        _listen: function () {
            var self = this;

            // 值改变是触发验证
            for (var field in this.rules) {
                $('[name="'+field+'"]', this.$element).change(function () {
                    if (!self.submitted) return;
                    self.valid($(this).attr('name'));
                });
            }

            // 键盘抬起触发验证
            for (var field in this.rules) {
                $('[name="'+field+'"]', this.$element).keyup(function () {
                    if (!self.submitted) return;
                    self.valid($(this).attr('name'));
                });
            }

            // 表单提交时整体验证
            this.$element.submit(function () {
                self.valid();
            });

            // 数字类型, 禁止无效字符
            $('[type="number"]', this.$element).keydown(function (e) {
                if (e.keyCode <= 20) return true;
                return !!(e.key + '').match(/[0-9\-\.]/);
            });

            return this;
        },

        // 设置验证规则
        _setRules: function () {
            var rules = {}
            for (var field in this.settings.rules) {
                rules[field] = this._parseRules(this.settings.rules[field]);
            }
            this.rules = rules;

            return this;
        },

        // 解析验证规则
        _parseRules: function (str) {
            var ruleArr = str.split('|'), ruleStr = '', rules = [];

            for (var i = 0; i < ruleArr.length; i++) {
                ruleStr = ruleArr[i];
                if (!ruleStr) continue;

                var arr = ruleStr.split(':'),
                    ruleName = arr[0],
                    ruleValue = arr[1];

                var messageMatch = ruleValue ? ruleValue.match(/\`.*\`$/) : '';
                var paramMatch = ruleValue ? ruleValue.split('`')[0] : '';
                var param = paramMatch ? paramMatch.split(',') : [];

                rules.push({
                    name: ruleName,
                    param: param,
                    message: messageMatch ? messageMatch[0].split('`')[1] : this._getRuleMessage(ruleName, param),
                });
            }

            return rules;
        },

        // 获取错误消息
        _getRuleMessage: function (ruleName, param) {
            var message = this.messages[ruleName] || '';
            if (message && param.length) message = this._decorateMessage(message, param)

            return message;
        },

        // 修饰错误消息
        _decorateMessage: function (message, param) {
            var placeholders = message.match(/\{p[0-9]?\}/g);
            if (!placeholders) return message;

            for (var i = 0; i < placeholders.length; i++) {
                var placeholder = placeholders[i], n = parseInt(placeholder[2]);
                message = message.replace('{p'+n+'}', param[n]);
            }

            return message;
        },

        // 检测单个字段
        _checkField: function (field) {
            try {
                var rules = this.rules[field] || {};

                for (var i = 0; i < rules.length; i++) {
                    if (!this._checkRule(field, rules[i])) return false;
                }

                return true;
            } catch(error) {
               console.log(error);
            }
        },

        // 检测单个规则
        _checkRule: function (field, rule) {
            var $field = $('[name="'+field+'"]', this.$element);

            // 表单不存在
            if (!$field.length) return true;

            // 验证通过
            var value = $.getValByName(field, this.$element);

            if ( this.methods[rule.name](value, $field , rule.param) ) {
                this.removeError(field);
                return true;
            }

            // 不通过
            else {
                this.addError(field, rule.message);
                return false;
            }
        },
    };

    // 成为jquery插件
    $.fn.validator = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                validator = $this.data('instance.validator');

            // 仅限<form>
            if ($(this)[0]['tagName'] != 'FORM') return;

            // 创建对象并缓存
            if (!validator) {
                if (option == 'destroy') return; // 无需创建
                validator = new Validator($this, options);
                $this.data('instance.validator', validator);
            }

            // 执行方法
            if (typeof option == 'string') validator[option](param);
        });
    };

    // 添加验证方法
    jQuery.extend({
        addValidatorMethods: function (name, func, message) {
            var methods = Validator.prototype.methods,
                messages = Validator.prototype.messages;

            // 已存在不可覆盖
            if (methods[name]) return false;

            methods[name] = func;
            messages[name] = message;

            return true;
        }
    });
})(window, $, _);