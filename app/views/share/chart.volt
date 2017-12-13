<div class="chart-item chart-share">
    <div class="chart-body"></div>
    <div class="chart-head">
        <h5 class="chart-title selectable">{{ chart['name'] }}</h5>
        <div class="chart-handles" stop-propagation>
            <button handle="refresh" class="btn btn-icon">
                <i class="iconfont icon-refresh"></i>
                <i class="iconfont icon-loading animation-spin hide"></i>
            </button>
        </div>
    </div>
    <div class="chart-foot">
        <div class="chart-datetime">
            <i class="iconfont icon-time"></i>
            <span class="datetime-range"></span>
            <span class="datetime-interval"></span>
        </div>
    </div>
</div>

<script type="application/javascript">
    var app = {
        uuid: '{{ uuid }}',
        chart: {{ chart|json_encode }}
    }
</script>