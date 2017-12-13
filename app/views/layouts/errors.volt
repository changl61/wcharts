<div class="app-error">
    <div class="error-icon">
        <i class="iconfont icon-sorry"></i>
    </div>
    <div class="error-text">
        {{ content() }}
    </div>
    <div class="error-buttons">
        <a class="btn btn-beautiful" href="/index">转到首页</a>
        <button class="btn btn-beautiful" onclick="javascript: history.go(-1)">返回上页</button>
    </div>
</div>