<div class="app-tab unselectable">
    <div class="tab-list">
        <ul class="menu-list">
            {% for item in dashboards %}
                <li>
                    <a href="/dashboard/detail/{{ group['id'] }}/{{ item['id'] }}"{% if item['id'] == dashboard['id'] %} class="active" {% endif %}>
                        {{ item['name'] }}
                    </a>
                </li>
            {% endfor %}
            <li>
                <button class="btn btn-icon" handle="createDashboard"><i class="iconfont icon-plus"></i></button>
            </li>
        </ul>
    </div>
    <div class="tab-right">
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
        <div class="btn-group">
            <button data-toggle="dropdown" class="btn btn-primary dropdown-toggle" type="button">
                <span class="text">{{ group['name'] }}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu dropdown-menu-right">
                {% for item in groups %}
                    <li {% if item['id'] == group['id'] %} class="active" {% endif %}>
                        <a href="/dashboard/detail/{{ item['id'] }}">{{ item['name'] }}</a>
                    </li>
                {% endfor %}
            </ul>
        </div>
    </div>
</div>
<div class="app-main">
    {{ content() }}
</div>
<ul class="app-handles">
    <li class="anchor" handle="shareDashboard" title="分享" data-toggle="tooltip" data-placement="left"><i class="iconfont icon-share"></i></li>
    <li class="anchor" handle="fullScreen" data-full="0" title="(退出)全屏" data-toggle="tooltip" data-placement="left"><i class="iconfont icon-fullscreen"></i></li>
    <li class="anchor" handle="goToTop" title="回到顶部" data-toggle="tooltip" data-placement="left"><i class="iconfont icon-totop"></i></li>
</ul>

{#魔态框 - 创建面板#}
<div id="modal-createDashboard" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">创建统计面板</h4>
            </div>
            <div class="modal-body">
                <form class="unit-form" style="margin: 50px 0 50px 40px;">
                    <input name="groupId" type="hidden" value="{{ group['id'] }}">
                    <div class="row form-group">
                        <label class="col-sm-3 form-label">
                            <i class="required">*</i> 统计面板名称
                        </label>
                        <div class="col-sm-5 form-input">
                            <input type="text" name="name" class="form-control" placeholder="" value="" />
                        </div>
                    </div>
                    <div class="row form-group">
                        <label class="col-sm-3 form-label">
                            <i class="required">*</i> 排序值
                        </label>
                        <div class="col-sm-2 form-input">
                            <input type="number" name="sort" class="form-control" value="100" />
                        </div>
                        <div class="col-sm-3 form-tips">
                            越小越靠前
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-primary" handle="submit">确定</button>
            </div>
        </div>
    </div>
</div>