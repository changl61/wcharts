<div class="share-top">
    <h4 class="title">{{ dashboard['name'] }}</h4>
    <div class="btn-group" id="auto-refresh">
        <button data-toggle="dropdown" class="btn btn-default dropdown-toggle" type="button">
            <span class="text">不自动刷新</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li class="active" value="0"><a href="javascript:void(0)">不自动刷新</a></li>
            <li value="30"><a href="javascript:void(0)">每30秒刷新</a></li>
            <li value="60"><a href="javascript:void(0)">每1分钟刷新</a></li>
            <li value="180"><a href="javascript:void(0)">每3分钟刷新</a></li>
            <li value="300"><a href="javascript:void(0)">每5分钟刷新</a></li>
        </ul>
    </div>
</div>
<div id="dashboard" class="dashboard-grid unselectable" style="padding: 10px;">
    {{ dashboard['grid'] }}
</div>

<script type="application/javascript">
    var app = {
        uuid : '{{ uuid }}',
        charts: {{ charts|json_encode }},
    }
</script>

{#模版 - 单个图表#}
<script id="template-chart-item" type="text/html">
    <div class="chart-item" data-id="">
        <div class="chart-body"></div>
        <div class="chart-head">
            <h5 class="chart-title selectable"></h5>
            <div class="chart-handles" stop-propagation>
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
        </div>
    </div>
</script>

{#模版 - 空图表#}
<script id="template-chart-empty" type="text/html">
    <div class="chart-empty">
        <div class="chart-body">
            <div class="tips">This is empty space.</div>
        </div>
    </div>
</script>