<ul class="share-list">
    <li class="unit-table" data-type='query'>
        <div class="table-head">
            <div class="table-head-left">
                <h5><i class="iconfont icon-search"></i> &nbsp;查询</h5>
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
                    <th width="33%">分享链接</th>
                    <th width="44%">原型</th>
                    <th width="7%">查看次数</th>
                    <th width="6%" class="text-center">查看</th>
                    <th width="60px" class="text-center">操作</th>
                </tr>
                {% for index, share in shareList['query'] %}
                <tr data-id="{{ share['id'] }}">
                    <td>{{ index+1 }}</td>
                    <td><a href="{{ url }}{{ share['uuid'] }}" target="_blank">{{ url }}{{ share['uuid'] }}</a></td>
                    <td>
                        {% if share['groupName'] %}
                            查询 / {{ share['groupName'] }} / {{ share['queryName'] }}
                        {% else %}
                            <span class="text-danger">已被删除</span>
                        {% endif %}
                    </td>
                    <td>{{ share['count'] }}</td>
                    <td align="center">
                        <input name="status" value="{% if share['groupName'] and share['status'] %}yes{% else %}no{% endif %}" type="hidden" {% if not share['groupName'] %}disabled{% endif %} />
                    </td>
                    <td align="center">
                        <button class="btn btn-icon" handle="delete">
                            <i class="iconfont icon-dustbin text-danger"></i>
                        </button>
                    </td>
                </tr>
                {% endfor %}

                {% if shareList['query'] is empty %}
                <tr><td colspan="100" align="center"> 暂无记录 </td></tr>
                {% endif %}
            </table>
        </div>
        <div class="table-foot"></div>
    </li>

    <li class="unit-table" data-type='dashboard'>
        <div class="table-head">
            <div class="table-head-left">
                <h5><i class="iconfont icon-dashboard"></i> &nbsp;统计面板</h5>
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
                    <th width="33%">分享链接</th>
                    <th width="44%">原型</th>
                    <th width="7%">查看次数</th>
                    <th width="6%" class="text-center">查看</th>
                    <th width="60px" class="text-center">操作</th>
                </tr>
                {% for index, share in shareList['dashboard'] %}
                    <tr data-id="{{ share['id'] }}">
                        <td>{{ index+1 }}</td>
                        <td><a href="{{ url }}{{ share['uuid'] }}" target="_blank">{{ url }}{{ share['uuid'] }}</a></td>
                        <td>
                            {% if share['groupName'] %}
                                统计 / {{ share['groupName'] }} / {{ share['dashboardName'] }}
                            {% else %}
                                已被删除
                            {% endif %}
                        </td>
                        <td>{{ share['count'] }}</td>
                        <td align="center">
                            <input name="status" value="{% if share['groupName'] and share['status'] %}yes{% else %}no{% endif %}" type="hidden" {% if not share['groupName'] %}disabled{% endif %} />
                        </td>
                        <td align="center">
                            <button class="btn btn-icon" handle="delete">
                                <i class="iconfont icon-dustbin text-danger"></i>
                            </button>
                        </td>
                    </tr>
                {% endfor %}

                {% if shareList['dashboard'] is empty %}
                    <tr><td colspan="100" align="center"> 暂无记录 </td></tr>
                {% endif %}
            </table>
        </div>
        <div class="table-foot"></div>
    </li>

    <li class="unit-table" data-type='dashboard'>
        <div class="table-head">
            <div class="table-head-left">
                <h5><i class="iconfont icon-chart-bar"></i> &nbsp;图表</h5>
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
                    <th width="33%">分享链接</th>
                    <th width="44%">原型</th>
                    <th width="7%">查看次数</th>
                    <th width="6%" class="text-center">查看</th>
                    <th width="60px" class="text-center">操作</th>
                </tr>
                {% for index, share in shareList['chart'] %}
                    <tr data-id="{{ share['id'] }}">
                        <td>{{ index+1 }}</td>
                        <td><a href="{{ url }}{{ share['uuid'] }}" target="_blank">{{ url }}{{ share['uuid'] }}</a></td>
                        <td>
                            {% if share['groupName'] %}
                                统计 / {{ share['groupName'] }} / {{ share['dashboardName'] }} / {{ share['chartName'] }}
                            {% else %}
                                <span class="text-warning">已被删除</span>
                            {% endif %}
                        </td>
                        <td>{{ share['count'] }}</td>
                        <td align="center">
                            <input name="status" value="{% if share['groupName'] and share['status'] %}yes{% else %}no{% endif %}" type="hidden" {% if not share['groupName'] %}disabled{% endif %} />
                        </td>
                        <td align="center">
                            <button class="btn btn-icon" handle="delete">
                                <i class="iconfont icon-dustbin text-danger"></i>
                            </button>
                        </td>
                    </tr>
                {% endfor %}

                {% if shareList['chart'] is empty %}
                    <tr><td colspan="100" align="center"> 暂无记录 </td></tr>
                {% endif %}
            </table>
        </div>
        <div class="table-foot"></div>
    </li>
</ul>
