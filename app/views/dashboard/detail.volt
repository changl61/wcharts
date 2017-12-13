<div class="no-dashboard-tips hide">
    此分组中还没有"统计面板", 请点击左上角"+"按钮创建统计面板。
</div>

<div class="chart-container unselectable hide">
    <div id="dashboard" class="dashboard-grid">
        {{ dashboard['grid'] }}
        <button class="btn btn-default" type="button" handle="createRow" style="margin-bottom: 100px;">增加行</button>
    </div>
</div>


<!-- 重要变量 -->
<script type="application/javascript">
    var app = {
        indices : {{ indices|json_encode }},
        groups : {{ groups|json_encode }},
        dashboard : {{ dashboard|json_encode }},
        charts: {{ charts|json_encode }},
        cluster: {{ cluster |json_encode }},
    }
</script>

{#魔态框 - 创建图表#}
<div id="modal-createChart" class="modal fade">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">创建图表</h4>
                <div class="unit-step-wrap">
                    <ul class="unit-step">
                        <li class="unit-step-item done">
                            <span class="line"></span>
                            <span class="text">
                                <span class="circle">1</span> 选择形式
                            </span>
                        </li>
                        <li class="unit-step-item active">
                            <span class="line"></span>
                            <span class="text">
                                <span class="circle">2</span> 选择索引
                            </span>
                        </li>
                        <li class="unit-step-item">
                            <span class="text">
                                <span class="circle">3</span> 构建图表
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="modal-body">
                {#模版 - 创建图表#}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-primary" handle="createChart2">下一步</button>
                <button type="button" class="btn btn-primary" handle="createChart3">下一步</button>
                <button type="button" class="btn btn-primary" handle="submit">保存</button>
            </div>
        </div>
    </div>
</div>

{#魔态框 - 复制图表#}
<div id="modal-copyChart" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">复制图表</h4>
            </div>
            <div class="modal-body">
                <form class="form-horizontal unit-form unselectable" style="padding: 60px 100px;" onsubmit="return false;">
                    <input type="hidden" name="id" value="" />
                    <div class="form-group">
                        <label class="col-sm-4 form-label">
                            <span class="required">*</span>
                            目标分组
                        </label>
                        <div class="col-sm-8 form-input">
                            <select name="groupId" class="hide"></select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-4 form-label">
                            <span class="required">*</span>
                            目标统计面板
                        </label>
                        <div class="col-sm-8 form-input">
                            <select name="dashboardId" class="hide"></select>
                            <span class="form-tips">请先选择分组</span>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-primary" handle="submitCopy">保存</button>
                <button type="button" class="btn btn-primary hide" handle="submitMove">保存</button>
            </div>
        </div>
    </div>
</div>

{#魔态框 - 编辑图表#}
<div id="modal-updateChart" class="modal fade">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">编辑图表</h4>
            </div>
            <div class="modal-body" style="">
                <div class="chart-panel">
                    <input type="hidden" name="id" value="" />
                    <div class="chart-name">
                        <b>图表名称</b><input type="text" class="form-control" name="name" value="" />
                        <button class="btn btn-running pull-right" handle="runChart" type="button">
                            运行 <i class="iconfont icon-loading animation-spin" style="display: none;"></i>
                        </button>
                    </div>
                    <div class="chart-builder">
                        <input type="hidden" name="builder" value="" />
                    </div>
                </div>
                <div class="chart-preview">
                    <div class="chart-body"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-primary" handle="submit">保存</button>
            </div>
        </div>
    </div>
</div>

{#模版 - 单个图表#}
<script id="template-chart-item" type="text/html">
    <div class="chart-item" data-id="">
        <div class="chart-body"></div>
        <div class="chart-head">
            <h5 class="chart-title selectable"></h5>
            <div class="chart-handles" stop-propagation>
                <div class="dropdown" handle="moreAboutDashboard">
                    <button class="btn btn-icon dropdown-toggle" data-toggle="dropdown"><i class="iconfont icon-more"></i></button>
                    <ul class="dropdown-menu dropdown-menu-right">
                        <li handle="update"><i class="iconfont icon-write"></i><span class="text">编辑</span></li>
                        <li handle="copy"><i class="iconfont icon-copy"></i><span class="text">复制</span></li>
                        <li handle="move"><i class="iconfont icon-move"></i><span class="text">移动</span></li>
                        <li handle="share"><i class="iconfont icon-share"></i><span class="text">分享</span></li>
                        <li handle="delete"><i class="iconfont icon-dustbin"></i><span class="text">删除</span></li>
                    </ul>
                </div>
                <button handle="refresh" class="btn btn-icon">
                    <i class="iconfont icon-refresh"></i>
                    <i class="iconfont icon-loading animation-spin hide"></i>
                </button>
            </div>
        </div>
        <div class="chart-foot">
            <div class="chart-datetime">
                <i class="iconfont icon-time"></i>&nbsp;&nbsp;<span class="datetime-range"></span>
                <span class="datetime-interval"></span>
            </div>
            <button class="btn btn-icon chart-resize-right"><i class="iconfont icon-resize-bottom-right"></i></button>
        </div>
    </div>
</script>

{#模版 - 空#}
<script id="template-chart-empty" type="text/html">
    <div class="chart-empty">
        <div class="chart-body">
            <div class="tips">This is empty space.</div>
            <button class="btn btn-default" handle="createChart" type="button">创建图表</button>
            <a class="anchor delete-row" handle="deleteRow" type="button" title="删除行"><i class="iconfont icon-remove text-danger"></i></a>
        </div>
    </div>
</script>