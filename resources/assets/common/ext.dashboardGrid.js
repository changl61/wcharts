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