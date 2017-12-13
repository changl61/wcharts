<ul class="share-list">
    <li class="unit-table" data-type='query'>
        <div class="table-head" style="padding: 5px 8px;">
            <div class="table-head-left">
                <h5 style="line-height: 28px;">我创建的团队</h5>
            </div>
            <div class="table-head-right">
                <button class="btn btn-primary" handle="create"><i class="iconfont icon-plus"> 团队</i></button>
                <div class="unit-handles">
                    <button class="btn btn-default btn-xs hide" handle="show">
                        展开 <i class="iconfont icon-down"></i>
                    </button>
                    <button class="btn btn-default btn-xs" handle="hide">
                        收起 <i class="iconfont icon-up"></i>
                    </button>
                </div>
            </div>
            <div class="clearfix"></div>
        </div>
        <div class="table-body">
            <table class="table">
                <tr>
                    <th width="5%">#</th>
                    <th width="15%">团队名称</th>
                    <th width="15%">管理员</th>
                    <th width="35%">团队成员</th>
                    <th width="20%">我的权限</th>
                    <th width="100px" class="text-center">操作</th>
                </tr>
                {% for index, team in createdTeams %}
                    <tr data-model='{{ team|json_encode }}'>
                        <td>{{ index+1 }}</td>
                        <td>{{ team['name'] }}</td>
                        <td>{{ team['admin'] }}</td>
                        <td>{{ team['users'] }}</td>
                        <td>可查看编辑, 成员管理</td>
                        <td align="center">
                            <button class="btn btn-icon" handle="update"><i class="iconfont icon-write"></i></button>
                            <button class="btn btn-icon" handle="delete"><i class="iconfont icon-dustbin text-danger"></i></button>
                        </td>
                    </tr>
                {% endfor %}

                {% if createdTeams is empty %}
                    <tr><td colspan="100" align="center"> 暂无记录 </td></tr>
                {% endif %}
            </table>
        </div>
        <div class="table-foot"></div>
    </li>

    <li class="unit-table" data-type='query'>
        <div class="table-head">
            <div class="table-head-left">
                <h5>我加入的团队</h5>
            </div>
            <div class="table-head-right">
                <div class="unit-handles">
                    <button class="btn btn-default btn-xs hide" handle="show">
                        展开 <i class="iconfont icon-down"></i>
                    </button>
                    <button class="btn btn-default btn-xs" handle="hide">
                        收起 <i class="iconfont icon-up"></i>
                    </button>
                </div>
            </div>
            <div class="clearfix"></div>
        </div>
        <div class="table-body">
            <table class="table">
                <tr>
                    <th width="5%">#</th>
                    <th width="15%">团队名称</th>
                    <th width="15%">管理员</th>
                    <th width="35%">团队成员</th>
                    <th width="20%">我的权限</th>
                    <th width="60px" class="text-center">操作</th>
                </tr>
                {% for index, team in joinedTeams %}
                    <tr data-model='{{ team|json_encode }}'>
                        <td>{{ index+1 }}</td>
                        <td>{{ team['name'] }}</td>
                        <td>{{ team['admin'] }}</td>
                        <td>{{ team['users'] }}</td>
                        <td>
                            {% if team['role'] is 'team.user.read' %} 仅查看 {% endif %}
                            {% if team['role'] is 'team.user.write' %} 可查看编辑 {% endif %}
                        </td>
                        <td align="center">
                            <button class="btn btn-danger btn-sm" handle="quit">退出团队</button>
                        </td>
                    </tr>
                {% endfor %}

                {% if joinedTeams is empty %}
                    <tr><td colspan="100" align="center"> 暂无记录 </td></tr>
                {% endif %}
            </table>
        </div>
        <div class="table-foot"></div>
    </li>
</ul>

<div id="modal-team" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">创建团队</h4>
            </div>
            <div class="modal-body">
                <form class="unit-form" style="margin: 30px 0 30px 70px;">
                    <input name="id" type="hidden" value="">
                    <div class="row form-group">
                        <label class="col-sm-3 form-label">
                            <i class="required">*</i> 团队名称
                        </label>
                        <div class="col-sm-5 form-input">
                            <input name="name" type="text" class="form-control" value="" />
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-primary" handle="submit">保存</button>
            </div>
        </div>
    </div>
</div>