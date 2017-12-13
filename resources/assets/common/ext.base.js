//===========================================
//  jQuery类本身添加方法
//===========================================
jQuery.extend({
    // HTTP请求封装
    http: {
        /**
         * http 获取
         *
         * @param  url     str 请求链接
         * @param  data    mix 请求数据
         * @param  options obj 其它选项 {success: callback, error: callback, complete: callback, ...}
         * @return xhr
         */
        get: function (url, data, options) {
            return new this.AjaxCall('GET', url,    data||{}, options||{});
        },

        post: function (url, data, options) {
            return new this.AjaxCall('POST', url,   data||{}, options||{});
        },

        put: function (url, data, options) {
            return new this.AjaxCall('PUT', url,    data||{}, options||{});
        },

        patch: function (url, data, options) {
            return new this.AjaxCall('PATCH', url,  data||{}, options||{});
        },

        delete: function (url, data, options) {
            return new this.AjaxCall('DELETE', url, data||{}, options||{});
        },

        /**
         * 异步上传文件
         *
         * @param url     str 上传地址
         * @param $file   $   文件表单
         * @param options obj 其它选项 {success: callback, error: callback, complete: callback, ...}
         */
        upload: function (url, $file, options) {
            // 默认设置
            var defaults = {
                method: 'POST',
                type: '',
                progress: true,
                success: function () {},
                error: function () {},
                complete: function () {},
            };
            var settings = $.extend(true, {}, defaults, options);

            // 启动动画
            if (options.progress) $.progress.start();

            // 执行上传
            $.ajaxFileUpload(settings.method, url, $file, function (respond) {
                respond = JSON.parse(respond);

                // 成功
                if (typeof respond == 'object' && respond.status && respond.status <= 299) {
                    if (typeof options.success == 'function') options.success(respond);
                }

                // 失败
                else {
                    if (typeof options.error == 'function') options.error(respond);
                }

                // 完成
                if (options.progress) $.progress.done();
                if (typeof options.complete == 'function') options.complete(respond);
            });
        },

        AjaxCall: function (method, url, data, options) {
            // 默认设置
            var defaults = {
                headers: {
                    Accept:  'application/json; charset=UTF-8',
                },
                //contentType: 'application/json; charset=UTF-8',
                dataType: 'json',
                progress: false,
            };
            this.ajaxOptions = $.extend(true, {}, defaults, options);

            // 启动动画
            if (options.progress) $.progress.start();

            // 请求相关
            this.ajaxOptions.type = method;
            this.ajaxOptions.url  = url;
            this.ajaxOptions.data = data;

            // 回调函数 - 成功(status 200-299)
            this.ajaxOptions.success = function (respond, statusText, xhr) {
                // 返回格式错误
                if (typeof respond != 'object' || !respond.status) {
                    $.message.alert('系统错误, 请联系管理员');
                    return;
                }

                // 执行成功回调
                if (typeof options.success == 'function') options.success(respond.data, respond.status, respond.msg);
            };

            // 回调函数 - 错误(status >=300)
            this.ajaxOptions.error = function (xhr, statusText, error) {
                var respond = xhr.responseJSON;

                // 请求流产
                if (typeof respond == 'undefined') return;

                // 返回格式错误
                if (typeof respond != 'object' || !respond.status) {
                    $.message.alert('系统错误, 请联系管理员');
                    return;
                }

                // 302跳转
                if (respond.status == 302) {
                    $.message.tip(respond.msg, function () {
                        if (respond.data.redirectUrl) {
                            location.href = respond.data.redirectUrl;
                        }
                    });
                    return;
                }

                // 未授权
                else if (respond.status == 401) {
                    $.message.pity('您尚未登录或账户已过期, 请重新登录', function () {
                        location.href = respond.data.redirectUrl;
                    });
                    return;
                }

                // 未授权
                else if (respond.status >= 500) {
                    $.message.alert(respond.msg);
                    return;
                }

                // 执行失败回调
                if (typeof options.error == 'function') options.error(respond.data, respond.status, respond.msg);

            };

            // 回调函数 - 完成
            this.ajaxOptions.complete = function (xhr) {
                if (options.progress) $.progress.done();
                if (typeof options.complete == 'function') options.complete();
            };

            // 执行AJAX
            this.xhr = $.ajax(this.ajaxOptions);
        },
    },

    // 进度条
    progress: {
        html: '<div id="ext-progress"><p class="percentage" style="overflow: hidden;"></p></div>',
        currentNum: 0,
        percentage: 0,
        $percentage: [],
        intervalId: null,

        start: function () {
            this.currentNum++;

            if (!$('#ext-progress').length) {
                $('body').append(this.html);
                this.$percentage = $('#ext-progress .percentage');
            }

            if (this.currentNum <= 1) {
                var self = this;
                this.$percentage.css({width: '0%', height: '2px'});
                this.intervalId = setInterval(function () {
                    var increment = (98 - self.percentage) / 8;
                    self.set(self.percentage + increment);
                }, 250);
            } else {
                this.percentage = 98 / this.currentNum;
            }

            return this;
        },

        set: function (n) {
            if (n < 0 || n > 98) return;
            this.percentage = n;
            this.$percentage.animate({width: this.percentage + '%'}, 200);

            return this;
        },

        done: function () {
            if (this.currentNum == 0) return;

            this.currentNum--;
            if (this.currentNum == 0) {
                clearInterval(this.intervalId);
                this.$percentage.animate({width: '100%'}, 50);
                this.$percentage.animate({height: '0px'}, 300);
                this.percentage = 0;
            }

            return this;
        },
    },

    // 消息框
    message: {
        wrap: '<div id="ext-message"><ul class="message-list"></ul></div>',
        template: '<li class="message message-<%= color %>"><% if (showCloseBtn) { %><button type="button" class="close">×</button><% } %><%= content %></li>',
        templateForConfirm: '<div class="unit-confirm"><h5 class="confirm-title"><%= title %></h5><div class="confirm-content">"<%= content %>"</div><div class="confirm-btns"><a class="confirm-yes">确定</a><a class="confirm-no">取消</a></div></div>',
        $wrap: [],
        $modalForConfirm: [],

        // 提示
        tip: function (text, callback) {
            var $message = this._setWrapOnce()._renderMessage({
                color: 'success animation-fadeInDown',
                showCloseBtn: false,
                content: text,
            });

            setTimeout(function () {
                $message.fadeOut('slow', function () {
                    $(this).remove();
                    if (typeof callback == 'function') callback();
                });
            }, 1000);
        },

        // 遗憾
        pity: function (text, callback) {
            var $message = this._setWrapOnce()._renderMessage({
                color: 'default animation-fadeInDown',
                showCloseBtn: false,
                content: text,
            });

            setTimeout(function () {
                $message.fadeOut('slow', function () {
                    $(this).remove();
                    if (typeof callback == 'function') callback();
                });
            }, 3000);
        },

        // 告知
        notify: function (text) {
            this._setWrapOnce()._renderMessage({
                color: 'success do-slideInDown',
                showCloseBtn: true,
                content: text,
            });
        },

        // 警示
        warn: function (text) {
            this._setWrapOnce()._renderMessage({
                color: 'warning animation-shake',
                showCloseBtn: true,
                content: text,
            });
        },

        // 报警
        alert: function (text) {
            this._setWrapOnce()._renderMessage({
                color: 'danger animation-shake',
                showCloseBtn: true,
                content: text,
            });
        },

        // 确认
        confirm: function (text, options) {
            this._renderModal({
                title: text,
                content: options.content ? options.content : '',
            });

            // 点击事件
            var self = this;
            this.$modalForConfirm.find('.confirm-yes').click(function () {
                if (typeof options.yes == 'function') options.yes();
                self.$modalForConfirm.modal('hide');
            });

            this.$modalForConfirm.find('.confirm-no').click(function () {
                if (typeof options.no == 'function') options.no();
                self.$modalForConfirm.modal('hide');
            });
        },

        _setWrapOnce: function () {
            if (this.$wrap.length) return this;

            $('body').append(this.wrap);
            this.$wrap = $('#ext-message .message-list');
            this.$wrap.on('click', 'button.close', function () {
                $(this).closest('li.message').fadeOut('fast', function () { $(this).remove(); });
            })

            return this;
        },

        _renderMessage: function (model) {
            var message = _.template(this.template)(model);
            this.$wrap.append(message);

            return this.$wrap.find('li:last');
        },

        _renderModal: function (model) {
            // 魔态框
            if (!this.$modalForConfirm.length) {
                var modal = '<div class="modal fade" id="ext-message-confirm"><div class="modal-dialog modal-sm"><div class="modal-content"></div></div></div>';
                $('body').append(modal);
            }
            this.$modalForConfirm = $('#ext-message-confirm');

            // 消息内容
            var message = _.template(this.templateForConfirm)(model);
            this.$modalForConfirm.find('.modal-content').html(message);
            this.$modalForConfirm.modal('show');
        },
    },

    // 文件上传
    ajaxFileUpload: function(method, url, $file, callback) {
        var iframeName = 'ajaxFileUpload_' + Math.round(10000);
        var iframe = '<iframe name="'+ iframeName +'" src="/file/upload" width="0" height="0"></iframe>';
        var form = '<form method="' + method + '" enctype="multipart/form-data"></form>';

        var $iframe = $('body').append(iframe).find('iframe:last');
        $iframe.load(function () {
            $form = $(window.frames[iframeName].document).find('body').html(form).find('form');
            $form.append($file.clone()).trigger('submit');

            $(this).unbind('load').load(function () {
                var respond = '{"data":{},"status":400,"msg":"success"}';
                if (typeof callback == 'function') callback(respond);
                $iframe.remove();
            });
        });
    },

    makeShareUrl: function (type, prototypeId) {
        var modal = '<div id="modal-share"class="modal fade"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">分享链接</h4></div><div class="modal-body"><p class="share-url">...</p><p class="share-tips">复制以上链接发送给好友,无需登录即可访问</p></div><div class="modal-footer"><button type="button"class="btn btn-default"data-dismiss="modal">关闭</button></div></div></div></div>';
        if (!$('#modal-share').length) $('body').append(modal);
        var $modal = $('#modal-share').modal('show');

        $.http.post('/share/create', {
            type: type,
            prototypeId: prototypeId,
        }, {
            success: function (data) {
                $modal.find('.share-url').text(data.url);
            },
        });
    },

    /**
     * 根据表单名获取其值
     * @param  name     string 表单名
     * @param  $context $      上下文
     * @return null,str,arr
     */
    getValByName: function (name, $context) {
        var $element = $('input[name="'+name+'"], select[name="'+name+'"], textarea[name="'+name+'"]', $context);
        if (!$element.length) return null;

        var type = $element.attr('type'), tagName = $element[0]['tagName'].toLowerCase();

        // 单选按钮
        if (type == 'radio') {
            return $element.filter(":checked").val() || '';
        }

        // 多选框
        else if (type == 'checkbox') {
            var val = [];
            $element.filter(":checked").each(function () {
                val.push($(this).val());
            });

            return val;
        }

        // 多选拉下菜单
        else if (tagName == 'select' && $element.prop('multiple')) {
            return $element.val() || [];
        }

        // 其它
        else {
            return $element.val() || '';
        }
    },

    // 多个表单取值
    getValByNames: function (names, $context) {
        var values = {};

        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            values[name] = $.getValByName(name, $context);
        }

        return values;
    },

    // 获取请求参数
    getParam: function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var arr = window.location.search.substr(1).match(reg);
        return (arr != null) ?  decodeURI(arr[2]) : null;
    },

    // 前端渲染
    render: function (templateName, model) {
        var template = $('#template-' + templateName).html();
        return _.template(template)(model);
    },

    /**
     * 载入tpl中的模版再渲染
     * @param  filename     str 模版文件名 /assets/tpl/*.html
     * @param  templateName str 模版名称
     * @param  model        obj 数据模型
     * @return str
     */
    renderFormTpl: function (filename, templateName, model) {
        var templateId = 'tpl-' + filename + '-' + templateName,
            $template = $('#' + templateId);

        if (!$template.length) {
            $.loadTplSync(filename);
            $template = $('#' + templateId);
        }

        var template = $template.html();
        return _.template(template)(model);
    },

    /**
     * 同步阻塞方式载入模版
     * @param  name str 模版文件名 /assets/tpl/*.html
     * @return undefined
     */
    loadTplSync: function (filename) {
        $.ajax({
            url: '/assets/tpl/'+filename+'.html',
            async: false,
            success: function(html){
                $('body').append(html);
            },
        });
    },

    // 判断是否为相对时间
    isRelativeDateTimeRange: function (timeRange) {
        return (timeRange.indexOf(' ~ ') > 0) ? false : true;
    },

    // 文本转换为相对时间
    parseRelativeDateTimeRange: function (text) {
        var self = this;

        this.format = 'YYYY-MM-DD HH:mm:ss';
        this.relative = {
            '最近1分钟'  : function () { return self.parseLatest(1, 'm'); },
            '最近5分钟'  : function () { return self.parseLatest(5, 'm'); },
            '最近10分钟' : function () { return self.parseLatest(10, 'm'); },
            '最近15分钟' : function () { return self.parseLatest(15, 'm'); },
            '最近30分钟' : function () { return self.parseLatest(30, 'm'); },

            '最近1小时'  : function () { return self.parseLatest(1, 'h'); },
            '最近3小时'  : function () { return self.parseLatest(3, 'h'); },
            '最近6小时'  : function () { return self.parseLatest(6, 'h'); },
            '最近12小时' : function () { return self.parseLatest(12, 'h'); },
            '最近24小时' : function () { return self.parseLatest(24, 'h'); },

            '今天' : function () {
                return moment().format('YYYY-MM-DD 00:00:00') + ' ~ ' + moment().format(self.format);
            },
            '昨天' : function () {
                return moment().subtract(1, 'd').format('YYYY-MM-DD 00:00:00') + ' ~ ' + moment().format('YYYY-MM-DD 00:00:00');
            },
            '最近7天'  : function () { return self.parseLatest(7, 'd'); },
            '最近15天' : function () { return self.parseLatest(15, 'd'); },
            '最近30天' : function () { return self.parseLatest(30, 'd'); },

            '本月' : function () {
                return moment().format('YYYY-MM-01 00:00:00') + ' ~ ' + moment().format(self.format);
            },
            '上个月' : function () {
                return moment().subtract(1, 'M').format('YYYY-MM-01 00:00:00') + ' ~ ' + moment().format('YYYY-MM-01 00:00:00');
            },
            '最近3个月'  : function () { return self.parseLatest(3, 'M'); },
            '最近6个月'  : function () { return self.parseLatest(3, 'M'); },
            '最近12个月' : function () { return self.parseLatest(12, 'M'); },
        };

        this.parseLatest = function (num, unit) {
            return moment().subtract(num, unit).format(self.format) + ' ~ ' + moment().format(self.format);
        };

        return this.relative[text]();
    },
});