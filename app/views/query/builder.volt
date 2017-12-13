<form class="form-horizontal unit-form unselectable" style="padding: 10px 20px 10px 10px;">
    <fieldset>
        <legend>选择索引</legend>
        <div class="form-group">
            <label class="col-sm-2 form-label"></label>
            <div class="col-sm-8 form-input">
                <input name="index" type="text" class="form-control" value="{{ query['index']['name'] }}" style="color: #fff;" disabled />
            </div>
        </div>
    </fieldset>
    <fieldset>
        <legend>时间范围</legend>
        <div class="form-group">
            <label class="col-sm-2 form-label">字段</label>
            <div class="col-sm-8 form-input">
                <input type="hidden" class="form-control" name="scopeField" value="{{ query['builder']['scope']['field'] }}" />
            </div>
        </div>
        <div class="form-group">
            <label class="col-sm-2 form-label">范围</label>
            <div class="col-sm-9 form-input">
                <label class="label-datetime">
                    <i class="glyphicon glyphicon-time"></i>
                    <input type="text" class="form-control" name="scopeRange" value="{{ query['builder']['scope']['range'] }}" />
                </label>
            </div>
        </div>
    </fieldset>
    <fieldset>
        <legend>筛选条件</legend>
        <input type="hidden" class="form-control" name="filters" value='{{ query['builder']['filters']|json_encode }}' />
    </fieldset>
    <fieldset>
        <legend>显示字段</legend>
        {% for field, type in query['index']['mapping'] %}
            <label class="label-checkbox">
                <input type="checkbox" name="fields" value="{{ field }}">
                <span class="input-replacement"></span>
                <span class="input-name">{{ field }}</span>
            </label>
        {% endfor %}
    </fieldset>
</form>