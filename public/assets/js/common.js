$(function () {
    // 页面切换动画
    $('.app-musk').fadeOut(1000);

    // 工具提示
    $('[data-toggle="tooltip"]').tooltip({container: 'body'});

    // 回到顶部
    $('.app-handles [handle="goToTop"]').click(function () {
        $('html,body').animate({scrollTop: '0px'}, 300);
    });

    // 全屏/退出全屏
    $('.app-handles [handle="fullScreen"]').click(function () {
        if ($(this).data('full')) {
            $('.app-right').animate({paddingLeft: '60px'}, 500, function () {
                $(this).trigger('resize');
            });
            $('.app-main').animate({marginTop: '48px'}, 500);
            $('.app-left').delay(500).show();
            $('.app-tab').delay(500).show();
            $(this).data('full', 0);
        } else {
            $('.app-left').hide();
            $('.app-tab').hide();
            $('.app-right').animate({paddingLeft: '0px'}, 500, function () {
                $(this).trigger('resize');
            });
            $('.app-main').animate({marginTop: '10px'}, 500);
            $(this).data('full', 1);
        }
    });

    // 退出登录
    $('[handle="logout"]').click(function () {
        $.http.get('/team/accounts', {}, {
            success: function (data) {
                $('#modal-switch-account .account-item').remove();

                if (data.team.length) {
                    var teamAccounts = '';
                    for (var i = 0; i < data.team.length; i++) {
                        teamAccounts += '<dd class="account-item" data-id="'+data.team[i]['id']+'">'+data.team[i]['name']+' <i class="iconfont icon-ok"></i></dd>';
                    }
                    var userAccounts =  '<dd class="account-item" data-id="'+data.prototype.id+'">'+data.prototype.name+' <i class="iconfont icon-ok"></i></dd>';

                    $('#modal-switch-account .team-accounts').append(teamAccounts);
                    $('#modal-switch-account .user-accounts').append(userAccounts);
                    $('#modal-switch-account .account-item[data-id="'+data.activeId+'"]').addClass('active');
                    $('#modal-switch-account').modal('show');
                } else {
                    window.location.href = '/auth/logout';
                }
            },
            error: function (data, status, msg) {
                $.message.warn(msg);
            },
        });
    });

    // 切换账户
    $('#modal-switch-account').on('click', '.account-item:not(.active)', function () {
        $.http.get('/auth/switch/' + $(this).data('id'));
    });
});
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
/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (value !== undefined && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setTime(+t + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {};

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
		var cookies = document.cookie ? document.cookie.split('; ') : [];

		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			var name = decode(parts.shift());
			var cookie = parts.join('=');

			if (key && key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key) === undefined) {
			return false;
		}

		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));

//============================================
//  jQuery对象级插件 -- 统计面板网格展示
//============================================
(function (window, $, _) {
    /**
     * 定义构造函数
     * @param $element jQuery
     * @param options  obj
     */
    var DashboardGrid = function($element, options) {
        this.$element = []; // 容器
        this.settings = {};
        this.enabled  = false;

        this.gridOfContent = [];

        this.initialize($element, options);
    }

    /**
     * 静态属性和方法
     */
    DashboardGrid.prototype = {
        defaults: {
            dragger: '',
            rightResizer: '',
            content: '',
            empty:'',
            minWidth: 250,
            minHeight: 190,
        },

        initialize: function ($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend({}, this.defaults, this.$element.data(), options);
            this.enabled  = true;

            return this._render()._listen();
        },

        toString: function () {
            var frame = '';

            $('.dashboard-row', this.$element).each(function () {
                frame += '<div class="dashboard-row" style="'+ $(this).attr('style') +'">';

                $('.dashboard-cell', $(this)).each(function () {
                    var id = $(this).children('.chart-item').data('id') || '';
                    frame += '<div class="dashboard-cell" data-content="'+ id +'" style="'+ $(this).attr('style') +'"></div>';
                });

                frame += '</div>';
            });

            return frame;
        },

        renderCell: function ($cell) {
            var content = $cell.data('content');

            if (content) {
                $cell.html(this.settings.content);
                $cell.children().attr('data-id', content);
                $cell.trigger('render.dashboardGrid');
            } else {
                $cell.html(this.settings.empty);
            }

            return this;
        },

        removeCell: function ($cell) {
            var $row = $cell.parent();
            $cell.remove();
            this._adjustEmptyCell($row);
            this.$element.trigger('change.dashboardGrid');

            return this;
        },

        _render: function () {
            var self = this;

            this.$element.find('.dashboard-cell').each(function () {
                self.renderCell($(this));
            });

            return this;
        },

        _listen: function () {
            var self  = this;

            // 拖拽
            this.$element.on('mousedown', this.settings.dragger, function (e) {
                self._drag(e, $(this).closest('.dashboard-cell'));
            });

            // 缩放 - 右侧
            this.$element.on('mousedown', this.settings.rightResizer, function (e) {
                self._resize(e, $(this).closest('.dashboard-cell'));
            });

            // 增加行
            this.$element.on('click', '[handle="createRow"]', function (e) {
                $(this).before('<div class="dashboard-row" style="height: 190px;"><div class="dashboard-cell" style="width: 100%">'+ self.settings.empty + '</div></div>');
                self.$element.trigger('change.dashboardGrid');
            });

            // 删除行
            this.$element.on('click', '[handle="deleteRow"]', function (e) {
                $(this).closest('.dashboard-row').remove();
                self.$element.trigger('change.dashboardGrid');
            });

            return this;
        },

        _drag: function (e, $cell) {
            var self  = this, mouseStart = {x:e.clientX, y:e.clientY};

            $cell.addClass('active');
            this._setGridOfContent();

            document.onmousemove = function(e) {
                var mouseEnd = {x:e.clientX, y:e.clientY},
                    x = mouseEnd.x - mouseStart.x,
                    y = mouseEnd.y - mouseStart.y;

                $cell.children().css({top : y, left : x, zIndex: 2});
                self._setTargetCell(mouseEnd);
            };

            document.onmouseup = function(e) {
                document.onmousemove = null;
                document.onmouseup = null;

                var $targetCell = $('.dashboard-cell.target', self.$element), $activeCell = $cell;


                if (!$targetCell.length) {
                    $activeCell.removeClass('active').children().animate({top : 0, left : 0, zIndex: 0}, 200, 'swing');
                } else {
                    var $targetCellContent = $targetCell.data('content'),
                        $activeCellContent = $activeCell.data('content');

                    $targetCell.data('content', $activeCellContent).removeClass('target');
                    self.renderCell($targetCell);

                    if (!$targetCellContent) {
                        var $activeRow = $activeCell.parent();
                        $activeCell.remove();
                        self._adjustEmptyCell($activeRow);
                    } else {
                        $activeCell.data('content', $targetCellContent).removeClass('active');
                        self.renderCell($activeCell);
                    }

                    self.$element.trigger('change.dashboardGrid');
                }
            };
        },

        _resize: function (e, $cell) {
            var self  = this;

            var mouseStart = {x:e.clientX, y:e.clientY};

            var $row = $cell.parent(),
                $nextCell = $cell.next('.dashboard-cell').length ?  $cell.next('.dashboard-cell').first() : self._appendEmptyCell($row);

            var start = {
                row: {width: $row.outerWidth(), height: $row.outerHeight()},
                cell: {width: $cell.outerWidth()},
                nextCell: {width: self._countTdWidth($nextCell)},
            };

            var nextCellIsEmpty = !!$nextCell.children('.chart-empty').length;

            document.onmousemove = function(e) {
                var mouseEnd = {x:e.clientX, y:e.clientY},
                    x = mouseEnd.x - mouseStart.x,
                    y = mouseEnd.y - mouseStart.y;

                var end = {
                    row: {height: start.row.height + y},
                    cell: {width: start.cell.width + x},
                    nextCell: {width: start.nextCell.width - x},
                }

                // 行高度
                if (end.row.height >= self.settings.minHeight) {
                    $row.css('height', end.row.height);
                }

                // 单元格宽度
                if (end.cell.width < 0 || end.nextCell.width <= 0) return;

                if (!nextCellIsEmpty && end.cell.width >= self.settings.minWidth && end.nextCell.width >= self.settings.minWidth) {
                    $cell.css('width', end.cell.width/start.row.width*100 + '%');
                    $nextCell.css('width', end.nextCell.width/start.row.width*100 + '%');
                }

                if (nextCellIsEmpty) {
                    if (end.cell.width >= self.settings.minWidth) {
                        $cell.css('width', end.cell.width/start.row.width*100 + '%');
                        $nextCell.css('width', end.nextCell.width/start.row.width*100 + '%');
                    }
                    end.nextCell.width >= self.settings.minWidth ? $nextCell.children().show() : $nextCell.children().hide();
                }
            };

            document.onmouseup = function(e) {
                document.onmousemove = null;
                document.onmouseup = null;
                self._adjustSize($row, $cell, $nextCell);
            };
        },

        _appendEmptyCell: function ($row) {
            $row.append('<div class="dashboard-cell" data-content="" style="width: 0px">'+ this.settings.empty + '</div>');
            var $cell = $row.children(':last');
            $cell.children().hide();

            return $cell;
        },

        _countTdWidth: function ($td) {
            var trWidth = $td.parent().outerWidth(), otherWidth = 0;

            $td.siblings().each(function () {
                otherWidth += $(this).outerWidth();
            });

            return trWidth - otherWidth -1;
        },

        _adjustSize: function ($row, $cell, $nextCell) {
            var self = this;

            var old = {
                row: { width: $row.outerWidth(), height: $row.outerHeight()},
                cell : { width: $cell.outerWidth()},
                nextCell : { width: $nextCell.outerWidth()},
            }

            var now = {
                row: { height: self._getAdjustNum(old.row.height)},
                cell : { width: 0},
                nextCell : { width: 0},
            }

            if (!$nextCell.data('content') && old.nextCell.width < this.settings.minWidth) {
                now.cell.width = old.cell.width + old.nextCell.width;
                $nextCell.remove();
            } else {
                now.cell.width = self._getAdjustNum(old.cell.width);
                now.nextCell.width = old.cell.width + old.nextCell.width - now.cell.width;
                $nextCell.animate({width: now.nextCell.width/old.row.width*100 + '%'}, 200, 'swing');
            }

            $cell.animate({width: now.cell.width/old.row.width*100 + '%'}, 200, 'swing');
            $row.animate({height: now.row.height}, 200, 'swing', function () {
                $row.children('.dashboard-cell').trigger('resized.dashboardGrid');
                self.$element.trigger('change.dashboardGrid');
            });
        },

        _getAdjustNum: function (num) {
            return Math.round(num / 10) * 10;
        },

        _setGridOfContent: function () {
            var grid = [];

            $('.dashboard-cell > div', this.$element).each(function () {
                if ($(this).parent().hasClass('active')) return;

                var offset = $(this).offset();
                grid.push({
                    tl: offset,
                    br: {top: offset.top + $(this).outerHeight(), left: offset.left + $(this).outerWidth()},
                    $cell: $(this).parent(),
                });
            });

            this.gridOfContent = grid;
        },

        _setTargetCell: function (mouse) {
            for (var i = 0; i < this.gridOfContent.length; i++) {
                var item = this.gridOfContent[i];

                if (mouse.y >= item.tl.top && mouse.x >= item.tl.left && mouse.y <= item.br.top && mouse.x <= item.br.left) {
                    item.$cell.addClass('target');
                } else {
                    item.$cell.removeClass('target');
                }
            }
        },

        _adjustEmptyCell: function ($row) {
            var $empty = $row.find('.chart-empty'), $cell = [];
            if ($empty.length) {
                $cell = $empty.parent();
            } else {
                $cell = this._appendEmptyCell($row);
            }

            $cell.css('width', this._countTdWidth($cell)/$row.outerWidth()*100 + '%').children().show();
        },
    };

    /**
     * 成为jquery插件
     * @param  option object or string
     * @param  param  multy
     * @return jQuery
     */
    $.fn.dashboardGrid = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                instance = $this.data('instance.dashboardGrid');

            // 仅限<table>
            if ($(this)[0]['tagName'].toLowerCase() != 'div') return;

            if (!instance) {
                if (option == 'destroy') return; // 无需创建
                instance = new DashboardGrid($this, options);  // 创建对象并缓存
                $this.data('instance.dashboardGrid', instance);
            }

            if (typeof option == 'string') instance[option](param); // 执行方法
        });
    };
})(window, $, _);
/* =========================================================
 * bootstrap-datetimepicker.js
 * =========================================================
 * Copyright 2012 Stefan Petre
 * Improvements by Andrew Rowls
 * Improvements by Sébastien Malot
 * Improvements by Yun Lai
 * Improvements by Kenneth Henderick
 * Project URL : http://www.malot.fr/bootstrap-datetimepicker
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

/*
 * Improvement by CuGBabyBeaR @ 2013-09-12
 *
 * Make it work in bootstrap v3
 */

