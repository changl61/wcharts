<div class="app-tab">
    <div class="tab-list">
        <ul class="menu-list">
            {% for item in queries %}
            <li>
                <a href="/query/detail/{{ group['id'] }}/{{ item['id'] }}"{% if item['id'] == query['id'] %} class="active" {% endif %}>
                    {{ item['name'] }}
                </a>
            </li>
            {% endfor %}
            <li>
                <button class="btn btn-icon" handle="createQuery"><i class="iconfont icon-plus"></i></button>
            </li>
        </ul>
    </div>
    <div class="tab-right">
        <div class="btn-group">
            <button data-toggle="dropdown" class="btn btn-primary dropdown-toggle" type="button">
                <span class="text">{{ group['name'] }}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu dropdown-menu-right">
                {% for item in groups %}
                <li {% if item['id'] == group['id'] %} class="active" {% endif %}>
                    <a href="/query/detail/{{ item['id'] }}">{{ item['name'] }}</a>
                </li>
                {% endfor %}
            </ul>
        </div>
    </div>
</div>
<div class="app-main">
    {{ content() }}
</div>

{#魔态框-创建查询#}
<div id="modal-createQuery" class="modal fade">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">创建查询</h4>
            </div>
            <div class="modal-body">
                {#模版-创建查询#}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">关闭</button>
                <button type="button" class="btn btn-primary" handle="submit">确定</button>
            </div>
        </div>
    </div>
</div>

{#模版-创建查询#}
<script id="template-query" type="text/html">
    <form class="unit-form" style="margin: 50px 0 50px 40px;">
        <input name="builder" type="hidden" value='<%= builder ? JSON.stringify(builder) : "" %>'>
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 查询名称
            </label>
            <div class="col-sm-5 form-input">
                <input type="text" name="name" class="form-control" placeholder="" value="<%= name %>" />
            </div>
        </div>
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 选择索引
            </label>
            <div class="col-sm-5 form-input">
                <% if(id){ %>
                <input name="indexId" type="hidden" value="<%= index.id %>">
                <input type="text" class="form-control" value="<%= index.name %>" disabled>
                <% }else{ %>
                <select name="indexId" class="hide"></select>
                <span class="form-tips">
                    <i class="iconfont icon-info-solid info-tips" title="没有索引? 去 [ 设置->ES集群 ] 中添加索引" data-toggle="tooltip" data-placement="right"></i>
                </span>
                <% } %>
            </div>
        </div>
        <div class="row form-group">
            <label class="col-sm-3 form-label">
                <i class="required">*</i> 选择分组
            </label>
            <div class="col-sm-5 form-input">
                <select name="groupId" class="hide"></select>
            </div>
        </div>
    </form>
</script>