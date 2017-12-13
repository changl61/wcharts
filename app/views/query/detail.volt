<div class="no-query-tips hide">
    此分组中还没有"查询", 请点击左上角"+"按钮创建新查询。
</div>

<div class="chart-container hide">
    <div class="chart-panel unselectable">
        <div class="chart-running">
            <button class="btn btn-remove" type="button" handle="deleteQuery"><i class="iconfont icon-dustbin"></i></button>
            <button class="btn btn-copy" type="button" handle="copyQuery"><i class="iconfont icon-copy"></i></button>
            <button class="btn btn-copy" type="button" handle="shareQuery"><i class="iconfont icon-share"></i></button>
            <button class="btn btn-running pull-right" type="button" handle="runQuery">保存&运行</button>
        </div>
        <div class="chart-builder">
            <form class="form-horizontal unit-form unselectable" style="padding: 10px 20px 10px 10px;">
                <fieldset>
                    <legend>选择索引</legend>
                    <div class="form-group">
                        <label class="col-sm-2 form-label"></label>
                        <div class="col-sm-8 form-input">
                            <input name="index" type="text" class="form-control" value="{{ query['index']['name'] }}" style="color: #fff;" disabled />
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>时间范围</legend>
                    <div class="form-group">
                        <label class="col-sm-2 form-label">字段</label>
                        <div class="col-sm-8 form-input">
                            <input type="hidden" name="scopeField" value="{{ query['builder']['scope']['field'] }}" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="col-sm-2 form-label">范围</label>
                        <div class="col-sm-9 form-input">
                            <label class="label-datetime">
                                <i class="glyphicon glyphicon-time"></i>
                                <input type="text" class="form-control" name="scopeRange" value="{{ query['builder']['scope']['range'] }}" />
                            </label>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>筛选条件</legend>
                    <input type="hidden" name="filters" value='{{ query['builder']['filters']|json_encode }}' />
                </fieldset>
            </form>
        </div>
        <div class="chart-handle">
            <a class="anchor" handle="builderDrawer"><i class="iconfont icon-drawer-right"></i></a>
        </div>
    </div>

    <div class="chart-preview">
        <!-- iframe -->
    </div>
</div>

<!-- 重要变量 -->
<script type="application/javascript">
    var app = {
        indices : {{ indices|json_encode }},
        groups : {{ groups|json_encode }},
        query: {{ query|json_encode }},
        mapping: {{ query['index']['mapping']|json_encode }},
    }
</script>