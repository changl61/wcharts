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