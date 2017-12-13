<div class="app-tab">
    <div class="tab-list">
        <ul class="menu-list">
            <li><a href="/setting/es" {% if action == 'es' %}class="active"{% endif %}>ES集群</a></li>


            {% if userRole is not 'team.user.read' %}
            <li><a href="/setting/dashboard" {% if action == 'dashboard' %}class="active"{% endif %}>统计面板管理</a></li>
            <li><a href="/setting/query" {% if action == 'query' %}class="active"{% endif %}>查询管理</a></li>
            <li><a href="/setting/share" {% if action == 'share' %}class="active"{% endif %}>分享链接管理</a></li>
            {% endif %}

            {% if userRole is 'admin' %}
            <li><a href="/setting/user" {% if action == 'user' %}class="active"{% endif %}>用户管理</a></li>
            {% endif %}

            {% if userRole is 'user' or userRole is 'admin' %}
            <li><a href="/setting/team" {% if action == 'team' %}class="active"{% endif %}>团队管理</a></li>
            <li><a href="/setting/account" {% if action == 'account' %}class="active"{% endif %}>账号管理</a></li>
            {% endif %}

            {% if userRole is 'team.admin' %}
            <li><a href="/setting/teamUser" {% if action == 'teamUser' %}class="active"{% endif %}>团队成员管理</a></li>
            {% endif %}
        </ul>
    </div>
</div>
<div class="app-main">
    {{ content() }}
</div>
<ul class="app-handles">
    <li class="anchor" handle="goToTop" title="回到顶部" data-toggle="tooltip" data-placement="left"><i class="iconfont icon-totop"></i></li>
</ul>