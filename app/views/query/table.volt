<div class="unit-table query-list">
    <div class="table-head">
        <div class="table-head-left">
            共 <span class="query-total">...</span> 条记录
        </div>
        <div class="table-head-right unselectable">
            <button class="btn btn-icon" handle="pickDisplayFields"><i class="iconfont icon-list2"></i></button>
        </div>
        <div class="clearfix"></div>
    </div>
    <table class="table table-body">
        <thead><!-- 模版 - 列表表头 --></thead>
        <tbody><!-- 模版 - 列表表体 --></tbody>
    </table>
    <div class="table-foot">
        <div class="page-loading">
            <i class="iconfont icon-loading2 animation-spin"></i>
        </div>
    </div>
</div>

<!-- 模版 - 列表表头 -->
<script id="template-listHead" type="text/html">
    <tr>
        <th width="36px" style="text-align: center;">#</th>
        <% _.each(fields, function (field) { %>
        <th><%= field %></th>
        <% }) %>
        <th width="60px" style="text-align: center;">
            <i class="iconfont icon-info-solid text-warning" title="导出所选日志的源文件前后5000(<=)条日志, 以供进一步分析" data-toggle="tooltip" data-placement="left"></i>
            导出
        </th>
        <th width="30px" style="text-align: center;">_source</th>
    </tr>
</script>

<!-- 模版 - 列表表体 -->
<script id="template-listBody" type="text/html">
    <% _.each(list, function (item, index) { %>
    <tr align="left" data-index="<%= from + index %>">
        <td class="_index"><%= from + index + 1 %></td>
        <% _.each(fields, function (field) { %>
        <td><%= item[field] %></td>
        <% }) %>
        <td align="center">
            <a class="btn btn-icon" handle="download"><i class="iconfont icon-download"></i></a>
        </td>
        <td align="center">
            <button class="btn btn-icon" handle="showSource"><i class="iconfont icon-down"></i></button>
            <button class="btn btn-icon hide" handle="hideSource"><i class="iconfont icon-hide"></i></button>
        </td>
    </tr>
    <% }) %>
</script>