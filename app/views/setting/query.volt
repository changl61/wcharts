<ul class="query-group-list">
    {% for group in groupQueries %}
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
                    <button class="btn btn-default btn-xs hide" handle="showQueries">
                        展开 <i class="iconfont icon-down"></i>
                    </button>
                    <button class="btn btn-default btn-xs" handle="hideQueries">
                        收起 <i class="iconfont icon-up"></i>
                    </button>
                </div>
            </div>
            <div class="clearfix"></div>
        </div>
        <div class="table-body">
            <table class="table">
                {% for index, query in group['queries'] %}
                <tr data-model='{{ query|json_encode }}'>
                    <td width="5%">{{ index+1 }}</td>
                    <td width="75%">{{ query['name'] }}</td>
                    <td width="20%" class="text-right">
                        <button class="btn btn-icon" handle="updateQuery">
                            <i class="iconfont icon-write"></i>
                        </button>
                        <button class="btn btn-icon" handle="deleteQuery">
                            <i class="iconfont icon-dustbin text-danger"></i>
                        </button>
                    </td>
                </tr>
                {% endfor %}

                {% if group['queries'] is empty %}
                <tr><td colspan="100" align="center"> 此分组下暂无查询 </td></tr>
                {% endif %}
            </table>
        </div>
        <div class="table-foot"></div>
    </li>
    {% endfor %}
    <li style="text-align: center;">
        <button type="button" class="btn btn-primary" handle="createGroup">
            <i class="iconfont icon-plus"></i> 查询分组
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

{#魔态框 - 查询#}
<div id="modal-query" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">编辑查询</h4>
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

{#模版 - 查询#}
<script id="template-query" type="text/html">
    <form class="unit-form" style="margin: 50px 0 50px 70px;">
        <input name="id" type="hidden" value="<%= id %>">
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 查询名称
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