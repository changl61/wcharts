<div class="app-left unselectable">
    <div class="avatar">
        <img class="img-circle" src="/assets/img/logo.jpg" width="38">
    </div>
    <ul class="navigation">
        <li><a href="/dashboard" {% if controller == 'dashboard' %}class="active"{% endif %}><i class="iconfont icon-dashboard"></i> <span class="text">统计</span></a></li>
        <li><a href="/query" {% if controller == 'query' %}class="active"{% endif %}><i class="iconfont icon-search"></i> <span class="text">查询</span></a></li>
        <li><a href="/setting/es" {% if controller == 'setting' %}class="active"{% endif %}><i class="iconfont icon-config"></i> <span class="text">设置</span></a></li>
    </ul>

    <div class="help-wrap">
        <a href="/help/index.html" target="_blank" class="btn btn-help">帮助</a><br/>
        <a class="btn btn-warning" handle="logout">退出</a>
    </div>
</div>

<div class="app-right">
    {{ content() }}
</div>

<div class="app-musk">
    <i class="iconfont icon-loading2 animation-spin"></i>
</div>

<div id="modal-switch-account" class="modal fade">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-body">
                <dl class="team-accounts">
                    <dt class="account-title">切换到团队账号</dt>
                </dl>
                <dl class="user-accounts">
                    <dt class="account-title">切换到个人账号</dt>
                </dl>
                <a href="/auth/logout" class="btn btn-danger btn-block">退出登录</a>
            </div>
        </div>
    </div>
</div>