!function ($) {

    function UTCDate() {
        return new Date(Date.UTC.apply(Date, arguments));
    }

    function UTCToday() {
        var today = new Date();
        return UTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), today.getUTCHours(), today.getUTCMinutes(), today.getUTCSeconds(), 0);
    }

    // Picker object

    var Datetimepicker = function (element, options) {
        var that = this;

        this.element = $(element);

        // add container for single page application
        // when page switch the datetimepicker div will be removed also.
        this.container = options.container || 'body';

        this.language = options.language || this.element.data('date-language') || "en";
        this.language = this.language in dates ? this.language : "en";
        this.isRTL = dates[this.language].rtl || false;
        this.formatType = options.formatType || this.element.data('format-type') || 'standard';
        this.format = DPGlobal.parseFormat(options.format || this.element.data('date-format') || dates[this.language].format || DPGlobal.getDefaultFormat(this.formatType, 'input'), this.formatType);
        this.isInline = false;
        this.isVisible = false;
        this.isInput = this.element.is('input');
        this.fontAwesome = options.fontAwesome || this.element.data('font-awesome') || false;

        this.bootcssVer = options.bootcssVer || (this.isInput ? (this.element.is('.form-control') ? 3 : 2) : ( this.bootcssVer = this.element.is('.input-group') ? 3 : 2 ));

        this.component = this.element.is('.date') ? ( this.bootcssVer == 3 ? this.element.find('.input-group-addon .glyphicon-th, .input-group-addon .glyphicon-time, .input-group-addon .glyphicon-calendar, .input-group-addon .glyphicon-calendar, .input-group-addon .fa-calendar, .input-group-addon .fa-clock-o').parent() : this.element.find('.add-on .icon-th, .add-on .icon-time, .add-on .icon-calendar .fa-calendar .fa-clock-o').parent()) : false;
        this.componentReset = this.element.is('.date') ? ( this.bootcssVer == 3 ? this.element.find(".input-group-addon .glyphicon-remove, .input-group-addon .fa-times").parent():this.element.find(".add-on .icon-remove, .add-on .fa-times").parent()) : false;
        this.hasInput = this.component && this.element.find('input').length;
        if (this.component && this.component.length === 0) {
            this.component = false;
        }
        this.linkField = options.linkField || this.element.data('link-field') || false;
        this.linkFormat = DPGlobal.parseFormat(options.linkFormat || this.element.data('link-format') || DPGlobal.getDefaultFormat(this.formatType, 'link'), this.formatType);
        this.minuteStep = options.minuteStep || this.element.data('minute-step') || 5;
        this.pickerPosition = options.pickerPosition || this.element.data('picker-position') || 'bottom-right';
        this.showMeridian = options.showMeridian || this.element.data('show-meridian') || false;
        this.initialDate = options.initialDate || new Date();
        this.zIndex = options.zIndex || this.element.data('z-index') || undefined;

        this.icons = {
            leftArrow: this.fontAwesome ? 'fa-arrow-left' : (this.bootcssVer === 3 ? 'glyphicon-arrow-left' : 'icon-arrow-left'),
            rightArrow: this.fontAwesome ? 'fa-arrow-right' : (this.bootcssVer === 3 ? 'glyphicon-arrow-right' : 'icon-arrow-right')
        };
        this.icontype = this.fontAwesome ? 'fa' : 'glyphicon';

        this._attachEvents();

        this.formatViewType = "datetime";
        if ('formatViewType' in options) {
            this.formatViewType = options.formatViewType;
        } else if ('formatViewType' in this.element.data()) {
            this.formatViewType = this.element.data('formatViewType');
        }

        this.minView = 0;
        if ('minView' in options) {
            this.minView = options.minView;
        } else if ('minView' in this.element.data()) {
            this.minView = this.element.data('min-view');
        }
        this.minView = DPGlobal.convertViewMode(this.minView);

        this.maxView = DPGlobal.modes.length - 1;
        if ('maxView' in options) {
            this.maxView = options.maxView;
        } else if ('maxView' in this.element.data()) {
            this.maxView = this.element.data('max-view');
        }
        this.maxView = DPGlobal.convertViewMode(this.maxView);

        this.wheelViewModeNavigation = false;
        if ('wheelViewModeNavigation' in options) {
            this.wheelViewModeNavigation = options.wheelViewModeNavigation;
        } else if ('wheelViewModeNavigation' in this.element.data()) {
            this.wheelViewModeNavigation = this.element.data('view-mode-wheel-navigation');
        }

        this.wheelViewModeNavigationInverseDirection = false;

        if ('wheelViewModeNavigationInverseDirection' in options) {
            this.wheelViewModeNavigationInverseDirection = options.wheelViewModeNavigationInverseDirection;
        } else if ('wheelViewModeNavigationInverseDirection' in this.element.data()) {
            this.wheelViewModeNavigationInverseDirection = this.element.data('view-mode-wheel-navigation-inverse-dir');
        }

        this.wheelViewModeNavigationDelay = 100;
        if ('wheelViewModeNavigationDelay' in options) {
            this.wheelViewModeNavigationDelay = options.wheelViewModeNavigationDelay;
        } else if ('wheelViewModeNavigationDelay' in this.element.data()) {
            this.wheelViewModeNavigationDelay = this.element.data('view-mode-wheel-navigation-delay');
        }

        this.startViewMode = 2;
        if ('startView' in options) {
            this.startViewMode = options.startView;
        } else if ('startView' in this.element.data()) {
            this.startViewMode = this.element.data('start-view');
        }
        this.startViewMode = DPGlobal.convertViewMode(this.startViewMode);
        this.viewMode = this.startViewMode;

        this.viewSelect = this.minView;
        if ('viewSelect' in options) {
            this.viewSelect = options.viewSelect;
        } else if ('viewSelect' in this.element.data()) {
            this.viewSelect = this.element.data('view-select');
        }
        this.viewSelect = DPGlobal.convertViewMode(this.viewSelect);

        this.forceParse = true;
        if ('forceParse' in options) {
            this.forceParse = options.forceParse;
        } else if ('dateForceParse' in this.element.data()) {
            this.forceParse = this.element.data('date-force-parse');
        }
        var template = this.bootcssVer === 3 ? DPGlobal.templateV3 : DPGlobal.template;
        while (template.indexOf('{iconType}') !== -1) {
            template = template.replace('{iconType}', this.icontype);
        }
        while (template.indexOf('{leftArrow}') !== -1) {
            template = template.replace('{leftArrow}', this.icons.leftArrow);
        }
        while (template.indexOf('{rightArrow}') !== -1) {
            template = template.replace('{rightArrow}', this.icons.rightArrow);
        }
        this.picker = $(template)
            .appendTo(this.isInline ? this.element : this.container) // 'body')
            .on({
                click:     $.proxy(this.click, this),
                mousedown: $.proxy(this.mousedown, this)
            });

        if (this.wheelViewModeNavigation) {
            if ($.fn.mousewheel) {
                this.picker.on({mousewheel: $.proxy(this.mousewheel, this)});
            } else {
                console.log("Mouse Wheel event is not supported. Please include the jQuery Mouse Wheel plugin before enabling this option");
            }
        }

        if (this.isInline) {
            this.picker.addClass('datetimepicker-inline');
        } else {
            this.picker.addClass('datetimepicker-dropdown-' + this.pickerPosition + ' dropdown-menu');
        }
        if (this.isRTL) {
            this.picker.addClass('datetimepicker-rtl');
            var selector = this.bootcssVer === 3 ? '.prev span, .next span' : '.prev i, .next i';
            this.picker.find(selector).toggleClass(this.icons.leftArrow + ' ' + this.icons.rightArrow);
        }
        $(document).on('mousedown', function (e) {
            // Clicked outside the datetimepicker, hide it
            if ($(e.target).closest('.datetimepicker').length === 0) {
                that.hide();
            }
        });

        this.autoclose = false;
        if ('autoclose' in options) {
            this.autoclose = options.autoclose;
        } else if ('dateAutoclose' in this.element.data()) {
            this.autoclose = this.element.data('date-autoclose');
        }

        this.keyboardNavigation = true;
        if ('keyboardNavigation' in options) {
            this.keyboardNavigation = options.keyboardNavigation;
        } else if ('dateKeyboardNavigation' in this.element.data()) {
            this.keyboardNavigation = this.element.data('date-keyboard-navigation');
        }

        this.todayBtn = (options.todayBtn || this.element.data('date-today-btn') || false);
        this.todayHighlight = (options.todayHighlight || this.element.data('date-today-highlight') || false);

        this.weekStart = ((options.weekStart || this.element.data('date-weekstart') || dates[this.language].weekStart || 0) % 7);
        this.weekEnd = ((this.weekStart + 6) % 7);
        this.startDate = -Infinity;
        this.endDate = Infinity;
        this.daysOfWeekDisabled = [];
        this.setStartDate(options.startDate || this.element.data('date-startdate'));
        this.setEndDate(options.endDate || this.element.data('date-enddate'));
        this.setDaysOfWeekDisabled(options.daysOfWeekDisabled || this.element.data('date-days-of-week-disabled'));
        this.setMinutesDisabled(options.minutesDisabled || this.element.data('date-minute-disabled'));
        this.setHoursDisabled(options.hoursDisabled || this.element.data('date-hour-disabled'));
        this.fillDow();
        this.fillMonths();
        this.update();
        this.showMode();

        if (this.isInline) {
            this.show();
        }
    };

    Datetimepicker.prototype = {
        constructor: Datetimepicker,

        _events:       [],
        _attachEvents: function () {
            this._detachEvents();
            if (this.isInput) { // single input
                this._events = [
                    [this.element, {
                        focus:   $.proxy(this.show, this),
                        keyup:   $.proxy(this.update, this),
                        keydown: $.proxy(this.keydown, this)
                    }]
                ];
            }
            else if (this.component && this.hasInput) { // component: input + button
                this._events = [
                    // For components that are not readonly, allow keyboard nav
                    [this.element.find('input'), {
                        focus:   $.proxy(this.show, this),
                        keyup:   $.proxy(this.update, this),
                        keydown: $.proxy(this.keydown, this)
                    }],
                    [this.component, {
                        click: $.proxy(this.show, this)
                    }]
                ];
                if (this.componentReset) {
                    this._events.push([
                        this.componentReset,
                        {click: $.proxy(this.reset, this)}
                    ]);
                }
            }
            else if (this.element.is('div')) {  // inline datetimepicker
                this.isInline = true;
            }
            else {
                this._events = [
                    [this.element, {
                        click: $.proxy(this.show, this)
                    }]
                ];
            }
            for (var i = 0, el, ev; i < this._events.length; i++) {
                el = this._events[i][0];
                ev = this._events[i][1];
                el.on(ev);
            }
        },

        _detachEvents: function () {
            for (var i = 0, el, ev; i < this._events.length; i++) {
                el = this._events[i][0];
                ev = this._events[i][1];
                el.off(ev);
            }
            this._events = [];
        },

        show: function (e) {
            this.picker.show();
            this.height = this.component ? this.component.outerHeight() : this.element.outerHeight() + 54;
            if (this.forceParse) {
                this.update();
            }
            this.place();
            $(window).on('resize', $.proxy(this.place, this));
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            this.isVisible = true;
            this.element.trigger({
                type: 'show',
                date: this.date
            });
        },

        hide: function (e) {
            if (!this.isVisible) return;
            if (this.isInline) return;
            this.picker.hide();
            $(window).off('resize', this.place);
            this.viewMode = this.startViewMode;
            this.showMode();
            if (!this.isInput) {
                $(document).off('mousedown', this.hide);
            }

            if (
                this.forceParse &&
                (
                    this.isInput && this.element.val() ||
                    this.hasInput && this.element.find('input').val()
                )
            )
                this.setValue();
            this.isVisible = false;
            this.element.trigger({
                type: 'hide',
                date: this.date
            });
        },

        remove: function () {
            this._detachEvents();
            this.picker.remove();
            delete this.picker;
            delete this.element.data().datetimepicker;
        },

        getDate: function () {
            var d = this.getUTCDate();
            return new Date(d.getTime() + (d.getTimezoneOffset() * 60000));
        },

        getUTCDate: function () {
            return this.date;
        },

        setDate: function (d) {
            this.setUTCDate(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)));
        },

        setUTCDate: function (d) {
            if (d >= this.startDate && d <= this.endDate) {
                this.date = d;
                this.setValue();
                this.viewDate = this.date;
                this.fill();
            } else {
                this.element.trigger({
                    type:      'outOfRange',
                    date:      d,
                    startDate: this.startDate,
                    endDate:   this.endDate
                });
            }
        },

        setFormat: function (format) {
            this.format = DPGlobal.parseFormat(format, this.formatType);
            var element;
            if (this.isInput) {
                element = this.element;
            } else if (this.component) {
                element = this.element.find('input');
            }
            if (element && element.val()) {
                this.setValue();
            }
        },

        setValue: function () {
            var formatted = this.getFormattedDate();
            if (!this.isInput) {
                if (this.component) {
                    this.element.find('input').val(formatted);
                }
                this.element.data('date', formatted);
            } else {
                this.element.val(formatted);
            }
            if (this.linkField) {
                $('#' + this.linkField).val(this.getFormattedDate(this.linkFormat));
            }
        },

        getFormattedDate: function (format) {
            if (format == undefined) format = this.format;
            return DPGlobal.formatDate(this.date, format, this.language, this.formatType);
        },

        setStartDate: function (startDate) {
            this.startDate = startDate || -Infinity;
            if (this.startDate !== -Infinity) {
                this.startDate = DPGlobal.parseDate(this.startDate, this.format, this.language, this.formatType);
            }
            this.update();
            this.updateNavArrows();
        },

        setEndDate: function (endDate) {
            this.endDate = endDate || Infinity;
            if (this.endDate !== Infinity) {
                this.endDate = DPGlobal.parseDate(this.endDate, this.format, this.language, this.formatType);
            }
            this.update();
            this.updateNavArrows();
        },

        setDaysOfWeekDisabled: function (daysOfWeekDisabled) {
            this.daysOfWeekDisabled = daysOfWeekDisabled || [];
            if (!$.isArray(this.daysOfWeekDisabled)) {
                this.daysOfWeekDisabled = this.daysOfWeekDisabled.split(/,\s*/);
            }
            this.daysOfWeekDisabled = $.map(this.daysOfWeekDisabled, function (d) {
                return parseInt(d, 10);
            });
            this.update();
            this.updateNavArrows();
        },

        setMinutesDisabled: function (minutesDisabled) {
            this.minutesDisabled = minutesDisabled || [];
            if (!$.isArray(this.minutesDisabled)) {
                this.minutesDisabled = this.minutesDisabled.split(/,\s*/);
            }
            this.minutesDisabled = $.map(this.minutesDisabled, function (d) {
                return parseInt(d, 10);
            });
            this.update();
            this.updateNavArrows();
        },

        setHoursDisabled: function (hoursDisabled) {
            this.hoursDisabled = hoursDisabled || [];
            if (!$.isArray(this.hoursDisabled)) {
                this.hoursDisabled = this.hoursDisabled.split(/,\s*/);
            }
            this.hoursDisabled = $.map(this.hoursDisabled, function (d) {
                return parseInt(d, 10);
            });
            this.update();
            this.updateNavArrows();
        },

        place: function () {
            if (this.isInline) return;

            if (!this.zIndex) {
                var index_highest = 0;
                $('div').each(function () {
                    var index_current = parseInt($(this).css("zIndex"), 10);
                    if (index_current > index_highest) {
                        index_highest = index_current;
                    }
                });
                this.zIndex = index_highest + 10;
            }

            var offset, top, left, containerOffset;
            if (this.container instanceof $) {
                containerOffset = this.container.offset();
            } else {
                containerOffset = $(this.container).offset();
            }

            if (this.component) {
                offset = this.component.offset();
                left = offset.left;
                if (this.pickerPosition == 'bottom-left' || this.pickerPosition == 'top-left') {
                    left += this.component.outerWidth() - this.picker.outerWidth();
                }
            } else {
                offset = this.element.offset();
                left = offset.left;
            }

            if(left+220 > document.body.clientWidth){
                left = document.body.clientWidth-220;
            }

            if (this.pickerPosition == 'top-left' || this.pickerPosition == 'top-right') {
                top = offset.top - this.picker.outerHeight();
            } else {
                top = offset.top + this.height;
            }

            top = top - containerOffset.top;
            left = left - containerOffset.left;

            if(this.container != 'body') top = top + document.body.scrollTop

            this.picker.css({
                top:    top,
                left:   left,
                zIndex: this.zIndex
            });
        },

        update: function () {
            var date, fromArgs = false;
            if (arguments && arguments.length && (typeof arguments[0] === 'string' || arguments[0] instanceof Date)) {
                date = arguments[0];
                fromArgs = true;
            } else {
                date = (this.isInput ? this.element.val() : this.element.find('input').val()) || this.element.data('date') || this.initialDate;
                if (typeof date == 'string' || date instanceof String) {
                    date = date.replace(/^\s+|\s+$/g,'');
                }
            }

            if (!date) {
                date = new Date();
                fromArgs = false;
            }

            this.date = DPGlobal.parseDate(date, this.format, this.language, this.formatType);

            if (fromArgs) this.setValue();

            if (this.date < this.startDate) {
                this.viewDate = new Date(this.startDate);
            } else if (this.date > this.endDate) {
                this.viewDate = new Date(this.endDate);
            } else {
                this.viewDate = new Date(this.date);
            }
            this.fill();
        },

        fillDow: function () {
            var dowCnt = this.weekStart,
                html = '<tr>';
            while (dowCnt < this.weekStart + 7) {
                html += '<th class="dow">' + dates[this.language].daysMin[(dowCnt++) % 7] + '</th>';
            }
            html += '</tr>';
            this.picker.find('.datetimepicker-days thead').append(html);
        },

        fillMonths: function () {
            var html = '',
                i = 0;
            while (i < 12) {
                html += '<span class="month">' + dates[this.language].monthsShort[i++] + '</span>';
            }
            this.picker.find('.datetimepicker-months td').html(html);
        },

        fill: function () {
            if (this.date == null || this.viewDate == null) {
                return;
            }
            var d = new Date(this.viewDate),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth(),
                dayMonth = d.getUTCDate(),
                hours = d.getUTCHours(),
                minutes = d.getUTCMinutes(),
                startYear = this.startDate !== -Infinity ? this.startDate.getUTCFullYear() : -Infinity,
                startMonth = this.startDate !== -Infinity ? this.startDate.getUTCMonth() + 1 : -Infinity,
                endYear = this.endDate !== Infinity ? this.endDate.getUTCFullYear() : Infinity,
                endMonth = this.endDate !== Infinity ? this.endDate.getUTCMonth() + 1 : Infinity,
                currentDate = (new UTCDate(this.date.getUTCFullYear(), this.date.getUTCMonth(), this.date.getUTCDate())).valueOf(),
                today = new Date();
            this.picker.find('.datetimepicker-days thead th:eq(1)')
                .text(dates[this.language].months[month] + ' ' + year);
            if (this.formatViewType == "time") {
                var formatted = this.getFormattedDate();
                this.picker.find('.datetimepicker-hours thead th:eq(1)').text(formatted);
                this.picker.find('.datetimepicker-minutes thead th:eq(1)').text(formatted);
            } else {
                this.picker.find('.datetimepicker-hours thead th:eq(1)')
                    .text(dayMonth + ' ' + dates[this.language].months[month] + ' ' + year);
                this.picker.find('.datetimepicker-minutes thead th:eq(1)')
                    .text(dayMonth + ' ' + dates[this.language].months[month] + ' ' + year);
            }
            this.picker.find('tfoot th.today')
                .text(dates[this.language].today)
                .toggle(this.todayBtn !== false);
            this.updateNavArrows();
            this.fillMonths();
            /*var prevMonth = UTCDate(year, month, 0,0,0,0,0);
             prevMonth.setUTCDate(prevMonth.getDate() - (prevMonth.getUTCDay() - this.weekStart + 7)%7);*/
            var prevMonth = UTCDate(year, month - 1, 28, 0, 0, 0, 0),
                day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
            prevMonth.setUTCDate(day);
            prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.weekStart + 7) % 7);
            var nextMonth = new Date(prevMonth);
            nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
            nextMonth = nextMonth.valueOf();
            var html = [];
            var clsName;
            while (prevMonth.valueOf() < nextMonth) {
                if (prevMonth.getUTCDay() == this.weekStart) {
                    html.push('<tr>');
                }
                clsName = '';
                if (prevMonth.getUTCFullYear() < year || (prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() < month)) {
                    clsName += ' old';
                } else if (prevMonth.getUTCFullYear() > year || (prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() > month)) {
                    clsName += ' new';
                }
                // Compare internal UTC date with local today, not UTC today
                if (this.todayHighlight &&
                    prevMonth.getUTCFullYear() == today.getFullYear() &&
                    prevMonth.getUTCMonth() == today.getMonth() &&
                    prevMonth.getUTCDate() == today.getDate()) {
                    clsName += ' today';
                }
                if (prevMonth.valueOf() == currentDate) {
                    clsName += ' active';
                }
                if ((prevMonth.valueOf() + 86400000) <= this.startDate || prevMonth.valueOf() > this.endDate ||
                    $.inArray(prevMonth.getUTCDay(), this.daysOfWeekDisabled) !== -1) {
                    clsName += ' disabled';
                }
                html.push('<td class="day' + clsName + '">' + prevMonth.getUTCDate() + '</td>');
                if (prevMonth.getUTCDay() == this.weekEnd) {
                    html.push('</tr>');
                }
                prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
            }
            this.picker.find('.datetimepicker-days tbody').empty().append(html.join(''));

            html = [];
            var txt = '', meridian = '', meridianOld = '';
            var hoursDisabled = this.hoursDisabled || [];
            for (var i = 0; i < 24; i++) {
                if (hoursDisabled.indexOf(i) !== -1) continue;
                var actual = UTCDate(year, month, dayMonth, i);
                clsName = '';
                // We want the previous hour for the startDate
                if ((actual.valueOf() + 3600000) <= this.startDate || actual.valueOf() > this.endDate) {
                    clsName += ' disabled';
                } else if (hours == i) {
                    clsName += ' active';
                }
                if (this.showMeridian && dates[this.language].meridiem.length == 2) {
                    meridian = (i < 12 ? dates[this.language].meridiem[0] : dates[this.language].meridiem[1]);
                    if (meridian != meridianOld) {
                        if (meridianOld != '') {
                            html.push('</fieldset>');
                        }
                        html.push('<fieldset class="hour"><legend>' + meridian.toUpperCase() + '</legend>');
                    }
                    meridianOld = meridian;
                    txt = (i % 12 ? i % 12 : 12);
                    html.push('<span class="hour' + clsName + ' hour_' + (i < 12 ? 'am' : 'pm') + '">' + txt + '</span>');
                    if (i == 23) {
                        html.push('</fieldset>');
                    }
                } else {
                    txt = i + ':00';
                    html.push('<span class="hour' + clsName + '">' + txt + '</span>');
                }
            }
            this.picker.find('.datetimepicker-hours td').html(html.join(''));

            html = [];
            txt = '', meridian = '', meridianOld = '';
            var minutesDisabled = this.minutesDisabled || [];
            for (var i = 0; i < 60; i += this.minuteStep) {
                if (minutesDisabled.indexOf(i) !== -1) continue;
                var actual = UTCDate(year, month, dayMonth, hours, i, 0);
                clsName = '';
                if (actual.valueOf() < this.startDate || actual.valueOf() > this.endDate) {
                    clsName += ' disabled';
                } else if (Math.floor(minutes / this.minuteStep) == Math.floor(i / this.minuteStep)) {
                    clsName += ' active';
                }
                if (this.showMeridian && dates[this.language].meridiem.length == 2) {
                    meridian = (hours < 12 ? dates[this.language].meridiem[0] : dates[this.language].meridiem[1]);
                    if (meridian != meridianOld) {
                        if (meridianOld != '') {
                            html.push('</fieldset>');
                        }
                        html.push('<fieldset class="minute"><legend>' + meridian.toUpperCase() + '</legend>');
                    }
                    meridianOld = meridian;
                    txt = (hours % 12 ? hours % 12 : 12);
                    //html.push('<span class="minute'+clsName+' minute_'+(hours<12?'am':'pm')+'">'+txt+'</span>');
                    html.push('<span class="minute' + clsName + '">' + txt + ':' + (i < 10 ? '0' + i : i) + '</span>');
                    if (i == 59) {
                        html.push('</fieldset>');
                    }
                } else {
                    txt = i + ':00';
                    //html.push('<span class="hour'+clsName+'">'+txt+'</span>');
                    html.push('<span class="minute' + clsName + '">' + hours + ':' + (i < 10 ? '0' + i : i) + '</span>');
                }
            }
            this.picker.find('.datetimepicker-minutes td').html(html.join(''));

            var currentYear = this.date.getUTCFullYear();
            var months = this.picker.find('.datetimepicker-months')
                .find('th:eq(1)')
                .text(year)
                .end()
                .find('span').removeClass('active');
            if (currentYear == year) {
                // getUTCMonths() returns 0 based, and we need to select the next one
                months.eq(this.date.getUTCMonth() + 2).addClass('active');
            }
            if (year < startYear || year > endYear) {
                months.addClass('disabled');
            }
            if (year == startYear) {
                months.slice(0, startMonth + 1).addClass('disabled');
            }
            if (year == endYear) {
                months.slice(endMonth).addClass('disabled');
            }

            html = '';
            year = parseInt(year / 10, 10) * 10;
            var yearCont = this.picker.find('.datetimepicker-years')
                .find('th:eq(1)')
                .text(year + '-' + (year + 9))
                .end()
                .find('td');
            year -= 1;
            for (var i = -1; i < 11; i++) {
                html += '<span class="year' + (i == -1 || i == 10 ? ' old' : '') + (currentYear == year ? ' active' : '') + (year < startYear || year > endYear ? ' disabled' : '') + '">' + year + '</span>';
                year += 1;
            }
            yearCont.html(html);
            this.place();
        },

        updateNavArrows: function () {
            var d = new Date(this.viewDate),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth(),
                day = d.getUTCDate(),
                hour = d.getUTCHours();
            switch (this.viewMode) {
                case 0:
                    if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()
                        && month <= this.startDate.getUTCMonth()
                        && day <= this.startDate.getUTCDate()
                        && hour <= this.startDate.getUTCHours()) {
                        this.picker.find('.prev').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.prev').css({visibility: 'visible'});
                    }
                    if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()
                        && month >= this.endDate.getUTCMonth()
                        && day >= this.endDate.getUTCDate()
                        && hour >= this.endDate.getUTCHours()) {
                        this.picker.find('.next').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.next').css({visibility: 'visible'});
                    }
                    break;
                case 1:
                    if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()
                        && month <= this.startDate.getUTCMonth()
                        && day <= this.startDate.getUTCDate()) {
                        this.picker.find('.prev').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.prev').css({visibility: 'visible'});
                    }
                    if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()
                        && month >= this.endDate.getUTCMonth()
                        && day >= this.endDate.getUTCDate()) {
                        this.picker.find('.next').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.next').css({visibility: 'visible'});
                    }
                    break;
                case 2:
                    if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()
                        && month <= this.startDate.getUTCMonth()) {
                        this.picker.find('.prev').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.prev').css({visibility: 'visible'});
                    }
                    if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()
                        && month >= this.endDate.getUTCMonth()) {
                        this.picker.find('.next').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.next').css({visibility: 'visible'});
                    }
                    break;
                case 3:
                case 4:
                    if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()) {
                        this.picker.find('.prev').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.prev').css({visibility: 'visible'});
                    }
                    if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()) {
                        this.picker.find('.next').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.next').css({visibility: 'visible'});
                    }
                    break;
            }
        },

        mousewheel: function (e) {

            e.preventDefault();
            e.stopPropagation();

            if (this.wheelPause) {
                return;
            }

            this.wheelPause = true;

            var originalEvent = e.originalEvent;

            var delta = originalEvent.wheelDelta;

            var mode = delta > 0 ? 1 : (delta === 0) ? 0 : -1;

            if (this.wheelViewModeNavigationInverseDirection) {
                mode = -mode;
            }

            this.showMode(mode);

            setTimeout($.proxy(function () {

                this.wheelPause = false

            }, this), this.wheelViewModeNavigationDelay);

        },

        click: function (e) {
            e.stopPropagation();
            e.preventDefault();
            var target = $(e.target).closest('span, td, th, legend');
            if (target.is('.' + this.icontype)) {
                target = $(target).parent().closest('span, td, th, legend');
            }
            if (target.length == 1) {
                if (target.is('.disabled')) {
                    this.element.trigger({
                        type:      'outOfRange',
                        date:      this.viewDate,
                        startDate: this.startDate,
                        endDate:   this.endDate
                    });
                    return;
                }
                switch (target[0].nodeName.toLowerCase()) {
                    case 'th':
                        switch (target[0].className) {
                            case 'switch':
                                this.showMode(1);
                                break;
                            case 'prev':
                            case 'next':
                                var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className == 'prev' ? -1 : 1);
                                switch (this.viewMode) {
                                    case 0:
                                        this.viewDate = this.moveHour(this.viewDate, dir);
                                        break;
                                    case 1:
                                        this.viewDate = this.moveDate(this.viewDate, dir);
                                        break;
                                    case 2:
                                        this.viewDate = this.moveMonth(this.viewDate, dir);
                                        break;
                                    case 3:
                                    case 4:
                                        this.viewDate = this.moveYear(this.viewDate, dir);
                                        break;
                                }
                                this.fill();
                                this.element.trigger({
                                    type:      target[0].className + ':' + this.convertViewModeText(this.viewMode),
                                    date:      this.viewDate,
                                    startDate: this.startDate,
                                    endDate:   this.endDate
                                });
                                break;
                            case 'today':
                                var date = new Date();
                                date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), 0);

                                // Respect startDate and endDate.
                                if (date < this.startDate) date = this.startDate;
                                else if (date > this.endDate) date = this.endDate;

                                this.viewMode = this.startViewMode;
                                this.showMode(0);
                                this._setDate(date);
                                this.fill();
                                if (this.autoclose) {
                                    this.hide();
                                }
                                break;
                        }
                        break;
                    case 'span':
                        if (!target.is('.disabled')) {
                            var year = this.viewDate.getUTCFullYear(),
                                month = this.viewDate.getUTCMonth(),
                                day = this.viewDate.getUTCDate(),
                                hours = this.viewDate.getUTCHours(),
                                minutes = this.viewDate.getUTCMinutes(),
                                seconds = this.viewDate.getUTCSeconds();

                            if (target.is('.month')) {
                                this.viewDate.setUTCDate(1);
                                month = target.parent().find('span').index(target);
                                day = this.viewDate.getUTCDate();
                                this.viewDate.setUTCMonth(month);
                                this.element.trigger({
                                    type: 'changeMonth',
                                    date: this.viewDate
                                });
                                if (this.viewSelect >= 3) {
                                    this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                                }
                            } else if (target.is('.year')) {
                                this.viewDate.setUTCDate(1);
                                year = parseInt(target.text(), 10) || 0;
                                this.viewDate.setUTCFullYear(year);
                                this.element.trigger({
                                    type: 'changeYear',
                                    date: this.viewDate
                                });
                                if (this.viewSelect >= 4) {
                                    this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                                }
                            } else if (target.is('.hour')) {
                                hours = parseInt(target.text(), 10) || 0;
                                if (target.hasClass('hour_am') || target.hasClass('hour_pm')) {
                                    if (hours == 12 && target.hasClass('hour_am')) {
                                        hours = 0;
                                    } else if (hours != 12 && target.hasClass('hour_pm')) {
                                        hours += 12;
                                    }
                                }
                                this.viewDate.setUTCHours(hours);
                                this.element.trigger({
                                    type: 'changeHour',
                                    date: this.viewDate
                                });
                                if (this.viewSelect >= 1) {
                                    this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                                }
                            } else if (target.is('.minute')) {
                                minutes = parseInt(target.text().substr(target.text().indexOf(':') + 1), 10) || 0;
                                this.viewDate.setUTCMinutes(minutes);
                                this.element.trigger({
                                    type: 'changeMinute',
                                    date: this.viewDate
                                });
                                if (this.viewSelect >= 0) {
                                    this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                                }
                            }
                            if (this.viewMode != 0) {
                                var oldViewMode = this.viewMode;
                                this.showMode(-1);
                                this.fill();
                                if (oldViewMode == this.viewMode && this.autoclose) {
                                    this.hide();
                                }
                            } else {
                                this.fill();
                                if (this.autoclose) {
                                    this.hide();
                                }
                            }
                        }
                        break;
                    case 'td':
                        if (target.is('.day') && !target.is('.disabled')) {
                            var day = parseInt(target.text(), 10) || 1;
                            var year = this.viewDate.getUTCFullYear(),
                                month = this.viewDate.getUTCMonth(),
                                hours = this.viewDate.getUTCHours(),
                                minutes = this.viewDate.getUTCMinutes(),
                                seconds = this.viewDate.getUTCSeconds();
                            if (target.is('.old')) {
                                if (month === 0) {
                                    month = 11;
                                    year -= 1;
                                } else {
                                    month -= 1;
                                }
                            } else if (target.is('.new')) {
                                if (month == 11) {
                                    month = 0;
                                    year += 1;
                                } else {
                                    month += 1;
                                }
                            }
                            this.viewDate.setUTCFullYear(year);
                            this.viewDate.setUTCMonth(month, day);
                            this.element.trigger({
                                type: 'changeDay',
                                date: this.viewDate
                            });
                            if (this.viewSelect >= 2) {
                                this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                            }
                        }
                        var oldViewMode = this.viewMode;
                        this.showMode(-1);
                        this.fill();
                        if (oldViewMode == this.viewMode && this.autoclose) {
                            this.hide();
                        }
                        break;
                }
            }
        },

        _setDate: function (date, which) {
            if (!which || which == 'date')
                this.date = date;
            if (!which || which == 'view')
                this.viewDate = date;
            this.fill();
            this.setValue();
            var element;
            if (this.isInput) {
                element = this.element;
            } else if (this.component) {
                element = this.element.find('input');
            }
            if (element) {
                element.change();
                if (this.autoclose && (!which || which == 'date')) {
                    //this.hide();
                }
            }
            this.element.trigger({
                type: 'changeDate',
                date: this.date
            });
        },

        moveMinute: function (date, dir) {
            if (!dir) return date;
            var new_date = new Date(date.valueOf());
            //dir = dir > 0 ? 1 : -1;
            new_date.setUTCMinutes(new_date.getUTCMinutes() + (dir * this.minuteStep));
            return new_date;
        },

        moveHour: function (date, dir) {
            if (!dir) return date;
            var new_date = new Date(date.valueOf());
            //dir = dir > 0 ? 1 : -1;
            new_date.setUTCHours(new_date.getUTCHours() + dir);
            return new_date;
        },

        moveDate: function (date, dir) {
            if (!dir) return date;
            var new_date = new Date(date.valueOf());
            //dir = dir > 0 ? 1 : -1;
            new_date.setUTCDate(new_date.getUTCDate() + dir);
            return new_date;
        },

        moveMonth: function (date, dir) {
            if (!dir) return date;
            var new_date = new Date(date.valueOf()),
                day = new_date.getUTCDate(),
                month = new_date.getUTCMonth(),
                mag = Math.abs(dir),
                new_month, test;
            dir = dir > 0 ? 1 : -1;
            if (mag == 1) {
                test = dir == -1
                    // If going back one month, make sure month is not current month
                    // (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
                    ? function () {
                    return new_date.getUTCMonth() == month;
                }
                    // If going forward one month, make sure month is as expected
                    // (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
                    : function () {
                    return new_date.getUTCMonth() != new_month;
                };
                new_month = month + dir;
                new_date.setUTCMonth(new_month);
                // Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
                if (new_month < 0 || new_month > 11)
                    new_month = (new_month + 12) % 12;
            } else {
                // For magnitudes >1, move one month at a time...
                for (var i = 0; i < mag; i++)
                    // ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
                    new_date = this.moveMonth(new_date, dir);
                // ...then reset the day, keeping it in the new month
                new_month = new_date.getUTCMonth();
                new_date.setUTCDate(day);
                test = function () {
                    return new_month != new_date.getUTCMonth();
                };
            }
            // Common date-resetting loop -- if date is beyond end of month, make it
            // end of month
            while (test()) {
                new_date.setUTCDate(--day);
                new_date.setUTCMonth(new_month);
            }
            return new_date;
        },

        moveYear: function (date, dir) {
            return this.moveMonth(date, dir * 12);
        },

        dateWithinRange: function (date) {
            return date >= this.startDate && date <= this.endDate;
        },

        keydown: function (e) {
            if (this.picker.is(':not(:visible)')) {
                if (e.keyCode == 27) // allow escape to hide and re-show picker
                    this.show();
                return;
            }
            var dateChanged = false,
                dir, day, month,
                newDate, newViewDate;
            switch (e.keyCode) {
                case 27: // escape
                    this.hide();
                    e.preventDefault();
                    break;
                case 37: // left
                case 39: // right
                    if (!this.keyboardNavigation) break;
                    dir = e.keyCode == 37 ? -1 : 1;
                    viewMode = this.viewMode;
                    if (e.ctrlKey) {
                        viewMode += 2;
                    } else if (e.shiftKey) {
                        viewMode += 1;
                    }
                    if (viewMode == 4) {
                        newDate = this.moveYear(this.date, dir);
                        newViewDate = this.moveYear(this.viewDate, dir);
                    } else if (viewMode == 3) {
                        newDate = this.moveMonth(this.date, dir);
                        newViewDate = this.moveMonth(this.viewDate, dir);
                    } else if (viewMode == 2) {
                        newDate = this.moveDate(this.date, dir);
                        newViewDate = this.moveDate(this.viewDate, dir);
                    } else if (viewMode == 1) {
                        newDate = this.moveHour(this.date, dir);
                        newViewDate = this.moveHour(this.viewDate, dir);
                    } else if (viewMode == 0) {
                        newDate = this.moveMinute(this.date, dir);
                        newViewDate = this.moveMinute(this.viewDate, dir);
                    }
                    if (this.dateWithinRange(newDate)) {
                        this.date = newDate;
                        this.viewDate = newViewDate;
                        this.setValue();
                        this.update();
                        e.preventDefault();
                        dateChanged = true;
                    }
                    break;
                case 38: // up
                case 40: // down
                    if (!this.keyboardNavigation) break;
                    dir = e.keyCode == 38 ? -1 : 1;
                    viewMode = this.viewMode;
                    if (e.ctrlKey) {
                        viewMode += 2;
                    } else if (e.shiftKey) {
                        viewMode += 1;
                    }
                    if (viewMode == 4) {
                        newDate = this.moveYear(this.date, dir);
                        newViewDate = this.moveYear(this.viewDate, dir);
                    } else if (viewMode == 3) {
                        newDate = this.moveMonth(this.date, dir);
                        newViewDate = this.moveMonth(this.viewDate, dir);
                    } else if (viewMode == 2) {
                        newDate = this.moveDate(this.date, dir * 7);
                        newViewDate = this.moveDate(this.viewDate, dir * 7);
                    } else if (viewMode == 1) {
                        if (this.showMeridian) {
                            newDate = this.moveHour(this.date, dir * 6);
                            newViewDate = this.moveHour(this.viewDate, dir * 6);
                        } else {
                            newDate = this.moveHour(this.date, dir * 4);
                            newViewDate = this.moveHour(this.viewDate, dir * 4);
                        }
                    } else if (viewMode == 0) {
                        newDate = this.moveMinute(this.date, dir * 4);
                        newViewDate = this.moveMinute(this.viewDate, dir * 4);
                    }
                    if (this.dateWithinRange(newDate)) {
                        this.date = newDate;
                        this.viewDate = newViewDate;
                        this.setValue();
                        this.update();
                        e.preventDefault();
                        dateChanged = true;
                    }
                    break;
                case 13: // enter
                    if (this.viewMode != 0) {
                        var oldViewMode = this.viewMode;
                        this.showMode(-1);
                        this.fill();
                        if (oldViewMode == this.viewMode && this.autoclose) {
                            this.hide();
                        }
                    } else {
                        this.fill();
                        if (this.autoclose) {
                            this.hide();
                        }
                    }
                    e.preventDefault();
                    break;
                case 9: // tab
                    this.hide();
                    break;
            }
            if (dateChanged) {
                var element;
                if (this.isInput) {
                    element = this.element;
                } else if (this.component) {
                    element = this.element.find('input');
                }
                if (element) {
                    element.change();
                }
                this.element.trigger({
                    type: 'changeDate',
                    date: this.date
                });
            }
        },

        showMode: function (dir) {
            if (dir) {
                var newViewMode = Math.max(0, Math.min(DPGlobal.modes.length - 1, this.viewMode + dir));
                if (newViewMode >= this.minView && newViewMode <= this.maxView) {
                    this.element.trigger({
                        type:        'changeMode',
                        date:        this.viewDate,
                        oldViewMode: this.viewMode,
                        newViewMode: newViewMode
                    });

                    this.viewMode = newViewMode;
                }
            }
            /*
             vitalets: fixing bug of very special conditions:
             jquery 1.7.1 + webkit + show inline datetimepicker in bootstrap popover.
             Method show() does not set display css correctly and datetimepicker is not shown.
             Changed to .css('display', 'block') solve the problem.
             See https://github.com/vitalets/x-editable/issues/37

             In jquery 1.7.2+ everything works fine.
             */
            //this.picker.find('>div').hide().filter('.datetimepicker-'+DPGlobal.modes[this.viewMode].clsName).show();
            this.picker.find('>div').hide().filter('.datetimepicker-' + DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
            this.updateNavArrows();
        },

        reset: function (e) {
            this._setDate(null, 'date');
        },

        convertViewModeText:  function (viewMode) {
            switch (viewMode) {
                case 4:
                    return 'decade';
                case 3:
                    return 'year';
                case 2:
                    return 'month';
                case 1:
                    return 'day';
                case 0:
                    return 'hour';
            }
        }
    };

    var old = $.fn.datetimepicker;
    $.fn.datetimepicker = function (option) {
        var args = Array.apply(null, arguments);
        args.shift();
        var internal_return;
        this.each(function () {
            var $this = $(this),
                data = $this.data('datetimepicker'),
                options = typeof option == 'object' && option;
            if (!data) {
                $this.data('datetimepicker', (data = new Datetimepicker(this, $.extend({}, $.fn.datetimepicker.defaults, options))));
            }
            if (typeof option == 'string' && typeof data[option] == 'function') {
                internal_return = data[option].apply(data, args);
                if (internal_return !== undefined) {
                    return false;
                }
            }
        });
        if (internal_return !== undefined)
            return internal_return;
        else
            return this;
    };

    $.fn.datetimepicker.defaults = {
    };
    $.fn.datetimepicker.Constructor = Datetimepicker;
    var dates = $.fn.datetimepicker.dates = {
        en: {
            days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
            daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
            daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
            months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
            monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
            today: "今天",
            suffix: [],
            meridiem: ["上午", "下午"]
        }
    };

    var DPGlobal = {
        modes:            [
            {
                clsName: 'minutes',
                navFnc:  'Hours',
                navStep: 1
            },
            {
                clsName: 'hours',
                navFnc:  'Date',
                navStep: 1
            },
            {
                clsName: 'days',
                navFnc:  'Month',
                navStep: 1
            },
            {
                clsName: 'months',
                navFnc:  'FullYear',
                navStep: 1
            },
            {
                clsName: 'years',
                navFnc:  'FullYear',
                navStep: 10
            }
        ],
        isLeapYear:       function (year) {
            return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
        },
        getDaysInMonth:   function (year, month) {
            return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
        },
        getDefaultFormat: function (type, field) {
            if (type == "standard") {
                if (field == 'input')
                    return 'yyyy-mm-dd hh:ii';
                else
                    return 'yyyy-mm-dd hh:ii:ss';
            } else if (type == "php") {
                if (field == 'input')
                    return 'Y-m-d H:i';
                else
                    return 'Y-m-d H:i:s';
            } else {
                throw new Error("Invalid format type.");
            }
        },
        validParts:       function (type) {
            if (type == "standard") {
                return /hh?|HH?|p|P|ii?|ss?|dd?|DD?|mm?|MM?|yy(?:yy)?/g;
            } else if (type == "php") {
                return /[dDjlNwzFmMnStyYaABgGhHis]/g;
            } else {
                throw new Error("Invalid format type.");
            }
        },
        nonpunctuation:   /[^ -\/:-@\[-`{-~\t\n\rTZ]+/g,
        parseFormat:      function (format, type) {
            // IE treats \0 as a string end in inputs (truncating the value),
            // so it's a bad format delimiter, anyway
            var separators = format.replace(this.validParts(type), '\0').split('\0'),
                parts = format.match(this.validParts(type));
            if (!separators || !separators.length || !parts || parts.length == 0) {
                throw new Error("Invalid date format.");
            }
            return {separators: separators, parts: parts};
        },
        parseDate:        function (date, format, language, type) {
            if (date instanceof Date) {
                var dateUTC = new Date(date.valueOf() - date.getTimezoneOffset() * 60000);
                dateUTC.setMilliseconds(0);
                return dateUTC;
            }
            if (/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(date)) {
                format = this.parseFormat('yyyy-mm-dd', type);
            }
            if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}$/.test(date)) {
                format = this.parseFormat('yyyy-mm-dd hh:ii', type);
            }
            if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}\:\d{1,2}[Z]{0,1}$/.test(date)) {
                format = this.parseFormat('yyyy-mm-dd hh:ii:ss', type);
            }
            if (/^[-+]\d+[dmwy]([\s,]+[-+]\d+[dmwy])*$/.test(date)) {
                var part_re = /([-+]\d+)([dmwy])/,
                    parts = date.match(/([-+]\d+)([dmwy])/g),
                    part, dir;
                date = new Date();
                for (var i = 0; i < parts.length; i++) {
                    part = part_re.exec(parts[i]);
                    dir = parseInt(part[1]);
                    switch (part[2]) {
                        case 'd':
                            date.setUTCDate(date.getUTCDate() + dir);
                            break;
                        case 'm':
                            date = Datetimepicker.prototype.moveMonth.call(Datetimepicker.prototype, date, dir);
                            break;
                        case 'w':
                            date.setUTCDate(date.getUTCDate() + dir * 7);
                            break;
                        case 'y':
                            date = Datetimepicker.prototype.moveYear.call(Datetimepicker.prototype, date, dir);
                            break;
                    }
                }
                return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), 0);
            }
            var parts = date && date.toString().match(this.nonpunctuation) || [],
                date = new Date(0, 0, 0, 0, 0, 0, 0),
                parsed = {},
                setters_order = ['hh', 'h', 'ii', 'i', 'ss', 's', 'yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'D', 'DD', 'd', 'dd', 'H', 'HH', 'p', 'P'],
                setters_map = {
                    hh:   function (d, v) {
                        return d.setUTCHours(v);
                    },
                    h:    function (d, v) {
                        return d.setUTCHours(v);
                    },
                    HH:   function (d, v) {
                        return d.setUTCHours(v == 12 ? 0 : v);
                    },
                    H:    function (d, v) {
                        return d.setUTCHours(v == 12 ? 0 : v);
                    },
                    ii:   function (d, v) {
                        return d.setUTCMinutes(v);
                    },
                    i:    function (d, v) {
                        return d.setUTCMinutes(v);
                    },
                    ss:   function (d, v) {
                        return d.setUTCSeconds(v);
                    },
                    s:    function (d, v) {
                        return d.setUTCSeconds(v);
                    },
                    yyyy: function (d, v) {
                        return d.setUTCFullYear(v);
                    },
                    yy:   function (d, v) {
                        return d.setUTCFullYear(2000 + v);
                    },
                    m:    function (d, v) {
                        v -= 1;
                        while (v < 0) v += 12;
                        v %= 12;
                        d.setUTCMonth(v);
                        while (d.getUTCMonth() != v)
                            if (isNaN(d.getUTCMonth()))
                                return d;
                            else
                                d.setUTCDate(d.getUTCDate() - 1);
                        return d;
                    },
                    d:    function (d, v) {
                        return d.setUTCDate(v);
                    },
                    p:    function (d, v) {
                        return d.setUTCHours(v == 1 ? d.getUTCHours() + 12 : d.getUTCHours());
                    }
                },
                val, filtered, part;
            setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
            setters_map['dd'] = setters_map['d'];
            setters_map['P'] = setters_map['p'];
            date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
            if (parts.length == format.parts.length) {
                for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
                    val = parseInt(parts[i], 10);
                    part = format.parts[i];
                    if (isNaN(val)) {
                        switch (part) {
                            case 'MM':
                                filtered = $(dates[language].months).filter(function () {
                                    var m = this.slice(0, parts[i].length),
                                        p = parts[i].slice(0, m.length);
                                    return m == p;
                                });
                                val = $.inArray(filtered[0], dates[language].months) + 1;
                                break;
                            case 'M':
                                filtered = $(dates[language].monthsShort).filter(function () {
                                    var m = this.slice(0, parts[i].length),
                                        p = parts[i].slice(0, m.length);
                                    return m.toLowerCase() == p.toLowerCase();
                                });
                                val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
                                break;
                            case 'p':
                            case 'P':
                                val = $.inArray(parts[i].toLowerCase(), dates[language].meridiem);
                                break;
                        }
                    }
                    parsed[part] = val;
                }
                for (var i = 0, s; i < setters_order.length; i++) {
                    s = setters_order[i];
                    if (s in parsed && !isNaN(parsed[s]))
                        setters_map[s](date, parsed[s])
                }
            }
            return date;
        },
        formatDate:       function (date, format, language, type) {
            if (date == null) {
                return '';
            }
            var val;
            if (type == 'standard') {
                val = {
                    // year
                    yy:   date.getUTCFullYear().toString().substring(2),
                    yyyy: date.getUTCFullYear(),
                    // month
                    m:    date.getUTCMonth() + 1,
                    M:    dates[language].monthsShort[date.getUTCMonth()],
                    MM:   dates[language].months[date.getUTCMonth()],
                    // day
                    d:    date.getUTCDate(),
                    D:    dates[language].daysShort[date.getUTCDay()],
                    DD:   dates[language].days[date.getUTCDay()],
                    p:    (dates[language].meridiem.length == 2 ? dates[language].meridiem[date.getUTCHours() < 12 ? 0 : 1] : ''),
                    // hour
                    h:    date.getUTCHours(),
                    // minute
                    i:    date.getUTCMinutes(),
                    // second
                    s:    date.getUTCSeconds()
                };

                if (dates[language].meridiem.length == 2) {
                    val.H = (val.h % 12 == 0 ? 12 : val.h % 12);
                }
                else {
                    val.H = val.h;
                }
                val.HH = (val.H < 10 ? '0' : '') + val.H;
                val.P = val.p.toUpperCase();
                val.hh = (val.h < 10 ? '0' : '') + val.h;
                val.ii = (val.i < 10 ? '0' : '') + val.i;
                val.ss = (val.s < 10 ? '0' : '') + val.s;
                val.dd = (val.d < 10 ? '0' : '') + val.d;
                val.mm = (val.m < 10 ? '0' : '') + val.m;
            } else if (type == 'php') {
                // php format
                val = {
                    // year
                    y: date.getUTCFullYear().toString().substring(2),
                    Y: date.getUTCFullYear(),
                    // month
                    F: dates[language].months[date.getUTCMonth()],
                    M: dates[language].monthsShort[date.getUTCMonth()],
                    n: date.getUTCMonth() + 1,
                    t: DPGlobal.getDaysInMonth(date.getUTCFullYear(), date.getUTCMonth()),
                    // day
                    j: date.getUTCDate(),
                    l: dates[language].days[date.getUTCDay()],
                    D: dates[language].daysShort[date.getUTCDay()],
                    w: date.getUTCDay(), // 0 -> 6
                    N: (date.getUTCDay() == 0 ? 7 : date.getUTCDay()),       // 1 -> 7
                    S: (date.getUTCDate() % 10 <= dates[language].suffix.length ? dates[language].suffix[date.getUTCDate() % 10 - 1] : ''),
                    // hour
                    a: (dates[language].meridiem.length == 2 ? dates[language].meridiem[date.getUTCHours() < 12 ? 0 : 1] : ''),
                    g: (date.getUTCHours() % 12 == 0 ? 12 : date.getUTCHours() % 12),
                    G: date.getUTCHours(),
                    // minute
                    i: date.getUTCMinutes(),
                    // second
                    s: date.getUTCSeconds()
                };
                val.m = (val.n < 10 ? '0' : '') + val.n;
                val.d = (val.j < 10 ? '0' : '') + val.j;
                val.A = val.a.toString().toUpperCase();
                val.h = (val.g < 10 ? '0' : '') + val.g;
                val.H = (val.G < 10 ? '0' : '') + val.G;
                val.i = (val.i < 10 ? '0' : '') + val.i;
                val.s = (val.s < 10 ? '0' : '') + val.s;
            } else {
                throw new Error("Invalid format type.");
            }
            var date = [],
                seps = $.extend([], format.separators);
            for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
                if (seps.length) {
                    date.push(seps.shift());
                }
                date.push(val[format.parts[i]]);
            }
            if (seps.length) {
                date.push(seps.shift());
            }
            return date.join('');
        },
        convertViewMode:  function (viewMode) {
            switch (viewMode) {
                case 4:
                case 'decade':
                    viewMode = 4;
                    break;
                case 3:
                case 'year':
                    viewMode = 3;
                    break;
                case 2:
                case 'month':
                    viewMode = 2;
                    break;
                case 1:
                case 'day':
                    viewMode = 1;
                    break;
                case 0:
                case 'hour':
                    viewMode = 0;
                    break;
            }

            return viewMode;
        },
        headTemplate:     '<thead>' +
        '<tr>' +
        '<th class="prev"><i class="{leftArrow}"/></th>' +
        '<th colspan="5" class="switch"></th>' +
        '<th class="next"><i class="{rightArrow}"/></th>' +
        '</tr>' +
        '</thead>',
        headTemplateV3:   '<thead>' +
        '<tr>' +
        '<th class="prev"><span class="{iconType} {leftArrow}"></span> </th>' +
        '<th colspan="5" class="switch"></th>' +
        '<th class="next"><span class="{iconType} {rightArrow}"></span> </th>' +
        '</tr>' +
        '</thead>',
        contTemplate:     '<tbody><tr><td colspan="7"></td></tr></tbody>',
        footTemplate:     '<tfoot><tr><th colspan="7" class="today"></th></tr></tfoot>'
    };
    DPGlobal.template = '<div class="datetimepicker">' +
        '<div class="datetimepicker-minutes">' +
        '<table class=" table-condensed">' +
        DPGlobal.headTemplate +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-hours">' +
        '<table class=" table-condensed">' +
        DPGlobal.headTemplate +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-days">' +
        '<table class=" table-condensed">' +
        DPGlobal.headTemplate +
        '<tbody></tbody>' +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-months">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplate +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-years">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplate +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '</div>';
    DPGlobal.templateV3 = '<div class="datetimepicker">' +
        '<div class="datetimepicker-minutes">' +
        '<table class=" table-condensed">' +
        DPGlobal.headTemplateV3 +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-hours">' +
        '<table class=" table-condensed">' +
        DPGlobal.headTemplateV3 +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-days">' +
        '<table class=" table-condensed">' +
        DPGlobal.headTemplateV3 +
        '<tbody></tbody>' +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-months">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplateV3 +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datetimepicker-years">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplateV3 +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '</div>';
    $.fn.datetimepicker.DPGlobal = DPGlobal;

    /* DATETIMEPICKER NO CONFLICT
     * =================== */

    $.fn.datetimepicker.noConflict = function () {
        $.fn.datetimepicker = old;
        return this;
    };

    /* DATETIMEPICKER DATA-API
     * ================== */

    $(document).on(
        'focus.datetimepicker.data-api click.datetimepicker.data-api',
        '[data-provide="datetimepicker"]',
        function (e) {
            var $this = $(this);
            if ($this.data('datetimepicker')) return;
            e.preventDefault();
            // component click requires us to explicitly show it
            $this.datetimepicker('show');
        }
    );
    $(function () {
        $('[data-provide="datetimepicker-inline"]').datetimepicker();
    });

}(window.jQuery);
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
//============================================
//  jQuery对象级插件 -- ES图表(基于eCharts)
//============================================
(function (window, $, _) {
    // 定义构造函数
    var EsChart = function($element, options) {
        this.$element = [];
        this.settings = {};
        this.enabled = false;

        this.echart = {};
        this.builder = {};

        this.initialize($element, options);
    };

    // 初始化方法
    EsChart.prototype = {
        defaults: {
            format: 'line',  // 形式
            url: '',         // 数据链接
            theme: 'dark',   // 主题
            loadingStart: function () {},  // 加载开始
            loadingDone: function () {},   // 加载结束
            $scopeRange: [],               // 时间范围
        },

        initialize: function($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend(true, {}, this.defaults, this.$element.data(), options);
            this.enabled = true;

            return this._render();
        },

        destroy: function () {
            this.$element.empty();
            this.$element.data('instance.esChart', '');
        },

        setUrl: function (url) {
            this.settings.url = url;
            return this;
        },

        refresh: function (clear) {
            if (!this.settings.url) return this;

            var self = this;

            if (typeof this.settings.loadingStart == 'function') this.settings.loadingStart();
            $.http.get(this.settings.url, {}, {
                success: function (data) {
                    clear ? self.echart.clearThenDraw(data) : self.echart.draw(data);
                    if (self.settings.$scopeRange.length) self.settings.$scopeRange.text(data.scope.range);
                },

                error: function (data, status, msg) {
                    $.message.warn(msg);
                },

                complete: function () {
                    if (typeof self.settings.loadingDone == 'function') self.settings.loadingDone();
                },
            });

            return this;
        },

        resize: function () {
            this.echart.instance.resize();
        },

        _render: function () {
            var element = this.$element[0], theme = this.settings.theme;
            switch (this.settings.format) {
                case 'line'  : this.echart = new LineChart(element, theme); break;
                case 'bar'   : this.echart = new BarChart(element, theme); break;
                case 'pie'   : this.echart = new PieChart(element, theme); break;
                case 'panel' : this.echart = new PanelChart(element, theme); break;
                case 'radar' : this.echart = new RadarChart(element, theme); break;
                case 'table' : this.echart = new TableChart(element, theme); break;
            }

            return this.refresh();
        },
    };


    // ES图表 - 折线图
    var LineChart = function (element, theme) {
        this.instance = {};  // echart 实例
        this.option = {};    // echart 配置
        this._initialized = false;

        return this.initialize(element, theme).draw({x:[], lines:[]});
    };
    LineChart.prototype = {
        _defaultOption: {
            title:   {text:'折线图示例', show: false},
            tooltip: {trigger:'axis',},
            legend:  {data:[/*'销量'*/], bottom:0},
            grid:    {left:'12px', right:'12px', bottom:'11%', top:'12px', containLabel:true},
            xAxis :  {type:'category', data:[/*'周一','周二','周三','周四','周五','周六','周日'*/]},
            yAxis :  {type:'value', axisLabel:{}},
            series : [], //[{name:'销量', type:'line', data:[120, 132, 101, 134, 90, 230, 210]}]
        },

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.instance = echarts.init(element, theme);

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            this.instance.clear(); // 清空
            this.draw(data);

            return this;
        },

        draw: function (data) {
            this._setOption(data);
            this.instance.setOption(this.option);

            return this;
        },

        _setOption: function (data) {
            this.option = $.extend(true, {}, this._defaultOption);
            this.option.yAxis.axisLabel.formatter = this._axisLabelFormatter;
            this.option.xAxis.data = data.x;

            for (var i = 0; i < data.lines.length; i++) {
                var item = data['lines'][i];

                this.option.series.push({
                    name: item.name,
                    type: 'line',
                    data: item.value,
                });

                this.option.legend.data.push(item.name);
            }

            return this;
        },

        _axisLabelFormatter: function (value, index) {
            if (value >= 100000000) {
                value = value/100000000 + '亿';
            } else if (value >= 10000) {
                value = value/10000 + '万';
            }

            return value;
        },
    };


    // ES图表 - 条形图
    var BarChart = function (element, theme) {
        this.instance = {};  // echart 实例
        this.option = {};    // echart 配置
        this._initialized = false;

        return this.initialize(element, theme).draw({x:[], bar: null});
    };
    BarChart.prototype = {
        _defaultOption: {
            title:   {text:'条形图示例', show: false},
            tooltip: {},
            legend:  {data:[/*'销量'*/], bottom:0, show:false},
            grid:    {left:'12px', right:'12px', bottom:'11%', top:'12px', containLabel:true},
            xAxis :  {type:'category', boundaryGap:true, axisLabel:{interval:0, rotate:-45, margin:10}, data:[/*'周一','周二','周三','周四','周五','周六','周日'*/]},
            yAxis :  {type:'value', axisLabel:{}},
            series : [], //[{name:'销量', type:'var', data:[120, 132, 101, 134, 90, 230, 210]}]
        },

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.instance = echarts.init(element, theme);

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            this.instance.clear(); // 清空
            this.draw(data);

            return this;
        },

        draw: function (data) {
            this._setOption(data);
            this.instance.setOption(this.option);

            return this;
        },

        _setOption: function (data) {
            this.option = $.extend(true, {}, this._defaultOption);
            this.option.yAxis.axisLabel.formatter = this._axisLabelFormatter;
            this.option.xAxis.data = data.x;

            if (data.bar) {
                this.option.series.push({
                    name: data.bar.name,
                    data: data.bar.value,
                    type: 'bar',
                    barWidth: '60%',
                });
                this.option.legend.data.push(data.bar.name);
            }

            return this;
        },

        _axisLabelFormatter: function (value, index) {
            if (value >= 100000000) {
                value = value/100000000 + '亿';
            } else if (value >= 10000) {
                value = value/10000 + '万';
            }

            return value;
        },
    };


    // ES图表 - 饼状图
    var PieChart = function (element, theme) {
        this.instance = {};  // echart 实例
        this.option = {};    // echart 配置
        this._initialized = false;

        return this.initialize(element, theme).draw({x:[], pie: null});
    };
    PieChart.prototype = {
        _defaultOption: {
            title : {text:'饼状图示例', show:false},
            tooltip: {trigger:'item', formatter:"{a} <br/>{b} : {c} ({d}%)"},
            legend: {orient:'horizontal', bottom: 0, data:[/*'直接访问'*/]},
            series : [
                /*{
                 type: 'pie',
                 radius : '50%',
                 center: ['50%', '60%'],
                 itemStyle: {emphasis: {shadowBlur:10, shadowOffsetX:0, shadowColor:'rgba(0, 0, 0, 0.5)'}},
                 name: '访问来源',
                 data:[{value:335, name:'直接访问'}],
                 }*/
            ]
        },

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.instance = echarts.init(element, theme);

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            this.instance.clear(); // 清空
            this.draw(data);

            return this;
        },

        draw: function (data) {
            this._setOption(data);
            this.instance.setOption(this.option);

            return this;
        },

        _setOption: function (data) {
            this.option = $.extend(true, {}, this._defaultOption);

            if (data.pie) {
                var values = [];

                for (var j = 0; j < data.pie.value.length; j++) {
                    values.push({
                        value:data.pie.value[j],
                        name:data.x[j],
                    });
                }

                this.option.series.push({
                    name: data.pie.name,
                    data: values,
                    type: 'pie',
                    //radius : '70%',
                    radius : ['20%', '70%'],
                    center: ['50%', '50%'],
                    itemStyle: {emphasis: {shadowBlur:10, shadowOffsetX:0, shadowColor:'rgba(0, 0, 0, 0.5)'}},
                });
            }

            return this;
        },

        _axisLabelFormatter: function (value, index) {
            if (value >= 100000000) {
                value = value/100000000 + '亿';
            } else if (value >= 10000) {
                value = value/10000 + '万';
            }

            return value;
        },
    };


    // ES图表 - 仪表盘
    var PanelChart = function (element, theme) {
        this.instance = {};  // echart 实例
        this.option = {};    // echart 配置
        this._initialized = false;

        return this.initialize(element, theme).draw({});
    };
    PanelChart.prototype = {
        _defaultOption: {
            title : {text:'仪表盘示例', show:false},
            tooltip : {formatter: "{b} : {c}"},
            series: [
                {
                    type: 'gauge', axisLabel: {}, axisTick:{lineStyle:{color: 'auto'}}, splitLine: {length: 14, lineStyle:{color: 'auto'}}, radius: '100%', center: ['50%', '57%'],
                    axisLine: {lineStyle: {width: 10, color:[[0.2, '#1aa844'], [0.8, '#0098d9'], [1, '#ff715e']]}},
                    title: {offsetCenter:[0, '30%'], color:'#ddd'},
                    detail: {offsetCenter:[0, '50%'], textStyle: {fontSize: 16}},
                    data: [{value: 0}]
                }
            ]
        },

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.instance = echarts.init(element, theme);
            this._setOption({});

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            this.instance.clear(); // 清空
            this._setOption({});
            this.draw(data);

            return this;
        },

        draw: function (data) {
            this._setOptionAboutPanel(data);
            this.instance.setOption(this.option);

            return this;
        },

        _setOption: function (data) {
            this.option = $.extend(true, {}, this._defaultOption);
            this.option.series[0].axisLabel.formatter = this._axisLabelFormatter;
            this.option.series[0].detail.formatter = this._detailFormatter;
            return this._setOptionAboutPanel(data);
        },

        _setOptionAboutPanel: function (data) {
            if (data.min) this.option.series[0].min = data.min;
            if (data.max) this.option.series[0].max = data.max;
            this.option.series[0].data[0].value = data.value || 0;
            this.option.series[0].data[0].name = data.name || 0;

            return this;
        },

        _axisLabelFormatter: function (value, index) {
            if (value >= 100000000) {
                value = value/100000000 + '亿';
            } else if (value >= 10000) {
                value = value/10000 + '万';
            }

            return value;
        },

        _detailFormatter: function (value, index) {
            if (value >= 100000000) {
                value = (value/100000000).toFixed(2) + '亿';
            } else if (value >= 10000) {
                value = (value/10000).toFixed(2) + '万';
            } else if ((''+value).length >= 8) {
                value = value.toFixed(4);
            }

            return value;
        },
    };


    // ES图表 - 雷达图
    var RadarChart = function (element, theme) {
        this.instance = {};  // echart 实例
        this.option = {};    // echart 配置
        this._initialized = false;

        return this.initialize(element, theme).draw({indicators: []});
    };
    RadarChart.prototype = {
        _defaultOption: {
            title : {text:'雷达图示例', show:false},
            tooltip: {trigger: 'axis'},
            radar : {
                shape: 'circle',
                indicator:[{ name: '-', max: 100}],
                splitArea:{show: false},
                splitLine:{lineStyle: {color: ['#333', '#444', '#555', '#666', '#777', '#888', '#999']}},
                axisLine: {lineStyle: {color: '#999'}},
            },
            series: [{
                type: 'radar',
                tooltip: {trigger: 'item'},
                itemStyle: {normal: {areaStyle: {type: 'default'}}},
                data: [{
                    value : [0],
                }],
            }],
        },

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.instance = echarts.init(element, theme);

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            this.instance.clear(); // 清空
            this.draw(data);

            return this;
        },

        draw: function (data) {
            this._setOption(data);
            this.instance.setOption(this.option);

            return this;
        },

        _setOption: function (data) {
            this.option = $.extend(true, {}, this._defaultOption);
            var indicators = [], value = [];

            for (var i = 0; i < data.indicators.length; i++) {
                var indicator = data.indicators[i];

                indicators.push({
                    name: indicator.name,
                    max: Math.max(indicator.max, indicator.value),
                });

                value.push(indicator.value);
            }

            if (data.indicators.length) {
                this.option.radar.indicator = indicators;
                this.option.series[0].data[0].value = value;
            }

            return this;
        },
    };


    // ES图表 - 表格
    var TableChart = function (element, theme) {
        this.$element = [];
        this.instance = this;  // table 实例
        this._initialized = false;

        return this.initialize(element, theme);
    };
    TableChart.prototype = {
        _defaultOption: {},
        template: '<table class="table-chart"width="100%"><tr><th><%=table.row[0].field%>&nbsp;\\&nbsp;<%=table.col[0].field%></th><%_.each(table.col,function(col,c){%><th><%=col.value%><i>&nbsp;(<%=col.operator.split("_")[1]%>)</i></th><%})%></tr><%_.each(table.row,function(row,r){%><tr><%_.each(table.col,function(col,c){%><%if(!c){%><th><%=row.value%><i>&nbsp;(<%=row.operator.split("_")[1]%>)</i></th><%}%><td><%=value[r+"-"+c]%></td><%})%></tr><%})%></table>',

        initialize: function (element, theme) {
            if (this._initialized) return this;

            this.$element = $(element);
            this.$element.addClass('table-chart-' + theme);

            this._initialized = true; return this;
        },

        clearThenDraw: function (data) {
            return this.draw(data);
        },

        draw: function (data) {
            if (!data) return this._showBlank();

            var table = _.template(this.template)(data);
            this.$element.html(table);

            return this;
        },

        _showBlank: function () {
            this.$element.find('td').text('');
            return this;
        },

        resize: function () {

        },
    };


    // 成为jquery插件
    $.fn.esChart = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                instance = $this.data('instance.esChart');

            // 仅限<div>
            if ($(this)[0]['tagName'] != 'DIV') return;

            // 创建对象并缓存
            if (!instance) {
                if (option == 'destroy') return; // 无需创建
                instance = new EsChart($this, options);
                $this.data('instance.esChart', instance);
            }

            // 执行方法
            if (typeof option == 'string') instance[option](param);
        });
    };
})(window, $, _);
//============================================
//  jQuery对象级插件 -- ES图表构造器
//============================================
(function (window, $, _) {
    // 定义构造函数
    var EsChartBuilder = function($element, options) {
        this.$builder = [];
        this.$element = [];
        this.settings = {};
        this.enabled = false;

        this.model = {};
        this.builder = {};

        this.initialize($element, options);
    };

    // 初始化方法
    EsChartBuilder.prototype = {
        defaults: {
            format: 'line',  // 形式
            mapping: {},     // 字段映射
        },
        form: '<form class="form-horizontal unit-form es-chart-builder"></form>',

        initialize: function($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend(true, {}, this.defaults, this.$element.data(), options);
            this.enabled = true;

            this.model = this.$element.val() ? JSON.parse(this.$element.val()) : {};

            return this._render();
        },

        destroy: function () {
            this.$builder.empty().remove();
            this.$element.data('instance.esChartBuilder', '');
        },

        validate: function () {
            var errorNum = 0;
            $('input:text', this.$builder).each(function () {
                if (!$(this).val()) {
                    errorNum++;
                    if (errorNum == 1) $(this).focus();
                }
            });
            if (errorNum) $.message.warn('有'+errorNum+'项为空, 请按提示填写');

            if (this.settings.format == 'table') {
                if (!$('input[name="table.col"]', this.$builder).esFilter().val().length) {
                    $.message.warn('表格至少定义一列'); return false;
                }

                if (!$('input[name="table.row"]', this.$builder).esFilter().val().length) {
                    $.message.warn('表格至少定义一行'); return false;
                }
            }

            return errorNum ? false : true;
        },

        // 获取值
        getValue: function () {
            return this.builder.getValue();
        },

        toString: function () {
            this.$element.val(JSON.stringify(this.getValue()));
        },

        _render: function () {
            this.$element.after(this.form);
            this.$builder = this.$element.siblings('form.es-chart-builder');

            help.mapping = this.settings.mapping;
            switch (this.settings.format) {
                case 'line':  this.builder = new LineBuilder(this.model, this.$builder); break;
                case 'bar':   this.builder = new BarBuilder(this.model, this.$builder); break;
                case 'pie':   this.builder = new PieBuilder(this.model, this.$builder); break;
                case 'panel': this.builder = new PanelBuilder(this.model, this.$builder); break;
                case 'radar': this.builder = new RadarBuilder(this.model, this.$builder); break;
                case 'table': this.builder = new TableBuilder(this.model, this.$builder); break;
                default     : break;
            }

            return this;
        },
    };

    // 辅助方法
    var help = {
        mapping: {},
        methods: {
            count: {text:'计数', types: []},
            sum:   {text:'求和', types: ['numeric']},
            avg:   {text:'平均', types: ['numeric']},
            max:   {text:'最大值', types: ['numeric']},
            min:   {text:'最小值', types: ['numeric']},
        },
        intervals: [
            {value:'1M'  ,seconds:2592000 ,text:'月', default: true,},
            {value:'1w'  ,seconds:604800  ,text:'周', default: true,},
            {value:'1d'  ,seconds:86400   ,text:'天', default: true,},
            {value:'12h' ,seconds:43200   ,text:'12小时',},
            {value:'6h'  ,seconds:21600   ,text:'6小时', },
            //{value:'2h'  ,seconds:7200    ,text:'2小时', },
            {value:'1h'  ,seconds:3600    ,text:'小时', default: true,},
            {value:'30m' ,seconds:1800    ,text:'30分钟',},
            {value:'15m' ,seconds:900     ,text:'15分钟',},
            {value:'10m' ,seconds:600     ,text:'10分钟',},
            {value:'5m'  ,seconds:300     ,text:'5分钟', },
            //{value:'2m'  ,seconds:120     ,text:'2分钟', },
            {value:'1m'  ,seconds:60      ,text:'分钟', default: true,},
            {value:'30s' ,seconds:30      ,text:'30秒钟',},
            {value:'15s' ,seconds:15      ,text:'15秒钟',},
            {value:'10s' ,seconds:10      ,text:'10秒钟',},
            {value:'5s'  ,seconds:5       ,text:'5秒钟', },
            //{value:'2s'  ,seconds:2       ,text:'2秒钟', },
            {value:'1s'  ,seconds:1       ,text:'秒钟', default: true,},
        ],

        // 获取某个字段的类型
        getFieldType: function (field) {
            return this.mapping[field];
        },

        // 获取某些类型的字段
        getFieldsByTypes: function (types) {
            var fields = [];
            for (var field in this.mapping) {
                if ($.inArray(this.mapping[field], types) >= 0) fields.push(field);
            }

            return fields;
        },

        // 获取取值方式选项
        getMethodOptions: function () {
            var options = [];
            for (var method in this.methods) {
                options.push({
                    text : this.methods[method]['text'],
                    value: method,
                });
            }

            return options;
        },

        // 获取取值方式选项 - 饼图
        getMethodOptionsForPie: function () {
            return [
                {text:'计数', value:'count'},
                {text:'求和', value:'sum'},
            ];
        },

        // 获取取值方式支持的数据类型
        getMethodTypes: function (method) {
            return this.methods[method]['types'];
        },

        // 根据时间跨度获得统计粒度
        getIntervalOptions: function (timeRange) {
            timeRange = $.isRelativeDateTimeRange(timeRange) ? $.parseRelativeDateTimeRange(timeRange) : timeRange;

            var minShards = 2,
                maxShards = 240;

            var arr = timeRange.split(' ~ '),
                start = moment(arr[0]).unix(),
                end = moment(arr[1]).unix(),
                totalSeconds = end - start;

            // 筛选出符合条件的
            var options = [];
            for (var i = 0; i < help.intervals.length; i++) {
                var item = help.intervals[i];
                if (totalSeconds/item.seconds >= minShards && totalSeconds/item.seconds <= maxShards) {
                    options.push($.extend(true, {}, item));
                }
            }

            return options;
        },
    };

    // 折线图构造器
    var LineBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    LineBuilder.prototype = {
        name: '折线图',
        template: 'lineBuilder',
        templateOfLine: 'lineBuilder-newLine',
        default: {scope:{field:'', range:'最近1小时', interval:'1m'}, lines:[{name:'日志总量', method:'count', field:'', filters:[]}]},

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field:    $('input[name="scope.field"]', this.$builder).val(),
                    range:    $('input[name="scope.range"]', this.$builder).val(),
                    interval: $('input[name="scope.interval"]', this.$builder).val(),
                },
                lines: this._getLines(),
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            this._renderScope();
            this._deleteBtnShowOrHide();

            var self = this;
            $('.line-item', this.$builder).each(function () { self._renderLine($(this)); });

            return this;
        },

        _renderScope: function () {
            $('input[name="scope.field"]', this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]', this.$builder).datetimeRangePicker();
            $('input[name="scope.interval"]', this.$builder).dropdownSelector({options: help.getIntervalOptions(this.model.scope.range)});
        },

        _renderLine: function ($item) {
            var $name = $('input[name="line.name"]', $item),
                $method = $('input[name="line.method"]', $item),
                $filters = $('input[name="line.filters"]', $item),
                $field = $('input[name="line.field"]', $item);

            $name.tooltip({container:'body'});
            $method.dropdownSelector({options: help.getMethodOptions()});
            $field.dropdownSelector();
            $filters.esFilter({mapping: help.mapping});
            this._updateFieldOptionsByMethod($method);

            return this;
        },

        _listen: function () {
            var self = this;

            // 时间跨度改变
            this.$builder.on('change', 'input[name="scope.range"]', function (e) { self._rangeChange($(e.target).val()); });
            // 增加折线
            this.$builder.on('click',  '[handle="createLine"]', function () { self._createLine(); });
            // 删除折线
            this.$builder.on('click',  '[handle="deleteLine"]', function (e) { self._deleteLine($(e.target).closest('.line-item')); });
            // 切换取值方式
            this.$builder.on('change', '[name="line.method"]', function (e) { self._updateFieldOptionsByMethod($(e.target)); });

            return this;
        },

        _rangeChange: function (range) {
            var intervalOptions = help.getIntervalOptions(range);
            $('input[name="scope.interval"]', this.$builder).dropdownSelector('updateOptions', intervalOptions);
        },

        _createLine: function () {
            var item = $.renderFormTpl('chart', 'lineBuilder-newLine', {}),
                $list = $('.line-list', this.$builder);

            $list.append(item);
            this._renderLine($list.children('.line-item:last'));

            return this._deleteBtnShowOrHide();
        },

        _deleteLine: function ($item) {
            $('input:text', $item).tooltip('destroy');
            $item.remove();

            return this._deleteBtnShowOrHide();
        },

        _deleteBtnShowOrHide: function () {
            var $delete = $('[handle="deleteLine"]', this.$builder);
            $delete.length <= 1 ? $delete.hide() : $delete.show();

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.line-item').find('[name="line.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },

        _getLines: function () {
            var lines = [];

            $('.line-item', this.$builder).each(function () {
                lines.push({
                    name:    $('input[name="line.name"]',    $(this)).val(),
                    method:  $('input[name="line.method"]',  $(this)).val(),
                    field:   $('input[name="line.field"]',   $(this)).val(),
                    filters: $('input[name="line.filters"]', $(this)).esFilter().val(),
                });
            });

            return lines;
        },
    };


    // 柱状图构造器
    var BarBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    BarBuilder.prototype = {
        name: '柱状图',
        template: 'barBuilder',
        default: {
            scope: {field:'', range:'最近1小时', filters:[]},
            statistic: {method:'count', field:''},
            category: {field:'fromhost', bucketing:'Top 20', ranges:[]},
        },

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field: $('input[name="scope.field"]', this.$builder).val(),
                    range: $('input[name="scope.range"]', this.$builder).val(),
                    filters: $('input[name="scope.filters"]', this.$builder).esFilter().val()
                },
                statistic: {
                    method: $('input[name="statistic.method"]', this.$builder).val(),
                    field: $('input[name="statistic.field"]', this.$builder).val(),
                },
                category: {
                    field: $('input[name="category.field"]', this.$builder).val(),
                    bucketing: $('input[name="category.bucketing"]', this.$builder).val(),
                    ranges: JSON.parse($('input[name="category.ranges"]', this.$builder).esTermRanges('toString').val()),
                },
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            // 范围
            $('input[name="scope.field"]',   this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]',   this.$builder).datetimeRangePicker();
            $('input[name="scope.filters"]', this.$builder).esFilter({mapping: help.mapping});

            // 分类
            $('input[name="statistic.method"]',   this.$builder).dropdownSelector({options: help.getMethodOptions()});
            $('input[name="statistic.field"]',    this.$builder).dropdownSelector();
            $('input[name="category.field"]',     this.$builder).dropdownSelector({options: help.getFieldsByTypes(['string', 'numeric'])});
            $('input[name="category.bucketing"]', this.$builder).dropdownSelector();

            // 提示
            $('.glyphicon-info-sign').tooltip({container:'body'});
            return this;
        },

        _listen: function () {
            var self = this;

            // 切换取值方式
            $('[name="statistic.method"]', this.$builder).change(function () {
                self._updateFieldOptionsByMethod($(this));
            }).trigger('change');

            // 切换分类字段
            $('[name="category.field"]', this.$builder).change(function () {
                self._updateBucketingOptionsByField($(this));
            }).trigger('change');

            // 自定义分类
            $('[name="category.bucketing"]', this.$builder).change(function () {
                self._updateCategoryRangesByBucketing($(this));
            }).trigger('change');

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.form-group').find('[name="statistic.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },

        _updateBucketingOptionsByField: function ($field) {
            var type = help.getFieldType($field.val());

            var options = [
                {text:'Top 10', value:'Top 10'},
                {text:'Top 20', value:'Top 20'},
                {divider:true},
                {text:'Bottom 10', value:'Bottom 10'},
                {text:'Bottom 20', value:'Bottom 20'},
            ];

            if (type == 'numeric') {
                options.push({divider:true});
                options.push({text:'自定义分类', value:'Numeric ranges'});
            } else if (type == 'date') {
                options.push({divider:true});
                options.push({text:'自定义分类', value:'Date ranges'});
            }

            $('[name="category.bucketing"]', this.$builder).dropdownSelector('updateOptions', options);

            return this;
        },

        _updateCategoryRangesByBucketing: function ($bucketing) {
            var $categoryRanges = $('[name="category.ranges"]', this.$builder),
                categoryBucketing = $bucketing.val();

            $categoryRanges.esTermRanges('destroy');

            if (categoryBucketing.indexOf('ranges') > 0) {
                $categoryRanges.esTermRanges();
                $categoryRanges.closest('.form-group').show();
            } else {
                $categoryRanges.closest('.form-group').hide();
            }
        },
    };


    // 饼状图构造器
    var PieBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    PieBuilder.prototype = {
        name: '饼装图',
        template: 'pieBuilder',
        default: {
            scope: {field:'', range:'最近1小时', filters:[]},
            statistic: {method:'count', field:''},
            category: {field:'fromhost', bucketing:'Top 20', ranges:[]},
        },

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field: $('input[name="scope.field"]', this.$builder).val(),
                    range: $('input[name="scope.range"]', this.$builder).val(),
                    filters: $('input[name="scope.filters"]', this.$builder).esFilter().val()
                },
                statistic: {
                    method: $('input[name="statistic.method"]', this.$builder).val(),
                    field: $('input[name="statistic.field"]', this.$builder).val(),
                },
                category: {
                    field: $('input[name="category.field"]', this.$builder).val(),
                    bucketing: $('input[name="category.bucketing"]', this.$builder).val(),
                    ranges: JSON.parse($('input[name="category.ranges"]', this.$builder).esTermRanges('toString').val()),
                },
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            // 范围
            $('input[name="scope.field"]',   this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]',   this.$builder).datetimeRangePicker();
            $('input[name="scope.filters"]', this.$builder).esFilter({mapping: help.mapping});

            // 分类
            $('input[name="statistic.method"]',   this.$builder).dropdownSelector({options: help.getMethodOptions()});
            $('input[name="statistic.field"]',    this.$builder).dropdownSelector();
            $('input[name="category.field"]',     this.$builder).dropdownSelector({options: help.getFieldsByTypes(['string', 'numeric'])});
            $('input[name="category.bucketing"]', this.$builder).dropdownSelector();

            // 提示
            $('.glyphicon-info-sign').tooltip({container:'body'});
            return this;
        },

        _listen: function () {
            var self = this;

            // 切换取值方式
            $('[name="statistic.method"]', this.$builder).change(function () {
                self._updateFieldOptionsByMethod($(this));
            }).trigger('change');

            // 切换分类字段
            $('[name="category.field"]', this.$builder).change(function () {
                self._updateBucketingOptionsByField($(this));
            }).trigger('change');

            // 自定义分类
            $('[name="category.bucketing"]', this.$builder).change(function () {
                self._updateCategoryRangesByBucketing($(this));
            }).trigger('change');

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.form-group').find('[name="statistic.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },

        _updateBucketingOptionsByField: function ($field) {
            var type = help.getFieldType($field.val());

            var options = [
                {text:'Top 10', value:'Top 10'},
                {text:'Top 20', value:'Top 20'},
                {divider:true},
                {text:'Bottom 10', value:'Bottom 10'},
                {text:'Bottom 20', value:'Bottom 20'},
            ];

            if (type == 'numeric') {
                options.push({divider:true});
                options.push({text:'自定义分类', value:'Numeric ranges'});
            } else if (type == 'date') {
                options.push({divider:true});
                options.push({text:'自定义分类', value:'Date ranges'});
            }

            $('[name="category.bucketing"]', this.$builder).dropdownSelector('updateOptions', options);

            return this;
        },

        _updateCategoryRangesByBucketing: function ($bucketing) {
            var $categoryRanges = $('[name="category.ranges"]', this.$builder),
                categoryBucketing = $bucketing.val();

            $categoryRanges.esTermRanges('destroy');

            if (categoryBucketing.indexOf('ranges') > 0) {
                $categoryRanges.esTermRanges();
                $categoryRanges.closest('.form-group').show();
            } else {
                $categoryRanges.closest('.form-group').hide();
            }
        },
    };


    // 仪表盘构造器
    var PanelBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    PanelBuilder.prototype = {
        name: '饼装图',
        template: 'panelBuilder',
        default: {
            scope: {field:'', range:'最近1小时', filters:[]},
            statistic: {method:'count', field:''},
            panel: {min: 0, max: 500000000},
        },

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field:   $('input[name="scope.field"]', this.$builder).val(),
                    range:   $('input[name="scope.range"]', this.$builder).val(),
                    filters: $('input[name="scope.filters"]', this.$builder).esFilter().val()
                },
                statistic: {
                    method: $('input[name="statistic.method"]', this.$builder).val(),
                    field:  $('input[name="statistic.field"]', this.$builder).val(),
                },
                panel: {
                    min: $('input[name="panel.min"]', this.$builder).val(),
                    max: $('input[name="panel.max"]', this.$builder).val(),
                },
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            // 范围
            $('input[name="scope.field"]',   this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]',   this.$builder).datetimeRangePicker();
            $('input[name="scope.filters"]', this.$builder).esFilter({mapping: help.mapping});

            // 统计
            $('input[name="statistic.method"]', this.$builder).dropdownSelector({options: help.getMethodOptions()});
            $('input[name="statistic.field"]',  this.$builder).dropdownSelector();

            return this;
        },

        _listen: function () {
            var self = this;

            // 切换取值方式
            $('[name="statistic.method"]', this.$builder).change(function () {
                self._updateFieldOptionsByMethod($(this));
            }).trigger('change');

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.form-group').find('[name="statistic.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },
    };


    // 仪表盘构造器
    var RadarBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    RadarBuilder.prototype = {
        name: '雷达图',
        template: 'radarBuilder',
        templateOfIndicator: 'radarBuilder-newIndicator',
        default: {
            scope: {field:'', range:'最近1小时', filters:[]},
            indicators: [
                {name:'', method:'count', field:'', max:''},
                {name:'', method:'count', field:'', max:''},
                {name:'', method:'count', field:'', max:''},
            ],
        },

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field:   $('input[name="scope.field"]',   this.$builder).val(),
                    range:   $('input[name="scope.range"]',    this.$builder).val(),
                    filters: $('input[name="scope.filters"]', this.$builder).esFilter().val()
                },
                indicators: this._getIndicators(),
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            this._renderScope();
            this._deleteBtnShowOrHide();

            var self = this;
            $('.indicator-item', this.$builder).each(function () { self._renderIndicator($(this)); });

            return this;
        },

        _renderScope: function () {
            $('input[name="scope.field"]',   this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]',   this.$builder).datetimeRangePicker();
            $('input[name="scope.filters"]', this.$builder).esFilter({mapping: help.mapping});
        },

        _renderIndicator: function ($indicator) {
            var $name =   $('input[name="indicator.name"]', $indicator),
                $method = $('input[name="indicator.method"]', $indicator),
                $field =  $('input[name="indicator.field"]', $indicator);

            $name.tooltip({container:'body'});
            $method.dropdownSelector({options: help.getMethodOptions()});
            $field.dropdownSelector();
            this._updateFieldOptionsByMethod($method);

            return this;
        },

        _listen: function () {
            var self = this;

            // 增加维度
            this.$builder.on('click',  '[handle="createIndicator"]', function () { self._createIndicator(); });
            // 删除维度
            this.$builder.on('click',  '[handle="deleteIndicator"]', function () { self._deleteIndicator($(this).closest('.indicator-item')); });
            // 切换取值方式
            this.$builder.on('change', '[name="indicator.method"]',  function () { self._updateFieldOptionsByMethod($(this)); });

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.form-group').find('[name="indicator.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },

        _deleteBtnShowOrHide: function () {
            var $delete = $('[handle="deleteIndicator"]', this.$builder);
            $delete.length <= 3 ? $delete.hide() : $delete.show();

            return this;
        },

        _createIndicator: function () {
            var item = $.renderFormTpl('chart', this.templateOfIndicator, {}),
                $list= $('.indicator-list', this.$builder);

            $list.append(item);
            this._renderIndicator($list.find('.indicator-item:last'));

            return this._deleteBtnShowOrHide();
        },

        _deleteIndicator: function ($indicator) {
            $('input:text', $indicator).tooltip('destroy');
            $indicator.remove();

            return this._deleteBtnShowOrHide();
        },

        _getIndicators: function () {
            var indicators = [];

            $('.indicator-item', this.$builder).each(function () {
                indicators.push({
                    name:   $('input[name="indicator.name"]',   $(this)).val(),
                    method: $('input[name="indicator.method"]', $(this)).val(),
                    field:  $('input[name="indicator.field"]',  $(this)).val(),
                    max:    $('input[name="indicator.max"]',    $(this)).val(),
                });
            });

            return indicators;
        },
    };


    // 表格构造器
    var TableBuilder = function (model, $builder) {
        this.$builder = [];
        this.model = {};
        this.enabled = false;

        this.initialize(model, $builder);
    };
    TableBuilder.prototype = {
        name: '表格',
        template: 'tableBuilder',
        default: {
            scope: {field:'', range:'最近1小时', filters:[]},
            statistic: {method:'count', field:''},
            table: {"col":[], "row":[]},
        },

        initialize: function (model, $builder) {
            if (this.enabled) return this;

            this.$builder = $builder;
            this.model = $.extend(true, {}, this.default, model);
            this.enabled = true;

            return this._render()._listen();
        },

        getValue: function () {
            return {
                scope: {
                    field:   $('input[name="scope.field"]', this.$builder).val(),
                    range:   $('input[name="scope.range"]', this.$builder).val(),
                    filters: $('input[name="scope.filters"]', this.$builder).esFilter().val()
                },
                statistic: {
                    method: $('input[name="statistic.method"]', this.$builder).val(),
                    field:  $('input[name="statistic.field"]', this.$builder).val(),
                },
                table: {
                    col: $('input[name="table.col"]', this.$builder).esFilter().val(),
                    row: $('input[name="table.row"]', this.$builder).esFilter().val(),
                },
            };
        },

        _render: function () {
            var html = $.renderFormTpl('chart', this.template, this.model);
            this.$builder.empty().html(html);

            // 范围
            $('input[name="scope.field"]',   this.$builder).dropdownSelector({options: help.getFieldsByTypes(['date'])});
            $('input[name="scope.range"]',   this.$builder).datetimeRangePicker();
            $('input[name="scope.filters"]', this.$builder).esFilter({mapping: help.mapping});

            // 统计
            $('input[name="statistic.method"]', this.$builder).dropdownSelector({options: help.getMethodOptions()});
            $('input[name="statistic.field"]',  this.$builder).dropdownSelector();

            // 仪表设置
            $('input[name="table.col"]', this.$builder).esFilter({mapping: help.mapping});
            $('input[name="table.row"]', this.$builder).esFilter({mapping: help.mapping});

            return this;
        },

        _listen: function () {
            var self = this;

            /// 切换取值方式
            $('[name="statistic.method"]', this.$builder).change(function () {
                self._updateFieldOptionsByMethod($(this));
            }).trigger('change');

            // 增删行列
            $('[name="table.col"], [name="table.row"]', this.$builder).bind('esFilter.create', function () {
                var $filter = $(this).siblings('.es-filter'),
                    $first = $('.filter-item:first', $filter),
                    $last = $('.filter-item:last', $filter);

                if (!$last.is($first)) {
                    $('[name=field]', $last).val($('[name=field]', $first).val()).trigger('change');
                    $('[name=field]', $first.siblings()).siblings('button').prop('disabled', true);
                }

            }).bind('esFilter.delete', function () {
                var $filter = $(this).siblings('.es-filter'),
                    $first = $('.filter-item:first', $filter);

                $('[name=field]', $first).siblings('button').prop('disabled', false);
            }).trigger('esFilter.create');

            this.$builder.on('change', '.filter-item [name="field"]', function () {
                var $filter = $(this).closest('.es-filter'),
                    $first = $('.filter-item:first', $filter);

                if($('[name=field]', $first).is($(this))) $first.siblings().remove();
            });

            return this;
        },

        _updateFieldOptionsByMethod: function ($method) {
            var $field = $method.closest('.form-group').find('[name="statistic.field"]'),
                types = help.getMethodTypes($method.val());

            if (types.length) {
                $field.dropdownSelector('updateOptions', help.getFieldsByTypes(types));
                $field.closest('.btn-group').show();
            } else {
                $field.val('');
                $field.closest('.btn-group').hide();
            }

            return this;
        },
    };


    // 成为jquery插件
    $.fn.esChartBuilder = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                instance = $this.data('instance.esChartBuilder');

            // 仅限<input>
            if ($(this)[0]['tagName'] != 'INPUT') return;

            // 创建对象并缓存
            if (!instance) {
                if (option == 'destroy') return; // 无需创建
                instance = new EsChartBuilder($this, options);
                $this.data('instance.esChartBuilder', instance);
            }

            // 执行方法
            if (typeof option == 'string') instance[option](param);
        });
    };
})(window, $, _);
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
//============================================
//  jQuery对象级插件 -- 大小可变的拖拽框
//============================================
(function (window, $, _) {
    /**
     * 定义构造函数
     * @param $element jQuery
     * @param options  obj
     */
    var ResizableDragger = function($element, options) {
        this.$element = []; // 容器
        this.settings = {};
        this.enabled  = false;

        this.$dragger = [];      // 拖拽控制元素
        this.$rightResizer = []; // 缩放控制元素 - 右侧
        this.$leftResizer = [];  // 缩放控制元素 - 左侧

        this.initialize($element, options);
    }

    /**
     * 静态属性和方法
     */
    ResizableDragger.prototype = {
        defaults: {
            dragger: '.dragger',
            rightResizer: '.resizer-right',
            leftResizer: '.resizer-left',
        },

        initialize: function ($element, options) {
            if (this.enabled) return this;

            this.$element = $element;
            this.settings = $.extend({}, this.defaults, this.$element.data(), options);

            this.$dragger = $(this.settings.dragger, this.$element);
            this.$rightResizer = $(this.settings.rightResizer, this.$element);
            this.$leftResizer = $(this.settings.leftResizer, this.$element);
            this.enabled  = true;

            return this._render()._listen();
        },

        _render: function () {

            return this;
        },

        _listen: function () {
            var self = this;

            // 拖拽
            this.$dragger.mousedown(function (e) {
                self._drag(e);
            });

            this.$dragger.children('[stop-propagation]').mousedown(function (e) {
                e.stopPropagation();
            });

            // 缩放 - 右侧
            this.$rightResizer.mousedown(function (e) {
                self._resize(e, 'right');
            });

            // 缩放 - 左侧
            this.$leftResizer.mousedown(function (e) {
                self._resize(e, 'left');
            });

            // 拖拽完成
            this.$element.bind('dragged.resizableDragger', function () {
                //console.log('dragged');
            });

            // 缩放完成
            this.$element.bind('resized.resizableDragger', function () {
                //console.log('resized');
            });

            return this;
        },

        _drag: function (e) {
            var self  = this,
                position = this.$element.position(),
                mouseStart = {x:e.clientX, y:e.clientY};

            document.onmousemove = function(e) {
                var mouseEnd = {x:e.clientX, y:e.clientY};
                self.$element.css({
                    top : position.top + mouseEnd.y - mouseStart.y,
                    left : position.left + mouseEnd.x - mouseStart.x
                });
            };

            document.onmouseup = function(e) {
                document.onmousemove = null;
                document.onmouseup = null;
                self._adjustPosition();
            };
        },

        _resize: function (e, direction) {
            var self  = this,
                position = this.$element.position(),
                size = {height:this.$element.height(), width:this.$element.width()},
                mouseStart = {x:e.clientX, y:e.clientY};

            document.onmousemove = function(e) {
                var mouseEnd = {x:e.clientX, y:e.clientY},
                    x = mouseEnd.x - mouseStart.x;

                if (direction == 'left') {
                    self.$element.css({
                        height : size.height + mouseEnd.y - mouseStart.y,
                        width : size.width - x,
                        left : position.left + x + 4,
                    });
                } else {
                    self.$element.css({
                        height : size.height + mouseEnd.y - mouseStart.y,
                        width : size.width + x,
                    });
                }
            };

            document.onmouseup = function(e) {
                document.onmousemove = null;
                document.onmouseup = null;
                self._adjustSize();
                self._adjustPosition();
            };
        },

        _adjustPosition: function () {
            var self = this;
            var old = this.$element.position(), now = {};

            if (old.top < 10) {
                now.top = 0;
            } else {
                now.top = this._getAdjustNum(old.top);
            }

            if (old.left < 10) {
                now.left = 0;
            } else {
                now.left = this._getAdjustNum(old.left);
            }

            this.$element.animate(now, 200, 'swing', function () {
                self.$element.trigger('dragged.resizableDragger');
            });
        },

        _adjustSize: function () {
            var self = this;
            var old = {height:this.$element.height(), width:this.$element.width()}, now = {};

            if (old.height < 200) {
                now.height = 200;
            } else {
                now.height = this._getAdjustNum(old.height);
            }

            if (old.width < 300) {
                now.width = 300;
            } else {
                now.width = this._getAdjustNum(old.width);
            }

            this.$element.animate(now, 200, 'swing', function () {
                self.$element.trigger('resized.resizableDragger');
            });
        },

        _getAdjustNum: function (num) {
            return Math.round(num / 10) * 10;
        },
    };

    /**
     * 成为jquery插件
     * @param  option object or string
     * @param  param  multy
     * @return jQuery
     */
    $.fn.resizableDragger = function(option, param) {
        return this.each(function () {
            var $this = $(this),
                options = (typeof option == 'object') ? option : {},
                instance = $this.data('instance.resizableDragger');

            if (!instance) {
                if (option == 'destroy') return; // 无需创建
                instance = new ResizableDragger($this, options);  // 创建对象并缓存
                $this.data('instance.resizableDragger', instance);
            }

            if (typeof option == 'string') instance[option](param); // 执行方法
        });
    };
})(window, $, _);
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
//============================================
//  jQuery对象级插件 -- 异步文件上传
//============================================
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