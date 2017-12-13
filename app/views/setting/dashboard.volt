<ul class="query-group-list">
    {% for group in groupDashboards %}
    <li class="unit-table" data-model='{"id":{{ group['id'] }}, "name":"{{ group['name'] }}", "sort":{{ group['sort'] }}}'>
        <div class="table-head">
            <div class="table-head-left">
                <h5><i class="iconfont icon-folder"></i> &nbsp;&nbsp;{{ group['name'] }}</h5>
            </div>
            <div class="table-head-right">
                <div class="unit-handles">
                    <button class="btn btn-icon" handle="updateGroup">
                        <i class="iconfont icon-write"></i>
                    </button>
                    <button class="btn btn-icon" handle="deleteGroup">
                        <i class="iconfont icon-dustbin text-danger"></i>
                    </button>
                    <button class="btn btn-default btn-xs hide" handle="showDashboards">
                        展开 <i class="iconfont icon-down"></i>
                    </button>
                    <button class="btn btn-default btn-xs" handle="hideDashboards">
                        收起 <i class="iconfont icon-up"></i>
                    </button>
                </div>
            </div>
            <div class="clearfix"></div>
        </div>
        <div class="table-body">
            <table class="table">
                {% for index, dashboard in group['dashboards'] %}
                <tr data-model='{{ dashboard|json_encode }}'>
                    <td width="5%">{{ index+1 }}</td>
                    <td width="50%">{{ dashboard['name'] }}</td>
                    <td width="25%">含图表{{ chartNum[dashboard['id']] ? chartNum[dashboard['id']]['num'] : 0 }}张</td>
                    <td width="20%" class="text-right">
                        <button class="btn btn-icon" handle="updateDashboard">
                            <i class="iconfont icon-write"></i>
                        </button>
                        <button class="btn btn-icon" handle="deleteDashboard">
                            <i class="iconfont icon-dustbin text-danger"></i>
                        </button>
                    </td>
                </tr>
                {% endfor %}

                {% if group['dashboards'] is empty %}
                <tr><td colspan="100" align="center"> 此分组下暂无统计面板 </td></tr>
                {% endif %}
            </table>
        </div>
        <div class="table-foot"></div>
    </li>
    {% endfor %}
    <li style="text-align: center;">
        <button type="button" class="btn btn-primary" handle="createGroup">
            <i class="iconfont icon-plus"></i> 统计面板分组
        </button>
    </li>
</ul>

<!-- 重要变量 -->
<script type="application/javascript">
    var app = {
        groups : {{ groups|json_encode }},
    }
</script>

{#魔态框 - 分组#}
<div id="modal-group" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">编辑分组</h4>
            </div>
            <div class="modal-body">
                {#模版 - 分组#}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-primary" handle="submit">保存</button>
            </div>
        </div>
    </div>
</div>

{#模版 - 分组#}
<script id="template-group" type="text/html">
    <form class="unit-form" style="margin: 50px 0 50px 70px;">
        <input name="id" type="hidden" value="<%= id %>">
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 分组名称
            </label>
            <div class="col-sm-5 form-input">
                <input name="name" type="text" class="form-control" value="<%= name %>" />
            </div>
        </div>
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                排序值
            </label>
            <div class="col-sm-2 form-input">
                <input type="number" name="sort" class="form-control" value="<%= sort %>" />
            </div>
            <div class="col-sm-3 form-tips">
                越小越靠前
            </div>
        </div>
    </form>
</script>

{#魔态框 - 面板#}
<div id="modal-dashboard" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">编辑统计面板</h4>
            </div>
            <div class="modal-body">
                {#模版-索引#}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-primary" handle="submit">保存</button>
            </div>
        </div>
    </div>
</div>

{#模版 - 面板#}
<script id="template-dashboard" type="text/html">
    <form class="unit-form" style="margin: 50px 0 50px 70px;">
        <input name="id" type="hidden" value="<%= id %>">
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 统计面板名称
            </label>
            <div class="col-sm-5 form-input">
                <input name="name" type="text" class="form-control" value="<%= name %>" />
            </div>
        </div>
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 切换分组
            </label>
            <div class="col-sm-5 form-input">
                <select name="groupId" class="hide"></select>
            </div>
        </div>
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                排序值
            </label>
            <div class="col-sm-2 form-input">
                <input type="number" name="sort" class="form-control" value="<%= sort %>" />
            </div>
            <div class="col-sm-3 form-tips">
                越小越靠前
            </div>
        </div>
    </form>
</script>