<ul class="user-list">
    <li class="unit-table">
        <div class="table-head">
            <div class="table-head-left">
                <form autocomplete="off">
                    <div class="input-group">
                        <input type="text" name="keywords" class="form-control" placeholder="名称关键字" value="{{ keywords }}">
                        <div class="input-group-btn">
                            <button type="submit" class="btn btn-default">
                                <i class="iconfont icon-search2 text-primary"></i>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <div class="table-head-right">
                <div class="unit-handles">
                    <button type="button" class="btn btn-primary" handle="create">
                        <i class="iconfont icon-plus"></i> 用户
                    </button>
                </div>
            </div>
            <div class="clearfix"></div>
        </div>
        <div class="table-body">
            <table class="table">
                <tr>
                    <th width="5%">编号</th>
                    <th width="32%">用户名</th>
                    <th width="21%">创建时间</th>
                    <th width="22%">最近登录时间</th>
                    <th width="10%" class="text-center">允许登录</th>
                    <th width="10%" class="text-center">操作</th>
                </tr>
                {% for index, user in users %}
                    <tr data-id='{{ user['id'] }}' data-name='{{ user['name'] }}' class="{% if not user['status'] %}forbidden{% endif %}">
                        <td>{{ index+1 }}</td>
                        <td>{{ user['name'] }}</td>
                        <td>{{ user['createTime'] }}</td>
                        <td>{{ user['loginTime'] }}</td>
                        <td class="text-center"><input type="hidden" value="{% if user['status'] %}yes{% else %}no{% endif %}" name="status" style="display: none;"></td>
                        <td class="text-center">
                            <a handle="resetPassword">重置密码</a>
                        </td>
                    </tr>
                {% endfor %}

                {% if users is empty %}
                    <tr><td colspan="100" align="center"> 暂无记录 </td></tr>
                {% endif %}
            </table>
        </div>
        <div class="table-foot"></div>
    </li>
</ul>

<div id="modal-user" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">新增用户</h4>
            </div>
            <div class="modal-body">
                <form class="unit-form" style="margin: 50px 0 50px 70px;">
                    <div class="row form-group">
                        <label class="col-sm-3 form-label">
                            <i class="required">*</i> 用户名
                        </label>
                        <div class="col-sm-5 form-input">
                            <input name="name" type="text" class="form-control" value="" />
                        </div>
                    </div>
                    <div class="row form-group">
                        <label class="col-sm-3 form-label">
                            <i class="required">*</i> 初始密码
                        </label>
                        <div class="col-sm-5 form-input">
                            <input name="password" type="text" class="form-control" value="" />
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