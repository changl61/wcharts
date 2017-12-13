<div class="description">
    <span style="font-size: 35px;">欢迎您! 请您完成第一步, 设置您的ES集群地址</span>
</div>

<div class="welcome">
    <a href="/help/index.html" target="_blank">帮助文档</a>
</div>

<form id="form-esCluster" class="unit-form" autocomplete="off">
    <div class="row form-group">
        <label class="col-sm-4 form-label">
            <i class="required">*</i> 协议
        </label>
        <div class="col-sm-6 form-input">
            <select name="protocol" class="hide">
                <option value="http">http</option>
                <option value="https">https</option>
            </select>
        </div>
    </div>

    <div class="row form-group">
        <label class="col-sm-4 form-label">
            <i class="required">*</i> 域名或IP
        </label>
        <div class="col-sm-6 form-input">
            <input name="host" type="text" class="form-control" value="">
        </div>
    </div>

    <div class="row form-group">
        <label class="col-sm-4 form-label">
            <i class="required">*</i> 端口
        </label>
        <div class="col-sm-6 form-input">
            <input name="port" type="text" class="form-control" value="">
        </div>
    </div>
    <div class="row form-group" style="margin-top: 20px;">
        <label class="col-sm-4 form-label">
        </label>
        <div class="col-sm-6 form-input">
            <button type="submit" class="btn btn-primary" handle="submit">确定</button>
            {% if hasTeamAccount %}
                <button type="button" class="btn btn-warning" handle="logout">切换帐户</button>
            {% else %}
                <button type="button" class="btn btn-default" handle="logout">退出登录</button>
            {% endif %}
        </div>
    </div>
</form>