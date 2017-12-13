<ul class="share-list">
    <li class="unit-table" data-type='query'>
        <div class="table-head" style="padding: 5px 8px;">
            <div class="table-head-left">
                <h5 style="line-height: 28px;">团队成员</h5>
            </div>
            <div class="table-head-right">
                <button class="btn btn-primary" handle="create"><i class="iconfont icon-plus"> 成员</i></button>
            </div>
            <div class="clearfix"></div>
        </div>
        <div class="table-body">
            <table class="table">
                <tr>
                    <th width="5%">#</th>
                    <th width="15%">用户名</th>
                    <th width="40%">角色</th>
                    <th width="30%">权限</th>
                    <th width="10%" class="text-center">操作</th>
                </tr>

                <tr>
                    <td>{{ 1 }}</td>
                    <td>{{ teamAdmin['name'] }}</td>
                    <td>管理员 ( 我 )</td>
                    <td>可查看编辑, 成员管理</td>
                    <td align="center">
                        <button class="btn btn-icon" disabled ><i class="iconfont icon-write"></i></button>
                        <button class="btn btn-icon" disabled ><i class="iconfont icon-dustbin text-danger"></i></button>
                    </td>
                </tr>

                {% for index, item in teamUsers %}
                    <tr data-model='{{ item|json_encode }}'>
                        <td>{{ index+2 }}</td>
                        <td>{{ item['name'] }}</td>
                        <td>普通用户</td>
                        <td>
                            {% if item['role'] is 'team.user.read' %} 仅查看 {% endif %}
                            {% if item['role'] is 'team.user.write' %} 可查看编辑 {% endif %}
                        </td>
                        <td align="center">
                            <button class="btn btn-icon" handle="update" {% if item['role'] is 'admin' %} disabled {% endif %}><i class="iconfont icon-write"></i></button>
                            <button class="btn btn-icon" handle="delete" {% if item['role'] is 'admin' %} disabled {% endif %}><i class="iconfont icon-dustbin text-danger"></i></button>
                        </td>
                    </tr>
                {% endfor %}
            </table>
        </div>
        <div class="table-foot"></div>
    </li>
</ul>

<div id="modal-teamUser" class="modal fade" autocomplete="off">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title"></h4>
            </div>
            <div class="modal-body">
                <form class="unit-form" style="margin: 30px 0 30px 70px;">
                    <input name="id" type="hidden" value="">
                    <div class="row form-group">
                        <label class="col-sm-3 form-label">
                            <i class="required">*</i> 用户名
                        </label>
                        <div class="col-sm-5 form-input">
                            <textarea name="name" class="form-control" placeholder="用户名, 一行一个"></textarea>
                        </div>
                    </div>
                    <div class="row form-group">
                        <label class="col-sm-3 form-label">
                            <i class="required">*</i> 角色
                        </label>
                        <div class="col-sm-5 form-input" style="margin-top: 6px;">
                            普通用户
                        </div>
                    </div>
                    <div class="row form-group">
                        <label class="col-sm-3 form-label">
                            <i class="required">*</i> 权限
                        </label>
                        <div class="col-sm-5 form-input" style="margin-top: 6px;">
                            <label class="label-checkbox">
                                <input type="radio" name="role" value="team.user.write"/>
                                <span class="input-replacement"></span>
                                <span class="input-name">可查看编辑</span>
                            </label>
                            <label class="label-checkbox">
                                <input type="radio" name="role" value="team.user.read"/>
                                <span class="input-replacement"></span>
                                <span class="input-name">仅查看</span>
                            </label>
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