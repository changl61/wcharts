{#集群统计信息#}
<div class="cluster-create-btn {% if cluster['id'] %} hide {% endif %}">
    <button class="btn btn-primary" handle="createUrl"><i class="iconfont icon-plus"></i> ES集群地址</button>
</div>

<ul class="cluster-statistics {% if not cluster['id'] %} hide {% endif %}">
    <li class="url">
        <h5>集群地址</h5>
        <button class="btn btn-icon cluster-config" handle="configUrl">
            <i class="iconfont icon-config"></i>
        </button>
        <div class="statistics-text">
            {{ cluster['url'] }}
        </div>
    </li>
    <li class="health">
        <h5>集群健康</h5>
        <div class="statistics-text">
            <span id="active-shards">...</span> /
            <span id="primary-shards">...</span><br>
            <span style="color: #888; font-size: 12px; margin-top: 10px;">健康分片 / 总分片</span>
        </div>
    </li>
    <li class="index">
        <h5>录入索引</h5>
        <div class="statistics-text">
            <span id="index-num">...</span>
        </div>
    </li>
    <li class="chart">
        <h5>图表数量</h5>
        <div class="statistics-text">
            <span id="chart-num">...</span>
        </div>
    </li>
    <li class="query">
        <h5>查询数量</h5>
        <div class="statistics-text">
            <span id="query-num">...</span>
        </div>
    </li>
</ul>

<div id="table-index" class="unit-table {% if not cluster['id'] %} hide {% endif %}">
    <div class="table-head">
        <div class="table-head-left">
            <h5>录入索引</h5>
            <span style="color: #666;">构建查询和图表需要先把索引录入系统</span>
        </div>
        <div class="table-head-right">
            <div class="unit-handles">
                <button class="btn btn-primary" handle="create">
                    <i class="iconfont icon-plus"></i> 索引
                </button>
            </div>
        </div>
        <div class="clearfix"></div>
    </div>
    <div class="table-body">
        <table class="table">
            <thead>
                <tr>
                    <th width="5%">#</th>
                    <th width="20%">索引 / 文档类型</th>
                    <th width="30%">字段</th>
                    <th width="10%">默认日期字段</th>
                    <th width="7%">图表数量</th>
                    <th width="7%">查询数量</th>
                    <th width="11%">备注</th>
                    <th width="60px" class="text-center">操作</th>
                </tr>
            </thead>
            <tbody>
                {#模版-索引列表#}
            </tbody>
        </table>
    </div>
    <div class="table-foot"></div>
</div>

{#魔态框-集群#}
<div id="modal-cluster" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">集群地址</h4>
                <div class="unit-tab-wrap" style="top:7px;">
                    <div class="unit-tab">
                        <a class="tab-item" handle="selectHistory">切换</a>
                        <a class="tab-item active" handle="update">修改当前</a>
                        <a class="tab-item" handle="create">新增</a>
                    </div>
                </div>
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

<!-- 重要变量 -->
<script type="application/javascript">
    var app = {
        cluster : {{ cluster|json_encode }},
    }
</script>

{#模版-集群#}
<script id="template-cluster" type="text/html">
    <form class="unit-form" style="margin: 50px 0 50px 40px;">
        <input name="id" type="hidden" value="<%= id %>">

        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 协议
            </label>
            <div class="col-sm-5 form-input">
                <select name="protocol" class="hide">
                    <option value="<%= protocol %>"><%= protocol %></option>
                </select>
            </div>
        </div>

        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 域名
            </label>
            <div class="col-sm-5 form-input">
                <input name="host" type="text" class="form-control" value="<%= host %>">
            </div>
            <div class="col-sm-3 form-tips">
                或者IP
            </div>
        </div>

        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 端口
            </label>
            <div class="col-sm-5 form-input">
                <input name="port" type="number" class="form-control" value="<%= port %>">
            </div>
        </div>
    </form>
</script>

{#模版-集群-历史#}
<script id="template-clusterHistory" type="text/html">
    <form class="unit-form" style="margin: 50px 60px">
        <ul class="cluster-history">
            <% _.each(list, function (item) { %>
            <li class="history-item row <% if (item.status == '1') { %> active <% } %>" data-id="<%= item.id %>" handle="switchCluster">
                <div class="col-xs-6 col-md-11"><%= item.url %></div>
                <div class="col-xs-6 col-md-1">
                    <i class="iconfont icon-ok"></i>
                </div>
            </li>
            <% }) %>
        </ul>
    </form>
</script>


{#魔态框-索引#}
<div id="modal-index" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">录入索引</h4>
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

{#模版-索引#}
<script id="template-index" type="text/html">
    <form class="unit-form" style="margin: 50px 0 50px 70px;">
        <input name="id" type="hidden" value="<%= id %>">
        <input name="mapping" type="hidden" value='<%= mapping %>'>
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 索引
            </label>
            <div class="col-sm-5 form-input">
                <input name="index" type="text" class="form-control" value="<%= index %>" />
            </div>
            <div class="col-sm-4 form-tips">
                <i class="iconfont icon-info-solid info-tips" data-toggle="tooltip" title='* 号代表动态索引的后缀, 例如"some_index_yyy-mm-dd"可写为"some_index*"'></i>
            </div>
        </div>
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 文档类型
            </label>
            <div class="col-sm-5 form-input">
                <select name="type" class="hide">
                    <% if (type) { %> <option value="<%= type %>"><%= type %></option> <% } %>
                </select>
            </div>
        </div>
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 默认日期字段
            </label>
            <div class="col-sm-9 form-input">
                <select name="defaultDateField" class="hide">
                    <% if (defaultDateField) { %> <option value="<%= defaultDateField %>"><%= defaultDateField %></option> <% } %>
                </select>
                <span class="form-tips" style="width: 120px;">
                    <i class="iconfont icon-info-solid info-tips" data-toggle="tooltip" title='含有日期字段的索引才能被录入系统'></i>
                </span>
            </div>
        </div>
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                 备注
            </label>
            <div class="col-sm-5 form-input">
                <textarea name="comment" placeholder="" class="form-control"><%= comment %></textarea>
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

{#模版-索引列表#}
<script id="template-index-list" type="text/html">
    <% if (list.length){ %>
        <% _.each(list, function (item, index) { %>
        <tr data-model='<%= JSON.stringify(item) %>'>
            <td><%= index+1 %></td>
            <td><%= item.name %></td>
            <td>
                <% _.each(JSON.parse(item.mapping), function (dataType, field) { %>
                    <span class="index-field"><%= field %></span>
                <% }) %>
            </td>
            <td><%= item.defaultDateField %></td>
            <td><%= item.chartNum %></td>
            <td><%= item.queryNum %></td>
            <td><%= item.comment %></td>
            <td align="center">
                <button class="btn btn-icon" handle="update"><i class="iconfont icon-write"></i></button>
                <button class="btn btn-icon" handle="delete"><i class="iconfont icon-dustbin text-danger"></i></button>
            </td>
        </tr>
        <% }) %>
    <% } else { %>
        <tr><td colspan="100" align="center">暂无记录</td></tr>
    <% } %>
</script>